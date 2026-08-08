/**
 * Unit tests for the beds24-mcp-server handler wiring.
 *
 * Per TEST-HARNESS.md: we mock the two workspace packages (beds24-knowledge,
 * beds24-sdk-client) and node:fs, then drive the named handler functions
 * DIRECTLY — no MCP transport required. This keeps tests hermetic: no real
 * libsql, no real embedder, no real stdio, no real YAML spec on disk.
 */

import { test, expect, describe, beforeEach, afterEach, mock } from "bun:test";
import { rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Bucket } from "beds24-knowledge";
import type { Field } from "beds24-sdk-client";

// ---------------------------------------------------------------------------
// Real temp directory for fs-backed handlers (resource list/read + status walk
// + countFactsFiles). Bun does not intercept the `node:fs` builtin via
// mock.module, so we exercise the real walk/read path against a temp corpus.
// ---------------------------------------------------------------------------
const KNOWLEDGE_DIR = join(tmpdir(), "beds24-mcp-test-knowledge");
const FAKE_DB_PATH = join(tmpdir(), "beds24-mcp-test-index.db");

function resetFs(): void {
	rmSync(KNOWLEDGE_DIR, { recursive: true, force: true });
	mkdirSync(KNOWLEDGE_DIR, { recursive: true });
	// The knowledge mock reports DB_PATH; status calls statSync(DB_PATH).size
	// when the index "exists". Keep a real placeholder file there so stat works.
	mkdirSync(join(FAKE_DB_PATH, ".."), { recursive: true });
	writeFileSync(FAKE_DB_PATH, "");
}

function addDir(path: string): void {
	mkdirSync(path, { recursive: true });
}

function addFile(path: string, content: string): void {
	mkdirSync(join(path, ".."), { recursive: true });
	writeFileSync(path, content);
}

// ---------------------------------------------------------------------------
// Mock beds24-knowledge. The factory closes over mutable mock refs so tests can
// swap implementations between cases.
// ---------------------------------------------------------------------------
const searchMock = mock(async () => [] as SearchHit[]);
const searchAllMock = mock(async () => [] as SearchHit[]);
const searchInBucketMock = mock(async () => [] as SearchHit[]);
const buildIndexMock = mock(async () => ({ files: 0, chunks: 0 }));
const getDbMock = mock(() => ({}) as unknown);
const dbExistsMock = mock(() => true);
const countChunksMock = mock(() => 0);
const bucketCountsMock = mock(
	() => ({ deprecated: 0, apiv1: 0, apiv2: 0, general: 0 }) as Record<Bucket, number>,
);

mock.module("beds24-knowledge", () => ({
	search: searchMock,
	searchAll: searchAllMock,
	searchInBucket: searchInBucketMock,
	buildIndex: buildIndexMock,
	getDb: getDbMock,
	dbExists: dbExistsMock,
	countChunks: countChunksMock,
	bucketCounts: bucketCountsMock,
	DB_PATH: FAKE_DB_PATH,
}));

// ---------------------------------------------------------------------------
// Mock beds24-sdk-client.
// ---------------------------------------------------------------------------
const getSchemaMock = mock(() => undefined as unknown);
const listEndpointsMock = mock(() => [] as string[]);
const flattenObjectMock = mock(() => [] as Field[]);
const validatorValidateMock = mock(() => ({
	valid: true,
	errors: [] as { path: string; message: string }[],
}));
const validatorInstance = { validate: validatorValidateMock };

class MockBeds24Validator {
	static create = mock(() => validatorInstance);
}

// T12 operational handlers import the SDK client + ops as values. This test
// file does not exercise them, but server.ts imports them at module load, so
// the mock must export them. They are no-op stubs here — server-ops.test.ts
// provides behaviorally complete mocks.
class StubOp {}
class MockBeds24Client {
	constructor(_config: unknown) {}
}

mock.module("beds24-sdk-client", () => ({
	getSchema: getSchemaMock,
	listEndpoints: listEndpointsMock,
	flattenObject: flattenObjectMock,
	Beds24Validator: MockBeds24Validator,
	Beds24Client: MockBeds24Client,
	BookingOps: StubOp,
	PricingOps: StubOp,
	AvailabilityOps: StubOp,
	ChannelsOps: StubOp,
	WebhooksOps: StubOp,
	MessageOps: StubOp,
	InventoryOps: StubOp,
	PropertyOps: StubOp,
	AccountOps: StubOp,
	InvoicingOps: StubOp,
	ChannelActionsOps: StubOp,
	StripeOps: StubOp,
}));

