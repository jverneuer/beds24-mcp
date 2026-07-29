/**
 * Public surface of the reusable Beds24 SDK.
 *
 * This module has ZERO dependency on the MCP SDK, so it can be imported from
 * dagster assets, inngest functions, CLIs, or any other TS runtime.
 *
 * Start with the facade: `const beds24 = await Beds24.create({ apiKey, propKey })`.
 * Prefer the low-level client? `import { Beds24Client } from "beds24-mcp-server/client"`.
 */

export { Beds24, type Beds24Config } from "./beds24.ts";
export { Beds24Client, Beds24Error, Scopes, ErrorCode, DEFAULT_BASE_URL, type Beds24ClientConfig, type Beds24Response, type Credits, type Scope } from "./client.ts";
export * from "./ops/index.ts";

export { buildIndex, type BuildResult } from "./indexer.ts";
export { search, Beds24Search, type SearchHit } from "./search.ts";
export { Beds24Validator, validateRequest, type ValidationError, type ValidationResult } from "./validate.ts";
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
