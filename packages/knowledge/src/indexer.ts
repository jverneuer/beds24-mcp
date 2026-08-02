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

import { readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { chunkMarkdown, type Chunk } from "./markdown/chunk.js";
import { countChunks, getDb, insertChunk, resetDatabase } from "./db.js";
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

export interface BuildResult {
	/** Number of markdown files indexed. */
	files: number;
	/** Total chunks written to the store. */
	chunks: number;
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
		// needed when the user_version bumps between builds.
		console.error("[beds24] force: resetting database (schema + FTS)");
		resetDatabase();
	}

	const files = walkMarkdown(root);
	let totalChunks = 0;

	// Process files one at a time; per-file embedding keeps memory flat and lets
	// us print steady progress.
	for (const fullPath of files) {
		const sourceFile = relative(root, fullPath).split("\\").join("/");
		const markdown = readText(fullPath);

		// bucketFromPath is the fallback; chunkMarkdown parses the frontmatter
		// and overrides the bucket when the doc declares one.
		const chunks: Chunk[] = chunkMarkdown(sourceFile, markdown, bucketFromPath(sourceFile));

		if (chunks.length === 0) {
			console.error(`  ${sourceFile}: 0 chunks (empty)`);
			continue;
		}

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

		totalChunks += chunks.length;
		console.error(`  ${sourceFile}: ${chunks.length} chunks`);
	}

	const indexed = countChunks();
	console.error(`[beds24] indexed ${files.length} files, ${totalChunks} chunks (store has ${indexed})`);
	return { files: files.length, chunks: totalChunks };
}