// ---------------------------------------------------------------------------
// Mock the stdio transport so startServer does not bind to process.stdin.
// ---------------------------------------------------------------------------
const transportInstances: unknown[] = [];
mock.module("@modelcontextprotocol/sdk/server/stdio.js", () => ({
	StdioServerTransport: class {
		constructor() {
			transportInstances.push(this);
		}
		onmessage: ((msg: unknown) => void) | null = null;
		async send(): Promise<void> {}
		async start(): Promise<void> {}
		async close(): Promise<void> {}
	},
}));

// ---------------------------------------------------------------------------
// Import the module under test AFTER all mocks are registered. Point the
// knowledge root at our temp dir so the fs-backed handlers walk real files.
// ---------------------------------------------------------------------------
process.env.BEDS24_KNOWLEDGE_DIR = KNOWLEDGE_DIR;

const {
	handleSearch,
	handleSearchAll,
	handleSearchInBucket,
	handleSchema,
	handleValidate,
	handleHowto,
	handleStatus,
	handleFactsList,
	handleFactsRead,
	handleEndpoints,
	countFactsFiles,
	startServer,
	main,
	server,
} = await import("./server.js");

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------
interface SearchHit {
	id: number;
	text: string;
	sourceFile: string;
	headingPath: string[];
	lines: [number, number];
	bucket: Bucket;
	docUrl: string | null;
	score: number;
}

function makeHit(overrides: Partial<SearchHit> = {}): SearchHit {
	return {
		id: 1,
		text: "Generic doc text.",
		sourceFile: "general/intro.md",
		headingPath: ["Intro"],
		lines: [1, 10],
		bucket: "general",
		docUrl: "https://docs.beds24.com/intro",
		score: 0.5,
		...overrides,
	};
}

const fakeHits: SearchHit[] = [makeHit(), makeHit({ id: 2, headingPath: ["Intro", "Details"] })];

// Spy on server.connect so we can assert the boot path without running the
// real stdio connection.
const connectCalls: unknown[][] = [];
const originalConnect = server.connect.bind(server);

function installConnectSpy(): void {
	connectCalls.length = 0;
	server.connect = mock(async (...args: unknown[]) => {
		connectCalls.push(args);
	}) as typeof server.connect;
}

function textOf(result: { content: { type: string; text?: string }[] }): string {
	const item = result.content[0];
	if (!item || item.type !== "text" || typeof item.text !== "string") {
		throw new Error("expected a text content block");
	}
	return item.text;
}

function resetMocks(): void {
	// mockReset clears call history AND any queued mockReturnValueOnce values,
	// which is critical — otherwise a once-stub leaks into the next test.
	dbExistsMock.mockReset();
	searchMock.mockReset();
	searchAllMock.mockReset();
	searchInBucketMock.mockReset();
	buildIndexMock.mockReset();
	getDbMock.mockReset();
	countChunksMock.mockReset();
	bucketCountsMock.mockReset();
	getSchemaMock.mockReset();
	listEndpointsMock.mockReset();
	flattenObjectMock.mockReset();
	validatorValidateMock.mockReset();
	MockBeds24Validator.create.mockReset();

	// Re-establish the default happy-path behavior.
	dbExistsMock.mockReturnValue(true);
	searchMock.mockResolvedValue([]);
	searchAllMock.mockResolvedValue([]);
	searchInBucketMock.mockResolvedValue([]);
	buildIndexMock.mockResolvedValue({ files: 0, chunks: 0 });
	getDbMock.mockReturnValue({});
	countChunksMock.mockReturnValue(0);
	bucketCountsMock.mockReturnValue({ deprecated: 0, apiv1: 0, apiv2: 0, general: 0 });
	getSchemaMock.mockReturnValue(undefined);
	listEndpointsMock.mockReturnValue([]);
	flattenObjectMock.mockReturnValue([]);
	validatorValidateMock.mockReturnValue({ valid: true, errors: [] });
	MockBeds24Validator.create.mockReturnValue(validatorInstance);

	transportInstances.length = 0;
	connectCalls.length = 0;
}

beforeEach(() => {
	resetFs();
	resetMocks();
	installConnectSpy();
});

afterEach(() => {
	server.connect = originalConnect;
});

