/**
 * Path helpers for the `beds24-knowledge` package.
 *
 * The knowledge package owns its corpus (`knowledge/` markdown) and its
 * regenerable vector index (`.beds24/index.db`), both resolved relative to the
 * knowledge package root. It has NO dependency on the SDK. Works both when run
 * from source (Bun, `import.meta.dir`) and from the bundled npm CLI (Node,
 * `import.meta.url`).
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Re-exported so modules that dropped their own `node:path` import can still
// resolve paths relative to the package without re-adding that export.
export { dirname };

/** Directory of the module that calls this (Bun: import.meta.dir; Node: derived). */
export function moduleDir(): string {
	if (typeof import.meta.dir === "string" && import.meta.dir.length > 0) {
		return import.meta.dir;
	}
	return dirname(fileURLToPath(import.meta.url));
}

/**
 * Knowledge package root — the directory containing `package.json` + `knowledge/`.
 *
 * We walk up from the module until we find a dir holding both `package.json` and
 * a `knowledge/` dir. Falls back to the parent of the module dir if the search
 * exhausts (e.g. a consumer's tree).
 */
export function packageRoot(): string {
	let dir = moduleDir();
	for (let i = 0; i < 8; i++) {
		if (existsSync(join(dir, "package.json")) && existsSync(join(dir, "knowledge"))) {
			return dir;
		}
		const parent = dirname(dir);
		if (parent === dir) break; // filesystem root
		dir = parent;
	}
	return dirname(moduleDir());
}

/**
 * Absolute path to the knowledge corpus root (the markdown facts).
 * Override with BEDS24_KNOWLEDGE_DIR.
 */
export function defaultKnowledgeDir(): string {
	return process.env.BEDS24_KNOWLEDGE_DIR ?? join(packageRoot(), "knowledge");
}

/**
 * On-disk location of the regenerable vector index, next to the corpus.
 * Override with BEDS24_DB_PATH.
 */
export const DB_PATH = process.env.BEDS24_DB_PATH ?? join(packageRoot(), ".beds24", "index.db");
