/**
 * Public surface of the reusable Beds24 SDK.
 *
 * This module has ZERO dependency on the MCP SDK, so it can be imported from
 * dagster assets, inngest functions, CLIs, or any other TS runtime.
 */

export { buildIndex, type BuildResult } from "./indexer.ts";
export { search, Beds24Search, type SearchHit } from "./search.ts";
export { Beds24Validator, type ValidationError, type ValidationResult } from "./validate.ts";
export {
	resolveSchema,
	flattenObject,
	listEndpoints,
	getSchema,
	type Field,
} from "./schema.ts";
export { chunkMarkdown, type Chunk } from "./chunk.ts";
export { embed, EMBED_DIM } from "./embed.ts";
export { getDb, DB_PATH, dbExists, countChunks, insertChunk, clearChunks } from "./db.ts";
