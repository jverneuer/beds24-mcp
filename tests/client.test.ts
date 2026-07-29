/**
 * Beds24Client tests — mocks global fetch to exercise the auth lifecycle,
 * error mapping, credit headers, and request validation without a network.
 */

import { test, expect, describe, beforeEach } from "bun:test";
import { Beds24Client, Beds24Error, ErrorCode, DEFAULT_BASE_URL } from "../src/sdk/client.ts";

/** Install a controllable mock of global.fetch. */
let mockFetch: ReturnType<typeof createMockFetch>;
interface FetchCall {
	url: string;
	init: RequestInit | undefined;
}

function createMockFetch() {
	let responses: Response[] = [];
	let calls: FetchCall[] = [];
	const fn = async (url: string, init?: RequestInit): Promise<Response> => {
		calls.push({ url, init });
		const next = responses.shift();
		if (!next) throw new Error("unexpected fetch: " + url);
		return next;
	};
	return {
		fn: fn as typeof fetch,
		set: (r: Response[]) => {
			responses = r;
			calls = [];
		},
		calls: () => calls.slice(),
	};
}

beforeEach(() => {
	mockFetch = createMockFetch();
	globalThis.fetch = mockFetch.fn;
	process.env.BEDS24_FACTS_DIR = "knowledge";
});

function jsonResponse(body: unknown, init?: ResponseInit): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
		...init,
	});
}

describe("Beds24Client auth", () => {
	test("fetches a token lazily and sends it as a header", async () => {
		mockFetch.set([
			jsonResponse({ token: "tok-123" }),
			jsonResponse({ bookings: [] }, { headers: { "x-five-min-limit-remaining": "99", "x-five-min-limit-resets-in": "299" } }),
		]);
		const client = new Beds24Client({ apiKey: "ak", propKey: "pk" });
		const res = await client.request("GET /bookings", { arrival: "2026-08-01" });

		expect(mockFetch.calls()).toHaveLength(2);
		expect(mockFetch.calls()[0]!.url).toContain("/json/getAuthenticationToken");
		expect(mockFetch.calls()[0]!.url).toContain("apiKey=ak");
		const reqHeaders = mockFetch.calls()[1]!.init?.headers as Record<string, string>;
		expect(reqHeaders.token).toBe("tok-123");
		expect(res.credits.remaining).toBe(99);
		expect(res.credits.resetsIn).toBe(299);
	});

	test("refreshes token once on 401 (single-flight)", async () => {
		mockFetch.set([
			jsonResponse({ token: "old" }),
			new Response("unauthorized", { status: 401 }),
			jsonResponse({ token: "new" }),
			jsonResponse({ bookings: [] }),
		]);
		const client = new Beds24Client({ apiKey: "ak", propKey: "pk" });
		const res = await client.request("GET /bookings");
		expect(res.data).toEqual({ bookings: [] });
		// auth(failed) + request(401) + re-auth + request(retry success)
		expect(mockFetch.calls()).toHaveLength(4);
		const paths = mockFetch.calls().map((c) => c.url);
		expect(paths[0]).toContain("getAuthenticationToken");
		expect(paths[2]).toContain("getAuthenticationToken");
	});

	test("reuses a provided token without fetching", async () => {
		mockFetch.set([jsonResponse({ bookings: [] })]);
		const client = new Beds24Client({ apiKey: "ak", propKey: "pk", token: "given" });
		await client.request("GET /bookings");
		expect(mockFetch.calls()).toHaveLength(1);
		const headers = mockFetch.calls()[0]!.init?.headers as Record<string, string>;
		expect(headers.token).toBe("given");
	});
});

describe("Beds24Client errors", () => {
	test("maps HTTP + Beds24 error codes to Beds24Error", async () => {
		mockFetch.set([
			jsonResponse({ token: "t" }),
			new Response(JSON.stringify({ code: 1016, message: "rate limit" }), { status: 429 }),
		]);
		const client = new Beds24Client({ apiKey: "ak", propKey: "pk" });
		let caught: Beds24Error | undefined;
		try {
			await client.request("GET /bookings");
		} catch (e) {
			caught = e as Beds24Error;
		}
		expect(caught).toBeInstanceOf(Beds24Error);
		expect(caught!.status).toBe(429);
		expect(caught!.code).toBe(ErrorCode.UsageLimitExceeded);
		expect(caught!.retryable).toBe(true);
	});

	test("network errors are retryable with status 0", async () => {
		const fn = (() => {
			throw new Error("conn refused");
		}) as unknown as typeof fetch;
		globalThis.fetch = fn;
		const client = new Beds24Client({ apiKey: "ak", propKey: "pk", token: "t" });
		let caught: Beds24Error | undefined;
		try {
			await client.request("GET /bookings");
		} catch (e) {
			caught = e as Beds24Error;
		}
		expect(caught!.status).toBe(0);
		expect(caught!.retryable).toBe(true);
	});
});

describe("Beds24Client request validation", () => {
	test("rejects an invalid request body before any fetch (never hits the wire)", async () => {
		const client = new Beds24Client({ apiKey: "ak", propKey: "pk", token: "t" });
		let caught: Beds24Error | undefined;
		try {
			// POST /bookings requires an array; a bare string is invalid.
			await client.request("POST /bookings", "not-an-array" as unknown);
		} catch (e) {
			caught = e as Beds24Error;
		}
		expect(caught).toBeInstanceOf(Beds24Error);
		expect(caught!.status).toBe(0);
		expect(caught!.retryable).toBe(false);
		// validation runs before getToken — no fetch at all
		expect(mockFetch.calls()).toHaveLength(0);
	});
});
