import { type Bucket } from "./frontmatter.js";
/**
 * Heading-aware markdown splitter.
 *
 * The knowledge facts are already atomic (one statement + citation per bullet),
 * so the right chunk granularity is the section boundary — NOT fixed-size
 * windows. Fixed-size shredding would splice unrelated facts together and
 * sever their citations ("vector soup"). Splitting at `##` / `###` keeps each
 * chunk self-contained with its heading path and inline citations intact.
 *
 * Inline citations (`[wiki → Name](url)`, `[extracted ...]`) are preserved
 * verbatim — we never strip or rewrite them.
 */
/** A single section chunk produced from one markdown file. */
export interface Chunk {
    /** Path relative to the knowledge root, e.g. `system-logic/wiki-api-v2.md`. */
    sourceFile: string;
    /** Heading breadcrumb from the doc title down to this section. */
    headingPath: string[];
    /** Inclusive 1-based start line in the source file. */
    lineStart: number;
    /** Inclusive 1-based end line in the source file. */
    lineEnd: number;
    /** Full section text (heading line + body), citations preserved. */
    text: string;
    /** Index/search pool this chunk belongs to (frontmatter-authoritative, falls back to the path-derived override, else "general"). */
    bucket: Bucket;
    /** Public documentation URL the chunk is sourced from (frontmatter only). */
    docUrl: string | null;
}
/**
 * Split a markdown document into section chunks.
 *
 * The text appearing before the first heading is attached to the document-title
 * chunk (the first `# ` heading) so intro paragraphs are still searchable.
 * Each subsequent `##` / `###` starts a new chunk whose `headingPath` records the
 * full breadcrumb.
 */
export declare function chunkMarkdown(sourceFile: string, markdown: string, bucketOverride?: Bucket): Chunk[];
//# sourceMappingURL=chunk.d.ts.map