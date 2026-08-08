/**
 * Parse + strip the YAML frontmatter block that precedes each knowledge doc.
 *
 * Every markdown fact carries a `---` delimited header declaring at least a
 * `bucket` (which index/search pool it lands in) and, for the API-reference
 * docs, a `doc_url` linking the chunk back to its public documentation. This
 * module is the single source of truth for the `Bucket` type, the bucket
 * constants, and the frontmatter parser — chunk.ts, indexer.ts and search.ts
 * all import from here.
 *
 * The frontmatter is flat string fields only, so we hand-parse `key: value`
 * lines instead of pulling in a yaml dependency. Unknown keys are preserved
 * on the returned object via the index signature, so forward-compatible
 * fields are never dropped.
 */
/** The index/search pools a fact can belong to. */
export type Bucket = "deprecated" | "apiv1" | "apiv2" | "general";
/** Every bucket we recognize, in display order. */
export declare const KNOWN_BUCKETS: readonly Bucket[];
/** Buckets safe to search by default (deprecated + legacy v1 are opt-in only). */
export declare const SAFE_BUCKETS: readonly Bucket[];
/** The structured header parsed out of a knowledge doc's frontmatter block. */
export interface Frontmatter {
    /** Target bucket; absent if the doc declares none. */
    bucket?: Bucket;
    /** Public documentation URL the chunk is sourced from. */
    docUrl?: string;
    /** Any other flat fields the doc declares, preserved verbatim. */
    [key: string]: unknown;
}
/** A parsed doc: its structured header plus the remaining markdown body. */
export interface ParsedMarkdown {
    /** Frontmatter fields (empty object when no frontmatter block is present). */
    frontmatter: Frontmatter;
    /** Everything after the closing `---`, trimmed of leading blank lines. */
    body: string;
}
/**
 * Parse and strip the YAML frontmatter from a raw knowledge doc.
 *
 * If the doc opens with `---\n`, the text up to the next `---` line is parsed
 * as flat `key: value` fields and everything after the closing delimiter is
 * returned as the body. Otherwise the whole input is treated as the body with
 * an empty frontmatter object.
 */
export declare function parseFrontmatter(raw: string): ParsedMarkdown;
//# sourceMappingURL=frontmatter.d.ts.map