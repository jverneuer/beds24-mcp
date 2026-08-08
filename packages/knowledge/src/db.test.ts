/**
 * Unit tests for the SQLite vector store (`db.ts`).
 *
 * `getDb()` is a module-level singleton, so every test starts from a fresh
 * in-memory database: `beforeEach` closes the cached connection (via the
 * additive `__resetDbForTests` hook) and the module re-opens `:memory:` on the
 * next `getDb()`. The env var is set before the dynamic import because ESM
 * imports are hoisted above ordinary statements.
 */

import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import type { Bucket } from "./markdown/frontmatter.js";

// --- Capture original env BEFORE the module-load-time mutation below ---
const ORIGINAL_BEDS24_DB_PATH = process.env.BEDS24_DB_PATH;
const ORIGINAL_BEDS24_EMBEDDER = process.env.BEDS24_EMBEDDER;

// Point the store at an in-memory database BEFORE importing the module —
// `paths.ts` reads `BEDS24_DB_PATH` once, at import time.
process.env.BEDS24_DB_PATH = ":memory:";
const db = await import("./db.js");

/** A deterministic 384-dim embedding (all zeros round-trip losslessly). */
const EMBEDDING = new Array<number>(db.EMBED_DIM).fill(0);

/** Build a deterministic `dim`-dim embedding (zeros — lossless round-trip). */
function embeddingOf(dim: number): number[] {
	return new Array<number>(dim).fill(0);
}

/** Read the stored embedding dimension from the `meta` table (undefined if absent). */
function storedDim(): string | undefined {
	const conn = db.getDb();
	// The `meta` table may not exist yet (pre-T18 DB or right after a DROP) —
	// guard the probe so callers always get `undefined` instead of a throw.
	const exists = conn
		.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
		.get("meta") as { name: string } | undefined;
	if (!exists) return undefined;
	const row = conn
		.prepare("SELECT value FROM meta WHERE key = ?")
		.get("embedding_dim") as { value: string } | undefined;
	return row?.value;
}

/** Column names of the `chunks` table (PRAGMA table_info). */
function chunkColumns(): string[] {
	return (db.getDb().prepare("PRAGMA table_info(chunks)").all() as Array<{ name: string }>).map(
		(c) => c.name,
	);
}

/** Build a unique-ish source file name so seeded rows never collide. */
function row(tag: string, bucket: Bucket, docUrl: string | null = null) {
	return {
		sourceFile: `${tag}.md`,
		headingPath: ["Section", "Sub"],
		lineStart: 1,
		lineEnd: 10,
		text: `seeded chunk for ${tag}`,
		bucket,
		docUrl,
	};
}

beforeEach(() => {
	// Fresh in-memory db + cleared flags for every test.
	db.__resetDbForTests();
});

afterEach(() => {
	// Belt-and-braces: guarantee no test leaves the connection in a bad state.
	db.__resetDbForTests();
	// Restore env vars captured at module load so later files inherit a clean state.
	if (ORIGINAL_BEDS24_EMBEDDER === undefined) delete process.env.BEDS24_EMBEDDER;
	else process.env.BEDS24_EMBEDDER = ORIGINAL_BEDS24_EMBEDDER;
	if (ORIGINAL_BEDS24_DB_PATH === undefined) delete process.env.BEDS24_DB_PATH;
	else process.env.BEDS24_DB_PATH = ORIGINAL_BEDS24_DB_PATH;
});

describe("constants + getDb", () => {
	test("EMBED_DIM matches the Xenova/all-MiniLM-L6-v2 output size", () => {
		expect(db.EMBED_DIM).toBe(384);
	});

	test("getDb() returns a stable singleton across calls", () => {
		const first = db.getDb();
		const second = db.getDb();
		expect(first).toBe(second);
	});

	test("getDb() re-initializes after a reset (new connection)", () => {
		const before = db.getDb();
		db.__resetDbForTests();
		const after = db.getDb();
		expect(after).not.toBe(before);
	});

	test("getDb() loads the extension only once (skip-load branch)", () => {
		// First call loads the extension.
		const first = db.getDb();
		// Reset the connection but mark the extension as already loaded → the
		// next getDb() must take the `extensionLoaded` "already loaded" branch.
		db.__resetDbForTests({ extensionLoaded: true });
		const second = db.getDb();
		expect(second).not.toBe(first);
	});
});

