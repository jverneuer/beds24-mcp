/**
 * Semantic search over the indexed knowledge chunks.
 *
 * Embeds the query with the same model used for indexing, then runs a cosine
 * distance query via the sqlite-vec extension. Returns the top-K most similar
 * sections with their source location and a similarity score in [0, 1].
 */

import { getDb } from "./db.ts";
import { embed } from "./embed.ts";

/** One search hit — a retrieved knowledge section. */
export interface SearchHit {
	text: string;
	sourceFile: string;
	headingPath: string[];
	lines: [number, number];
	/** Cosine similarity in [0, 1] (1 = identical). */
	score: number;
}

interface RawHit {
	source_file: string;
	heading_path: string;
	line_start: number;
	line_end: number;
	text: string;
	distance: number;
}

/**
 * Search the vector index for `query`, returning at most `topK` hits ordered by
 * descending similarity. Returns an empty array if the index has no chunks.
 */
export async function search(query: string, topK = 5): Promise<SearchHit[]> {
	const db = getDb();

	const [vec] = await embed([query]);
	if (!vec) return [];
	const blob = Buffer.from(new Float32Array(vec).buffer);

	// vec_distance_cosine returns distance in [0, 2]; 0 = identical. Convert to
	// a similarity score in [0, 1].
	const rows = db
		.prepare(
			`SELECT source_file, heading_path, line_start, line_end, text,
			        vec_distance_cosine(embedding, ?) AS distance
			   FROM chunks
			  ORDER BY distance ASC
			  LIMIT ?`,
		)
		.all(blob, topK) as unknown as RawHit[];

	return rows.map((r) => {
		const distance = r.distance;
		const score = Math.max(0, Math.min(1, 1 - distance));
		let headingPath: string[] = [];
		try {
			headingPath = JSON.parse(r.heading_path) as string[];
		} catch {
			headingPath = [];
		}
		return {
			text: r.text,
			sourceFile: r.source_file,
			headingPath,
			lines: [r.line_start, r.line_end] as [number, number],
			score,
		};
	});
}

/**
 * Stateful search facade. The long-lived form exists so the SDK can expose the
 * same surface the MCP tools use, without re-implementing the query logic.
 */
export class Beds24Search {
	async search(query: string, topK = 5): Promise<SearchHit[]> {
		return search(query, topK);
	}
}
