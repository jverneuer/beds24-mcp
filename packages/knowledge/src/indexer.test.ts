/**
 * Unit tests for `indexer.ts` — targets 100% statement / branch / line coverage.
 *
 * Approach (per TEST-HARNESS.md):
 *  - REAL tempdir fixtures, not fs mocks. We write synthetic `.md` files into a
 *    fresh `os.tmpdir()` dir and point `buildIndex` at it, so the real
 *    walk → chunk → embed → store path runs end to end.
 *  - In-memory SQLite (`BEDS24_DB_PATH=:memory:`) so the store is fast and
 *    isolated; `__resetDbForTests()` gives every test a clean slate.
 *  - The embed pipeline is mocked so the real model never loads. We mock the
 *    LOCAL `./embed.js` surface (TEST-HARNESS.md sanctions "mock the local
 *    embed.ts surface" as an alternative to mocking @huggingface/transformers).
 *    We count invocations of `embed()` to prove the indexer wires embed.
 *
 * Why the local surface and not @huggingface/transformers: embed.test.ts
 * registers a process-global mock for `@huggingface/transformers`; a second
 * registration from this file would clobber it and break that suite. Mocking
 * the local surface avoids the collision while still guaranteeing the real
 * model never loads.
 *
 * The fixtures are engineered to hit every branch of `bucketFromPath`
 * (xml-deprecated / apiv1 / apiv2 / general / default), `walkMarkdown`
 * (recurse, `.md` filter, non-md skip), and `buildIndex` (force, the
 * `chunks.length === 0` empty-file branch, the embed + insert loop).
 */

import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";
import { readdirSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import * as realEmbed from "./embed.js";

// --- Capture original env BEFORE any module-load-time mutation ---
const ORIGINAL_BEDS24_DB_PATH = process.env.BEDS24_DB_PATH;
const ORIGINAL_BEDS24_EMBEDDER = process.env.BEDS24_EMBEDDER;
const ORIGINAL_BEDS24_KNOWLEDGE_DIR = process.env.BEDS24_KNOWLEDGE_DIR;

// A real-embed surface copy, stashed for embed.test.ts. Stored on globalThis
// as a plain object cast through an explicit interface — never `any`.
interface RealEmbedStash {
	embed: (...args: unknown[]) => Promise<unknown>;
	getEmbedder: (...args: unknown[]) => unknown;
	EMBED_DIM: number;
}
const realEmbedStash: RealEmbedStash = { ...realEmbed } as unknown as RealEmbedStash;
(globalThis as unknown as { __realEmbed: RealEmbedStash }).__realEmbed = realEmbedStash;

/** Frozen embedding dimensionality — mirrored from CONTRACT.md (do not drift). */
const EMBED_DIM = 384;
const EMBED_BYTES = EMBED_DIM * 4;

/**
 * Count of `embed()` invocations. The indexer batches all of one file's chunk
 * texts into a single `embed(texts)` call, so this counts files-with-chunks
 * (one batch per file), NOT individual chunks.
 */
const mockState = { embedCalls: 0 };

/**
 * Deterministic, L2-normalized `len`-dim vector seeded from `seed`. Mirrors the
 * real embedder's `normalize: true` output so values are finite unit vectors —
 * the indexer only stores whatever it gets, so any finite 384-dim vector works.
 */
function makeUnitVector(seed: number, len: number): Float32Array {
	const tmp: number[] = new Array<number>(len);
	let sumSq = 0;
	for (let i = 0; i < len; i++) {
		const val = Math.sin(seed + i * 0.137) * 0.5 + Math.cos(seed * 0.7 + i * 0.311);
		tmp[i] = val;
		sumSq += val * val;
	}
	const norm = Math.sqrt(sumSq);
	const v = new Float32Array(len);
	for (let i = 0; i < len; i++) {
		const t = tmp[i] as number;
		v[i] = norm > 0 ? t / norm : 0;
	}
	return v;
}

// --- Mock the LOCAL embed surface BEFORE importing the indexer -------------
// The indexer imports `embed` from `./embed.js`. Replacing that module means
// the real embed.ts (and the real @huggingface/transformers model) never load.
mock.module("./embed.js", () => ({
	embed: mock(async (texts: string[]) => {
		mockState.embedCalls++;
		return texts.map((_, i) => Array.from(makeUnitVector(i + 1, EMBED_DIM)));
	}),
	EMBED_DIM,
}));

// --- Point the store at :memory: BEFORE importing (paths.ts reads it once) ---
process.env.BEDS24_DB_PATH = ":memory:";
const { buildIndex, fileHash } = await import("./indexer.js");
const db = await import("./db.js");

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

/** Create a fresh tempdir under os.tmpdir(). */
function makeTempDir(): string {
	return mkdtempSync(join(tmpdir(), "beds24-indexer-"));
}

/** Write a map of relative-path → content into dir (creates subdirs). */
function writeFiles(dir: string, files: Record<string, string>): void {
	for (const [rel, content] of Object.entries(files)) {
		const full = join(dir, rel);
		mkdirSync(dirname(full), { recursive: true });
		writeFileSync(full, content);
	}
}

/** Recursively count `.md` files — independent check on the indexer's walk. */
function countMdFiles(dir: string): number {
	let n = 0;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			n += countMdFiles(join(dir, entry.name));
		} else if (entry.name.endsWith(".md")) {
			n++;
		}
	}
	return n;
}

