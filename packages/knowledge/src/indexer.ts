/**
 * Build (or rebuild) the vector index from the markdown knowledge corpus.
 *
 * Pipeline: walk corpus → section chunks (heading- and frontmatter-aware)
 * → embed → upsert. A chunk's `bucket` comes from its frontmatter when the doc
 * declares one; otherwise we fall back to a path-derived bucket so every chunk
 * is still routed to a search pool. `force` drops and recreates the schema +
 * FTS from scratch (used on a user_version bump); otherwise we re-embed in
 * place.
 */

import { createHash } from "node:crypto";
import { readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

import { chunkMarkdown, type Chunk } from "./markdown/chunk.js";
import {
	countChunks,
	deleteChunksForFile,
	deleteStoredHash,
	getAllTrackedFilePaths,
	getDb,
	getStoredHash,
	insertChunk,
	resetDatabase,
	setStoredHash,
} from "./db.js";
import type { Bucket } from "./markdown/frontmatter.js";
import { embed } from "./embed.js";

/**
 * Path substrings that route a doc to the apiv1 pool (checked in order).
 * A chunk under `bookings/`, for example, lands in `apiv1` unless its
 * frontmatter says otherwise.
 */
const APIV1_DIRS = [
	"api-basics",
	"availability",
	"bookings",
	"pricing",
	"properties",
	"invoicing",
	"messages",
	"account",
] as const;

/** Path substrings that route a doc to the general pool. */
const GENERAL_DIRS = ["system-logic", "ota", "csv", "utilities"] as const;

/**
 * Derive a chunk's fallback bucket from its source path — authoritative only
 * when the doc's frontmatter omits one.
 *
 * Checks substrings in priority order; the first match wins and everything
 * unrecognized defaults to "general". Case-insensitive so caller casing (e.g.
 * a `Bookings/` dir) never changes the routing.
 */
function bucketFromPath(sourceFile: string): Bucket {
	const path = sourceFile.toLowerCase();
	if (path.includes("xml-deprecated")) return "deprecated";
	if (APIV1_DIRS.some((d) => path.includes(d))) return "apiv1";
	if (path.includes("api-v2")) return "apiv2";
	if (GENERAL_DIRS.some((d) => path.includes(d))) return "general";
	return "general";
}

/** Collect every `.md` file under `dir`, recursively, with their full paths. */
function walkMarkdown(dir: string): string[] {
	const out: string[] = [];
	const entries = readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			out.push(...walkMarkdown(full));
		} else if (entry.name.endsWith(".md")) {
			out.push(full);
		}
	}
	return out;
}

/** Read a file and guard against accidental binary / unreadable input. */
function readText(path: string): string {
	const fs = require("node:fs") as typeof import("node:fs");
	return fs.readFileSync(path, "utf8");
}

/**
 * SHA-256 hex digest of a file's raw bytes. Pure and testable: the indexer
 * compares this against the stored hash to decide whether a file changed since
 * the last run. Hashing raw bytes (not the decoded text) so a UTF-8 re-encode
 * never produces a false "changed" signal.
 */
export async function fileHash(path: string): Promise<string> {
	const buf = await readFile(path);
	return createHash("sha-256").update(buf).digest("hex");
}

export interface BuildResult {
	/** Number of markdown files indexed. */
	files: number;
	/** Total chunks written to the store. */
	chunks: number;
	/**
	 * Files skipped on this run because their content hash matched the stored
	 * one — their existing chunks + embeddings were reused unchanged. Lets
	 * callers (and tests) verify the incremental path actually fired.
	 */
	unchanged?: number;
}

/**
 * Build the vector index from the knowledge corpus.
 *
 * @param opts.knowledgeDir  Root containing the markdown knowledge docs.
 * @param opts.force        If true, drop + recreate the schema and FTS before re-indexing.
 */
export async function buildIndex(opts: {
	knowledgeDir: string;
	force?: boolean;
}): Promise<BuildResult> {
	const { knowledgeDir, force = false } = opts;
	const root = resolve(knowledgeDir);

	// Touch the db early so the migration runs before we spend time embedding.
	getDb();

	if (force) {
		// resetDatabase() (not clearChunks) so the schema + FTS5 are recreated —
		// needed when the user_version bumps between builds. This also wipes
		// indexed_files, so every file is re-embedded on the force pass.
		console.error("[beds24] force: resetting database (schema + FTS)");
		resetDatabase();
	}

	const files = walkMarkdown(root);
	let totalChunks = 0;
	let unchanged = 0;

	// Process files one at a time; per-file embedding keeps memory flat and lets
	// us print steady progress.
	for (const fullPath of files) {
		const sourceFile = relative(root, fullPath).split("\\").join("/");

		// Incremental gate: hash the file and skip if it's unchanged since the
		// last successful index. --force skips this check (resetDatabase already
		// cleared the hash table above).
		const hash = await fileHash(fullPath);
		if (!force) {
			const stored = getStoredHash(sourceFile);
			if (stored !== undefined && stored === hash) {
				unchanged++;
				continue;
			}
		}

		const markdown = readText(fullPath);

		// bucketFromPath is the fallback; chunkMarkdown parses the frontmatter
		// and overrides the bucket when the doc declares one.
		const chunks: Chunk[] = chunkMarkdown(sourceFile, markdown, bucketFromPath(sourceFile));

		if (chunks.length === 0) {
			console.error(`  ${sourceFile}: 0 chunks (empty)`);
			// The file exists but is empty (or parseable-to-nothing). Clear any
			// stale chunks + hash so an empty file never lingers in the store.
			deleteChunksForFile(sourceFile);
			deleteStoredHash(sourceFile);
			continue;
		}

		// Changed or brand-new file: drop its old chunks before re-inserting so
		// a content edit can't leave orphaned chunks behind (and so re-runs
		// don't silently double the store).
		deleteChunksForFile(sourceFile);

		const texts = chunks.map((c) => c.text);
		const vectors = await embed(texts);

		for (let i = 0; i < chunks.length; i++) {
			const c = chunks[i]!;
			const vec = vectors[i]!;
			insertChunk(
				c.sourceFile,
				c.headingPath,
				c.lineStart,
				c.lineEnd,
				c.text,
				vec,
				c.bucket,
				c.docUrl,
			);
		}

		// Remember the hash only AFTER a successful (re-)embed, so a failed run
		// leaves the file indexed as "changed" on the next attempt.
		setStoredHash(sourceFile, hash, chunks.length);
		totalChunks += chunks.length;
		console.error(`  ${sourceFile}: ${chunks.length} chunks`);
	}

	// Stale cleanup: files that were indexed in a previous run but no longer
	// exist on disk. Evict their chunks + hash record so the store tracks the
	// live corpus exactly. Mirrors Turso's indexed_files cleanup step.
	if (!force) {
		const livePaths = new Set(
			files.map((f) => relative(root, f).split("\\").join("/")),
		);
		for (const tracked of getAllTrackedFilePaths()) {
			if (!livePaths.has(tracked)) {
				deleteChunksForFile(tracked);
				deleteStoredHash(tracked);
				console.error(`  ${tracked}: removed (no longer on disk)`);
			}
		}
	}

	const indexed = countChunks();
	console.error(
		`[beds24] indexed ${files.length} files, ${totalChunks} chunks (store has ${indexed}); ${unchanged} unchanged`,
	);
	return { files: files.length, chunks: totalChunks, unchanged };
}
