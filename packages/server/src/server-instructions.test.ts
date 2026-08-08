/**
 * Unit tests for the T13 server-level enrichments in server.ts:
 *   - the server-level `instructions:` field surfaced to every connected LLM,
 *   - the three registered MCP prompts (create booking / set daily prices /
 *     register webhook),
 *   - the operational-handler error path now surfacing isError: true.
 *
 * Per TEST-HARNESS.md + the known cross-file flakiness flagged by T12: mock
 * BOTH workspace packages, point BEDS24_KNOWLEDGE_DIR at the SAME shared temp
 * dir the other server tests use, and mockReset() in beforeEach. This file
 * does NOT touch T10/T12's test files.
 */

import { test, expect, describe, beforeEach, mock } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Request, Notification } from "@modelcontextprotocol/sdk/types.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { GetPromptResult, TextContent } from "@modelcontextprotocol/sdk/types.js";

// The prompt callback signature the SDK expects — inferred from the no-arg
// PromptCallback form. RequestHandlerExtra is generic over the server's
// request/notification types; use the base types for a generic-enough mock.
type PromptExtra = RequestHandlerExtra<Request, Notification>;

// ---------------------------------------------------------------------------
// Shared temp dir — identical to server.test.ts / server-ops.test.ts so the
// module-level KNOWLEDGE_DIR these files lock in agrees across test files.
// ---------------------------------------------------------------------------
const KNOWLEDGE_DIR = join(tmpdir(), "beds24-mcp-test-knowledge");
const FAKE_DB_PATH = join(tmpdir(), "beds24-mcp-test-index.db");

mock.module("beds24-knowledge", () => ({
	search: mock(async () => []),
	searchAll: mock(async () => []),
	searchInBucket: mock(async () => []),
	buildIndex: mock(async () => ({ files: 0, chunks: 0 })),
	getDb: mock(() => ({})),
	dbExists: mock(() => true),
	countChunks: mock(() => 0),
	bucketCounts: mock(() => ({ deprecated: 0, apiv1: 0, apiv2: 0, general: 0 })),
	DB_PATH: FAKE_DB_PATH,
}));

// Minimal beds24-sdk-client mock. Only the client + ops the error-path test
// touches need real-ish behavior; everything else is a no-op stub.
class MockBeds24Client {
	constructor(_config: unknown) {}
}
const bookingGet = mock(async () => ({ data: { ok: true } }));

class MockBookingOps {
	constructor(_client: unknown) {}
	get = bookingGet;
}

mock.module("beds24-sdk-client", () => ({
	Beds24Client: MockBeds24Client as unknown as typeof import("beds24-sdk-client").Beds24Client,
	BookingOps: MockBookingOps,
	PricingOps: class {},
	AvailabilityOps: class {},
	ChannelsOps: class {},
	WebhooksOps: class {},
	MessageOps: class {},
	InventoryOps: class {},
	PropertyOps: class {},
	AccountOps: class {},
	InvoicingOps: class {},
	OrganizationOps: class {},
	ChannelActionsOps: class {},
	ReviewsOps: class {},
	StripeOps: class {},
	getSchema: mock(() => undefined),
	listEndpoints: mock(() => []),
	flattenObject: mock(() => []),
	Beds24Validator: class {
		static create = mock(() => ({ validate: mock(() => ({ valid: true, errors: [] })) }));
	},
}));

// ---------------------------------------------------------------------------
// Import AFTER mocks + env are in place.
// ---------------------------------------------------------------------------
process.env.BEDS24_KNOWLEDGE_DIR = KNOWLEDGE_DIR;

const mod = await import("./server.js");
const {
	server,
	SERVER_INSTRUCTIONS,
	promptCreateBooking,
	promptSetDailyPrices,
	promptRegisterWebhook,
	handleBookingGet,
} = mod;

// The SDK stores registered prompts privately; reach in via the typed shape.
type RegisteredPrompt = {
	title?: string;
	description?: string;
	callback: (extra: PromptExtra) => GetPromptResult | Promise<GetPromptResult>;
};
function registeredPrompts(): Record<string, RegisteredPrompt> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (server as any)._registeredPrompts as Record<string, RegisteredPrompt>;
}

// The underlying Server stores instructions privately; read it back.
function serverInstructions(): string | undefined {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (server as any).server?._instructions as string | undefined;
}

// Our prompts only ever emit text content blocks. Narrow the union so we can
// read .text under noUncheckedIndexedAccess without an `as` cast at every call.
function textOf(msg: GetPromptResult["messages"][number]): string {
	const content = msg.content;
	if (content.type !== "text") {
		throw new Error(`expected text content, got ${content.type}`);
	}
	return (content as TextContent).text;
}

// Duck-typed read of a tool result's first text block — mirrors the textOf
// helper in server.test.ts / server-ops.test.ts so we avoid the SDK content
// union narrowing at every call site.
function toolText(result: { content: { type: string; text?: string }[] }): string {
	const item = result.content[0];
	if (!item || item.type !== "text" || typeof item.text !== "string") {
		throw new Error("expected a text content block");
	}
	return item.text;
}

function resetMocks(): void {
	bookingGet.mockReset();
	bookingGet.mockResolvedValue({ data: { ok: true } });
}

beforeEach(resetMocks);

