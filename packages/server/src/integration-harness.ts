/**
 * Real end-to-end integration scenarios for the composed three-package stack.
 *
 * This file is run in ISOLATION (spawned by integration.test.ts) so that the
 * sibling server.test.ts files' global mock.module registrations for the
 * workspace packages do NOT leak in. In its own process it imports the REAL
 * beds24-knowledge + beds24-sdk-client (plain specifiers resolve to the real
 * modules) and mocks only the two external boundaries:
 *   - the embedding model (@huggingface/transformers) → constant unit vector
 *   - the network (globalThis.fetch) → canned auth + API responses
 * The server→sdk→knowledge module graph itself is real.
 *
 * WHY isolation: `bun test` runs files in parallel workers that share the global
 * mock.module registry. The sibling server-*.test.ts files mock the workspace
 * packages at top level; under parallel those mocks clobber this file's imports
 * nondeterministically. Running in a subprocess gives a clean registry.
 */

import { test, expect, describe, beforeEach, afterEach, mock } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SearchHit } from "beds24-knowledge";
import type { Field } from "beds24-sdk-client";

import { buildIndex, search, searchAll, searchInBucket } from "beds24-knowledge";

// knowledge computes DB_PATH from this env var at import time — set before the
// knowledge import so the real module opens the :memory: db we use.
process.env.BEDS24_DB_PATH = ":memory:";

// ---------------------------------------------------------------------------
// Embed mock — deterministic constant unit vector. With every text embedding
// to the same unit vector, cosine distance ties across chunks and ranking falls
// to FTS, so search returns real hits without loading the model (slow/network).
// ---------------------------------------------------------------------------
const EMBED_DIM = 384;
const UNIT_VALUE = 1 / Math.sqrt(EMBED_DIM);
mock.module("@huggingface/transformers", () => ({
	pipeline: mock(
		async () =>
			mock(async (texts: string[]) => ({
				dims: [texts.length, EMBED_DIM],
				data: new Float32Array(texts.length * EMBED_DIM).fill(UNIT_VALUE),
			})),
	),
}));

// ---------------------------------------------------------------------------
// Network mock — drives the real sdk client's auth + request path.
// Per-test overrides (e.g. to force errors) go through fetchMock.mockImplementation.
// ---------------------------------------------------------------------------
type FetchArgs = [input: RequestInfo | URL, init?: RequestInit];
const defaultFetch = async (...args: FetchArgs): Promise<Response> => {
	const [input, init] = args;
	const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
	if (url.includes("/authentication/token")) {
		return new Response(JSON.stringify({ token: "tok-test", refreshToken: "rt" }), {
			status: 200,
			headers: { "content-type": "application/json" },
		});
	}
	if (url.includes("/bookings")) {
		const method = init?.method ?? "GET";
		const body = method === "POST" ? { bookings: [{ id: 999 }] } : { bookings: [] };
		return new Response(JSON.stringify(body), {
			status: 200,
			headers: {
				"content-type": "application/json",
				"x-five-min-limit-remaining": "10",
				"x-five-min-limit-resets-in": "300",
			},
		});
	}
	return new Response("{}", { status: 404, headers: { "content-type": "application/json" } });
};
const fetchMock = mock(defaultFetch);
globalThis.fetch = fetchMock as unknown as typeof fetch;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A multi-bucket corpus: apiv2 + general land in SAFE_BUCKETS, deprecated does not. */
function writeCorpus(root: string): void {
	mkdirSync(join(root, "apiv2"), { recursive: true });
	mkdirSync(join(root, "general"), { recursive: true });
	mkdirSync(join(root, "deprecated"), { recursive: true });
	writeFileSync(
		join(root, "apiv2", "bookings.md"),
		[
			"---",
			"bucket: apiv2",
			"docUrl: https://wiki.beds24.com/bookings",
			"---",
			"# Bookings",
			"Create a booking with POST /bookings. Requires roomId, arrival, departure.",
		].join("\n"),
	);
	writeFileSync(
		join(root, "general", "pricing.md"),
		["---", "bucket: general", "---", "# Pricing", "Set daily prices for a room using the calendar."].join(
			"\n",
		),
	);
	writeFileSync(
		join(root, "deprecated", "old.md"),
		["---", "bucket: deprecated", "---", "# Legacy", "OLDMARKERTERM legacy endpoint."].join("\n"),
	);
	// Single-segment fact: the server's `beds24://facts/{path}` template only
	// matches one path segment, so a top-level file is readable where a nested
	// one is not.
	writeFileSync(
		join(root, "top.md"),
		["---", "bucket: general", "---", "# Top", "TOPMARKER single-segment fact."].join("\n"),
	);
}