// ---------------------------------------------------------------------------
// beds24_search
// ---------------------------------------------------------------------------
describe("handleSearch", () => {
	test("calls search(query, topK) and serializes the hits", async () => {
		searchMock.mockReturnValue(Promise.resolve(fakeHits));
		const result = await handleSearch({ query: "pricing", topK: 3 });
		expect(searchMock).toHaveBeenCalledTimes(1);
		expect(searchMock).toHaveBeenCalledWith("pricing", 3);
		expect(JSON.parse(textOf(result))).toEqual(fakeHits);
	});

	test("defaults topK to 5 when omitted", async () => {
		searchMock.mockReturnValue(Promise.resolve([]));
		await handleSearch({ query: "webhooks" });
		expect(searchMock).toHaveBeenCalledWith("webhooks", 5);
	});

	test("returns a search failed message on error", async () => {
		searchMock.mockImplementation(async () => {
			throw new Error("embed boom");
		});
		const result = await handleSearch({ query: "x" });
		expect(textOf(result)).toBe("search failed: embed boom");
	});
});

// ---------------------------------------------------------------------------
// beds24_search_all
// ---------------------------------------------------------------------------
describe("handleSearchAll", () => {
	test("calls searchAll(query, topK) and serializes the hits", async () => {
		searchAllMock.mockReturnValue(Promise.resolve(fakeHits));
		const result = await handleSearchAll({ query: "legacy api", topK: 7 });
		expect(searchAllMock).toHaveBeenCalledWith("legacy api", 7);
		expect(JSON.parse(textOf(result))).toEqual(fakeHits);
	});

	test("defaults topK to 5", async () => {
		searchAllMock.mockReturnValue(Promise.resolve([]));
		await handleSearchAll({ query: "x" });
		expect(searchAllMock).toHaveBeenCalledWith("x", 5);
	});

	test("returns a search failed message on error", async () => {
		searchAllMock.mockRejectedValue(new Error("index missing"));
		const result = await handleSearchAll({ query: "x" });
		expect(textOf(result)).toBe("search failed: index missing");
	});
});

// ---------------------------------------------------------------------------
// beds24_search_in_bucket
// ---------------------------------------------------------------------------
describe("handleSearchInBucket", () => {
	test("calls searchInBucket(bucket, query, topK) and serializes the hits", async () => {
		searchInBucketMock.mockReturnValue(Promise.resolve(fakeHits));
		const result = await handleSearchInBucket({ bucket: "apiv2", query: "set prices", topK: 2 });
		expect(searchInBucketMock).toHaveBeenCalledWith("apiv2", "set prices", 2);
		expect(JSON.parse(textOf(result))).toEqual(fakeHits);
	});

	test("defaults topK to 5", async () => {
		searchInBucketMock.mockReturnValue(Promise.resolve([]));
		await handleSearchInBucket({ bucket: "general", query: "x" });
		expect(searchInBucketMock).toHaveBeenCalledWith("general", "x", 5);
	});

	test("returns a search failed message on error", async () => {
		searchInBucketMock.mockRejectedValue(new Error("vec error"));
		const result = await handleSearchInBucket({ bucket: "apiv1", query: "x" });
		expect(textOf(result)).toBe("search failed: vec error");
	});
});

// ---------------------------------------------------------------------------
// beds24_schema
// ---------------------------------------------------------------------------
describe("handleSchema", () => {
	test("resolves the schema and flattens it", async () => {
		getSchemaMock.mockReturnValueOnce({ type: "object", properties: { arrival: { type: "string" } } });
		flattenObjectMock.mockReturnValueOnce([{ name: "arrival", type: "string", required: true }]);
		const result = await handleSchema({ endpoint: "POST /bookings", direction: "request" });
		expect(getSchemaMock).toHaveBeenCalledWith("POST /bookings", "request");
		expect(flattenObjectMock).toHaveBeenCalledTimes(1);
		expect(JSON.parse(textOf(result))).toEqual([{ name: "arrival", type: "string", required: true }]);
	});

	test("reports not-found with the endpoint list", async () => {
		getSchemaMock.mockReturnValueOnce(undefined);
		listEndpointsMock.mockReturnValueOnce(["POST /bookings", "GET /inventory/rooms"]);
		const result = await handleSchema({ endpoint: "POST /nope", direction: "request" });
		expect(textOf(result)).toBe(
			'no request schema found for "POST /nope". Try one of: POST /bookings, GET /inventory/rooms',
		);
	});

	test("treats a non-object schema as not-found", async () => {
		getSchemaMock.mockReturnValueOnce("weird");
		listEndpointsMock.mockReturnValueOnce(["POST /bookings"]);
		const result = await handleSchema({ endpoint: "POST /x", direction: "response" });
		expect(textOf(result)).toContain("no response schema found");
	});

	test("returns a schema lookup failed message on error", async () => {
		getSchemaMock.mockImplementationOnce(() => {
			throw new Error("spec unparseable");
		});
		const result = await handleSchema({ endpoint: "POST /x", direction: "request" });
		expect(textOf(result)).toBe("schema lookup failed: spec unparseable");
	});
});

