/**
 * Path helpers that work both when run from source (Bun) and when run as the
 * bundled npm CLI (Node).
 *
 * Bun exposes `import.meta.dir`; Node only has `import.meta.url`. We prefer the
 * Bun form and derive the equivalent from the URL otherwise, so the package can
 * locate `knowledge/` and `.beds24/` relative to itself regardless of runtime.
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Re-exported so modules that dropped their own `node:path` import (db.ts) can
// still resolve paths relative to the package without re-adding that import.
export { dirname };

/** Directory of the module that calls this (Bun: import.meta.dir; Node: derived). */
export function moduleDir(): string {
	if (typeof import.meta.dir === "string" && import.meta.dir.length > 0) {
		return import.meta.dir;
	}
	return dirname(fileURLToPath(import.meta.url));
}

/**
 * Package root — the directory containing `package.json` + `knowledge/`.
 *
 * We can't assume "parent of the module dir": that's only true for the bundle
 * (`dist/cli.mjs` → repo root) and breaks for TS source imports, where
 * `src/sdk/*.ts` would resolve to `src/`. So walk up from the module until we
 * find a dir holding both `package.json` and `knowledge/`. Falls back to the
 * parent of the module dir if the search exhausts (e.g. a consumer's tree).
 */
export function packageRoot(): string {
	let dir = moduleDir();
	for (let i = 0; i < 8; i++) {
		try {
			const fs = require("node:fs") as typeof import("node:fs");
			if (fs.existsSync(join(dir, "package.json")) && fs.existsSync(join(dir, "knowledge"))) {
				return dir;
			}
		} catch {
			/* keep walking */
		}
		const parent = dirname(dir);
		if (parent === dir) break; // filesystem root
		dir = parent;
	}
	return dirname(moduleDir());
}

/** Absolute path to the knowledge root, relative to the package. */
export function defaultKnowledgeDir(): string {
	return join(packageRoot(), "knowledge");
}
