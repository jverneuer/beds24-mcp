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
 */

import Database from "libsql";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { load } from "sqlite-vec";

import { DB_PATH as DB_PATH_FROM_PATHS } from "./paths.js";
import type { Bucket } from "./markdown/frontmatter.js";

/** On-disk location of the regenerable vector index (see paths.ts for the value). */
export const DB_PATH = DB_PATH_FROM_PATHS;

/** Embedding dimensionality — fixed by Xenova/all-MiniLM-L6-v2. */
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
	/** Cosine distance from a query vector (only present on search results). */
	distance?: number;
}

/**
 * Schema version we expect on disk. When the on-disk version is lower than
 * this, or the FTS table is missing, the database is reset and repopulated.
 */
const SCHEMA_VERSION = 2;

let dbInstance: DbInstance | null = null;
let extensionLoaded = false;
/** True once the migration gate has run for the current process. */
let schemaReady = false;

/** Create the `chunks` table, the FTS5 table, and the FTS sync triggers. */
function createSchema(db: DbInstance): void {
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

/** Drop + recreate both tables and the FTS sync triggers (kept in sync by triggers). */
function recreateDatabase(db: DbInstance): void {
	db.exec(`
		DROP TABLE IF EXISTS chunks_fts;
		DROP TABLE IF EXISTS chunks;
	`);
	createSchema(db);
}

/**
 * Run the migration gate once: if `user_version` is behind or the FTS table is
 * missing, reset the database so the next index run repopulates it. Then stamp
 * the current `user_version`.
 */
function ensureSchema(db: DbInstance): void {
	if (schemaReady) return;

	const versionRow = db
		.prepare("PRAGMA user_version")
		.get() as { user_version: number } | undefined;
	const version = versionRow?.user_version ?? 0;

	const ftsRow = db
		.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
		.get("chunks_fts") as { name: string } | undefined;

	if (version < SCHEMA_VERSION || ftsRow === undefined) {
		recreateDatabase(db);
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
	} catch {
		return false;
	}
}

/** Remove every indexed chunk (FTS table stays in sync via the delete trigger). */
export function clearChunks(): void {
	const db = getDb();
	db.exec("DELETE FROM chunks;");
}

/** Drop + recreate both tables and the FTS sync triggers (used on force reindex). */
export function resetDatabase(): void {
	recreateDatabase(getDb());
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
	const blob = Buffer.from(new Float32Array(embedding).buffer);
	const stmt = db.prepare(
		`INSERT INTO chunks (source_file, heading_path, line_start, line_end, text, embedding, bucket, doc_url)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
	);
	return Number(info.lastInsertRowid);
}

/** Total number of indexed chunks. */
export function countChunks(): number {
	const db = getDb();
	const row = db.prepare("SELECT COUNT(*) AS c FROM chunks").get() as
		| { c: number }
		| undefined;
	return row?.c ?? 0;
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
