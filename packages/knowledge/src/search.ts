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

import { getDb, countChunks } from "./db.ts";
import { embed } from "./embed.ts";
import { KNOWN_BUCKETS, SAFE_BUCKETS } from "./markdown/frontmatter.ts";
import type { Bucket } from "./markdown/frontmatter.ts";

/** RRF constant — dampens the contribution of low-ranking candidates. */
const RRF_K = 60;

/** Default number of results returned to callers. */
const DEFAULT_TOP_K = 8;

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

/** Resolve the bucket filter: undefined/empty → no filter (all buckets). */
function resolveBuckets(buckets: readonly Bucket[] | undefined): Bucket[] {
	return buckets && buckets.length > 0 ? [...buckets] : [];
}

/**
 * Turn a free-text query into a safe FTS5 MATCH expression.
 *
 * Tokens are split on non-alphanumerics, empty tokens dropped, each wrapped in
 * double quotes (internal quotes doubled), and joined with OR. Returns "" for a
 * query with no indexable tokens.
 */
export function toFtsQuery(query: string): string {
	const tokens = query.split(/[^A-Za-z0-9]+/).filter((t) => t.length > 0);
	if (tokens.length === 0) return "";
	return tokens.map((t) => `"${t.replace(/"/g, '""')}"`).join(" OR ");
}

/**
 * Merge ranked candidate lists with Reciprocal Rank Fusion.
 *
 * Each list MUST already be ordered best-first; `rank` is the 0-based index
 * into that list. A chunk present in multiple lists accumulates a contribution
 * from each — that is the whole point, so do not de-duplicate before calling.
 * Pure: it does not touch the database. Returns the merged list sorted by
 * descending score.
 */
export function rrfMerge(lists: ChunkDataRow[][], k = RRF_K): ScoredChunk[] {
	const byId = new Map<number, ScoredChunk>();
	for (const list of lists) {
		list.forEach((row, rank) => {
			const contribution = 1 / (k + rank);
			const existing = byId.get(row.id);
			if (existing) {
				existing.score += contribution;
			} else {
				byId.set(row.id, { row, score: contribution });
			}
		});
	}
	return [...byId.values()].sort((a, b) => b.score - a.score);
}

/** Fetch vector (cosine-distance) candidates, ordered best-first by ASC distance. */
function vectorCandidates(blob: Buffer, buckets: Bucket[], candidateK: number): ChunkDataRow[] {
	const db = getDb();
	const filtered = buckets.length > 0;
	const where = filtered ? `WHERE bucket IN (${buckets.map(() => "?").join(",")})` : "";
	const sql =
		`SELECT id, source_file, heading_path, line_start, line_end, text, bucket, doc_url, ` +
		`vec_distance_cosine(embedding, ?) AS distance ` +
		`FROM chunks ${where} ` +
		`ORDER BY distance ASC LIMIT ?`;
	const params: (string | number | Buffer)[] = filtered
		? [blob, ...buckets, candidateK]
		: [blob, candidateK];
	return db.prepare(sql).all(...params) as unknown as ChunkDataRow[];
}

/** Fetch FTS5 candidates, ordered best-first by ASC bm25 (bm25 is negative). */
function ftsCandidates(ftsQuery: string, buckets: Bucket[], candidateK: number): ChunkDataRow[] {
	const db = getDb();
	const filtered = buckets.length > 0;
	const andBucket = filtered ? `AND c.bucket IN (${buckets.map(() => "?").join(",")})` : "";
	const sql =
		`SELECT c.id, c.source_file, c.heading_path, c.line_start, c.line_end, c.text, c.bucket, c.doc_url, ` +
		`bm25(chunks_fts) AS bm25 ` +
		`FROM chunks_fts ` +
		`JOIN chunks c ON c.id = chunks_fts.rowid ` +
		`WHERE chunks_fts MATCH ? ${andBucket} ` +
		`ORDER BY bm25 ASC LIMIT ?`;
	const params: (string | number)[] = filtered
		? [ftsQuery, ...buckets, candidateK]
		: [ftsQuery, candidateK];
	return db.prepare(sql).all(...params) as unknown as ChunkDataRow[];
}

/** Hydrate a fully-scored candidate into a SearchHit. */
function toSearchHit(sc: ScoredChunk): SearchHit {
	const r = sc.row;
	let headingPath: string[] = [];
	try {
		headingPath = JSON.parse(r.heading_path) as string[];
	} catch {
		headingPath = [];
	}
	return {
		id: r.id,
		text: r.text,
		sourceFile: r.source_file,
		headingPath,
		lines: [r.line_start, r.line_end],
		bucket: r.bucket as Bucket,
		docUrl: r.doc_url,
		score: sc.score,
	};
}

/**
 * Hybrid vector + FTS5 search merged with RRF.
 *
 * Embeds the query and fetches `candidateK` vector candidates (by ascending
 * cosine distance) and `candidateK` FTS candidates (by ascending bm25), merges
 * them with RRF, and returns the top `topK` hits. Bucket filtering applies to
 * both lists. Returns [] if the index is empty or the query embeds to nothing.
 */
export async function hybridSearch(opts: HybridSearchOpts): Promise<SearchHit[]> {
	const topK = opts.topK ?? DEFAULT_TOP_K;
	const candidateK = opts.candidateK ?? Math.max(topK * 5, 50);
	const buckets = resolveBuckets(opts.buckets);

	if (countChunks() === 0) return [];

	const [vec] = await embed([opts.query]);
	if (!vec) return [];
	const blob = Buffer.from(new Float32Array(vec).buffer);

	const vectorRows = vectorCandidates(blob, buckets, candidateK);

	const ftsQuery = toFtsQuery(opts.query);
	const ftsRows = ftsQuery.length > 0 ? ftsCandidates(ftsQuery, buckets, candidateK) : [];

	return rrfMerge([vectorRows, ftsRows])
		.slice(0, topK)
		.map(toSearchHit);
}

/** Search every bucket. */
export async function searchAll(query: string, topK?: number): Promise<SearchHit[]> {
	return hybridSearch({ query, buckets: [], topK });
}

/** Search only the safe buckets (apiv2 + general). */
export async function search(query: string, topK?: number): Promise<SearchHit[]> {
	return hybridSearch({ query, buckets: SAFE_BUCKETS, topK });
}

/** Search a single bucket, returning [] for any unknown bucket. */
export async function searchInBucket(
	bucket: Bucket,
	query: string,
	topK?: number,
): Promise<SearchHit[]> {
	if (!KNOWN_BUCKETS.includes(bucket)) return [];
	return hybridSearch({ query, buckets: [bucket], topK });
}

/**
 * Stateful search facade. The long-lived form exists so the SDK can expose the
 * same surface the MCP tools use, without re-implementing the query logic.
 */
export class Beds24Search {
	async searchAll(query: string, topK?: number): Promise<SearchHit[]> {
		return searchAll(query, topK);
	}

	async search(query: string, topK?: number): Promise<SearchHit[]> {
		return search(query, topK);
	}

	async searchInBucket(bucket: Bucket, query: string, topK?: number): Promise<SearchHit[]> {
		return searchInBucket(bucket, query, topK);
	}
}
