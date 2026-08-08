/**
 * Unit tests for the T12 operational handlers in server.ts.
 *
 * Per TEST-HARNESS.md (server section): mock beds24-sdk-client, drive the named
 * handler functions DIRECTLY — no MCP transport. Each SDK op is a stub class
 * whose methods are bun:test mocks; handlers build a per-request client via
 * getClient() and forward to the op, so we assert on (a) the op method that was
 * called, (b) the args it received, and (c) the serialized result. Error paths
 * assert the defensive "X failed: ..." message.
 */

import { test, expect, describe, beforeEach, mock } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Beds24Client } from "@jverneuer/beds24-sdk-client";

// ---------------------------------------------------------------------------
// server.ts computes its module-level KNOWLEDGE_DIR from the env var +
// beds24-knowledge's DB_PATH at import time. Bun caches server.ts across test
// files and evaluates KNOWLEDGE_DIR on first import, so the first file to
// import server.js locks it. server-ops.test.ts sorts first alphabetically,
// which means it wins — and if its dir differed from the one server.test.ts
// seeds, T10's facts/status tests would read an empty dir. Use the SAME temp
// dir names as server.test.ts so both files agree on KNOWLEDGE_DIR.
// ---------------------------------------------------------------------------
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
// Mock beds24-sdk-client: every op is a class whose methods are mocks.
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

const bookingGet = mock(async () => canned);
const bookingCreate = mock(async () => canned);
const bookingCancel = mock(async () => canned);
const messageList = mock(async () => canned);
const messageCreate = mock(async () => canned);
const pricingSetDaily = mock(async () => canned);
const pricingGetCalendar = mock(async () => canned);
const pricingSetFixed = mock(async () => canned);
const availabilityGet = mock(async () => canned);
const inventoryGetOffers = mock(async () => canned);
const propertyList = mock(async () => canned);
const accountList = mock(async () => canned);
const channelGet = mock(async () => canned);
const channelConfigure = mock(async () => canned);
const webhookRegister = mock(async () => canned);

const MockBookingOps = makeOps({
	get: bookingGet,
	create: bookingCreate,
	cancel: bookingCancel,
});
const MockMessageOps = makeOps({ list: messageList, create: messageCreate });
const MockPricingOps = makeOps({
	setDailyPrices: pricingSetDaily,
	getCalendar: pricingGetCalendar,
	setFixedPrices: pricingSetFixed,
});
const MockAvailabilityOps = makeOps({ get: availabilityGet });
const MockInventoryOps = makeOps({ getOffers: inventoryGetOffers });
const MockPropertyOps = makeOps({ list: propertyList });
const MockAccountOps = makeOps({ list: accountList });
const MockChannelsOps = makeOps({ get: channelGet, configure: channelConfigure });
const MockWebhooksOps = makeOps({ register: webhookRegister });

const canned = { data: { ok: true }, credits: { remaining: 10, resetsIn: 300 } };

const constructedConfigs: Array<{ refreshToken?: string; inviteCode?: string; token?: string; baseUrl?: string }> = [];
class MockBeds24Client {
	constructor(config: { refreshToken?: string; inviteCode?: string; token?: string; baseUrl?: string }) {
		constructedConfigs.push(config);
	}
}