// ---------------------------------------------------------------------------
// beds24_validate
// ---------------------------------------------------------------------------
describe("handleValidate", () => {
	test("creates a validator and serializes the validation result", async () => {
		const validationResult = {
			valid: false,
			errors: [{ path: "arrival", message: "required field missing: arrival" }],
		};
		validatorValidateMock.mockReturnValueOnce(validationResult);
		const result = await handleValidate({
			endpoint: "POST /bookings",
			direction: "request",
			payload: { nights: 3 },
		});
		expect(MockBeds24Validator.create).toHaveBeenCalledTimes(1);
		expect(validatorValidateMock).toHaveBeenCalledWith("POST /bookings", "request", { nights: 3 });
		expect(JSON.parse(textOf(result))).toEqual(validationResult);
	});

	test("returns a validation failed message when the validator throws", async () => {
		validatorValidateMock.mockImplementationOnce(() => {
			throw new Error("ajv compile failed");
		});
		const result = await handleValidate({
			endpoint: "POST /bookings",
			direction: "request",
			payload: {},
		});
		expect(textOf(result)).toBe("validation failed: ajv compile failed");
	});
});

// ---------------------------------------------------------------------------
// beds24_howto
// ---------------------------------------------------------------------------
describe("handleHowto", () => {
	test("resolves the schema for the endpoint mentioned in the top hit", async () => {
		searchMock.mockReturnValueOnce(
			Promise.resolve([
				makeHit({ text: "To create a booking, call POST /bookings with an array of items." }),
			]),
		);
		getSchemaMock.mockReturnValueOnce({ type: "object", properties: { booking: { type: "object" } } });
		flattenObjectMock.mockReturnValueOnce([{ name: "booking", type: "object", required: true }]);

		const result = await handleHowto({ task: "create a booking" });
		const summary = JSON.parse(textOf(result));

		expect(searchMock).toHaveBeenCalledWith("create a booking", 5);
		expect(getSchemaMock).toHaveBeenCalledWith("POST /bookings", "request");
		expect(summary.matchedEndpoint).toBe("POST /bookings");
		expect(summary.requestSchema).toEqual([{ name: "booking", type: "object", required: true }]);
		expect(summary.steps[0]!.snippet).toContain("POST /bookings");
	});

	test("falls back when no METHOD /path is mentioned", async () => {
		searchMock.mockReturnValueOnce(
			Promise.resolve([makeHit({ text: "General info about the platform, no endpoint here." })]),
		);
		const result = await handleHowto({ task: "explain the platform" });
		const summary = JSON.parse(textOf(result));

		expect(getSchemaMock).not.toHaveBeenCalled();
		expect(summary.matchedEndpoint).toBeNull();
		expect(summary.requestSchema).toEqual([]);
		expect(summary.steps).toHaveLength(1);
	});

	test("falls back cleanly when there are no hits at all", async () => {
		searchMock.mockReturnValueOnce(Promise.resolve([]));
		const result = await handleHowto({ task: "obscure thing" });
		const summary = JSON.parse(textOf(result));
		expect(summary.matchedEndpoint).toBeNull();
		expect(summary.requestSchema).toEqual([]);
		expect(summary.steps).toEqual([]);
	});

	test("returns a howto failed message on error", async () => {
		searchMock.mockRejectedValue(new Error("search broke"));
		const result = await handleHowto({ task: "x" });
		expect(textOf(result)).toBe("howto failed: search broke");
	});
});

