import { createRequire } from "node:module";
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// packages/knowledge/src/frontmatter.ts
var KNOWN_BUCKETS = [
  "deprecated",
  "apiv1",
  "apiv2",
  "general"
];
var SAFE_BUCKETS = ["apiv2", "general"];
function isBucket(value) {
  return value === "deprecated" || value === "apiv1" || value === "apiv2" || value === "general";
}
function parseField(line) {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.startsWith("#"))
    return null;
  const colon = trimmed.indexOf(":");
  if (colon === -1)
    return null;
  const key = trimmed.slice(0, colon).trim();
  const value = trimmed.slice(colon + 1).trim();
  if (key.length === 0)
    return null;
  return { key, value };
}
function unquote(raw) {
  if (raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')) {
    return raw.slice(1, -1);
  }
  if (raw.length >= 2 && raw.startsWith("'") && raw.endsWith("'")) {
    return raw.slice(1, -1);
  }
  return raw;
}
function parseFields(yaml) {
  const frontmatter = {};
  for (const line of yaml.split(`
`)) {
    const field = parseField(line);
    if (field === null)
      continue;
    const { key, value } = field;
    const scalar = unquote(value);
    if (key === "bucket") {
      if (isBucket(scalar)) {
        frontmatter.bucket = scalar;
      }
    } else if (key === "doc_url" || key === "docUrl") {
      frontmatter.docUrl = scalar;
    } else {
      frontmatter[key] = scalar;
    }
  }
  return frontmatter;
}
function parseFrontmatter(raw) {
  const opensWithDelimiter = raw.startsWith(`---
`) || raw.startsWith(`---\r
`);
  if (!opensWithDelimiter) {
    return { frontmatter: {}, body: raw };
  }
  const afterOpen = raw.slice(raw.indexOf(`
`) + 1);
  const closeMatch = afterOpen.match(/^---\r?\n/m);
  if (closeMatch === null) {
    return { frontmatter: {}, body: raw };
  }
  const closeIdx = closeMatch.index ?? 0;
  const yaml = afterOpen.slice(0, closeIdx);
  const rest = afterOpen.slice(closeIdx + closeMatch[0].length);
  const frontmatter = parseFields(yaml);
  const body = rest.replace(/^\r?\n/, "").trim();
  return { frontmatter, body };
}
// packages/knowledge/src/chunk.ts
var HEADING_RE = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
function cleanHeading(raw) {
  return raw.replace(/\s+#+\s*$/, "").trim();
}
function chunkMarkdown(sourceFile, markdown, bucketOverride) {
  const { frontmatter, body } = parseFrontmatter(markdown);
  const bucket = frontmatter.bucket ?? bucketOverride ?? "general";
  const docUrl = frontmatter.docUrl ?? null;
  const lines = body.split(`
`);
  const chunks = [];
  const stack = [];
  let docTitle = null;
  let pendingIntro = [];
  let currentHeading = null;
  let currentBody = [];
  let currentStart = 1;
  const flushCurrent = () => {
    if (currentHeading === null)
      return;
    const headingPath = [
      ...stack.map((h) => h.title),
      currentHeading.title
    ];
    const text = [currentHeading.title, ...currentBody].join(`
`).trim();
    if (text.length > 0) {
      chunks.push({
        sourceFile,
        headingPath,
        lineStart: currentStart,
        lineEnd: currentStart + currentBody.length,
        text,
        bucket,
        docUrl
      });
    }
  };
  for (let i = 0;i < lines.length; i++) {
    const line = lines[i] ?? "";
    const lineno = i + 1;
    const match = HEADING_RE.exec(line);
    if (match) {
      const level = match[1].length;
      const title = cleanHeading(match[2]);
      if (docTitle === null && level === 1) {
        docTitle = title;
      }
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      stack.push({ level, title });
      flushCurrent();
      const isFirstHeading = currentHeading === null;
      currentHeading = { level, title };
      currentBody = isFirstHeading ? [...pendingIntro] : [];
      currentStart = lineno;
      pendingIntro = [];
    } else {
      if (currentHeading === null) {
        pendingIntro.push(line);
      } else {
        currentBody.push(line);
      }
    }
  }
  flushCurrent();
  if (chunks.length === 0 && body.trim().length > 0) {
    chunks.push({
      sourceFile,
      headingPath: docTitle ? [docTitle] : [],
      lineStart: 1,
      lineEnd: lines.length,
      text: body.trim(),
      bucket,
      docUrl
    });
  }
  return chunks;
}
// packages/knowledge/src/indexer.ts
import { readdirSync } from "node:fs";
import { join as join2, relative, resolve } from "node:path";

// packages/knowledge/src/db.ts
import Database from "libsql";
import { mkdirSync } from "node:fs";
import { dirname as dirname2 } from "node:path";
import { load } from "sqlite-vec";

// packages/knowledge/src/paths.ts
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
function moduleDir() {
  if (typeof import.meta.dir === "string" && import.meta.dir.length > 0) {
    return import.meta.dir;
  }
  return dirname(fileURLToPath(import.meta.url));
}
function packageRoot() {
  let dir = moduleDir();
  for (let i = 0;i < 8; i++) {
    if (existsSync(join(dir, "package.json")) && existsSync(join(dir, "knowledge"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir)
      break;
    dir = parent;
  }
  return dirname(moduleDir());
}
function defaultKnowledgeDir() {
  return process.env.BEDS24_KNOWLEDGE_DIR ?? join(packageRoot(), "knowledge");
}
var DB_PATH = process.env.BEDS24_DB_PATH ?? join(packageRoot(), ".beds24", "index.db");

// packages/knowledge/src/db.ts
var DB_PATH2 = DB_PATH;
var EMBED_DIM = 384;
var SCHEMA_VERSION = 2;
var dbInstance = null;
var extensionLoaded = false;
var schemaReady = false;
function createSchema(db) {
  db.exec(`
		CREATE TABLE IF NOT EXISTS chunks (
			id          INTEGER PRIMARY KEY AUTOINCREMENT,
			source_file TEXT NOT NULL,
			heading_path TEXT NOT NULL,
			line_start  INTEGER NOT NULL,
			line_end    INTEGER NOT NULL,
			text        TEXT NOT NULL,
			embedding   BLOB NOT NULL,
			bucket      TEXT NOT NULL,
			doc_url     TEXT
		);

		CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts
			USING fts5(text, content='chunks', content_rowid='id', tokenize='unicode61');

		CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
			INSERT INTO chunks_fts(rowid, text) VALUES (new.id, new.text);
		END;

		CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
			INSERT INTO chunks_fts(chunks_fts, rowid, text) VALUES('delete', old.id, old.text);
		END;

		CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
			INSERT INTO chunks_fts(chunks_fts, rowid, text) VALUES('delete', old.id, old.text);
			INSERT INTO chunks_fts(rowid, text) VALUES (new.id, new.text);
		END;
	`);
}
function recreateDatabase(db) {
  db.exec(`
		DROP TABLE IF EXISTS chunks_fts;
		DROP TABLE IF EXISTS chunks;
	`);
  createSchema(db);
}
function ensureSchema(db) {
  if (schemaReady)
    return;
  const versionRow = db.prepare("PRAGMA user_version").get();
  const version = versionRow?.user_version ?? 0;
  const ftsRow = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get("chunks_fts");
  if (version < SCHEMA_VERSION || ftsRow === undefined) {
    recreateDatabase(db);
  }
  db.exec(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  schemaReady = true;
}
function getDb() {
  if (dbInstance === null) {
    mkdirSync(dirname2(DB_PATH2), { recursive: true });
    const db = new Database(DB_PATH2);
    db.exec("PRAGMA journal_mode = WAL;");
    if (!extensionLoaded) {
      load(db);
      extensionLoaded = true;
    }
    ensureSchema(db);
    dbInstance = db;
  }
  return dbInstance;
}
function dbExists() {
  try {
    const fs = __require("node:fs");
    return fs.existsSync(DB_PATH2);
  } catch {
    return false;
  }
}
function clearChunks() {
  const db = getDb();
  db.exec("DELETE FROM chunks;");
}
function resetDatabase() {
  recreateDatabase(getDb());
}
function insertChunk(sourceFile, headingPath, lineStart, lineEnd, text, embedding, bucket, docUrl) {
  const db = getDb();
  const blob = Buffer.from(new Float32Array(embedding).buffer);
  const stmt = db.prepare(`INSERT INTO chunks (source_file, heading_path, line_start, line_end, text, embedding, bucket, doc_url)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const info = stmt.run(sourceFile, JSON.stringify(headingPath), lineStart, lineEnd, text, blob, bucket, docUrl);
  return Number(info.lastInsertRowid);
}
function countChunks() {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) AS c FROM chunks").get();
  return row?.c ?? 0;
}
function bucketCounts() {
  const db = getDb();
  const counts = {
    deprecated: 0,
    apiv1: 0,
    apiv2: 0,
    general: 0
  };
  const rows = db.prepare("SELECT bucket, COUNT(*) AS c FROM chunks GROUP BY bucket").all();
  for (const row of rows) {
    if (row.bucket in counts) {
      counts[row.bucket] = row.c;
    }
  }
  return counts;
}

// packages/knowledge/src/embed.ts
import { pipeline } from "@huggingface/transformers";
var EMBED_DIM2 = 384;
var pipelinePromise = null;
var readyLog = false;
async function getEmbedder() {
  if (pipelinePromise === null) {
    if (!readyLog) {
      console.error("[beds24] loading embedding model (Xenova/all-MiniLM-L6-v2)...");
      readyLog = true;
    }
    const opts = { dtype: "fp32" };
    pipelinePromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", opts);
  }
  return pipelinePromise;
}
async function embed(texts) {
  const embedder = await getEmbedder();
  const output = await embedder(texts, {
    pooling: "mean",
    normalize: true
  });
  const dims = output.dims;
  const data = output.data;
  const rows = dims.length >= 2 ? dims[0] ?? 1 : 1;
  const cols = dims[dims.length - 1] ?? EMBED_DIM2;
  const vecs = [];
  for (let i = 0;i < rows; i++) {
    const start = i * cols;
    const slice = data.slice(start, start + cols);
    vecs.push(Array.from(slice));
  }
  return vecs;
}

// packages/knowledge/src/indexer.ts
var APIV1_DIRS = [
  "api-basics",
  "availability",
  "bookings",
  "pricing",
  "properties",
  "invoicing",
  "messages",
  "account"
];
var GENERAL_DIRS = ["system-logic", "ota", "csv", "utilities"];
function bucketFromPath(sourceFile) {
  const path = sourceFile.toLowerCase();
  if (path.includes("xml-deprecated"))
    return "deprecated";
  if (APIV1_DIRS.some((d) => path.includes(d)))
    return "apiv1";
  if (path.includes("api-v2"))
    return "apiv2";
  if (GENERAL_DIRS.some((d) => path.includes(d)))
    return "general";
  return "general";
}
function walkMarkdown(dir) {
  const out = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join2(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkMarkdown(full));
    } else if (entry.name.endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}
function readText(path) {
  const fs = __require("node:fs");
  return fs.readFileSync(path, "utf8");
}
async function buildIndex(opts) {
  const { knowledgeDir, force = false } = opts;
  const root = resolve(knowledgeDir);
  getDb();
  if (force) {
    console.error("[beds24] force: resetting database (schema + FTS)");
    resetDatabase();
  }
  const files = walkMarkdown(root);
  let totalChunks = 0;
  for (const fullPath of files) {
    const sourceFile = relative(root, fullPath).split("\\").join("/");
    const markdown = readText(fullPath);
    const chunks = chunkMarkdown(sourceFile, markdown, bucketFromPath(sourceFile));
    if (chunks.length === 0) {
      console.error(`  ${sourceFile}: 0 chunks (empty)`);
      continue;
    }
    const texts = chunks.map((c) => c.text);
    const vectors = await embed(texts);
    for (let i = 0;i < chunks.length; i++) {
      const c = chunks[i];
      const vec = vectors[i];
      insertChunk(c.sourceFile, c.headingPath, c.lineStart, c.lineEnd, c.text, vec, c.bucket, c.docUrl);
    }
    totalChunks += chunks.length;
    console.error(`  ${sourceFile}: ${chunks.length} chunks`);
  }
  const indexed = countChunks();
  console.error(`[beds24] indexed ${files.length} files, ${totalChunks} chunks (store has ${indexed})`);
  return { files: files.length, chunks: totalChunks };
}
// packages/knowledge/src/search.ts
var RRF_K = 60;
var DEFAULT_TOP_K = 8;
function resolveBuckets(buckets) {
  return buckets && buckets.length > 0 ? [...buckets] : [];
}
function toFtsQuery(query) {
  const tokens = query.split(/[^A-Za-z0-9]+/).filter((t) => t.length > 0);
  if (tokens.length === 0)
    return "";
  return tokens.map((t) => `"${t.replace(/"/g, '""')}"`).join(" OR ");
}
function rrfMerge(lists, k = RRF_K) {
  const byId = new Map;
  for (const list of lists) {
    list.forEach((row, rank) => {
      const contribution = 1 / (k + rank);
      const existing = byId.get(row.id);
      if (existing) {
        existing.score += contribution;
      } else {
        byId.set(row.id, { row, score: contribution });
      }
    });
  }
  return [...byId.values()].sort((a, b) => b.score - a.score);
}
function vectorCandidates(blob, buckets, candidateK) {
  const db = getDb();
  const filtered = buckets.length > 0;
  const where = filtered ? `WHERE bucket IN (${buckets.map(() => "?").join(",")})` : "";
  const sql = `SELECT id, source_file, heading_path, line_start, line_end, text, bucket, doc_url, ` + `vec_distance_cosine(embedding, ?) AS distance ` + `FROM chunks ${where} ` + `ORDER BY distance ASC LIMIT ?`;
  const params = filtered ? [blob, ...buckets, candidateK] : [blob, candidateK];
  return db.prepare(sql).all(...params);
}
function ftsCandidates(ftsQuery, buckets, candidateK) {
  const db = getDb();
  const filtered = buckets.length > 0;
  const andBucket = filtered ? `AND c.bucket IN (${buckets.map(() => "?").join(",")})` : "";
  const sql = `SELECT c.id, c.source_file, c.heading_path, c.line_start, c.line_end, c.text, c.bucket, c.doc_url, ` + `bm25(chunks_fts) AS bm25 ` + `FROM chunks_fts ` + `JOIN chunks c ON c.id = chunks_fts.rowid ` + `WHERE chunks_fts MATCH ? ${andBucket} ` + `ORDER BY bm25 ASC LIMIT ?`;
  const params = filtered ? [ftsQuery, ...buckets, candidateK] : [ftsQuery, candidateK];
  return db.prepare(sql).all(...params);
}
function toSearchHit(sc) {
  const r = sc.row;
  let headingPath = [];
  try {
    headingPath = JSON.parse(r.heading_path);
  } catch {
    headingPath = [];
  }
  return {
    id: r.id,
    text: r.text,
    sourceFile: r.source_file,
    headingPath,
    lines: [r.line_start, r.line_end],
    bucket: r.bucket,
    docUrl: r.doc_url,
    score: sc.score
  };
}
async function hybridSearch(opts) {
  const topK = opts.topK ?? DEFAULT_TOP_K;
  const candidateK = opts.candidateK ?? Math.max(topK * 5, 50);
  const buckets = resolveBuckets(opts.buckets);
  if (countChunks() === 0)
    return [];
  const [vec] = await embed([opts.query]);
  if (!vec)
    return [];
  const blob = Buffer.from(new Float32Array(vec).buffer);
  const vectorRows = vectorCandidates(blob, buckets, candidateK);
  const ftsQuery = toFtsQuery(opts.query);
  const ftsRows = ftsQuery.length > 0 ? ftsCandidates(ftsQuery, buckets, candidateK) : [];
  return rrfMerge([vectorRows, ftsRows]).slice(0, topK).map(toSearchHit);
}
async function searchAll(query, topK) {
  return hybridSearch({ query, buckets: [], topK });
}
async function search(query, topK) {
  return hybridSearch({ query, buckets: SAFE_BUCKETS, topK });
}
async function searchInBucket(bucket, query, topK) {
  if (!KNOWN_BUCKETS.includes(bucket))
    return [];
  return hybridSearch({ query, buckets: [bucket], topK });
}

class Beds24Search {
  async searchAll(query, topK) {
    return searchAll(query, topK);
  }
  async search(query, topK) {
    return search(query, topK);
  }
  async searchInBucket(bucket, query, topK) {
    return searchInBucket(bucket, query, topK);
  }
}
export {
  searchInBucket,
  searchAll,
  search,
  resetDatabase,
  parseFrontmatter,
  insertChunk,
  hybridSearch,
  getDb,
  embed,
  defaultKnowledgeDir,
  dbExists,
  countChunks,
  clearChunks,
  chunkMarkdown,
  buildIndex,
  bucketCounts,
  SAFE_BUCKETS,
  KNOWN_BUCKETS,
  EMBED_DIM,
  DB_PATH2 as DB_PATH,
  Beds24Search
};

//# debugId=A6C6000E4D5C7CD364756E2164756E21
//# sourceMappingURL=index.js.map
