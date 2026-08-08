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
import type { Bucket } from "./markdown/frontmatter.js";
/** On-disk location of the regenerable vector index (see paths.ts for the value). */
export declare const DB_PATH: string;
/**
 * Default embedding dimensionality (LocalEmbedder). CONTRACT.md frozen at 384.
 *
 * NOTE: the REAL dimension is now dynamic — it follows the active embedder
 * (`createEmbedder().dimension`, selected via `BEDS24_EMBEDDER`). This constant
 * remains the local/default value so the frozen CONTRACT.md surface and the
 * existing test embeddings (all 384-dim) keep working. Use
 * `currentEmbedderDimension()` for the active value.
 */
export declare const EMBED_DIM = 384;
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
/** The active embedder's dimension (dynamic — follows `BEDS24_EMBEDDER`). */
export declare function currentEmbedderDimension(): number;
/**
 * Return the shared `Database` connection, creating + initializing it on first
 * call. Loads the sqlite-vec extension exactly once and points it at the native
 * binding for this platform.
 */
export declare function getDb(): DbInstance;
/** True if the on-disk index database file already exists. */
export declare function dbExists(): boolean;
/** Remove every indexed chunk (FTS table stays in sync via the delete trigger). */
export declare function clearChunks(): void;
/**
 * Drop + recreate both tables and the FTS sync triggers (used on force reindex).
 * Re-stamps the active dimension into `meta` so a subsequent `getDb()` does not
 * see a missing/old dimension and recreate again.
 */
export declare function resetDatabase(): void;
/** Insert a chunk and return its rowid. */
export declare function insertChunk(sourceFile: string, headingPath: string[], lineStart: number, lineEnd: number, text: string, embedding: number[], bucket: Bucket, docUrl: string | null): number;
/** Return the stored content hash for a file, or undefined if never indexed. */
export declare function getStoredHash(filePath: string): string | undefined;
/**
 * Record (or overwrite) a file's content hash after a successful (re-)index.
 * `indexed_at` is stamped with the current time so stale-cleanup + ordering
 * have a trail. Uses upsert semantics so re-indexing a file can't duplicate
 * its row.
 */
export declare function setStoredHash(filePath: string, hash: string, chunkCount: number): void;
/** Remove a file's hash record (used after stale cleanup or a force-rebuild). */
export declare function deleteStoredHash(filePath: string): void;
/**
 * Delete every chunk belonging to one source file. The FTS table stays in sync
 * via the delete trigger. Used to clear a file's old chunks before re-embedding
 * a changed file (avoids the "double the store on every run" behavior).
 */
export declare function deleteChunksForFile(filePath: string): void;
/**
 * Every file path currently tracked in `indexed_files`, oldest first. The
 * indexer walks this after the main pass to evict entries (and their chunks)
 * for files that no longer exist on disk — Turso's stale-cleanup step.
 */
export declare function getAllTrackedFilePaths(): string[];
/**
 * Close the cached connection and reset the init flags so the next `getDb()`
 * re-runs the full open → load-extension → migrate path. The flag overrides
 * let a test pre-seed specific guard states (e.g. `extensionLoaded: true`) to
 * exercise the "already initialized" branches.
 */
export declare function __resetDbForTests(opts?: {
    extensionLoaded?: boolean;
    schemaReady?: boolean;
}): void;
/**
 * Re-run the migration gate against the current (already-migrated) connection
 * with the gate reset, so the "already at the current schema version → skip
 * recreate" branch of `ensureSchema` is reachable with an in-memory database.
 * Also resets the cached embedder info so a test that changes `BEDS24_EMBEDDER`
 * between calls sees the new provider on the re-run.
 */
export declare function __rerunSchemaGateForTests(): void;
/** Total number of indexed chunks. */
export declare function countChunks(): number;
/** Number of chunks per bucket (every known bucket defaults to 0). */
export declare function bucketCounts(): Record<Bucket, number>;
export {};
//# sourceMappingURL=db.d.ts.map