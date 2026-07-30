/**
 * MCP server for the Beds24 API — a thin wrapper over the beds24-knowledge and
 * beds24-sdk-client workspace packages.
 *
 * All reusable logic lives in those packages (zero MCP dependency): search and
 * indexing in beds24-knowledge, schema/validation in beds24-sdk-client. This file only
 * registers MCP tools/resources and forwards calls. The MCP SDK is the only
 * non-dev dependency here, which is what keeps the packages portable.
 *
 * Note on the facade (./beds24.ts): it is still the pre-restructure surface — it
 * only exposes a single SAFE `.search()` and passes the old `factsDir` to schema
 * functions whose signatures have changed. We therefore compose the workspace
 * packages directly, which is the fallback the contract calls for.
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";

import {
	search,
	searchAll,
	searchInBucket,
	buildIndex,
	getDb,
	dbExists,
	countChunks,
	bucketCounts,
	DB_PATH,
	type Bucket,
} from "beds24-knowledge";

import {
	getSchema,
	listEndpoints,
	flattenObject,
	Beds24Validator,
	type Field,
} from "beds24-sdk-client";

/**
 * Knowledge corpus root. The package does not currently export its path helper,
 * so derive it from the exported DB_PATH (`<root>/.beds24/index.db`) and allow an
 * override. The `.beds24` dir is the grandparent of the corpus `knowledge/` dir.
 */
const KNOWLEDGE_DIR = process.env.BEDS24_KNOWLEDGE_DIR ?? join(dirname(dirname(DB_PATH)), "knowledge");

const server = new McpServer({
	name: "beds24",
	version: "0.1.0",
	description:
		"Semantic search over Beds24 docs (safe / all / per-bucket) + YAML schema validation for the V2 API.",
});

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

server.registerTool(
	"beds24_search",
	{
		title: "Search Beds24 docs (safe)",
		description:
			"Semantic search over the cited Beds24 knowledge base — current apiv2 + general docs only. " +
			"Returns the most relevant sections with source file, heading path, line range, bucket, RRF score, and a docUrl. " +
			"Each hit includes a docUrl linking to the public documentation — offer to open it when a hit looks relevant.",
		inputSchema: {
			query: z
				.string()
				.describe("Natural-language question, e.g. 'how does pricing propagate to channels?'"),
			topK: z
				.number()
				.int()
				.min(1)
				.max(20)
				.optional()
				.describe("Number of sections to return (default 5)"),
		},
	},
	async ({ query, topK }) => {
		try {
			const hits = await search(query, topK ?? 5);
			return { content: [{ type: "text" as const, text: JSON.stringify(hits, null, 2) }] };
		} catch (e) {
			return { content: [{ type: "text" as const, text: `search failed: ${(e as Error).message}` }] };
		}
	},
);

server.registerTool(
	"beds24_search_all",
	{
		title: "Search Beds24 docs (all buckets)",
		description:
			"Like beds24_search but across ALL buckets, including legacy/deprecated (apiv1, deprecated). " +
			"May surface outdated or removed APIs — prefer beds24_search unless the user explicitly wants legacy behavior.",
		inputSchema: {
			query: z
				.string()
				.describe("Natural-language question, e.g. 'long-term booking window'"),
			topK: z
				.number()
				.int()
				.min(1)
				.max(20)
				.optional()
				.describe("Number of sections to return (default 5)"),
		},
	},
	async ({ query, topK }) => {
		try {
			const hits = await searchAll(query, topK ?? 5);
			return { content: [{ type: "text" as const, text: JSON.stringify(hits, null, 2) }] };
		} catch (e) {
			return { content: [{ type: "text" as const, text: `search failed: ${(e as Error).message}` }] };
		}
	},
);

server.registerTool(
	"beds24_search_in_bucket",
	{
		title: "Search one Beds24 bucket",
		description:
			"Semantic search restricted to a single bucket. " +
			"Use 'apiv2' for the current API, 'general' for concepts, 'apiv1' or 'deprecated' for legacy behavior.",
		inputSchema: {
			bucket: z
				.enum(["deprecated", "apiv1", "apiv2", "general"])
				.describe("Which bucket to search"),
			query: z
				.string()
				.describe("Natural-language question, e.g. 'set daily prices for Airbnb'"),
			topK: z
				.number()
				.int()
				.min(1)
				.max(20)
				.optional()
				.describe("Number of sections to return (default 5)"),
		},
	},
	async ({ bucket, query, topK }) => {
		try {
			const hits = await searchInBucket(bucket, query, topK ?? 5);
			return { content: [{ type: "text" as const, text: JSON.stringify(hits, null, 2) }] };
		} catch (e) {
			return { content: [{ type: "text" as const, text: `search failed: ${(e as Error).message}` }] };
		}
	},
);

