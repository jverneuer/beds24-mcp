/**
 * SQLite vector store for the Beds24 knowledge base.
 *
 * We use the `libsql` `Database` class directly (rather than the higher-level
 * `@libsql/client` `Client`) because loading the sqlite-vec extension requires
 * a per-connection `loadExtension()` call, which the `Client` interface does not
 * expose. The connection that loads the extension is the one that must run the
 * cosine-distance queries, so we keep a single shared connection.
 */

import Database from "libsql";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { load } from "sqlite-vec";

/** On-disk location of the regenerable vector index (see .gitignore). */
export const DB_PATH = ".beds24/index.db";

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
	embedding: Buffer;
	distance: number;
}

let dbInstance: DbInstance | null = null;
let extensionLoaded = false;

/** Create the `chunks` table if it does not already exist. */
function ensureSchema(db: DbInstance): void {
	db.exec(`
		CREATE TABLE IF NOT EXISTS chunks (
			id          INTEGER PRIMARY KEY AUTOINCREMENT,
			source_file TEXT NOT NULL,
			heading_path TEXT NOT NULL,
			line_start  INTEGER NOT NULL,
			line_end    INTEGER NOT NULL,
			text        TEXT NOT NULL,
			embedding   BLOB NOT NULL
		);
	`);
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

/** Remove every indexed chunk (used by `buildIndex({ force })`). */
export function clearChunks(): void {
	const db = getDb();
	db.exec("DELETE FROM chunks;");
}

/** Insert a chunk and return its rowid. */
export function insertChunk(
	sourceFile: string,
	headingPath: string[],
	lineStart: number,
	lineEnd: number,
	text: string,
	embedding: number[],
): number {
	const db = getDb();
	const blob = Buffer.from(new Float32Array(embedding).buffer);
	const stmt = db.prepare(
		`INSERT INTO chunks (source_file, heading_path, line_start, line_end, text, embedding)
		 VALUES (?, ?, ?, ?, ?, ?)`,
	);
	const info = stmt.run(
		sourceFile,
		JSON.stringify(headingPath),
		lineStart,
		lineEnd,
		text,
		blob,
	);
	return Number(info.lastInsertRowid);
}

/** Total number of indexed chunks. */
export function countChunks(): number {
	const db = getDb();
	const row = db
		.prepare(`SELECT COUNT(*) AS c FROM chunks`)
		.get() as { c: number } | undefined;
	return row?.c ?? 0;
}
