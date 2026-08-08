/**
 * SQLite vector store for the Beds24 knowledge base.
 *
 * We use the `libsql` `Database` class directly (rather than the higher-level
 * `@libsql/client` `Client`) because loading the sqlite-vec extension requires
 * a per-connection `loadExtension()` call, which the `Client` interface does not
 * expose. The connection that loads the extension is the one that must run the
 * cosine-distance queries, so we keep a single shared connection.
 *
 * Schema versioning lives in `PRAGMA user_version`. A bump (or a missing FTS
 * table) triggers `resetDatabase()`, which drops + recreates both tables and the
 * FTS sync triggers — the next `buildIndex` run repopulates them. The FTS5 table
 * uses the content-table pattern, kept in sync by triggers on `chunks`.
 *
 * Dimension handling (T18):
 * sqlite-vec requires every stored vector to have the same length as the query
 * vector. Switching the active embedder from a 384-dim model (local) to a
 * 1024-dim model (ollama-bge-m3) would otherwise produce a corrupt index. We
 * track the active embedder's id per-row (`chunks.embedding_model`) and its
 * dimension in a small `meta` table. The migration gate compares the stored
 * dimension to the active one on every `getDb()`; a mismatch forces a one-time
 * drop + recreate at the new dimension (which forces a re-index). `bge-small`
 * (384) is a drop-in; `bge-m3` (1024) auto-reindexes on first use.
 */

import Database from "libsql";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { load } from "sqlite-vec";

import { DB_PATH as DB_PATH_FROM_PATHS } from "./paths.js";
import type { Bucket } from "./markdown/frontmatter.js";
import { createEmbedder } from "./embed.js";

/** On-disk location of the regenerable vector index (see paths.ts for the value). */
export const DB_PATH = DB_PATH_FROM_PATHS;

/**
 * Default embedding dimensionality (LocalEmbedder). CONTRACT.md frozen at 384.
 *
 * NOTE: the REAL dimension is now dynamic — it follows the active embedder
 * (`createEmbedder().dimension`, selected via `BEDS24_EMBEDDER`). This constant
 * remains the local/default value so the frozen CONTRACT.md surface and the
 * existing test embeddings (all 384-dim) keep working. Use
 * `currentEmbedderDimension()` for the active value.
 */
export const EMBED_DIM = 384;

/** Instance type of the libsql connection (the default export is a constructor). */
type DbInstance = InstanceType<typeof Database>;

/** A single indexed knowledge chunk (one row of the `chunks` table). */
export interface ChunkRow {
	id: number;
	source_file: string;
	heading_path: string;
	line_start: number;
	line_end: number;
	text: string;
	bucket: Bucket;
	doc_url: string | null;
	embedding: Buffer;
	/** Embedder id that produced `embedding` (e.g. "local", "ollama-bge-m3"). */
	embedding_model: string;
	/** Cosine distance from a query vector (only present on search results). */
	distance?: number;
}

/**
 * Schema version we expect on disk. Bumped to 3 for the `embedding_model`
 * column + the `meta` table (which records the dimension the DB was built at).
 * An older on-disk version forces a drop + recreate at the active dimension.
 */
const SCHEMA_VERSION = 3;

/** Meta-table key storing the dimension the DB was (re)built at. */
const META_DIMENSION_KEY = "embedding_dim";

let dbInstance: DbInstance | null = null;
let extensionLoaded = false;
/** True once the migration gate has run for the current process. */
let schemaReady = false;

/**
 * Resolve the active embedder's id + dimension defensively. `createEmbedder`
 * lives in embed.ts; when that module is mocked in tests without exposing the
 * factory (e.g. search.test.ts mocks only `{ embed }`), we fall back to the
 * local defaults so db.ts keeps working. In production the factory always exists.
 */