mock.module("@jverneuer/beds24-sdk-client", () => ({
	Beds24Client: MockBeds24Client as unknown as typeof Beds24Client,
	BookingOps: MockBookingOps,
	PricingOps: MockPricingOps,
	AvailabilityOps: MockAvailabilityOps,
	ChannelsOps: MockChannelsOps,
	WebhooksOps: MockWebhooksOps,
	MessageOps: MockMessageOps,
	InventoryOps: MockInventoryOps,
	PropertyOps: MockPropertyOps,
	AccountOps: MockAccountOps,
	// Unused by these handlers but imported by server.ts — satisfy the binding.
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
// Import the module under test AFTER mocks are registered. Point the knowledge
// root at our shared temp dir so server.js locks in the same KNOWLEDGE_DIR that
// server.test.ts seeds.
// ---------------------------------------------------------------------------
process.env.BEDS24_KNOWLEDGE_DIR = KNOWLEDGE_DIR;

const handlers = await import("./server.js");
const {
	handleBookingGet,
	handleBookingCreate,
	handleBookingCancel,
	handleMessageList,
	handleMessageSend,
	handlePriceSetDaily,
	handlePriceGetCalendar,
	handlePriceSetFixed,
	handleAvailabilityGet,
	handleInventoryOffers,
	handlePropertyList,
	handleAccountList,
	handleChannelSettingsGet,
	handleChannelSettingsConfigure,
	handleWebhookRegister,
} = handlers;

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
	bookingGet.mockReset();
	bookingCreate.mockReset();
	bookingCancel.mockReset();
	messageList.mockReset();
	messageCreate.mockReset();
	pricingSetDaily.mockReset();
	pricingGetCalendar.mockReset();
	pricingSetFixed.mockReset();
	availabilityGet.mockReset();
	inventoryGetOffers.mockReset();
	propertyList.mockReset();
	accountList.mockReset();
	channelGet.mockReset();
	channelConfigure.mockReset();
	webhookRegister.mockReset();

	bookingGet.mockResolvedValue(canned);
	bookingCreate.mockResolvedValue(canned);
	bookingCancel.mockResolvedValue(canned);
	messageList.mockResolvedValue(canned);
	messageCreate.mockResolvedValue(canned);
	pricingSetDaily.mockResolvedValue(canned);
	pricingGetCalendar.mockResolvedValue(canned);
	pricingSetFixed.mockResolvedValue(canned);
	availabilityGet.mockResolvedValue(canned);
	inventoryGetOffers.mockResolvedValue(canned);
	propertyList.mockResolvedValue(canned);
	accountList.mockResolvedValue(canned);
	channelGet.mockResolvedValue(canned);
	channelConfigure.mockResolvedValue(canned);
	webhookRegister.mockResolvedValue(canned);

	constructedConfigs.length = 0;
}

beforeEach(resetMocks);

// ---------------------------------------------------------------------------
// Auth forwarding
// ---------------------------------------------------------------------------
describe("getClient auth forwarding", () => {
	test("passes refreshToken through to the client constructor", async () => {
		await handleBookingGet({ refreshToken: "rk", status: ["confirmed"] });
		expect(constructedConfigs).toEqual([{ refreshToken: "rk" }]);
		expect(bookingGet).toHaveBeenCalledWith({ status: ["confirmed"] });
	});

	test("passes inviteCode through", async () => {
		await handleAccountList({ inviteCode: "inv" });
		expect(constructedConfigs).toEqual([{ inviteCode: "inv" }]);
	});

	test("passes token + baseUrl through", async () => {
		await handlePropertyList({ token: "tk", baseUrl: "https://example.com/v2" });
		expect(constructedConfigs).toEqual([{ token: "tk", baseUrl: "https://example.com/v2" }]);
	});
});

// ---------------------------------------------------------------------------
// beds24_booking_get / create / cancel
// ---------------------------------------------------------------------------
describe("handleBookingGet", () => {
	test("forwards a status-array filter and serializes the response", async () => {
		const result = await handleBookingGet({ refreshToken: "rk", status: ["confirmed", "new"] });
		expect(bookingGet).toHaveBeenCalledTimes(1);
		expect(bookingGet).toHaveBeenCalledWith({ status: ["confirmed", "new"] });
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("supports arrival/departure + pagination", async () => {
		await handleBookingGet({ arrival: "2026-08-01", departure: "2026-08-05", page: 2 });
		expect(bookingGet).toHaveBeenCalledWith({ arrival: "2026-08-01", departure: "2026-08-05", page: 2 });
	});

	test("returns a failed message on error", async () => {
		bookingGet.mockImplementationOnce(async () => {
			throw new Error("boom");
		});
		const result = await handleBookingGet({ refreshToken: "rk" });
		expect(textOf(result)).toBe("booking get failed: boom");
	});
});

describe("handleBookingCreate", () => {
	test("forwards the bookings array to create", async () => {
		const draft = { roomId: 1001, arrival: "2026-08-01", departure: "2026-08-05", firstName: "Ada" };
		const result = await handleBookingCreate({ refreshToken: "rk", bookings: [draft] });
		expect(bookingCreate).toHaveBeenCalledTimes(1);
		expect(bookingCreate).toHaveBeenCalledWith([draft]);
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		bookingCreate.mockImplementationOnce(async () => {
			throw new Error("invalid");
		});
		const result = await handleBookingCreate({ bookings: [] });
		expect(textOf(result)).toBe("booking create failed: invalid");
	});
});

describe("handleBookingCancel", () => {
	test("cancels by id", async () => {
		const result = await handleBookingCancel({ refreshToken: "rk", id: 12345 });
		expect(bookingCancel).toHaveBeenCalledWith(12345);
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		bookingCancel.mockImplementationOnce(async () => {
			throw new Error("not found");
		});
		const result = await handleBookingCancel({ id: 1 });
		expect(textOf(result)).toBe("booking cancel failed: not found");
	});
});

// ---------------------------------------------------------------------------
// beds24_booking_message_list / send
// ---------------------------------------------------------------------------
describe("handleMessageList", () => {
	test("forwards message query filters", async () => {
		const result = await handleMessageList({ refreshToken: "rk", bookingId: [99], filter: "unread" });
		expect(messageList).toHaveBeenCalledWith({ bookingId: [99], filter: "unread" });
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		messageList.mockImplementationOnce(async () => {
			throw new Error("msg boom");
		});
		const result = await handleMessageList({});
		expect(textOf(result)).toBe("message list failed: msg boom");
	});
});

describe("handleMessageSend", () => {
	test("forwards messages to create", async () => {
		const draft = { bookingId: 99, message: "Hello" };
		const result = await handleMessageSend({ refreshToken: "rk", messages: [draft] });
		expect(messageCreate).toHaveBeenCalledWith([draft]);
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		messageCreate.mockImplementationOnce(async () => {
			throw new Error("send fail");
		});
		const result = await handleMessageSend({ messages: [] });
		expect(textOf(result)).toBe("message send failed: send fail");
	});
});

// ---------------------------------------------------------------------------
// beds24_price_set_daily / get_calendar / set_fixed
// ---------------------------------------------------------------------------
describe("handlePriceSetDaily", () => {
	test("forwards daily-price rows", async () => {
		const row = { roomId: 1, calendar: [{ from: "2026-08-01", to: "2026-08-05", multiplier: 1 }] };
		const result = await handlePriceSetDaily({ refreshToken: "rk", rows: [row] });
		expect(pricingSetDaily).toHaveBeenCalledWith([row]);
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		pricingSetDaily.mockImplementationOnce(async () => {
			throw new Error("price boom");
		});
		const result = await handlePriceSetDaily({ rows: [] });
		expect(textOf(result)).toBe("price set daily failed: price boom");
	});
});

describe("handlePriceGetCalendar", () => {
	test("forwards startDate/endDate and include flags", async () => {
		const result = await handlePriceGetCalendar({
			refreshToken: "rk",
			startDate: "2026-08-01",
			endDate: "2026-08-31",
			includePrices: true,
		});
		expect(pricingGetCalendar).toHaveBeenCalledWith({
			startDate: "2026-08-01",
			endDate: "2026-08-31",
			includePrices: true,
		});
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		pricingGetCalendar.mockImplementationOnce(async () => {
			throw new Error("cal boom");
		});
		const result = await handlePriceGetCalendar({ startDate: "2026-08-01", endDate: "2026-08-31" });
		expect(textOf(result)).toBe("price get calendar failed: cal boom");
	});
});

describe("handlePriceSetFixed", () => {
	test("forwards fixed-price rows", async () => {
		const row = { roomId: 1, firstNight: "2026-08-01", lastNight: "2026-08-05" };
		const result = await handlePriceSetFixed({ refreshToken: "rk", rows: [row] });
		expect(pricingSetFixed).toHaveBeenCalledWith([row]);
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		pricingSetFixed.mockImplementationOnce(async () => {
			throw new Error("fixed boom");
		});
		const result = await handlePriceSetFixed({ rows: [] });
		expect(textOf(result)).toBe("price set fixed failed: fixed boom");
	});
});

// ---------------------------------------------------------------------------
// beds24_availability_get
// ---------------------------------------------------------------------------
describe("handleAvailabilityGet", () => {
	test("forwards availability query", async () => {
		const result = await handleAvailabilityGet({ refreshToken: "rk", startDate: "2026-08-01", endDate: "2026-08-05" });
		expect(availabilityGet).toHaveBeenCalledWith({ startDate: "2026-08-01", endDate: "2026-08-05" });
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		availabilityGet.mockImplementationOnce(async () => {
			throw new Error("avail boom");
		});
		const result = await handleAvailabilityGet({});
		expect(textOf(result)).toBe("availability get failed: avail boom");
	});
});

// ---------------------------------------------------------------------------
// beds24_inventory_offers
// ---------------------------------------------------------------------------
describe("handleInventoryOffers", () => {
	test("forwards required arrival/departure/numAdults", async () => {
		const result = await handleInventoryOffers({
			refreshToken: "rk",
			arrival: "2026-08-01",
			departure: "2026-08-05",
			numAdults: 2,
		});
		expect(inventoryGetOffers).toHaveBeenCalledWith({
			arrival: "2026-08-01",
			departure: "2026-08-05",
			numAdults: 2,
		});
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		inventoryGetOffers.mockImplementationOnce(async () => {
			throw new Error("offers boom");
		});
		const result = await handleInventoryOffers({ arrival: "2026-08-01", departure: "2026-08-05", numAdults: 2 });
		expect(textOf(result)).toBe("inventory offers failed: offers boom");
	});
});

// ---------------------------------------------------------------------------
// beds24_property_list / account_list
// ---------------------------------------------------------------------------
describe("handlePropertyList", () => {
	test("forwards property query + include flags", async () => {
		const result = await handlePropertyList({ refreshToken: "rk", id: [1, 2], includeOffers: true });
		expect(propertyList).toHaveBeenCalledWith({ id: [1, 2], includeOffers: true });
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		propertyList.mockImplementationOnce(async () => {
			throw new Error("prop boom");
		});
		const result = await handlePropertyList({});
		expect(textOf(result)).toBe("property list failed: prop boom");
	});
});

describe("handleAccountList", () => {
	test("forwards account query flags", async () => {
		const result = await handleAccountList({ refreshToken: "rk", includeUsage: true });
		expect(accountList).toHaveBeenCalledWith({ includeUsage: true });
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		accountList.mockImplementationOnce(async () => {
			throw new Error("acct boom");
		});
		const result = await handleAccountList({});
		expect(textOf(result)).toBe("account list failed: acct boom");
	});
});

// ---------------------------------------------------------------------------
// beds24_channel_settings_get / configure
// ---------------------------------------------------------------------------
describe("handleChannelSettingsGet", () => {
	test("forwards propertyId (required) query", async () => {
		const result = await handleChannelSettingsGet({ refreshToken: "rk", propertyId: "42" });
		expect(channelGet).toHaveBeenCalledWith({ propertyId: "42" });
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		channelGet.mockImplementationOnce(async () => {
			throw new Error("channel boom");
		});
		const result = await handleChannelSettingsGet({ propertyId: "42" });
		expect(textOf(result)).toBe("channel settings get failed: channel boom");
	});
});

describe("handleChannelSettingsConfigure", () => {
	test("forwards settings to configure", async () => {
		const settings = [{ roomId: 1, channel: "airbnb" }];
		const result = await handleChannelSettingsConfigure({ refreshToken: "rk", settings });
		expect(channelConfigure).toHaveBeenCalledWith(settings);
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		channelConfigure.mockImplementationOnce(async () => {
			throw new Error("configure boom");
		});
		const result = await handleChannelSettingsConfigure({ settings: [] });
		expect(textOf(result)).toBe("channel settings configure failed: configure boom");
	});
});

// ---------------------------------------------------------------------------
// beds24_webhook_register
// ---------------------------------------------------------------------------
describe("handleWebhookRegister", () => {
	test("forwards the webhook payload", async () => {
		const payload = { timeStamp: "2026-08-01T00:00:00Z", booking: { id: 5 } };
		const result = await handleWebhookRegister({ refreshToken: "rk", payload });
		expect(webhookRegister).toHaveBeenCalledWith(payload);
		expect(JSON.parse(textOf(result))).toEqual(canned);
	});

	test("returns a failed message on error", async () => {
		webhookRegister.mockImplementationOnce(async () => {
			throw new Error("hook boom");
		});
		const result = await handleWebhookRegister({ payload: {} });
		expect(textOf(result)).toBe("webhook register failed: hook boom");
	});
});
