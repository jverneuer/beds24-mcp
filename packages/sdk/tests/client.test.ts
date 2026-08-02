/**
 * Beds24Client tests — mocks global fetch to exercise the V2 auth lifecycle,
 * error mapping, credit headers, query-string params, and request validation
 * without a network.
 */

import { test, expect, describe, beforeEach } from "bun:test";
import { Beds24Client, Beds24Error, ErrorCode } from "../src/client.ts";

/** Install a controllable mock of global.fetch. */
let mockFetch: ReturnType<typeof createMockFetch>;
interface FetchCall {
	url: string;
	init: RequestInit | undefined;
}

function createMockFetch() {
	let responses: Response[] = [];
	let calls: FetchCall[] = [];
	const fn = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		// openapi-fetch sends a `Request` object (headers live on it); the raw
		// token fetch sends `(url, init)`. Normalize both to { url, init }.
		let url: string;
		let headers: HeadersInit | undefined;
		if (input instanceof Request) {
			url = input.url;
			headers = Object.fromEntries(input.headers.entries());
		} else {
			url = typeof input === "string" ? input : input.toString();
			headers = init?.headers;
		}
		calls.push({ url, init: init ?? { headers } });
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
});

function jsonResponse(body: unknown, init?: ResponseInit): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
		...init,
	});
}

describe("Beds24Client auth", () => {
	test("mints a token lazily from a refreshToken and sends it as a header", async () => {
		mockFetch.set([
			jsonResponse({ token: "tok-123" }),
			jsonResponse({ bookings: [] }, { headers: { "x-five-min-limit-remaining": "99", "x-five-min-limit-resets-in": "299" } }),
		]);
		const client = new Beds24Client({ refreshToken: "rt" });
		const res = await client.request("GET /bookings", { arrival: "2026-08-01" });

		expect(mockFetch.calls()).toHaveLength(2);
		// auth fetch hits /authentication/token with the refreshToken header
		expect(mockFetch.calls()[0]!.url).toContain("/authentication/token");
		const authHeaders = mockFetch.calls()[0]!.init?.headers as Record<string, string>;
		expect(authHeaders.refreshToken).toBe("rt");
		// real request carries the minted token + serializes params to query string
		expect(mockFetch.calls()[1]!.url).toContain("/bookings?arrival=2026-08-01");
		const reqHeaders = mockFetch.calls()[1]!.init?.headers as Record<string, string>;
		expect(reqHeaders.token).toBe("tok-123");
		expect(res.credits.remaining).toBe(99);
		expect(res.credits.resetsIn).toBe(299);
	});

	test("bootstraps from an invite code, then mints from the returned refreshToken", async () => {
		mockFetch.set([
			// /authentication/setup → token + refreshToken
			jsonResponse({ token: "tok-invite", refreshToken: "rt-invite" }),
			// 401 on first request → client should refresh via /authentication/token
			new Response("unauthorized", { status: 401 }),
			// /authentication/token → fresh token
			jsonResponse({ token: "tok-refreshed" }),
			jsonResponse({ bookings: [] }),
		]);
		const client = new Beds24Client({ inviteCode: "INVITE" });
		const res = await client.request("GET /bookings");
		expect(res.data).toEqual({ bookings: [] });
		const urls = mockFetch.calls().map((c) => c.url);
		expect(urls[0]).toContain("/authentication/setup");
		expect(urls[2]).toContain("/authentication/token");
		expect(mockFetch.calls()).toHaveLength(4);
	});

	test("refreshes token once on 401 (single-flight)", async () => {
		mockFetch.set([
			jsonResponse({ token: "old" }),
			new Response("unauthorized", { status: 401 }),
			jsonResponse({ token: "new" }),
			jsonResponse({ bookings: [] }),
		]);
		const client = new Beds24Client({ refreshToken: "rt" });
		const res = await client.request("GET /bookings");
		expect(res.data).toEqual({ bookings: [] });
		// auth + request(401) + re-auth + request(retry success)
		expect(mockFetch.calls()).toHaveLength(4);
		const paths = mockFetch.calls().map((c) => c.url);
		expect(paths[0]).toContain("/authentication/token");
		expect(paths[2]).toContain("/authentication/token");
	});

	test("reuses a provided token without fetching", async () => {
		mockFetch.set([jsonResponse({ bookings: [] })]);
		const client = new Beds24Client({ token: "given" });
		await client.request("GET /bookings");
		expect(mockFetch.calls()).toHaveLength(1);
		const headers = mockFetch.calls()[0]!.init?.headers as Record<string, string>;
		expect(headers.token).toBe("given");
	});
});

describe("Beds24Client errors", () => {
	test("maps HTTP + Beds24 error codes to Beds24Error", async () => {
		mockFetch.set([
			new Response(JSON.stringify({ code: 1016, message: "rate limit" }), { status: 429 }),
		]);
		const client = new Beds24Client({ token: "t" });
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
		const client = new Beds24Client({ token: "t" });
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
		const client = new Beds24Client({ token: "t" });
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
