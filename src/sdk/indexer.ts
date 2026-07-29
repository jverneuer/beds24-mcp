/**
 * Build (or rebuild) the vector index from the markdown knowledge base.
 *
 * Pipeline: walk facts → section chunks (heading-aware) → embed → upsert.
 * Idempotent per run: `force` wipes the table first, otherwise we re-embed
 * everything (cheap enough at this scale, and facts change infrequently).
 */

import { readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { clearChunks, countChunks, getDb, insertChunk } from "./db.ts";
import { chunkMarkdown, type Chunk } from "./chunk.ts";
import { embed } from "./embed.ts";

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
 * Build the vector index from `factsDir`.
 *
 * @param opts.factsDir  Root containing the markdown facts + `apiV2.yaml`.
 * @param opts.force    If true, wipe existing chunks before re-indexing.
 */
export async function buildIndex(opts: {
	factsDir: string;
	force?: boolean;
}): Promise<BuildResult> {
	const { factsDir, force = false } = opts;
	const root = resolve(factsDir);

	// Touch the db early so a missing index is created before we spend time
	// embedding.
	getDb();

	if (force) {
		clearChunks();
	}

	const files = walkMarkdown(root);
	let totalChunks = 0;

	// Process files one at a time; per-file embedding keeps memory flat and lets
	// us print steady progress.
	for (const fullPath of files) {
		const sourceFile = relative(root, fullPath).split("\\").join("/");
		const markdown = readText(fullPath);
		const chunks: Chunk[] = chunkMarkdown(sourceFile, markdown);

		if (chunks.length === 0) {
			console.error(`  ${sourceFile}: 0 chunks (empty)`);
			continue;
		}

		const texts = chunks.map((c) => c.text);
		const vectors = await embed(texts);

		for (let i = 0; i < chunks.length; i++) {
			const c = chunks[i]!;
			const vec = vectors[i]!;
			insertChunk(c.sourceFile, c.headingPath, c.lineStart, c.lineEnd, c.text, vec);
		}

		totalChunks += chunks.length;
		console.error(`  ${sourceFile}: ${chunks.length} chunks`);
	}

	const indexed = countChunks();
	console.error(`[beds24] indexed ${files.length} files, ${totalChunks} chunks (store has ${indexed})`);
	return { files: files.length, chunks: totalChunks };
}
