/**
 * Path helpers for the `beds24-sdk-client` package.
 *
 * The SDK owns its API spec (`apiV2.yaml` in the sdk package root) and resolves
 * it relative to itself — it has NO knowledge of the knowledge/corpus package.
 * Works both when run from source (Bun, `import.meta.dir`) and from the bundled
 * npm CLI (Node, `import.meta.url`).
 */
import { dirname } from "node:path";
export { dirname };
/** Directory of the module that calls this (Bun: import.meta.dir; Node: derived). */
export declare function moduleDir(): string;
/**
 * SDK package root — the directory containing `package.json` + `apiV2.yaml`.
 *
 * We walk up from the module until we find a dir holding both `package.json` and
 * `apiV2.yaml`. Falls back to the parent of the module dir if the search
 * exhausts (e.g. a consumer's tree).
 */
export declare function packageRoot(): string;
/**
 * Absolute path to the V2 OpenAPI spec the SDK validates against.
 * Override with BEDS24_SPEC_DIR to point at a different spec file.
 */
export declare function defaultSpecDir(): string;
//# sourceMappingURL=paths.d.ts.map