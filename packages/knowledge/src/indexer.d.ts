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
/**
 * SHA-256 hex digest of a file's raw bytes. Pure and testable: the indexer
 * compares this against the stored hash to decide whether a file changed since
 * the last run. Hashing raw bytes (not the decoded text) so a UTF-8 re-encode
 * never produces a false "changed" signal.
 */
export declare function fileHash(path: string): Promise<string>;
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
export declare function buildIndex(opts: {
    knowledgeDir: string;
    force?: boolean;
}): Promise<BuildResult>;
//# sourceMappingURL=indexer.d.ts.map