let corpusRoot = "";

/** Fresh temp corpus on disk, seeded into a real in-memory knowledge index. */
async function seedRealIndex(): Promise<void> {
	corpusRoot = mkdtempSync(join(tmpdir(), "beds24-int-"));
	writeCorpus(corpusRoot);
	// Real pipeline: walk → chunk → embed (mocked) → store. No model is loaded.
	await buildIndex({ knowledgeDir: corpusRoot, force: true });
}

/** Cache-bust import gives an isolated, un-mocked-composition server + db. */
async function importServer(): Promise<typeof import("./server.js")> {
	const token = `t=${Date.now()}-${Math.random()}`;
	return import(`./server.js?${token}`);
}

interface Session {
	server: McpServer;
	client: Client;
}

/** Build a real MCP session over a linked in-memory transport pair. */
async function makeSession(): Promise<Session> {
	process.env.BEDS24_KNOWLEDGE_DIR = corpusRoot;
	const mod = await importServer();
	const { server } = mod;
	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
	const client = new Client({ name: "integration-test", version: "0.0.1" });
	await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
	return { server, client };
}

/**
 * Call a tool and narrow to the content-branch result. The SDK returns a union
 * ({content} | {toolResult}); passing the result schema selects the content
 * branch so callers get a clean CallToolResult.
 */
async function callTool(
	client: Client,
	name: string,
	args: Record<string, unknown>,
): Promise<CallToolResult> {
	const result = await client.callTool({ name, arguments: args }, CallToolResultSchema);
	if (!("content" in result)) {
		throw new Error(`tool "${name}" returned a non-content result`);
	}
	return result as CallToolResult;
}

/** Read the text of a tool result's first content block (text tools only). */
function textOf(result: CallToolResult): string {
	const block = result.content[0];
	if (!block || block.type !== "text" || typeof block.text !== "string") {
		throw new Error("expected a text content block");
	}
	return block.text;
}

beforeEach(async () => {
	await seedRealIndex();
	fetchMock.mockClear();
	fetchMock.mockImplementation(defaultFetch);
});

