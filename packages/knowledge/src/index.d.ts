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
export { KNOWN_BUCKETS, SAFE_BUCKETS, parseFrontmatter } from "./markdown/frontmatter.js";
export type { Bucket, Frontmatter } from "./markdown/frontmatter.js";
export { chunkMarkdown, type Chunk } from "./markdown/chunk.js";
export { buildIndex, fileHash, type BuildResult } from "./indexer.js";
export { getDb, dbExists, clearChunks, resetDatabase, countChunks, bucketCounts, insertChunk, deleteChunksForFile, getStoredHash, setStoredHash, deleteStoredHash, getAllTrackedFilePaths, DB_PATH, EMBED_DIM, } from "./db.js";
export type { ChunkRow } from "./db.js";
export { defaultKnowledgeDir } from "./paths.js";
export { search, searchAll, searchInBucket, hybridSearch, Beds24Search, } from "./search.js";
export type { SearchHit, HybridSearchOpts } from "./search.js";
export { embed, LocalEmbedder, OllamaEmbedder, createEmbedder, __resetEmbedderForTests } from "./embed.js";
export type { Embedder, EmbedderOpts } from "./embed.js";
//# sourceMappingURL=index.d.ts.map