/**
 * Synthetic corpus engineered to cover every branch:
 *
 *  bookings/getBookings.md  → path "bookings"      → apiv1   (×2 chunks)
 *  api-v2/auth.md           → path "api-v2"        → apiv2   (×1)
 *  system-logic/foo.md      → path "system-logic"  → general (×1)
 *  xml-deprecated/old.md    → path "xml-deprecated"→ deprecated (×1)
 *  misc/plain.md            → no headings, path default → general (×1 fallback)
 *  nested/deep/inner.md     → recursion, path default  → general (×1)
 *  fm-authority.md          → frontmatter bucket apiv2 WINS over default path (×1)
 *  empty.md                 → 0 chunks (covers the empty-file branch)
 *  readme.txt / image.png   → non-md, skipped by the walk
 */
const CORPUS: Record<string, string> = {
	"bookings/getBookings.md": [
		"# GetBookings",
		"",
		"intro text",
		"",
		"## Parameters",
		"",
		"params body",
	].join("\n"),
	"api-v2/auth.md": ["# Auth", "", "auth intro"].join("\n"),
	"system-logic/foo.md": ["# Foo", "", "foo body"].join("\n"),
	"xml-deprecated/old.md": ["# Old Method", "", "old body"].join("\n"),
	"misc/plain.md": "Just a paragraph of text, no headings at all.",
	"nested/deep/inner.md": ["# Deep", "", "deep body"].join("\n"),
	"fm-authority.md": [
		"---",
		"bucket: apiv2",
		"doc_url: https://example.com/fm",
		"---",
		"# FM Doc",
		"",
		"fm body",
	].join("\n"),
	"empty.md": "",
	"readme.txt": "This is not markdown.",
	"image.png": "fake binary bytes",
};

beforeEach(() => {
	mockState.embedCalls = 0;
	db.__resetDbForTests();
});

