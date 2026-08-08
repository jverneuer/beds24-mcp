/**
 * Hybrid search over the indexed knowledge chunks.
 *
 * Combines vector cosine search (semantic) with FTS5 full-text search
 * (lexical) and merges the two ranked candidate lists with Reciprocal Rank
 * Fusion (RRF, k=60). RRF sums 1/(k + rank) across lists, so a chunk that ranks
 * well in BOTH the semantic and lexical results scores highest — this captures
 * matches that neither modality would surface alone.
 *
 * BREAKING vs. the previous vector-only `search`: `SearchHit.score` is now an
 * unbounded RRF fusion score (higher is better), NOT a cosine similarity in
 * [0, 1].
 *
 * The `bucket` / `doc_url` columns and the `chunks_fts` FTS5 table are owned by
 * `db.ts` (migrated separately); this module queries them but never creates
 * them.
 */
import type { Bucket } from "./markdown/frontmatter.js";
/** One retrieved knowledge section, scored by RRF fusion. */
export interface SearchHit {
    id: number;
    text: string;
    sourceFile: string;
    headingPath: string[];
    lines: [number, number];
    bucket: Bucket;
    docUrl: string | null;
    /** RRF fusion score — higher is better, unbounded. BREAKING: was cosine similarity in [0,1]. */
    score: number;
}
/** Options for `hybridSearch`. */
export interface HybridSearchOpts {
    query: string;
    /** Bucket filter. []/undefined = all buckets; otherwise only these buckets. */
    buckets?: readonly Bucket[];
    /** Number of hits to return. Default 8. */
    topK?: number;
    /** Number of candidates fetched per modality before fusion. Default max(topK*5, 50). */
    candidateK?: number;
}
/** The stored chunk columns that both result lists hydrate a SearchHit from. */
interface ChunkDataRow {
    id: number;
    source_file: string;
    heading_path: string;
    line_start: number;
    line_end: number;
    text: string;
    bucket: string;
    doc_url: string | null;
}
/** A candidate together with its accumulated RRF score. */
interface ScoredChunk {
    row: ChunkDataRow;
    score: number;
}
/**
 * Turn a free-text query into a safe FTS5 MATCH expression.
 *
 * Tokens are split on non-alphanumerics, empty tokens dropped, each wrapped in
 * double quotes (internal quotes doubled), and joined with OR. Returns "" for a
 * query with no indexable tokens.
 */
export declare function toFtsQuery(query: string): string;
/**
 * Merge ranked candidate lists with Reciprocal Rank Fusion.
 *
 * Each list MUST already be ordered best-first; `rank` is the 0-based index
 * into that list. A chunk present in multiple lists accumulates a contribution
 * from each — that is the whole point, so do not de-duplicate before calling.
 * Pure: it does not touch the database. Returns the merged list sorted by
 * descending score.
 */
export declare function rrfMerge(lists: ChunkDataRow[][], k?: number): ScoredChunk[];
/**
 * Hybrid vector + FTS5 search merged with RRF.
 *
 * Embeds the query and fetches `candidateK` vector candidates (by ascending
 * cosine distance) and `candidateK` FTS candidates (by ascending bm25), merges
 * them with RRF, and returns the top `topK` hits. Bucket filtering applies to
 * both lists. Returns [] if the index is empty or the query embeds to nothing.
 */
export declare function hybridSearch(opts: HybridSearchOpts): Promise<SearchHit[]>;
/** Search every bucket. */
export declare function searchAll(query: string, topK?: number): Promise<SearchHit[]>;
/** Search only the safe buckets (apiv2 + general). */
export declare function search(query: string, topK?: number): Promise<SearchHit[]>;
/** Search a single bucket, returning [] for any unknown bucket. */
export declare function searchInBucket(bucket: Bucket, query: string, topK?: number): Promise<SearchHit[]>;
/**
 * Stateful search facade. The long-lived form exists so the SDK can expose the
 * same surface the MCP tools use, without re-implementing the query logic.
 */
export declare class Beds24Search {
    searchAll(query: string, topK?: number): Promise<SearchHit[]>;
    search(query: string, topK?: number): Promise<SearchHit[]>;
    searchInBucket(bucket: Bucket, query: string, topK?: number): Promise<SearchHit[]>;
}
export {};
//# sourceMappingURL=search.d.ts.map