server.registerTool(
	"beds24_schema",
	{
		title: "Get endpoint schema",
		description:
			"Resolve the request or response schema for a V2 endpoint (e.g. 'POST /bookings') into a flat field list with types, required flags, descriptions, and enums.",
		inputSchema: {
			endpoint: z
				.string()
				.describe("'METHOD /path', e.g. 'POST /bookings' or 'GET /inventory/rooms/calendar'"),
			direction: z.enum(["request", "response"]).describe("Which body to inspect"),
		},
	},
	async ({ endpoint, direction }) => {
		try {
			const schema = getSchema(endpoint, direction);
			if (!schema || typeof schema !== "object") {
				return {
					content: [
						{
							type: "text" as const,
							text: `no ${direction} schema found for "${endpoint}". Try one of: ${listEndpoints().join(", ")}`,
						},
					],
				};
			}
			const fields = flattenObject(schema);
			return { content: [{ type: "text" as const, text: JSON.stringify(fields, null, 2) }] };
		} catch (e) {
			return { content: [{ type: "text" as const, text: `schema lookup failed: ${(e as Error).message}` }] };
		}
	},
);

server.registerTool(
	"beds24_validate",
	{
		title: "Validate a payload",
		description:
			"Validate a draft request/response payload against the resolved schema for an endpoint. Returns structured, LLM-actionable errors (missing fields, wrong types, unknown fields with 'did you mean?').",
		inputSchema: {
			endpoint: z.string().describe("'METHOD /path', e.g. 'POST /bookings'"),
			direction: z.enum(["request", "response"]).describe("Which body to validate against"),
			payload: z.unknown().describe("The JSON payload to validate (object, or array for V2 POST endpoints)"),
		},
	},
	async ({ endpoint, direction, payload }) => {
		try {
			const validator = Beds24Validator.create();
			const result = validator.validate(endpoint, direction, payload);
			return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
		} catch (e) {
			return { content: [{ type: "text" as const, text: `validation failed: ${(e as Error).message}` }] };
		}
	},
);

server.registerTool(
	"beds24_howto",
	{
		title: "How to do X on Beds24",
		description:
			"End-to-end helper: semantic search (safe buckets) for the task, fetch the matching endpoint schema, and summarize the steps. Use when you need both the 'what the docs say' and 'what the API expects'.",
		inputSchema: {
			task: z
				.string()
				.describe("What you want to do, e.g. 'create a booking' or 'set daily prices for Airbnb'"),
		},
	},
	async ({ task }) => {
		try {
			const hits = await search(task, 5);
			// Best-guess endpoint from the top hit's text (heuristic: first
			// 'METHOD /path' mention). Fall back to a generic message.
			const endpointMatch = hits[0]?.text.match(/(GET|POST|PUT|DELETE|PATCH)\s+\/[A-Za-z0-9/_{}-]+/);
			const requestSchema: Field[] = endpointMatch
				? flattenObject(getSchema(endpointMatch[0], "request"))
				: [];

			const summary = {
				query: task,
				steps: hits.slice(0, 3).map((h) => ({
					section: h.headingPath.join(" > "),
					lines: h.lines,
					snippet: h.text.slice(0, 280),
				})),
				matchedEndpoint: endpointMatch?.[0] ?? null,
				requestSchema,
			};
			return { content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }] };
		} catch (e) {
			return { content: [{ type: "text" as const, text: `howto failed: ${(e as Error).message}` }] };
		}
	},
);

