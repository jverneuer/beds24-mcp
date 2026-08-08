/**
 * Unit tests for the three new operational handlers added in T16:
 * handleInvoiceList, handleChannelAirbnbPush, handleStripeSetup.
 *
 * Follows the T12 handler pattern in server-ops.test.ts: mock
 * beds24-sdk-client, drive the named handler functions DIRECTLY — no MCP
 * transport. Each SDK op is a stub class whose methods are bun:test mocks;
 * handlers build a per-request client via getClient() and forward to the op, so
 * we assert on (a) the op method that was called, (b) the args it received, and
 * (c) the serialized result. Error paths assert the defensive "X failed: ...".
 */

import { test, expect, describe, beforeEach, mock } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Beds24Client } from "@jverneuer/beds24-sdk-client";

// Same deterministic KNOWLEDGE_DIR/DB_PATH as server-ops.test.ts so the
// module-level KNOWLEDGE_DIR server.js locks is consistent across files.
const KNOWLEDGE_DIR = join(tmpdir(), "beds24-mcp-test-knowledge");
const FAKE_DB_PATH = join(tmpdir(), "beds24-mcp-test-index.db");

mock.module("@jverneuer/beds24-knowledge", () => ({
	search: mock(async () => []),
	searchAll: mock(async () => []),
	searchInBucket: mock(async () => []),
	buildIndex: mock(async () => ({ files: 0, chunks: 0 })),
	getDb: mock(() => ({})),
	dbExists: mock(() => false),
	countChunks: mock(() => 0),
	bucketCounts: mock(() => ({ deprecated: 0, apiv1: 0, apiv2: 0, general: 0 })),
	DB_PATH: FAKE_DB_PATH,
}));

// ---------------------------------------------------------------------------
// Mock beds24-sdk-client: the new ops are stub classes whose methods are mocks.
// ---------------------------------------------------------------------------
function makeOps(methods: Record<string, (...args: unknown[]) => unknown>) {
	const entries = Object.entries(methods).map(([k, fn]) => [k, mock(fn)] as const);
	return class {
		constructor(_client: unknown) {
			for (const [k, fn] of entries) {
				(this as Record<string, unknown>)[k] = fn;
			}
		}
	};
}

const invoiceList = mock(async () => canned);
const channelAirbnbPush = mock(async () => canned);
const stripeSetup = mock(async () => canned);

const MockInvoicingOps = makeOps({ list: invoiceList });
const MockChannelActionsOps = makeOps({ pushToAirbnb: channelAirbnbPush });
const MockStripeOps = makeOps({ setupStripe: stripeSetup });

const canned = { data: { ok: true }, credits: { remaining: 10, resetsIn: 300 } };

const constructedConfigs: Array<{ refreshToken?: string; inviteCode?: string; token?: string; baseUrl?: string }> = [];
class MockBeds24Client {
	constructor(config: { refreshToken?: string; inviteCode?: string; token?: string; baseUrl?: string }) {
		constructedConfigs.push(config);
	}
}

mock.module("@jverneuer/beds24-sdk-client", () => ({
	Beds24Client: MockBeds24Client as unknown as typeof Beds24Client,
	BookingOps: class {},
	PricingOps: class {},
	AvailabilityOps: class {},
	ChannelsOps: class {},
	WebhooksOps: class {},
	MessageOps: class {},
	InventoryOps: class {},
	PropertyOps: class {},
	AccountOps: class {},
	InvoicingOps: MockInvoicingOps,
	OrganizationOps: class {},
	ChannelActionsOps: MockChannelActionsOps,
	ReviewsOps: class {},
	StripeOps: MockStripeOps,
	getSchema: mock(() => undefined),
	listEndpoints: mock(() => []),
	flattenObject: mock(() => []),
	Beds24Validator: class {
		static create = mock(() => ({ validate: mock(() => ({ valid: true, errors: [] })) }));
	},
}));

process.env.BEDS24_KNOWLEDGE_DIR = KNOWLEDGE_DIR;

const handlers = await import("./server.js");
const { handleInvoiceList, handleChannelAirbnbPush, handleStripeSetup } = handlers;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function textOf(result: { content: { type: string; text?: string }[] }): string {
	const item = result.content[0];
	if (!item || item.type !== "text" || typeof item.text !== "string") {
		throw new Error("expected a text content block");
	}
	return item.text;
}

function resetMocks(): void {
	invoiceList.mockReset();
	channelAirbnbPush.mockReset();
	stripeSetup.mockReset();

	invoiceList.mockResolvedValue(canned);
	channelAirbnbPush.mockResolvedValue(canned);
	stripeSetup.mockResolvedValue(canned);

	constructedConfigs.length = 0;
}

beforeEach(resetMocks);

// ---------------------------------------------------------------------------
// beds24_invoice_list
// ---------------------------------------------------------------------------
describe("handleInvoiceList", () => {
	test("forwards an empty query by default", async () => {
		const result = await handleInvoiceList({ refreshToken: "rk" });
		expect(invoiceList).toHaveBeenCalledWith({});
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("forwards a bookingId filter", async () => {
		const result = await handleInvoiceList({ refreshToken: "rk", query: { bookingId: [1, 2] } });
		expect(invoiceList).toHaveBeenCalledWith({ bookingId: [1, 2] });
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		invoiceList.mockImplementationOnce(async () => {
			throw new Error("inv boom");
		});
		const result = await handleInvoiceList({});
		expect(textOf(result)).toBe("invoice list failed: inv boom");
	});
});

// ---------------------------------------------------------------------------
// beds24_channel_airbnb_push
// ---------------------------------------------------------------------------
describe("handleChannelAirbnbPush", () => {
	test("forwards Airbnb actions to pushToAirbnb", async () => {
		const drafts = [{ action: "connectToExistingRoom", roomId: 5 }];
		const result = await handleChannelAirbnbPush({ refreshToken: "rk", drafts });
		expect(channelAirbnbPush).toHaveBeenCalledWith(drafts);
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		channelAirbnbPush.mockImplementationOnce(async () => {
			throw new Error("airbnb boom");
		});
		const result = await handleChannelAirbnbPush({ drafts: [] });
		expect(textOf(result)).toBe("channel Airbnb push failed: airbnb boom");
	});
});

// ---------------------------------------------------------------------------
// beds24_stripe_setup
// ---------------------------------------------------------------------------
describe("handleStripeSetup", () => {
	test("forwards Stripe actions to setupStripe", async () => {
		const drafts = [{ action: "createCheckoutSession", amount: 1000 }];
		const result = await handleStripeSetup({ refreshToken: "rk", drafts });
		expect(stripeSetup).toHaveBeenCalledWith(drafts);
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		stripeSetup.mockImplementationOnce(async () => {
			throw new Error("stripe boom");
		});
		const result = await handleStripeSetup({ drafts: [] });
		expect(textOf(result)).toBe("stripe setup failed: stripe boom");
	});
});
