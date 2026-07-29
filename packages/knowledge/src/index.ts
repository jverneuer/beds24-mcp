/**
 * Public surface of the beds24-knowledge package.
 *
 * Bucket-aware chunking, the markdown→vector indexer, the SQLite vector store,
 * local embedding (Xenova/all-MiniLM-L6-v2), and semantic search over the indexed
 * knowledge base. There is NO MCP dependency and NO OpenAPI/schema dependency here
 * — the HTTP client and validation live in the sdk package.
 *
 * ```
 * const hits = await search("how do webhooks work?");
 * await buildIndex({ knowledgeDir: "./knowledge", force: true });
 * ```
 */

export { KNOWN_BUCKETS, SAFE_BUCKETS, parseFrontmatter } from "./frontmatter.ts";
export type { Bucket, Frontmatter } from "./frontmatter.ts";

export { chunkMarkdown, type Chunk } from "./chunk.ts";

export { buildIndex, type BuildResult } from "./indexer.ts";

export {
	getDb,
	dbExists,
	clearChunks,
	resetDatabase,
	countChunks,
	bucketCounts,
	insertChunk,
	DB_PATH,
	EMBED_DIM,
} from "./db.ts";
export type { ChunkRow } from "./db.ts";
export { defaultKnowledgeDir } from "./paths.ts";

export {
	search,
	searchAll,
	searchInBucket,
	hybridSearch,
	Beds24Search,
} from "./search.ts";
export type { SearchHit, HybridSearchOpts } from "./search.ts";

export { embed } from "./embed.ts";