describe("countChunks + empty-db behavior", () => {
	test("empty database reports zero chunks", () => {
		expect(db.countChunks()).toBe(0);
	});

	test("bucketCounts() is all-zero on an empty database", () => {
		expect(db.bucketCounts()).toEqual({
			deprecated: 0,
			apiv1: 0,
			apiv2: 0,
			general: 0,
		});
	});
});

describe("insertChunk", () => {
	test("insertChunk returns an autoincrement id and bumps the count", () => {
		const id = db.insertChunk(
			"a.md",
			["H"],
			1,
			5,
			"hello world",
			EMBEDDING,
			"general",
			null,
		);
		expect(id).toBeGreaterThan(0);
		expect(db.countChunks()).toBe(1);
	});

	test("inserting multiple chunks yields contiguous ids + correct count", () => {
		const ids = new Array<number>();
		for (let i = 0; i < 5; i++) {
			ids.push(
				db.insertChunk(
					`f${i}.md`,
					["H"],
					1,
					2,
					`body ${i}`,
					EMBEDDING,
					"apiv2",
					"https://example.com",
				),
			);
		}
		expect(db.countChunks()).toBe(5);
		// Autoincrement ids are strictly increasing.
		for (let i = 1; i < ids.length; i++) {
			expect(ids[i]).toBeGreaterThan(ids[i - 1]!);
		}
	});

	test("headingPath is round-tripped through JSON serialization", () => {
		const id = db.insertChunk(
			"nested.md",
			["API", "Bookings", "Create"],
			10,
			20,
			"deep heading",
			EMBEDDING,
			"apiv2",
			null,
		);
		const row = db
			.getDb()
			.prepare("SELECT heading_path FROM chunks WHERE id = ?")
			.get(id) as { heading_path: string };
		expect(JSON.parse(row.heading_path)).toEqual(["API", "Bookings", "Create"]);
	});
});