server.registerTool(
	"beds24_status",
	{
		title: "Index status",
		description:
			"Report the current state of the local vector index: the knowledge dir, whether it exists, how many chunks are indexed (total + per bucket), its on-disk size, and how many facts files / API endpoints are known.",
		inputSchema: {},
	},
	async () => {
		try {
			const indexExists = dbExists();
			let chunksIndexed = 0;
			let dbSizeBytes = 0;
			let byBucket: Record<Bucket, number> = { deprecated: 0, apiv1: 0, apiv2: 0, general: 0 };
			if (indexExists) {
				chunksIndexed = countChunks();
				dbSizeBytes = statSync(DB_PATH).size;
				byBucket = bucketCounts();
			}
			const status = {
				indexKnowledgeDir: KNOWLEDGE_DIR,
				indexExists,
				chunksIndexed,
				dbSizeBytes,
				byBucket,
				factsFiles: countFactsFiles(KNOWLEDGE_DIR),
				apiEndpoints: listEndpoints().length,
			};
			return { content: [{ type: "text" as const, text: JSON.stringify(status, null, 2) }] };
		} catch (e) {
			return { content: [{ type: "text" as const, text: `status failed: ${(e as Error).message}` }] };
		}
	},
);

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

/** Count markdown facts files under the knowledge corpus root. */
function countFactsFiles(dir: string): number {
	if (!existsSync(dir)) return 0;
	let n = 0;
	const walk = (d: string): void => {
		for (const e of readdirSync(d, { withFileTypes: true })) {
			const p = join(d, e.name);
			if (e.isDirectory()) walk(p);
			else if (e.name.endsWith(".md")) n += 1;
		}
	};
	walk(dir);
	return n;
}

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

// Raw markdown facts: beds24://facts/path/to/file.md
server.registerResource(
	"facts",
	new ResourceTemplate("beds24://facts/{path}", {
		list: async () => {
			const resources: Array<{ uri: string; name: string; mimeType: string }> = [];
			const walk = (d: string): void => {
				for (const e of readdirSync(d, { withFileTypes: true })) {
					const p = join(d, e.name);
					if (e.isDirectory()) walk(p);
					else if (e.name.endsWith(".md")) {
						resources.push({
							uri: `beds24://facts/${p.slice(KNOWLEDGE_DIR.length + 1).split("\\").join("/")}`,
							name: e.name,
							mimeType: "text/markdown",
						});
					}
				}
			};
			if (existsSync(KNOWLEDGE_DIR)) walk(KNOWLEDGE_DIR);
			return { resources };
		},
	}),
	{
		title: "Beds24 fact files",
		description: "Raw cited markdown facts from the knowledge base.",
	},
	async (uri, variables) => {
		const rel = (variables.path as string).replace(/^\/+/, "");
		const full = join(KNOWLEDGE_DIR, rel);
		// Contain the read inside the knowledge root (no path traversal).
		if (!full.startsWith(KNOWLEDGE_DIR)) {
			throw new Error(`access denied: ${variables.path}`);
		}
		const text = readFileSync(full, "utf8");
		return {
			contents: [{ uri: uri.href, name: rel, mimeType: "text/markdown", text }],
		};
	},
);

// Endpoint index: beds24://endpoints
server.registerResource(
	"endpoints",
	"beds24://endpoints",
	{
		title: "Beds24 V2 endpoint index",
		description: "All request/response endpoints parsed from apiV2.yaml.",
	},
	async (uri) => {
		const endpoints = listEndpoints();
		return {
			contents: [
				{
					uri: uri.href,
					name: "endpoints",
					mimeType: "application/json",
					text: JSON.stringify(endpoints, null, 2),
				},
			],
		};
	},
);

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

/** Build the index (if missing) then connect the MCP server on stdio. */
export async function startServer(): Promise<void> {
	// Auto-build the index on startup if it's missing. Log to stderr so we
	// never corrupt the stdio JSON-RPC stream.
	if (!dbExists()) {
		console.error("[beds24] index missing — building from knowledge base...");
		try {
			getDb();
			const res = await buildIndex({ knowledgeDir: KNOWLEDGE_DIR });
			console.error(`[beds24] index built: ${res.files} files, ${res.chunks} chunks.`);
		} catch (e) {
			console.error(`[beds24] auto-index failed: ${(e as Error).message}`);
		}
	}

	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("[beds24] MCP server connected on stdio.");
}

// Run directly (`bun run src/server.ts`) — not when imported by the CLI.
if (import.meta.main) {
	startServer().catch((err) => {
		console.error("[beds24] fatal:", err);
		process.exit(1);
	});
}