afterEach(() => {
	db.__resetDbForTests();
	// Restore env vars captured at module load so later files inherit a clean state.
	if (ORIGINAL_BEDS24_DB_PATH === undefined) delete process.env.BEDS24_DB_PATH;
	else process.env.BEDS24_DB_PATH = ORIGINAL_BEDS24_DB_PATH;
	if (ORIGINAL_BEDS24_EMBEDDER === undefined) delete process.env.BEDS24_EMBEDDER;
	else process.env.BEDS24_EMBEDDER = ORIGINAL_BEDS24_EMBEDDER;
	if (ORIGINAL_BEDS24_KNOWLEDGE_DIR === undefined) delete process.env.BEDS24_KNOWLEDGE_DIR;
	else process.env.BEDS24_KNOWLEDGE_DIR = ORIGINAL_BEDS24_KNOWLEDGE_DIR;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("buildIndex — walk + chunk + embed + store pipeline", () => {
	test("synthetic corpus: correct counts, buckets, stored rows, embed wiring", async () => {
		const dir = makeTempDir();
		writeFiles(dir, CORPUS);

		const result = await buildIndex({ knowledgeDir: dir });

		// 8 .md files walked; 2 non-md files skipped.
		expect(result.files).toBe(8);
		// 2 + 1 + 1 + 1 + 1 + 1 + 1 + 0 = 8 chunks across the files.
		expect(result.chunks).toBe(8);
		// Fresh run: every file is new, so nothing is reused.
		expect(result.unchanged).toBe(0);

		// Every returned chunk was written to the store (fresh db).
		expect(db.countChunks()).toBe(8);

		// One embed batch per file that produced chunks (all but empty.md → 7).
		expect(mockState.embedCalls).toBe(7);

		// Bucket distribution: apiv1×2, apiv2×2, deprecated×1, general×3.
		expect(db.bucketCounts()).toEqual({
			deprecated: 1,
			apiv1: 2,
			apiv2: 2,
			general: 3,
		});

		// --- Per-source bucket + frontmatter authority, read back from the DB --
		const rows = db
			.getDb()
			.prepare("SELECT source_file, bucket, doc_url FROM chunks")
			.all() as Array<{
				source_file: string;
				bucket: string;
				doc_url: string | null;
			}>;
		const byFile = new Map(rows.map((r) => [r.source_file, r]));

		// Frontmatter bucket wins over the path-derived default.
		expect(byFile.get("fm-authority.md")?.bucket).toBe("apiv2");
		expect(byFile.get("fm-authority.md")?.doc_url).toBe("https://example.com/fm");
		// Path-derived buckets (no frontmatter).
		expect(byFile.get("bookings/getBookings.md")?.bucket).toBe("apiv1");
		expect(byFile.get("api-v2/auth.md")?.bucket).toBe("apiv2");
		expect(byFile.get("system-logic/foo.md")?.bucket).toBe("general");
		expect(byFile.get("xml-deprecated/old.md")?.bucket).toBe("deprecated");
		// Default fallback (unrecognized path, no frontmatter).
		expect(byFile.get("misc/plain.md")?.bucket).toBe("general");
		expect(byFile.get("nested/deep/inner.md")?.bucket).toBe("general");

		// Empty file produced no rows; non-md files never reached the store.
		expect(byFile.has("empty.md")).toBe(false);
		expect(byFile.has("readme.txt")).toBe(false);
		expect(byFile.has("image.png")).toBe(false);

		// Embeddings are stored as 384-dim float32 blobs (384 × 4 bytes).
		const emb = db
			.getDb()
			.prepare("SELECT length(embedding) AS len FROM chunks LIMIT 1")
			.get() as { len: number };
		expect(emb.len).toBe(EMBED_BYTES);

		rmSync(dir, { recursive: true, force: true });
	});

	test("real corpus smoke: walks knowledge/, stores every chunk, no throw", async () => {
		const knowledgeDir = join(import.meta.dir, "..", "knowledge");
		const expectedFiles = countMdFiles(knowledgeDir);

		const before = mockState.embedCalls;
		const result = await buildIndex({ knowledgeDir });

		// The walk counted exactly the files on disk.
		expect(result.files).toBe(expectedFiles);
		expect(result.chunks).toBeGreaterThan(0);
		// Store matches the per-run chunk count (single run, fresh db).
		expect(db.countChunks()).toBe(result.chunks);
		// Embed was wired: at least one batch ran against the mock.
		expect(mockState.embedCalls).toBeGreaterThan(before);

		// Every chunk landed as a stored embedding blob.
		const emb = db
			.getDb()
			.prepare("SELECT length(embedding) AS len FROM chunks LIMIT 1")
			.get() as { len: number };
		expect(emb.len).toBe(EMBED_BYTES);

		// Bucket counts are consistent with the total.
		const counts = db.bucketCounts();
		const total = counts.deprecated + counts.apiv1 + counts.apiv2 + counts.general;
		expect(total).toBe(result.chunks);
	});
});

describe("buildIndex — empty dir", () => {
	test("a directory with no files yields {files:0, chunks:0}", async () => {
		const dir = makeTempDir();
		const callsBefore = mockState.embedCalls;

		const result = await buildIndex({ knowledgeDir: dir });

		expect(result).toEqual({ files: 0, chunks: 0, unchanged: 0 });
		expect(db.countChunks()).toBe(0);
		// No files → no embed calls.
		expect(mockState.embedCalls).toBe(callsBefore);

		rmSync(dir, { recursive: true, force: true });
	});
});

describe("buildIndex — incremental re-indexing (content hash)", () => {
	// Core proof of T19: build, then re-build unchanged → embed is NOT called
	// again and the store does not grow. The old (pre-incremental) behavior
	// doubled the store on every run; now unchanged files are skipped.
	test("second run without force skips all unchanged files (no re-embed)", async () => {
		const dir = makeTempDir();
		// a.md → 1 chunk, b.md → 2 chunks  ⇒  files 2, chunks 3.
		writeFiles(dir, {
			"a.md": "# A\n\nbody A",
			"b.md": ["# B", "", "intro", "", "## C", "", "body C"].join("\n"),
		});

		const first = await buildIndex({ knowledgeDir: dir });
		expect(first).toEqual({ files: 2, chunks: 3, unchanged: 0 });
		expect(db.countChunks()).toBe(3);
		const embedAfterFirst = mockState.embedCalls;
		expect(embedAfterFirst).toBe(2); // one batch per non-empty file

		// Second run WITHOUT force, nothing changed: every file is skipped, no
		// embed call happens, store stays at 3.
		const second = await buildIndex({ knowledgeDir: dir });
		expect(second).toEqual({ files: 2, chunks: 0, unchanged: 2 });
		expect(db.countChunks()).toBe(3);
		expect(mockState.embedCalls).toBe(embedAfterFirst); // NO new embed calls

		// Hashes were stored for both files.
		expect(db.getStoredHash("a.md")).toBeTypeOf("string");
		expect(db.getStoredHash("b.md")).toBeTypeOf("string");

		rmSync(dir, { recursive: true, force: true });
	});

	test("modifying ONE file re-embeds only that file; the other is reused", async () => {
		const dir = makeTempDir();
		writeFiles(dir, {
			"a.md": "# A\n\nversion one",
			"b.md": ["# B", "", "intro", "", "## C", "", "body C"].join("\n"),
		});

		// First run: a.md (1 chunk), b.md (2 chunks) → 3 chunks, 2 embed batches.
		const first = await buildIndex({ knowledgeDir: dir });
		expect(first.chunks).toBe(3);
		expect(db.countChunks()).toBe(3);
		const embedAfterFirst = mockState.embedCalls;
		expect(embedAfterFirst).toBe(2);
		const bChunksBefore = (
			db.getDb().prepare("SELECT text FROM chunks WHERE source_file = ?").all("b.md") as Array<{
				text: string;
			}>
		).map((r) => r.text);

		// Touch ONLY a.md.
		writeFiles(dir, { "a.md": "# A\n\nversion two (modified)" });

		// Second run: a.md is re-embedded (its hash changed); b.md is reused.
		const second = await buildIndex({ knowledgeDir: dir });
		expect(second.files).toBe(2);
		expect(second.chunks).toBe(1); // only a.md re-chunked (1 chunk)
		expect(second.unchanged).toBe(1); // b.md skipped
		// Exactly ONE additional embed batch (a.md); b.md contributed none.
		expect(mockState.embedCalls).toBe(embedAfterFirst + 1);

		// Store still totals 3 chunks: a.md's 1 (replaced) + b.md's 2 (kept).
		expect(db.countChunks()).toBe(3);
		const aRows = db
			.getDb()
			.prepare("SELECT text FROM chunks WHERE source_file = ?")
			.all("a.md") as Array<{ text: string }>;
		expect(aRows.length).toBe(1);
		expect(aRows[0]!.text).toContain("version two (modified)");
		// b.md's chunks are byte-for-byte what they were before — untouched.
		const bChunksAfter = (
			db.getDb().prepare("SELECT text FROM chunks WHERE source_file = ?").all("b.md") as Array<{
				text: string;
			}>
		).map((r) => r.text);
		expect(bChunksAfter).toEqual(bChunksBefore);

		// The modified file's hash was updated; the untouched one's was not.
		expect(db.getStoredHash("a.md")).not.toBe(db.getStoredHash("b.md"));

		rmSync(dir, { recursive: true, force: true });
	});

	test("deleting a file from the corpus evicts its chunks + hash (stale cleanup)", async () => {
		const dir = makeTempDir();
		writeFiles(dir, {
			"a.md": "# A\n\nbody A",
			"b.md": "# B\n\nbody B",
		});
		const first = await buildIndex({ knowledgeDir: dir });
		expect(first.chunks).toBe(2);
		expect(db.countChunks()).toBe(2);
		expect(db.getAllTrackedFilePaths().sort()).toEqual(["a.md", "b.md"]);

		// Remove a.md from disk.
		rmSync(join(dir, "a.md"));

		const second = await buildIndex({ knowledgeDir: dir });
		// Only b.md walked now; a.md not present to be counted.
		expect(second.files).toBe(1);
		expect(second.chunks).toBe(0); // b.md unchanged → reused
		expect(second.unchanged).toBe(1);
		// a.md's chunks were evicted by stale cleanup.
		expect(db.countChunks()).toBe(1);
		expect(db.getAllTrackedFilePaths()).toEqual(["b.md"]);
		const aRows = db
			.getDb()
			.prepare("SELECT COUNT(*) AS c FROM chunks WHERE source_file = ?")
			.get("a.md") as { c: number };
		expect(aRows.c).toBe(0);

		rmSync(dir, { recursive: true, force: true });
	});

	test("force rebuild ignores stored hashes and re-embeds everything", async () => {
		const dir = makeTempDir();
		writeFiles(dir, {
			"a.md": "# A\n\nbody A",
			"b.md": "# B\n\nbody B",
		});
		await buildIndex({ knowledgeDir: dir });
		expect(db.countChunks()).toBe(2);
		const before = mockState.embedCalls;
		// Unchanged content, but force:true → re-embed all files, resetting the
		// hash table via resetDatabase.
		const forced = await buildIndex({ knowledgeDir: dir, force: true });
		expect(forced).toEqual({ files: 2, chunks: 2, unchanged: 0 });
		expect(db.countChunks()).toBe(2);
		// Both files were re-embedded despite being byte-identical.
		expect(mockState.embedCalls).toBe(before + 2);
		// Content hashes are byte-derived, so identical content yields an
		// identical hash — force re-embeds the vectors but stores the same
		// hash. The hashes are still present (re-written) after the force pass.
		expect(db.getStoredHash("a.md")).toBeTypeOf("string");
		expect(db.getStoredHash("b.md")).toBeTypeOf("string");

		rmSync(dir, { recursive: true, force: true });
	});

	test("fileHash is a stable SHA-256 hex digest of the raw bytes", async () => {
		const dir = makeTempDir();
		const rel = "h.md";
		writeFiles(dir, { [rel]: "# Hello\n\ncontent" });
		const full = join(dir, rel);

		const h1 = await fileHash(full);
		const h2 = await fileHash(full);
		expect(h1).toBe(h2); // stable
		expect(h1).toMatch(/^[0-9a-f]{64}$/); // SHA-256 hex length

		// A single-byte change flips the hash.
		writeFiles(dir, { [rel]: "# Hello\n\ncontent!" });
		const h3 = await fileHash(full);
		expect(h3).not.toBe(h1);

		rmSync(dir, { recursive: true, force: true });
	});
});