function activeEmbedderInfo(): { id: string; dimension: number } {
	const factory = createEmbedder;
	if (typeof factory !== "function") return { id: "local", dimension: EMBED_DIM };
	try {
		const e = factory();
		return { id: e.id, dimension: e.dimension };
	} catch {
		return { id: "local", dimension: EMBED_DIM };
	}
}

/** The active embedder's dimension (dynamic — follows `BEDS24_EMBEDDER`). */
export function currentEmbedderDimension(): number {
	return activeEmbedderInfo().dimension;
}

/** Create the `chunks` table, the FTS5 table, the FTS sync triggers, and the `meta` table. */
function createSchema(db: DbInstance): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS chunks (
			id             INTEGER PRIMARY KEY AUTOINCREMENT,
			source_file    TEXT NOT NULL,
			heading_path   TEXT NOT NULL,
			line_start     INTEGER NOT NULL,
			line_end       INTEGER NOT NULL,
			text           TEXT NOT NULL,
			embedding      BLOB NOT NULL,
			bucket         TEXT NOT NULL,
			doc_url        TEXT,
			embedding_model TEXT NOT NULL DEFAULT 'local'
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

		CREATE TABLE IF NOT EXISTS meta (
			key   TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS indexed_files (
			file_path    TEXT PRIMARY KEY,
			content_hash TEXT NOT NULL,
			chunk_count  INTEGER NOT NULL,
			indexed_at   INTEGER NOT NULL
		);
	`);
}

/** Drop + recreate the chunks table, the FTS table, and the meta table. */
function recreateDatabase(db: DbInstance): void {
	db.exec(`
		DROP TABLE IF EXISTS chunks_fts;
		DROP TABLE IF EXISTS indexed_files;
		DROP TABLE IF EXISTS chunks;
		DROP TABLE IF EXISTS meta;
	`);
	createSchema(db);
}

/** Read the stored embedding dimension from `meta` (undefined if absent/garbage). */
function getStoredDimension(db: DbInstance): number | undefined {
	const row = db
		.prepare("SELECT value FROM meta WHERE key = ?")
		.get(META_DIMENSION_KEY) as { value: string } | undefined;
	if (!row) return undefined;
	const dim = Number(row.value);
	return Number.isFinite(dim) ? dim : undefined;
}

/** Stamp the active embedding dimension into `meta` (call after a recreate). */
function storeDimension(db: DbInstance, dim: number): void {
	db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run(
		META_DIMENSION_KEY,
		String(dim),
	);
}

/**
 * Run the migration gate once. A drop + recreate is triggered when ANY of:
 *   - `user_version` is behind `SCHEMA_VERSION`,
 *   - the FTS table is missing,
 *   - the `meta` table is missing (pre-T18 database), or
 *   - the stored embedding dimension differs from the active embedder's
 *     dimension (model switch → force a one-time re-index).
 * After any recreate the active dimension is stamped into `meta`; `user_version`
 * is then bumped to the current `SCHEMA_VERSION`.
 */
function ensureSchema(db: DbInstance): void {
	if (schemaReady) return;

	const { dimension: activeDim } = activeEmbedderInfo();

	// PRAGMA user_version always returns exactly one row.
	const versionRow = db
		.prepare("PRAGMA user_version")
		.get() as { user_version: number };
	const version = versionRow.user_version;

	const ftsRow = db
		.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
		.get("chunks_fts") as { name: string } | undefined;
	const metaRow = db
		.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
		.get("meta") as { name: string } | undefined;

	const storedDim = metaRow ? getStoredDimension(db) : undefined;

	const needsRecreate =
		version < SCHEMA_VERSION ||
		ftsRow === undefined ||
		metaRow === undefined ||
		storedDim === undefined ||
		storedDim !== activeDim;

	if (needsRecreate) {
		recreateDatabase(db);
		storeDimension(db, activeDim);
	} else {
		// Additive migration: a DB already at the current schema version can
		// still predate the `indexed_files` table (added by T19, independent of
		// T18's `embedding_model`/`meta` changes). Create it in place so
		// existing chunk data is preserved — only rebuilds when the schema
		// version actually changes.
		const indexedFilesRow = db
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
			.get("indexed_files") as { name: string } | undefined;
		if (indexedFilesRow === undefined) {
			db.exec(`
				CREATE TABLE IF NOT EXISTS indexed_files (
					file_path    TEXT PRIMARY KEY,
					content_hash TEXT NOT NULL,
					chunk_count  INTEGER NOT NULL,
					indexed_at   INTEGER NOT NULL
				);
			`);
		}
	}

	db.exec(`PRAGMA user_version = ${SCHEMA_VERSION};`);
	schemaReady = true;
}

/**
 * Return the shared `Database` connection, creating + initializing it on first
 * call. Loads the sqlite-vec extension exactly once and points it at the native
 * binding for this platform.
 */
export function getDb(): DbInstance {
	if (dbInstance === null) {
		mkdirSync(dirname(DB_PATH), { recursive: true });
		const db = new Database(DB_PATH);
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

/** True if the on-disk index database file already exists. */
export function dbExists(): boolean {
	try {
		const fs = require("node:fs") as typeof import("node:fs");
		return fs.existsSync(DB_PATH);
	} catch { return false; }
}

/** Remove every indexed chunk (FTS table stays in sync via the delete trigger). */
export function clearChunks(): void {
	const db = getDb();
	db.exec("DELETE FROM chunks;");
}

/**
 * Drop + recreate both tables and the FTS sync triggers (used on force reindex).
 * Re-stamps the active dimension into `meta` so a subsequent `getDb()` does not
 * see a missing/old dimension and recreate again.
 */
export function resetDatabase(): void {
	const db = getDb();
	recreateDatabase(db);
	storeDimension(db, activeEmbedderInfo().dimension);
}

/** Insert a chunk and return its rowid. */
export function insertChunk(
	sourceFile: string,
	headingPath: string[],
	lineStart: number,
	lineEnd: number,
	text: string,
	embedding: number[],
	bucket: Bucket,
	docUrl: string | null,
): number {
	const db = getDb();
	const { id: modelId } = activeEmbedderInfo();
	const blob = Buffer.from(new Float32Array(embedding).buffer);
	const stmt = db.prepare(
		`INSERT INTO chunks
		   (source_file, heading_path, line_start, line_end, text, embedding, bucket, doc_url, embedding_model)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	);
	const info = stmt.run(
		sourceFile,
		JSON.stringify(headingPath),
		lineStart,
		lineEnd,
		text,
		blob,
		bucket,
		docUrl,
		modelId,
	);
	return Number(info.lastInsertRowid);
}