// ---------------------------------------------------------------------------
// Server-level instructions
// ---------------------------------------------------------------------------
describe("SERVER_INSTRUCTIONS", () => {
	test("is a non-empty string with the five-step workflow keywords", () => {
		expect(typeof SERVER_INSTRUCTIONS).toBe("string");
		expect(SERVER_INSTRUCTIONS.length).toBeGreaterThan(0);
		// Workflow order is encoded in the guidance.
		for (const keyword of [
			"SEARCH FIRST",
			"INSPECT NEXT",
			"VALIDATE BEFORE SENDING",
			"THEN OPERATE",
			"AUTH",
		]) {
			expect(SERVER_INSTRUCTIONS).toContain(keyword);
		}
	});

	test("names the key tools the LLM should use", () => {
		for (const tool of [
			"beds24_search",
			"beds24_howto",
			"beds24_schema",
			"beds24_validate",
			"beds24_booking_create",
		]) {
			expect(SERVER_INSTRUCTIONS).toContain(tool);
		}
	});

	test("calls out the auth block + cancelled-not-deleted note", () => {
		expect(SERVER_INSTRUCTIONS).toContain("refreshToken");
		expect(SERVER_INSTRUCTIONS).toContain("inviteCode");
		expect(SERVER_INSTRUCTIONS).toContain("token");
		expect(SERVER_INSTRUCTIONS.toUpperCase()).toContain("CANCELLED");
	});
});

describe("server instructions field", () => {
	test("the McpServer exposes the instructions via the underlying Server", () => {
		// The instructions are passed through to the underlying Server at
		// construction time and surfaced again on the initialize response.
		expect(serverInstructions()).toBe(SERVER_INSTRUCTIONS);
	});
});

// ---------------------------------------------------------------------------
// MCP prompts — registered + return expected structure
// ---------------------------------------------------------------------------
describe("registered prompts", () => {
	const expected = [
		"beds24_prompt_create_booking",
		"beds24_prompt_set_daily_prices",
		"beds24_prompt_register_webhook",
	] as const;

	test("all three prompts are registered with titles + descriptions", () => {
		const prompts = registeredPrompts();
		for (const name of expected) {
			const p = prompts[name];
			expect(p, `prompt ${name} should be registered`).toBeDefined();
			expect(p?.title).toBeTruthy();
			expect(p?.description).toBeTruthy();
			expect(typeof p?.callback).toBe("function");
		}
	});
});

describe("promptCreateBooking handler", () => {
	test("returns a user message walking search → schema → validate → create", async () => {
		const result = await promptCreateBooking();
		expect(result.description).toMatch(/booking/i);
		expect(result.messages).toHaveLength(1);
		const msg = result.messages[0]!;
		expect(msg.role).toBe("user");
		const t = textOf(msg);
		for (const needle of [
			"beds24_search",
			"POST /bookings",
			"beds24_schema",
			"beds24_validate",
			"beds24_booking_create",
			"refreshToken",
		]) {
			expect(t).toContain(needle);
		}
	});
});

describe("promptSetDailyPrices handler", () => {
	test("returns a user message pointing at the calendar schema + price tool", async () => {
		const result = await promptSetDailyPrices();
		expect(result.messages).toHaveLength(1);
		const t = textOf(result.messages[0]!);
		for (const needle of [
			"beds24_search",
			"POST /inventory/rooms/calendar",
			"beds24_schema",
			"beds24_validate",
			"beds24_price_set_daily",
		]) {
			expect(t).toContain(needle);
		}
	});
});

describe("promptRegisterWebhook handler", () => {
	test("returns a user message pointing at the Webhooks schema + register tool", async () => {
		const result = await promptRegisterWebhook();
		expect(result.messages).toHaveLength(1);
		const t = textOf(result.messages[0]!);
		for (const needle of [
			"beds24_search",
			"POST Webhooks - bookings",
			"beds24_schema",
			"beds24_webhook_register",
		]) {
			expect(t).toContain(needle);
		}
	});
});

describe("registered prompt callbacks are callable", () => {
	test("each registered prompt callback returns a GetPromptResult", async () => {
		const prompts = registeredPrompts();
		for (const name of [
			"beds24_prompt_create_booking",
			"beds24_prompt_set_daily_prices",
			"beds24_prompt_register_webhook",
		]) {
			const cb = prompts[name]?.callback;
			expect(cb, `${name} callback`).toBeDefined();
			const result = await cb!({} as PromptExtra);
			expect(result.messages.length).toBeGreaterThan(0);
			expect(result.messages[0]!.role).toBe("user");
		}
	});
});

// ---------------------------------------------------------------------------
// Error handling — operational handlers now surface isError: true
// ---------------------------------------------------------------------------
describe("operational error path", () => {
	test("handleBookingGet surfaces isError: true on failure, text unchanged", async () => {
		bookingGet.mockImplementationOnce(async () => {
			throw new Error("network down");
		});
		const result = await handleBookingGet({ refreshToken: "rk" });
		// New behavior: genuine failures are flagged as MCP errors.
		expect(result.isError).toBe(true);
		// Existing text prefix format is preserved.
		expect(toolText(result)).toBe("booking get failed: network down");
	});

	test("handleBookingGet does NOT set isError on a normal success", async () => {
		const result = await handleBookingGet({ refreshToken: "rk", status: ["confirmed"] });
		expect(result.isError).toBeUndefined();
		expect(toolText(result)).toContain("ok");
	});
});