// ---------------------------------------------------------------------------
// beds24_status
// ---------------------------------------------------------------------------
describe("handleStatus", () => {
	test("reports the live index when it exists", async () => {
		dbExistsMock.mockReturnValueOnce(true);
		countChunksMock.mockReturnValueOnce(42);
		bucketCountsMock.mockReturnValueOnce({ deprecated: 1, apiv1: 2, apiv2: 10, general: 5 });
		listEndpointsMock.mockReturnValueOnce(["POST /bookings", "GET /inventory/rooms"]);
		// countFactsFiles walks KNOWLEDGE_DIR; seed a couple of files.
		addDir(KNOWLEDGE_DIR);
		addFile(`${KNOWLEDGE_DIR}/intro.md`, "# Intro");
		addDir(`${KNOWLEDGE_DIR}/apiv2`);
		addFile(`${KNOWLEDGE_DIR}/apiv2/pricing.md`, "# Pricing");

		const result = await handleStatus();
		const status = JSON.parse(textOf(result));

		expect(dbExistsMock).toHaveBeenCalled();
		expect(countChunksMock).toHaveBeenCalled();
		expect(bucketCountsMock).toHaveBeenCalled();
		expect(status.indexKnowledgeDir).toBe(KNOWLEDGE_DIR);
		expect(status).toMatchObject({
			indexExists: true,
			chunksIndexed: 42,
			byBucket: { deprecated: 1, apiv1: 2, apiv2: 10, general: 5 },
			factsFiles: 2,
			apiEndpoints: 2,
		});
		expect(typeof status.dbSizeBytes).toBe("number");
	});

	test("reports a zeroed-out status when the index is missing", async () => {
		dbExistsMock.mockReturnValue(false);
		listEndpointsMock.mockReturnValue(["POST /bookings"]);

		const result = await handleStatus();
		const status = JSON.parse(textOf(result));

		expect(countChunksMock).not.toHaveBeenCalled();
		expect(bucketCountsMock).not.toHaveBeenCalled();
		expect(status.indexExists).toBe(false);
		expect(status.chunksIndexed).toBe(0);
		expect(status.dbSizeBytes).toBe(0);
		expect(status.byBucket).toEqual({ deprecated: 0, apiv1: 0, apiv2: 0, general: 0 });
		expect(status.factsFiles).toBe(0);
		expect(status.apiEndpoints).toBe(1);
	});

	test("returns a status failed message on error", async () => {
		dbExistsMock.mockImplementationOnce(() => {
			throw new Error("fs explosion");
		});
		const result = await handleStatus();
		expect(textOf(result)).toBe("status failed: fs explosion");
	});
});

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------
describe("handleFactsList (resource list)", () => {
	test("walks the knowledge root and lists .md files as resources", async () => {
		addDir(KNOWLEDGE_DIR);
		addFile(`${KNOWLEDGE_DIR}/intro.md`, "# Intro");
		addDir(`${KNOWLEDGE_DIR}/apiv2`);
		addFile(`${KNOWLEDGE_DIR}/apiv2/pricing.md`, "# Pricing");
		addFile(`${KNOWLEDGE_DIR}/apiv2/README.txt`, "not markdown");

		const result = await handleFactsList();
		const uris = result.resources.map((r) => r.uri).sort();
		expect(uris).toEqual([
			"beds24://facts/apiv2/pricing.md",
			"beds24://facts/intro.md",
		]);
		expect(result.resources.every((r) => r.mimeType === "text/markdown")).toBe(true);
	});

	test("returns an empty list when the knowledge dir does not exist", async () => {
		const result = await handleFactsList();
		expect(result.resources).toEqual([]);
	});
});

describe("handleFactsRead (resource read)", () => {
	test("reads a contained facts file", async () => {
		addFile(`${KNOWLEDGE_DIR}/intro.md`, "# Intro\nContent here.");

		const result = await handleFactsRead(new URL("beds24://facts/intro.md"), { path: "intro.md" });
		expect(result.contents).toHaveLength(1);
		expect(result.contents[0]!.uri).toBe("beds24://facts/intro.md");
		expect(result.contents[0]!.name).toBe("intro.md");
		expect(result.contents[0]!.mimeType).toBe("text/markdown");
		expect(result.contents[0]!.text).toBe("# Intro\nContent here.");
	});

	test("strips a leading slash from the path", async () => {
		addFile(`${KNOWLEDGE_DIR}/intro.md`, "ok");
		const result = await handleFactsRead(new URL("beds24://facts/intro.md"), { path: "/intro.md" });
		expect(result.contents[0]!.text).toBe("ok");
	});

	test("accepts the path as a string-array template variable", async () => {
		addFile(`${KNOWLEDGE_DIR}/intro.md`, "array-path");
		const result = await handleFactsRead(new URL("beds24://facts/intro.md"), {
			path: ["intro.md", "extra"],
		});
		expect(result.contents[0]!.text).toBe("array-path");
	});

	test("rejects a path that escapes the knowledge root", async () => {
		await expect(
			handleFactsRead(new URL("beds24://facts/secret"), { path: "../../etc/passwd" }),
		).rejects.toThrow("access denied: ../../etc/passwd");
	});
});

