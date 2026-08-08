/**
 * Path helpers for the `beds24-knowledge` package.
 *
 * The knowledge package owns its corpus (`knowledge/` markdown) and its
 * regenerable vector index (`.beds24/index.db`), both resolved relative to the
 * knowledge package root. It has NO dependency on the SDK. Works both when run
 * from source (Bun, `import.meta.dir`) and from the bundled npm CLI (Node,
 * `import.meta.url`).
 */
import { dirname } from "node:path";
export { dirname };
/** Test-only: override the directory `moduleDir()` resolves to. */
export declare function __setBaseDirForTests(dir: string | undefined): void;
/** Directory of the module that calls this (Bun: import.meta.dir; Node: derived). */
export declare function moduleDir(): string;
/**
 * Knowledge package root — the directory containing `package.json` + `knowledge/`.
 *
 * We walk up from the module until we find a dir holding both `package.json` and
 * a `knowledge/` dir. Falls back to the parent of the module dir if the search
 * exhausts (e.g. a consumer's tree).
 */
export declare function packageRoot(): string;
/**
 * Absolute path to the knowledge corpus root (the markdown facts).
 * Override with BEDS24_KNOWLEDGE_DIR.
 */
export declare function defaultKnowledgeDir(): string;
/**
 * On-disk location of the regenerable vector index, next to the corpus.
 * Override with BEDS24_DB_PATH.
 */
export declare const DB_PATH: string;
//# sourceMappingURL=paths.d.ts.map