// ---------------------------------------------------------------------------
// Per-file content hash helpers (T19 — incremental re-indexing).
//
// The indexer keys off these to skip unchanged files on re-run. They read /
// write the `indexed_files` table created by createSchema / the additive
// migration in ensureSchema. Independent of T18's `embedding_model` column.
// ---------------------------------------------------------------------------

/** Return the stored content hash for a file, or undefined if never indexed. */
export function getStoredHash(filePath: string): string | undefined {
	const db = getDb();
	const row = db
		.prepare("SELECT content_hash FROM indexed_files WHERE file_path = ?")
		.get(filePath) as { content_hash: string } | undefined;
	return row?.content_hash;
}

/**
 * Record (or overwrite) a file's content hash after a successful (re-)index.
 * `indexed_at` is stamped with the current time so stale-cleanup + ordering
 * have a trail. Uses upsert semantics so re-indexing a file can't duplicate
 * its row.
 */
export function setStoredHash(filePath: string, hash: string, chunkCount: number): void {
	const db = getDb();
	db.prepare(
		`INSERT INTO indexed_files (file_path, content_hash, chunk_count, indexed_at)
		 VALUES (?, ?, ?, ?)
		 ON CONFLICT(file_path) DO UPDATE SET
		   content_hash = excluded.content_hash,
		   chunk_count = excluded.chunk_count,
		   indexed_at = excluded.indexed_at`,
	).run(filePath, hash, chunkCount, Date.now());
}

