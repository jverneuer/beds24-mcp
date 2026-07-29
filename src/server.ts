/**
 * MCP server for the Beds24 API — a thin wrapper over src/sdk.
 *
 * All reusable logic lives in the SDK (zero MCP dependency). This file only
 * registers MCP tools/resources and forwards calls. The MCP SDK is the only
 * non-dev dependency here, which is what keeps the SDK portable.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { z } from "zod";

import { dbExists, getDb } from "./sdk/db.ts";
import { buildIndex } from "./sdk/indexer.ts";
import { search } from "./sdk/search.ts";
import { getSchema, listEndpoints, flattenObject, type Field } from "./sdk/schema.ts";
import { Beds24Validator } from "./sdk/validate.ts";

/** Resolve the knowledge root relative to this file (repo root / knowledge). */
function defaultFactsDir(): string {
	return resolve(join(import.meta.dir, "..", "knowledge"));
}

const FACTS_DIR = process.env.BEDS24_FACTS_DIR ?? defaultFactsDir();

const server = new McpServer({
	name: "beds24",
	version: "0.1.0",
	description:
		"Semantic search over Beds24 docs + YAML schema validation for the V2 API.",
});

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

server.registerTool(
	"beds24_search",
	{
		title: "Search Beds24 docs",
		description:
			"Semantic search over the cited Beds24 knowledge base. Returns the most relevant sections with source file, heading path, line range, and score.",
		inputSchema: {
			query: z.string().describe("Natural-language question, e.g. 'how does pricing propagate to channels?'"),
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
			const text = JSON.stringify(hits, null, 2);
			return { content: [{ type: "text" as const, text }] };
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
			const schema = getSchema(FACTS_DIR, endpoint, direction);
			if (!schema || typeof schema !== "object") {
				return {
					content: [
						{
							type: "text" as const,
							text: `no ${direction} schema found for "${endpoint}". Try one of: ${listEndpoints(FACTS_DIR).join(", ")}`,
						},
					],
				};
			}
			const fields: Field[] = flattenObject(schema as Record<string, unknown>);
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
			const validator = Beds24Validator.create({ factsDir: FACTS_DIR });
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
			"End-to-end helper: semantic search for the task, fetch the matching endpoint schema, and summarize the steps. Use when you need both the 'what the docs say' and 'what the API expects'.",
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
			const schema = endpointMatch
				? flattenObject(getSchema(FACTS_DIR, endpointMatch[0], "request") as Record<string, unknown> | undefined)
				: [];

			const summary = {
				query: task,
				steps: hits.slice(0, 3).map((h) => ({
					section: h.headingPath.join(" > "),
					lines: h.lines,
					snippet: h.text.slice(0, 280),
				})),
				matchedEndpoint: endpointMatch?.[0] ?? null,
				requestSchema: schema,
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
			"Report the current state of the local vector index: whether it exists, how many chunks are indexed, its on-disk size, and how many facts files / API endpoints are known.",
		inputSchema: {},
	},
	async () => {
		try {
			const exists = dbExists();
			let chunks = 0;
			let dbSize = 0;
			if (exists) {
				const fs = require("node:fs") as typeof import("node:fs");
				const row = getDb()
					.prepare(`SELECT COUNT(*) AS c FROM chunks`)
					.get() as { c: number } | undefined;
				chunks = row?.c ?? 0;
				dbSize = fs.statSync(".beds24/index.db").size;
			}
			const status = {
				factsDir: FACTS_DIR,
				indexExists: exists,
				chunksIndexed: chunks,
				dbSizeBytes: dbSize,
				factsFiles: countFactsFiles(),
				apiEndpoints: listEndpoints(FACTS_DIR).length,
			};
			return { content: [{ type: "text" as const, text: JSON.stringify(status, null, 2) }] };
		} catch (e) {
			return { content: [{ type: "text" as const, text: `status failed: ${(e as Error).message}` }] };
		}
	},
);

/** Count markdown facts files under the knowledge root. */
function countFactsFiles(): number {
	const fs = require("node:fs") as typeof import("node:fs");
	const { join } = require("node:path") as typeof import("node:path");
	const dir = FACTS_DIR;
	if (!fs.existsSync(dir)) return 0;
	let n = 0;
	const walk = (d: string): void => {
		for (const e of fs.readdirSync(d, { withFileTypes: true })) {
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
			const fs = require("node:fs") as typeof import("node:fs");
			const { join } = require("node:path") as typeof import("node:path");
			const resources: Array<{ uri: string; name: string; mimeType: string }> = [];
			const walk = (d: string): void => {
				for (const e of fs.readdirSync(d, { withFileTypes: true })) {
					const p = join(d, e.name);
					if (e.isDirectory()) walk(p);
					else if (e.name.endsWith(".md")) {
						resources.push({
							uri: `beds24://facts/${p.slice(FACTS_DIR.length + 1).split("\\").join("/")}`,
							name: e.name,
							mimeType: "text/markdown",
						});
					}
				}
			};
			if (fs.existsSync(FACTS_DIR)) walk(FACTS_DIR);
			return { resources };
		},
	}),
	{
		title: "Beds24 fact files",
		description: "Raw cited markdown facts from the knowledge base.",
	},
	async (uri, variables) => {
		const rel = (variables.path as string).replace(/^\/+/, "");
		const full = join(FACTS_DIR, rel);
		// Contain the read inside the knowledge root (no path traversal).
		if (!full.startsWith(FACTS_DIR)) {
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
		const endpoints = listEndpoints(FACTS_DIR);
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

async function main(): Promise<void> {
	// Auto-build the index on startup if it's missing. Log to stderr so we
	// never corrupt the stdio JSON-RPC stream.
	if (!dbExists()) {
		console.error("[beds24] index missing — building from knowledge base...");
		try {
			getDb();
			const res = await buildIndex({ factsDir: FACTS_DIR });
			console.error(`[beds24] index built: ${res.files} files, ${res.chunks} chunks.`);
		} catch (e) {
			console.error(`[beds24] auto-index failed: ${(e as Error).message}`);
		}
	}

	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("[beds24] MCP server connected on stdio.");
}

main().catch((err) => {
	console.error("[beds24] fatal:", err);
	process.exit(1);
});