afterEach(() => {
	rmSync(corpusRoot, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Scenario 2 (bold) — Knowledge search end-to-end
// ---------------------------------------------------------------------------
describe("knowledge search end-to-end (server → beds24-knowledge)", () => {
	test("beds24_search returns real hits from a real in-memory index", async () => {
		const { client } = await makeSession();
		const result = await callTool(client, "beds24_search", { query: "create booking" });
		expect(result.isError).toBeFalsy();

		const hits = JSON.parse(textOf(result)) as SearchHit[];
		expect(hits.length).toBeGreaterThan(0);

		const top = hits[0]!;
		expect(top.sourceFile).toContain("bookings.md");
		expect(top.bucket).toBe("apiv2");
		expect(top.headingPath.length).toBeGreaterThan(0);
		expect(top.lines[0]).toBeLessThanOrEqual(top.lines[1]!);
		expect(typeof top.score).toBe("number");
		expect(top.score).toBeGreaterThan(0);
		expect(top.docUrl).toBe("https://wiki.beds24.com/bookings");
	});

	test("SAFE_BUCKETS excludes deprecated; search_all includes it", async () => {
		const { client } = await makeSession();

		// A query whose FTS match lives ONLY in the deprecated bucket. Safe search
		// must never surface deprecated content; search_all must.
		const safe = await callTool(client, "beds24_search", { query: "OLDMARKERTERM" });
		const safeHits = JSON.parse(textOf(safe)) as SearchHit[];
		expect(safeHits.every((h) => h.bucket === "apiv2" || h.bucket === "general")).toBe(true);

		const all = await callTool(client, "beds24_search_all", { query: "OLDMARKERTERM" });
		const allHits = JSON.parse(textOf(all)) as SearchHit[];
		expect(allHits.some((h) => h.bucket === "deprecated")).toBe(true);
	});

	test("beds24_search_in_bucket filters to one bucket", async () => {
		const { client } = await makeSession();
		const result = await callTool(client, "beds24_search_in_bucket", {
			bucket: "general",
			query: "daily prices",
		});
		const hits = JSON.parse(textOf(result)) as SearchHit[];
		expect(hits.length).toBeGreaterThan(0);
		expect(hits.every((h) => h.bucket === "general")).toBe(true);
	});

	// Direct-library variant: prove the real knowledge package composes without
	// the MCP layer in between (knowledge entry points are the real thing).
	test("real knowledge library: search / searchAll / searchInBucket", async () => {
		const hits = await search("create booking", 5);
		expect(hits.length).toBeGreaterThan(0);
		expect(hits[0]!.bucket).toBe("apiv2");

		const all = await searchAll("OLDMARKERTERM", 5);
		expect(all.some((h) => h.bucket === "deprecated")).toBe(true);

		const bucket = await searchInBucket("general", "daily prices", 5);
		expect(bucket.every((h) => h.bucket === "general")).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Scenario 1 (bold) — Full operate workflow: search → schema → validate → create
// ---------------------------------------------------------------------------
describe("operate workflow (search → schema → validate → booking_create)", () => {
	test("each step resolves and hands off through the real sdk", async () => {
		const { client } = await makeSession();

		// 1. search (real knowledge index)
		const searchRes = await callTool(client, "beds24_search", { query: "create booking" });
		expect(searchRes.isError).toBeFalsy();
		expect((JSON.parse(textOf(searchRes)) as SearchHit[]).length).toBeGreaterThan(0);

		// 2. schema (real spec resolution)
		const schema = await callTool(client, "beds24_schema", {
			endpoint: "POST /bookings",
			direction: "request",
		});
		expect(schema.isError).toBeFalsy();
		const fields = JSON.parse(textOf(schema)) as Field[];
		expect(fields.length).toBeGreaterThan(0);
		expect(fields.some((f) => f.name === "roomId")).toBe(true);
		expect(fields.some((f) => f.name === "arrival")).toBe(true);

		// 3. validate — invalid payload (real schema validation)
		const invalid = await callTool(client, "beds24_validate", {
			endpoint: "POST /bookings",
			direction: "request",
			payload: { bogus: true },
		});
		expect(invalid.isError).toBeFalsy();
		const invalidResult = JSON.parse(textOf(invalid)) as { valid: boolean; errors: { path: string }[] };
		expect(invalidResult.valid).toBe(false);
		expect(invalidResult.errors.length).toBeGreaterThan(0);

		// 3b. validate — valid payload
		const valid = await callTool(client, "beds24_validate", {
			endpoint: "POST /bookings",
			direction: "request",
			payload: [{ roomId: 1, arrival: "2026-09-01", departure: "2026-09-05" }],
		});
		expect(JSON.parse(textOf(valid))).toEqual({ valid: true, errors: [] });

		// 4. booking_create (real sdk client → mocked network)
		const created = await callTool(client, "beds24_booking_create", {
			refreshToken: "rt",
			bookings: [{ roomId: 1, arrival: "2026-09-01", departure: "2026-09-05" }],
		});
		expect(created.isError).toBeFalsy();
		const body = JSON.parse(textOf(created)) as {
			data: { bookings: { id: number }[] };
			credits: { remaining: number | null };
		};
		expect(body.data.bookings[0]!.id).toBe(999);
		expect(body.credits.remaining).toBe(10);

		// The real client hit the mocked auth endpoint then the bookings endpoint.
		const urls = fetchMock.mock.calls.map((c) => {
			const inp = c[0];
			return typeof inp === "string" ? inp : inp instanceof URL ? inp.href : inp.url;
		});
		expect(urls.some((u) => u.includes("/authentication/token"))).toBe(true);
		expect(urls.some((u) => u.includes("/bookings"))).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Scenario 3 — Prompts + instructions
// ---------------------------------------------------------------------------
describe("prompts + instructions", () => {
	test("server exposes instructions and the three prompts resolve with tool refs", async () => {
		const { client } = await makeSession();

		const instructions = client.getInstructions();
		expect(typeof instructions).toBe("string");
		expect(instructions).toContain("SEARCH FIRST");
		expect(instructions).toContain("beds24_booking_create");

		const list = await client.listPrompts();
		const names = list.prompts.map((p) => p.name);
		for (const n of [
			"beds24_prompt_create_booking",
			"beds24_prompt_set_daily_prices",
			"beds24_prompt_register_webhook",
		]) {
			expect(names).toContain(n);
		}

		const prompt = await client.getPrompt({ name: "beds24_prompt_create_booking" });
		expect(prompt.messages).toHaveLength(1);
		const msg = prompt.messages[0]!;
		expect(msg.role).toBe("user");
		const txt = (msg.content as { type: "text"; text: string }).text;
		for (const needle of ["beds24_search", "POST /bookings", "beds24_validate", "beds24_booking_create"]) {
			expect(txt).toContain(needle);
		}
	});
});

// ---------------------------------------------------------------------------
// Scenario 4 — Resource access
// ---------------------------------------------------------------------------
describe("resource access", () => {
	test("beds24://endpoints returns the real spec index; facts reads a real file", async () => {
		const { client } = await makeSession();

		const endpoints = await client.readResource({ uri: "beds24://endpoints" });
		expect(endpoints.contents).toHaveLength(1);
		const epText = (endpoints.contents[0] as { mimeType: string; text: string }).text;
		const epList = JSON.parse(epText) as string[];
		expect(epList).toContain("POST /bookings");
		expect(epList.length).toBeGreaterThan(10);

		const facts = await client.listResourceTemplates();
		const templates = facts.resourceTemplates.map((t) => t.uriTemplate);
		expect(templates).toContain("beds24://facts/{path}");

		const fact = await client.readResource({ uri: "beds24://facts/top.md" });
		const factText = (fact.contents[0] as { mimeType: string; text: string }).text;
		expect(factText).toContain("TOPMARKER single-segment fact");
	});
});

// ---------------------------------------------------------------------------
// Scenario 5 — Error surface
// ---------------------------------------------------------------------------
describe("error surface", () => {
	test("a failing operational tool surfaces isError: true through the client", async () => {
		fetchMock.mockImplementation(async (...args: FetchArgs): Promise<Response> => {
			const [input] = args;
			const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
			if (url.includes("/authentication/token")) {
				return new Response(JSON.stringify({ token: "tok-test" }), {
					status: 200,
					headers: { "content-type": "application/json" },
				});
			}
			// Force the bookings call to fail.
			return new Response(JSON.stringify({ message: "Internal Server Error" }), {
				status: 500,
				headers: { "content-type": "application/json" },
			});
		});

		const { client } = await makeSession();
		const result = await callTool(client, "beds24_booking_get", {
			refreshToken: "rt",
			status: ["confirmed"],
		});
		expect(result.isError).toBe(true);
		expect(textOf(result)).toContain("booking get failed:");
	});

	test("a network-level failure is also flagged isError", async () => {
		fetchMock.mockImplementation(async (): Promise<Response> => {
			throw new Error("socket hang up");
		});
		const { client } = await makeSession();
		const result = await callTool(client, "beds24_booking_create", {
			refreshToken: "rt",
			bookings: [{ roomId: 1, arrival: "2026-09-01", departure: "2026-09-05" }],
		});
		expect(result.isError).toBe(true);
		expect(textOf(result)).toContain("booking create failed:");
	});
});

// ---------------------------------------------------------------------------
// Scenario 6 — Cross-package type compatibility (compile-time integration)
// ---------------------------------------------------------------------------
describe("cross-package type composition", () => {
	test("types from both workspace packages coexist and compose in one scope", () => {
		// These imports resolve only if the workspace: deps are wired and the
		// types are mutually compatible (no `any`, strict on).
		const hit: SearchHit = {
			id: 1,
			text: "Create a booking",
			sourceFile: "apiv2/bookings.md",
			headingPath: ["Bookings"],
			lines: [1, 10],
			bucket: "apiv2",
			docUrl: "https://wiki.beds24.com/bookings",
			score: 0.5,
		};
		const field: Field = { name: "roomId", type: "integer", required: true };

		const combined: { hit: SearchHit; field: Field; bucket: typeof hit.bucket } = {
			hit,
			field,
			bucket: "apiv2",
		};
		expect(combined.hit.bucket).toBe("apiv2");
		expect(combined.field.name).toBe("roomId");
		expect(combined.bucket).toBe("apiv2");
	});
});