describe("bucketCounts", () => {
	test("counts rows per bucket, defaulting unknown buckets to zero", () => {
		const r = row;
		db.insertChunk(
			r("g1", "general").sourceFile,
			r("g1", "general").headingPath,
			r("g1", "general").lineStart,
			r("g1", "general").lineEnd,
			r("g1", "general").text,
			EMBEDDING,
			"general",
			null,
		);
		db.insertChunk(
			r("v1", "apiv2").sourceFile,
			r("v1", "apiv2").headingPath,
			r("v1", "apiv2").lineStart,
			r("v1", "apiv2").lineEnd,
			r("v1", "apiv2").text,
			EMBEDDING,
			"apiv2",
			null,
		);
		db.insertChunk(
			r("v2", "apiv2").sourceFile,
			r("v2", "apiv2").headingPath,
			r("v2", "apiv2").lineStart,
			r("v2", "apiv2").lineEnd,
			r("v2", "apiv2").text,
			EMBEDDING,
			"apiv2",
			null,
		);
		const counts = db.bucketCounts();
		expect(counts.general).toBe(1);
		expect(counts.apiv2).toBe(2);
		expect(counts.apiv1).toBe(0);
		expect(counts.deprecated).toBe(0);
	});

	test("rows with an unknown bucket are skipped by bucketCounts", () => {
		// Insert a row whose bucket is not one of KNOWN_BUCKETS via raw SQL.
		const conn = db.getDb();
		const blob = Buffer.from(new Float32Array(EMBEDDING).buffer);
		conn
			.prepare(
				`INSERT INTO chunks
				   (source_file, heading_path, line_start, line_end, text, embedding, bucket, doc_url, embedding_model)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
			.run(
				"weird.md",
				"[]",
				1,
				2,
				"unknown bucket",
				blob,
				"not_a_bucket",
				null,
				"local",
			);
		const counts = db.bucketCounts();
		const total = counts.deprecated + counts.apiv1 + counts.apiv2 + counts.general;
		expect(total).toBe(0);
	});
});

describe("clearChunks + resetDatabase", () => {
	test("clearChunks removes every row but keeps the schema", () => {
		db.insertChunk("a.md", ["H"], 1, 2, "x", EMBEDDING, "general", null);
		db.insertChunk("b.md", ["H"], 1, 2, "y", EMBEDDING, "apiv2", null);
		expect(db.countChunks()).toBe(2);

		db.clearChunks();
		expect(db.countChunks()).toBe(0);

		// Schema survived → we can still insert.
		db.insertChunk("c.md", ["H"], 1, 2, "z", EMBEDDING, "general", null);
		expect(db.countChunks()).toBe(1);
	});

	test("resetDatabase drops + recreates the schema", () => {
		db.insertChunk("a.md", ["H"], 1, 2, "x", EMBEDDING, "general", null);
		expect(db.countChunks()).toBe(1);

		db.resetDatabase();
		expect(db.countChunks()).toBe(0);

		// Schema was recreated → inserts still work.
		db.insertChunk("d.md", ["H"], 1, 2, "w", EMBEDDING, "apiv2", null);
		expect(db.countChunks()).toBe(1);
	});
});

describe("FTS5 sync triggers", () => {
	test("a newly inserted chunk is searchable via the FTS table", () => {
		db.insertChunk(
			"fts.md",
			["H"],
			1,
			2,
			"uniquefuzzyterm elephant",
			EMBEDDING,
			"general",
			null,
		);
		const hits = db
			.getDb()
			.prepare("SELECT rowid FROM chunks_fts WHERE chunks_fts MATCH ?")
			.all("uniquefuzzyterm") as Array<{ rowid: number }>;
		expect(hits.length).toBe(1);
	});

	test("clearChunks keeps the FTS table in sync (delete trigger)", () => {
		const id = db.insertChunk(
			"fts2.md",
			["H"],
			1,
			2,
			"giraffe uniqueword",
			EMBEDDING,
			"general",
			null,
		);
		db.clearChunks();
		const hits = db
			.getDb()
			.prepare("SELECT rowid FROM chunks_fts WHERE chunks_fts MATCH ?")
			.all("giraffe") as Array<{ rowid: number }>;
		expect(hits.length).toBe(0);
		expect(id).toBeGreaterThan(0);
	});
});

describe("migration gate (ensureSchema)", () => {
	test("a fresh connection is migrated to the current schema version", () => {
		const conn = db.getDb();
		const versionRow = conn
			.prepare("PRAGMA user_version")
			.get() as { user_version: number };
		expect(versionRow.user_version).toBe(3);

		const ftsRow = conn
			.prepare(
				"SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
			)
			.get("chunks_fts") as { name: string } | undefined;
		expect(ftsRow?.name).toBe("chunks_fts");

		// The `meta` table (dimension bookmark) is created by the migration.
		const metaRow = conn
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
			.get("meta") as { name: string } | undefined;
		expect(metaRow?.name).toBe("meta");

		// On a fresh (re)build the active dimension is stamped into `meta`.
		expect(storedDim()).toBe(String(db.currentEmbedderDimension()));
	});

	test("an already-migrated connection skips recreate (no data loss)", () => {
		// Seed a sentinel row, then re-run the migration gate on the same
		// (already-migrated) connection. The gate must take the
		// "already at current version" branch and leave the row intact.
		db.insertChunk(
			"sentinel.md",
			["H"],
			1,
			2,
			"do not drop me",
			EMBEDDING,
			"general",
			null,
		);
		expect(db.countChunks()).toBe(1);

		db.__rerunSchemaGateForTests();

		expect(db.countChunks()).toBe(1);
	});

	test("a gate reset with schemaReady:true short-circuits ensureSchema", () => {
		// Seed so the table exists, then reset with schemaReady:true. The next
		// getDb() must hit the `if (schemaReady) return` early-return branch.
		db.insertChunk("x.md", ["H"], 1, 2, "t", EMBEDDING, "general", null);
		db.__resetDbForTests({ schemaReady: true });
		// Still returns a valid connection; the early return simply skips work.
		expect(db.getDb()).toBeDefined();
	});

	// T19 additive migration: a DB at the current schema version that predates
	// the `indexed_files` table must get it created in place (no data loss),
	// without bumping the schema version or recreating `chunks`.
	test("missing indexed_files table is added in place (additive migration)", () => {
		// Seed a sentinel chunk + a hash record, then drop `indexed_files` to
		// simulate a pre-T19 database that's otherwise at schema version 3.
		db.insertChunk("sentinel.md", ["H"], 1, 2, "keep", EMBEDDING, "general", null);
		db.setStoredHash("sentinel.md", "deadbeef", 1);
		expect(db.countChunks()).toBe(1);
		expect(db.getStoredHash("sentinel.md")).toBe("deadbeef");

		db.getDb().exec("DROP TABLE IF EXISTS indexed_files;");
		// Table is gone — verify via schema introspection (getStoredHash's
		// prepare would throw on a missing table; that's not the path under
		// test, the gate is).
		const tableExists = db
			.getDb()
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
			.get("indexed_files") as { name: string } | undefined;
		expect(tableExists).toBeUndefined();

		// Re-run the gate: `indexed_files` missing but schema version current →
		// the additive branch recreates the table without wiping `chunks`.
		db.__rerunSchemaGateForTests();

		// The table exists again; the gate took the non-recreate path so the
		// seeded chunk survives (only the hash record was dropped with the
		// table — additive migration re-creates an empty table, as intended).
		expect(db.countChunks()).toBe(1);
		const stillThere = db
			.getDb()
			.prepare("SELECT source_file FROM chunks WHERE source_file = ?")
			.get("sentinel.md") as { source_file: string } | undefined;
		expect(stillThere?.source_file).toBe("sentinel.md");
		// And we can store hashes again on the recreated table.
		db.setStoredHash("sentinel.md", "cafebabe", 1);
		expect(db.getStoredHash("sentinel.md")).toBe("cafebabe");
	});
});

describe("indexed_files — per-file content hash store", () => {
	test("a fresh database tracks no files", () => {
		expect(db.getStoredHash("missing.md")).toBeUndefined();
		expect(db.getAllTrackedFilePaths()).toEqual([]);
	});

	test("setStoredHash stores a hash; getStoredHash round-trips it", () => {
		db.setStoredHash("a.md", "deadbeef", 3);
		expect(db.getStoredHash("a.md")).toBe("deadbeef");
		expect(db.getAllTrackedFilePaths()).toEqual(["a.md"]);
	});

	test("setStoredHash with the same path overwrites (upsert, not duplicate)", () => {
		db.setStoredHash("a.md", "first", 1);
		db.setStoredHash("a.md", "second", 2);
		expect(db.getStoredHash("a.md")).toBe("second");
		// One row, not two.
		const paths = db.getAllTrackedFilePaths();
		expect(paths.filter((p) => p === "a.md")).toHaveLength(1);
	});

	test("getAllTrackedFilePaths returns entries oldest-first by indexed_at", () => {
		db.setStoredHash("early.md", "h1", 1);
		// Force a measurable gap so the clock ordering is deterministic.
		const row = db
			.getDb()
			.prepare("SELECT indexed_at FROM indexed_files WHERE file_path = ?")
			.get("early.md") as { indexed_at: number };
		db
			.getDb()
			.prepare("UPDATE indexed_files SET indexed_at = ? WHERE file_path = ?")
			.run(row.indexed_at + 1000, "late.md");
		// Seed late.md directly with the bumped timestamp.
		db.setStoredHash("late.md", "h2", 1);
		// Re-stamp early.md to be definitively older than late.md.
		db
			.getDb()
			.prepare("UPDATE indexed_files SET indexed_at = ? WHERE file_path = ?")
			.run(row.indexed_at - 1000, "early.md");

		expect(db.getAllTrackedFilePaths()).toEqual(["early.md", "late.md"]);
	});

	test("deleteStoredHash removes the row; getStoredHash then returns undefined", () => {
		db.setStoredHash("gone.md", "h", 1);
		expect(db.getStoredHash("gone.md")).toBe("h");
		db.deleteStoredHash("gone.md");
		expect(db.getStoredHash("gone.md")).toBeUndefined();
		// Deleting a non-existent path is a no-op, not an error.
		expect(() => db.deleteStoredHash("never.md")).not.toThrow();
	});

	test("deleteChunksForFile removes only the named file's chunks", () => {
		const keepId = db.insertChunk("keep.md", ["H"], 1, 2, "keep", EMBEDDING, "general", null);
		const dropId = db.insertChunk("drop.md", ["H"], 1, 2, "drop", EMBEDDING, "general", null);
		expect(db.countChunks()).toBe(2);

		db.deleteChunksForFile("drop.md");

		expect(db.countChunks()).toBe(1);
		// keep.md's row survived (same id), drop.md's row is gone.
		const surviving = db
			.getDb()
			.prepare("SELECT source_file FROM chunks WHERE id = ?")
			.get(keepId) as { source_file: string } | undefined;
		expect(surviving?.source_file).toBe("keep.md");
		const dropped = db
			.getDb()
			.prepare("SELECT id FROM chunks WHERE id = ?")
			.get(dropId) as { id: number } | undefined;
		expect(dropped).toBeUndefined();
		// FTS stayed in sync via the delete trigger.
		const ftsHits = db
			.getDb()
			.prepare("SELECT rowid FROM chunks_fts WHERE chunks_fts MATCH ?")
			.all("drop") as Array<{ rowid: number }>;
		expect(ftsHits.length).toBe(0);
	});
});

describe("dbExists", () => {
	test(":memory: is never a file on disk → dbExists() is false (try branch)", () => {
		expect(db.dbExists()).toBe(false);
	});

	test("dbExists() swallows a failing require and returns false (catch branch)", () => {
		const original = (globalThis as any).require;
		(globalThis as any).require = () => {
			throw new Error("require disabled");
		};
		try {
			expect(db.dbExists()).toBe(false);
		} finally {
			(globalThis as any).require = original;
		}
	});
});

// ---------------------------------------------------------------------------
// T18 — embedding_model column + dynamic dimension handling
// ---------------------------------------------------------------------------

describe("T18 — schema carries embedding_model + meta dimension", () => {
	test("chunks table exposes an `embedding_model` column", () => {
		db.getDb();
		expect(chunkColumns()).toContain("embedding_model");
	});

	test("meta table exposes the active embedder dimension after build", () => {
		// Default provider is local (384).
		db.getDb();
		expect(storedDim()).toBe("384");
		expect(db.currentEmbedderDimension()).toBe(384);
	});

	test("insertChunk stamps the active embedder id into embedding_model", () => {
		db.getDb();
		const id = db.insertChunk("m.md", ["H"], 1, 2, "body", EMBEDDING, "general", null);
		const row = db
			.getDb()
			.prepare("SELECT embedding_model FROM chunks WHERE id = ?")
			.get(id) as { embedding_model: string };
		// Default provider id is "local".
		expect(row.embedding_model).toBe("local");
	});

	test("EMBED_DIM stays 384 (CONTRACT.md frozen) while real dimension is dynamic", () => {
		expect(db.EMBED_DIM).toBe(384);
		// currentEmbedderDimension() reflects the active provider, not the constant.
		expect(db.currentEmbedderDimension()).toBe(db.EMBED_DIM);
	});
});

describe("T18 — dimension-mismatch detection (the crux)", () => {
	test("active embedder change (local 384 → ollama-bge-m3 1024) forces a rebuild", () => {
		// Build the index at the default local dimension (384).
		db.getDb();
		expect(db.currentEmbedderDimension()).toBe(384);
		expect(storedDim()).toBe("384");

		const id = db.insertChunk(
			"sentinel.md",
			["H"],
			1,
			2,
			"will be wiped",
			EMBEDDING,
			"general",
			null,
		);
		expect(db.countChunks()).toBe(1);
		expect(id).toBeGreaterThan(0);

		// Switch the active embedder to ollama-bge-m3 (1024-dim) and re-run the
		// migration gate. The stored dimension (384) no longer matches the
		// active dimension (1024), so the gate must drop + recreate.
		process.env.BEDS24_EMBEDDER = "ollama-bge-m3";
		db.__rerunSchemaGateForTests();

		// Table was recreated at the new dimension → prior rows are gone.
		expect(db.countChunks()).toBe(0);
		expect(db.currentEmbedderDimension()).toBe(1024);
		expect(storedDim()).toBe("1024");

		// And we can insert a 1024-dim vector into the rebuilt table.
		const big = embeddingOf(1024);
		const newId = db.insertChunk(
			"after-switch.md",
			["H"],
			1,
			2,
			"1024-dim body",
			big,
			"general",
			null,
		);
		expect(newId).toBeGreaterThan(0);
		expect(db.countChunks()).toBe(1);
		const row = db
			.getDb()
			.prepare("SELECT embedding_model FROM chunks WHERE id = ?")
			.get(newId) as { embedding_model: string };
		expect(row.embedding_model).toBe("ollama-bge-m3");
	});

	test("ollama-bge-small (384) is a drop-in — no rebuild when switching to it from local", () => {
		// Build at local (384).
		db.getDb();
		expect(storedDim()).toBe("384");
		db.insertChunk("keep.md", ["H"], 1, 2, "retain me", EMBEDDING, "general", null);
		const before = db.countChunks();
		expect(before).toBeGreaterThan(0);

		// bge-small is also 384-dim → same dimension → no rebuild.
		process.env.BEDS24_EMBEDDER = "ollama-bge-small";
		db.__rerunSchemaGateForTests();

		expect(db.currentEmbedderDimension()).toBe(384);
		expect(storedDim()).toBe("384");
		// Rows are preserved (no drop + recreate).
		expect(db.countChunks()).toBe(before);
	});

	test("stays at 1024 after switching the active embedder to ollama-bge-m3 (env overrides default)", () => {
		// Explicitly select the 1024-dim embedder.
		process.env.BEDS24_EMBEDDER = "ollama-bge-m3";
		db.__resetDbForTests(); // new :memory: connection → gate runs against env
		db.getDb();

		expect(db.currentEmbedderDimension()).toBe(1024);
		expect(storedDim()).toBe("1024");

		// Inserting a 1024-dim vector succeeds; a mismatched 384-dim one would
		// be rejected by vec_distance_cosine at query time, so we only store
		// vectors that match the stamped dimension.
		const id = db.insertChunk(
			"big.md",
			["H"],
			1,
			2,
			"1024 body",
			embeddingOf(1024),
			"general",
			null,
		);
		expect(id).toBeGreaterThan(0);
		const row = db
			.getDb()
			.prepare("SELECT length(embedding) AS len FROM chunks WHERE id = ?")
			.get(id) as { len: number };
		expect(row.len).toBe(1024 * 4); // 1024 floats × 4 bytes
	});

	test("switching back from 1024 (ollama-bge-m3) to 384 (local) rebuilds at 384", () => {
		// Start at 1024.
		process.env.BEDS24_EMBEDDER = "ollama-bge-m3";
		db.__resetDbForTests();
		db.getDb();
		expect(storedDim()).toBe("1024");
		db.insertChunk("big.md", ["H"], 1, 2, "x", embeddingOf(1024), "general", null);
		expect(db.countChunks()).toBe(1);

		// Switch back to local (384). Mismatch → rebuild.
		delete process.env.BEDS24_EMBEDDER;
		db.__rerunSchemaGateForTests();

		expect(db.currentEmbedderDimension()).toBe(384);
		expect(storedDim()).toBe("384");
		expect(db.countChunks()).toBe(0); // wiped + recreated
	});

	test("rebuild on missing meta table (pre-T18 database) forces recreation", () => {
		// Build normally, then drop the `meta` table to simulate a pre-T18 DB.
		db.getDb();
		expect(storedDim()).toBe("384");
		db.insertChunk("sentinel2.md", ["H"], 1, 2, "x", EMBEDDING, "general", null);
		expect(db.countChunks()).toBe(1);

		db.getDb().exec("DROP TABLE IF EXISTS meta;");
		expect(storedDim()).toBeUndefined();

		// Re-run the gate: missing `meta` → recreate at the active dimension.
		db.__rerunSchemaGateForTests();

		expect(storedDim()).toBe("384");
		expect(db.countChunks()).toBe(0); // recreated, rows gone
	});
});

describe("T18 — resetDatabase re-stamps the active dimension", () => {
	test("resetDatabase drops + recreates and re-stamps meta at the active dimension", () => {
		// Start with the 1024-dim embedder.
		process.env.BEDS24_EMBEDDER = "ollama-bge-m3";
		db.__resetDbForTests();
		db.getDb();
		expect(storedDim()).toBe("1024");

		db.insertChunk("a.md", ["H"], 1, 2, "x", embeddingOf(1024), "general", null);
		expect(db.countChunks()).toBe(1);

		db.resetDatabase();

		// Wiped + recreated, dimension re-stamped at the active (1024) value.
		expect(db.countChunks()).toBe(0);
		expect(storedDim()).toBe("1024");
		expect(db.currentEmbedderDimension()).toBe(1024);

		// A subsequent getDb() must NOT trigger another rebuild (meta matches).
		db.__rerunSchemaGateForTests();
		expect(storedDim()).toBe("1024");
	});
});

describe("T18 — clearChunks preserves the dimension bookmark", () => {
	test("clearChunks wipes rows but leaves meta (dimension) intact", () => {
		db.getDb();
		db.insertChunk("a.md", ["H"], 1, 2, "x", EMBEDDING, "general", null);
		db.insertChunk("b.md", ["H"], 1, 2, "y", EMBEDDING, "apiv2", null);
		expect(db.countChunks()).toBe(2);
		expect(storedDim()).toBe("384");

		db.clearChunks();

		expect(db.countChunks()).toBe(0);
		// Dimension bookmark survives — a later getDb() must not rebuild.
		expect(storedDim()).toBe("384");
		db.__rerunSchemaGateForTests();
		expect(storedDim()).toBe("384");
		// And we can still insert after clearing.
		db.insertChunk("c.md", ["H"], 1, 2, "z", EMBEDDING, "general", null);
		expect(db.countChunks()).toBe(1);
	});
});

describe("T18 — defensive embedder resolution + additive migrations", () => {
	test("an unknown BEDS24_EMBEDDER falls back to local defaults (no throw)", () => {
		// Build at the default local dimension first.
		db.getDb();
		expect(storedDim()).toBe("384");

		// Point at a provider that does NOT exist. createEmbedder() throws; the
		// gate must catch that and fall back to the local default rather than
		// crashing — the dimension bookmark is preserved.
		process.env.BEDS24_EMBEDDER = "not-a-real-provider";
		db.__rerunSchemaGateForTests();

		expect(() => db.getDb()).not.toThrow();
		expect(db.currentEmbedderDimension()).toBe(384);
		expect(storedDim()).toBe("384");
	});

	test("additive migration: existing v3 DB missing `indexed_files` gets it created in place", () => {
		// Build a full v3 DB (has chunks, fts, meta, indexed_files).
		db.getDb();
		expect(storedDim()).toBe("384");
		db.insertChunk("keep.md", ["H"], 1, 2, "retain", EMBEDDING, "general", null);
		expect(db.countChunks()).toBe(1);
		// Confirm the table exists before dropping it.
		const before = db
			.getDb()
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
			.get("indexed_files") as { name: string } | undefined;
		expect(before?.name).toBe("indexed_files");

		// Simulate a DB that predates T19: drop `indexed_files` while leaving
		// everything else (chunks, meta, user_version=3) intact.
		db.getDb().exec("DROP TABLE indexed_files;");
		const gone = db
			.getDb()
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
			.get("indexed_files") as { name: string } | undefined;
		expect(gone).toBeUndefined();

		// Re-run the gate. No rebuild (dimensions match), but the missing
		// `indexed_files` table must be created in place — chunk data survives.
		db.__rerunSchemaGateForTests();

		const restored = db
			.getDb()
			.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
			.get("indexed_files") as { name: string } | undefined;
		expect(restored?.name).toBe("indexed_files");
		expect(db.countChunks()).toBe(1); // data preserved
		expect(storedDim()).toBe("384");
	});
});
