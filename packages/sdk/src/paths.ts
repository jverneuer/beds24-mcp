/**
 * Path helpers for the `beds24-sdk` package.
 *
 * The SDK owns its API spec (`apiV2.yaml` in the sdk package root) and resolves
 * it relative to itself — it has NO knowledge of the knowledge/corpus package.
 * Works both when run from source (Bun, `import.meta.dir`) and from the bundled
 * npm CLI (Node, `import.meta.url`).
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
 * SDK package root — the directory containing `package.json` + `apiV2.yaml`.
 *
 * We walk up from the module until we find a dir holding both `package.json` and
 * `apiV2.yaml`. Falls back to the parent of the module dir if the search
 * exhausts (e.g. a consumer's tree).
 */
export function packageRoot(): string {
	let dir = moduleDir();
	for (let i = 0; i < 8; i++) {
		if (existsSync(join(dir, "package.json")) && existsSync(join(dir, "apiV2.yaml"))) {
			return dir;
		}
		const parent = dirname(dir);
		if (parent === dir) break; // filesystem root
		dir = parent;
	}
	return dirname(moduleDir());
}

/**
 * Absolute path to the V2 OpenAPI spec the SDK validates against.
 * Override with BEDS24_SPEC_DIR to point at a different spec file.
 */
export function defaultSpecDir(): string {
	return process.env.BEDS24_SPEC_DIR ?? join(packageRoot(), "apiV2.yaml");
}