describe("handleEndpoints (resource read)", () => {
	test("lists all endpoints as JSON", async () => {
		listEndpointsMock.mockReturnValueOnce(["POST /bookings", "GET /inventory/rooms"]);
		const result = await handleEndpoints(new URL("beds24://endpoints"));
		expect(result.contents).toHaveLength(1);
		expect(result.contents[0]!.mimeType).toBe("application/json");
		expect(JSON.parse(result.contents[0]!.text)).toEqual(["POST /bookings", "GET /inventory/rooms"]);
	});
});

// ---------------------------------------------------------------------------
// countFactsFiles helper
// ---------------------------------------------------------------------------
describe("countFactsFiles", () => {
	test("returns 0 when the directory is missing", () => {
		expect(countFactsFiles("/does/not/exist")).toBe(0);
	});

	test("counts .md files recursively", () => {
		addDir(KNOWLEDGE_DIR);
		addFile(`${KNOWLEDGE_DIR}/a.md`, "a");
		addDir(`${KNOWLEDGE_DIR}/sub`);
		addFile(`${KNOWLEDGE_DIR}/sub/b.md`, "b");
		addFile(`${KNOWLEDGE_DIR}/sub/c.txt`, "not md");
		expect(countFactsFiles(KNOWLEDGE_DIR)).toBe(2);
	});
});

// ---------------------------------------------------------------------------
// startServer boot / auto-index
// ---------------------------------------------------------------------------
describe("startServer", () => {
	test("builds the index when it is missing, then connects on stdio", async () => {
		dbExistsMock.mockReturnValue(false);

		await startServer();

		expect(dbExistsMock).toHaveBeenCalled();
		expect(getDbMock).toHaveBeenCalled();
		expect(buildIndexMock).toHaveBeenCalledWith({ knowledgeDir: KNOWLEDGE_DIR });
		expect(transportInstances).toHaveLength(1);
		expect(connectCalls).toHaveLength(1);
		expect(connectCalls[0]![0]).toBe(transportInstances[0]);
	});

	test("skips buildIndex when the index already exists", async () => {
		dbExistsMock.mockReturnValue(true);

		await startServer();

		expect(getDbMock).not.toHaveBeenCalled();
		expect(buildIndexMock).not.toHaveBeenCalled();
		expect(transportInstances).toHaveLength(1);
		expect(connectCalls).toHaveLength(1);
	});

	test("logs and continues when auto-index fails", async () => {
		dbExistsMock.mockReturnValue(false);
		buildIndexMock.mockRejectedValueOnce(new Error("index build boom"));

		// Should not throw — the failure is logged to stderr and boot continues.
		await expect(startServer()).resolves.toBeUndefined();
		expect(connectCalls).toHaveLength(1);
	});
});

// ---------------------------------------------------------------------------
// main() entry point
// ---------------------------------------------------------------------------
describe("main", () => {
	test("starts the server", async () => {
		dbExistsMock.mockReturnValue(true);
		await main();
		expect(connectCalls).toHaveLength(1);
	});

	test("logs and exits non-zero when startServer throws", async () => {
		dbExistsMock.mockReturnValue(true);
		// Replace the connect spy with one that throws so startServer rejects.
		server.connect = mock(async () => {
			throw new Error("transport boom");
		}) as typeof server.connect;

		const exitMock = mock((_code?: number) => undefined);
		const origExit = process.exit;
		const origError = console.error;
		process.exit = exitMock as unknown as typeof process.exit;
		console.error = mock(() => undefined);
		try {
			await main();
			expect(exitMock).toHaveBeenCalledWith(1);
		} finally {
			process.exit = origExit;
			console.error = origError;
			installConnectSpy();
		}
	});
});