/** Remove a file's hash record (used after stale cleanup or a force-rebuild). */
export function deleteStoredHash(filePath: string): void {
	const db = getDb();
	db.prepare("DELETE FROM indexed_files WHERE file_path = ?").run(filePath);
}

/**
 * Delete every chunk belonging to one source file. The FTS table stays in sync
 * via the delete trigger. Used to clear a file's old chunks before re-embedding
 * a changed file (avoids the "double the store on every run" behavior).
 */
export function deleteChunksForFile(filePath: string): void {
	const db = getDb();
	db.prepare("DELETE FROM chunks WHERE source_file = ?").run(filePath);
}

/**
 * Every file path currently tracked in `indexed_files`, oldest first. The
 * indexer walks this after the main pass to evict entries (and their chunks)
 * for files that no longer exist on disk — Turso's stale-cleanup step.
 */
export function getAllTrackedFilePaths(): string[] {
	const db = getDb();
	const rows = db
		.prepare("SELECT file_path FROM indexed_files ORDER BY indexed_at ASC")
		.all() as Array<{ file_path: string }>;
	return rows.map((r) => r.file_path);
}

// ---------------------------------------------------------------------------
// Test-only reset hooks
//
// `getDb()` is a module-level singleton: the connection plus the
// `extensionLoaded` / `schemaReady` flags are cached for the life of the
// module. In normal operation the init block runs exactly once, so the
// "already initialized" branches of those guards (and the "already migrated →
// skip recreate" branch of `ensureSchema`) can never be exercised by app code.
// These additive hooks reset that cached state so unit tests can drive every
// branch in isolation. They are NOT part of the public API and leave every
// frozen signature untouched.
// ---------------------------------------------------------------------------

/**
 * Close the cached connection and reset the init flags so the next `getDb()`
 * re-runs the full open → load-extension → migrate path. The flag overrides
 * let a test pre-seed specific guard states (e.g. `extensionLoaded: true`) to
 * exercise the "already initialized" branches.
 */
export function __resetDbForTests(opts?: {
	extensionLoaded?: boolean;
	schemaReady?: boolean;
}): void {
	if (dbInstance !== null) {
		try {
			dbInstance.close();
		} catch {
			/* already closed */
		}
		dbInstance = null;
	}
	extensionLoaded = opts?.extensionLoaded ?? false;
	schemaReady = opts?.schemaReady ?? false;
}

/**
 * Re-run the migration gate against the current (already-migrated) connection
 * with the gate reset, so the "already at the current schema version → skip
 * recreate" branch of `ensureSchema` is reachable with an in-memory database.
 * Also resets the cached embedder info so a test that changes `BEDS24_EMBEDDER`
 * between calls sees the new provider on the re-run.
 */
export function __rerunSchemaGateForTests(): void {
	schemaReady = false;
	ensureSchema(getDb());
}

/** Total number of indexed chunks. */
export function countChunks(): number {
	const db = getDb();
	// COUNT(*) always returns exactly one row, so `.get()` can't be undefined.
	const row = db.prepare("SELECT COUNT(*) AS c FROM chunks").get() as
		| { c: number };
	return row.c;
}

/** Number of chunks per bucket (every known bucket defaults to 0). */
export function bucketCounts(): Record<Bucket, number> {
	const db = getDb();
	const counts: Record<Bucket, number> = {
		deprecated: 0,
		apiv1: 0,
		apiv2: 0,
		general: 0,
	};
	const rows = db
		.prepare("SELECT bucket, COUNT(*) AS c FROM chunks GROUP BY bucket")
		.all() as Array<{ bucket: string; c: number }>;
	for (const row of rows) {
		if (row.bucket in counts) {
			counts[row.bucket as Bucket] = row.c;
		}
	}
	return counts;
}
