/**
 * Low-level Beds24 API client — HTTP + auth.
 *
 * Dependency-free: uses global `fetch` (Node 18+). Every V2 endpoint documented
 * in apiV2.yaml is reachable via `client.request("METHOD /path", body)`; request
 * bodies are validated client-side against the same schemas the local validator
 * uses (fail fast, save a credit).
 *
 * Auth: pass apiKey + propKey. The client lazily fetches a 24h token from
 * `/authentication/token` and sends it as a `token:` header. On a 401 it
 * refreshes once (single-flight — concurrent calls share one refresh promise).
 */

import { getSchema, listEndpoints } from "./schema.ts";
import { validateRequest } from "./validate.ts";
import { defaultSpecDir } from "./paths.ts";

/** Base URL for the Beds24 JSON API. */
export const DEFAULT_BASE_URL = "https://www.beds24.com/api";

/** V2 token scopes (from api-v2/auth-and-setup.md). */
export const Scopes = {
	Bookings: "bookings",
	Inventory: "inventory",
	Properties: "properties",
	Accounts: "accounts",
	Channels: "channels",
	Webhooks: "webhooks",
} as const;
export type Scope = (typeof Scopes)[keyof typeof Scopes];

/** Credit-limit state, read from response headers (api-v2/auth-and-setup.md). */
export interface Credits {
	/** Credits left in the current 5-minute window. */
	remaining: number | null;
	/** Seconds until the window resets. */
	resetsIn: number | null;
}

/** A successful API response, with credit state attached. */
export interface Beds24Response<T = unknown> {
	data: T;
	credits: Credits;
}

/** Error codes documented in api-basics/error-codes.md. */
export const ErrorCode = {
	NotAllowedForRole: 1009,
	NoWriteAccess: 1010,
	UsageLimitExceeded: 1016,
	UsageLimitExceededAlt: 1020,
	InvalidRequest: 1021,
	Unauthorized: 1022,
} as const;

/** Typed error thrown by the client. */
export class Beds24Error extends Error {
	/** HTTP status (0 if the request never reached the server). */
	readonly status: number;
	/** Beds24 numeric error code, when the response carries one. */
	readonly code: number | null;
	/** Whether the call is safe to retry (5xx, usage-limit, or network). */
	readonly retryable: boolean;
	/** Credit state at the time of the error (null if unavailable). */
	readonly creditsRemaining: number | null;

	constructor(opts: {
		message: string;
		status: number;
		code?: number | null;
		retryable?: boolean;
		creditsRemaining?: number | null;
	}) {
		super(opts.message);
		this.name = "Beds24Error";
		this.status = opts.status;
		this.code = opts.code ?? null;
		this.retryable = opts.retryable ?? false;
		this.creditsRemaining = opts.creditsRemaining ?? null;
	}
}

/** Configuration for the API client. */
export interface Beds24ClientConfig {
	/** Account API key (from Account Settings). */
	apiKey: string;
	/** Property key (from Property Settings). */
	propKey: string;
	/** Reuse an existing token instead of fetching one. */
	token?: string;
	/** API base URL. Defaults to https://www.beds24.com/api. */
	baseUrl?: string;
	/** Per-call cancellation signal. */
	signal?: AbortSignal;
}

/** A parsed endpoint key: `GET /bookings` → { method, path }. */
interface Endpoint {
	method: string;
	path: string;
}

/** Parse `"GET /bookings"` into `{ method: "GET", path: "/bookings" }`. */
function parseEndpoint(key: string): Endpoint {
	const idx = key.indexOf(" ");
	return { method: key.slice(0, idx), path: key.slice(idx + 1) };
}

/**
 * Resolve the spec dir for client-side request validation.
 *
 * The SDK owns its spec (`apiV2.yaml` in the sdk package root); the default is
 * provided by `defaultSpecDir()` (which honors BEDS24_SPEC_DIR).
 */
function resolveSpecDir(): string {
	return defaultSpecDir();
}

export class Beds24Client {
	private apiKey: string;
	private propKey: string;
	private baseUrl: string;
	private token: string | null;
	private signal?: AbortSignal;

	/** In-flight token refresh, shared across concurrent calls. */
	private refreshPromise: Promise<string> | null = null;

	/** All `METHOD /path` keys the spec knows about. */
	readonly endpoints: string[];

	constructor(config: Beds24ClientConfig) {
		this.apiKey = config.apiKey;
		this.propKey = config.propKey;
		this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
		this.token = config.token ?? null;
		this.signal = config.signal;
		this.endpoints = listEndpoints(resolveSpecDir());
	}

	/** Fetch (or refresh) the 24h token. Single-flight under concurrency. */
	private async getToken(): Promise<string> {
		if (this.token) return this.token;
		if (!this.refreshPromise) {
			this.refreshPromise = this.fetchToken().finally(() => {
				this.refreshPromise = null;
			});
		}
		return this.refreshPromise;
	}

	private async fetchToken(): Promise<string> {
		const url = `${this.baseUrl}/json/getAuthenticationToken?apiKey=${encodeURIComponent(
			this.apiKey,
		)}&propKey=${encodeURIComponent(this.propKey)}`;
		const res = await fetch(url, { signal: this.signal });
		const body = (await res.json()) as { token?: string };
		if (!res.ok || !body.token) {
			throw new Beds24Error({
				message: `auth failed: ${res.status}`,
				status: res.status,
				retryable: res.status >= 500,
			});
		}
		this.token = body.token;
		return body.token;
	}

	/** Invalidate the cached token (e.g. after a 401). */
	private resetToken(): void {
		this.token = null;
	}

	/**
	 * Call a documented endpoint by its `METHOD /path` key (e.g. `GET /bookings`).
	 * When `body` is given it is validated against the request schema first and
	 * JSON-encoded. `opts.idempotencyKey` attaches an `Idempotency-Key` header.
	 */
	async request<T = unknown>(
		endpoint: string,
		body?: unknown,
		opts?: { idempotencyKey?: string; signal?: AbortSignal },
	): Promise<Beds24Response<T>> {
		const ep = parseEndpoint(endpoint);

		// Only validate when this endpoint has a request schema. GET endpoints
		// take query params, not a body, so there is nothing to validate.
		if (body !== undefined) {
			const schema = getSchema(endpoint, "request", resolveSpecDir());
			if (schema && typeof schema === "object") {
				const check = validateRequest(endpoint, "request", body, resolveSpecDir());
				if (!check.valid) {
					throw new Beds24Error({
						message: `request invalid: ${check.errors[0]?.message ?? "validation failed"}`,
						status: 0,
						retryable: false,
					});
				}
			}
		}

		const token = await this.getToken();
		try {
			return await this.doFetch<T>(token, ep, body, opts);
		} catch (e) {
			if (e instanceof Beds24Error && e.status === 401) {
				this.resetToken();
				const fresh = await this.getToken();
				return await this.doFetch<T>(fresh, ep, body, opts);
			}
			throw e;
		}
	}

	private async doFetch<T>(
		token: string,
		ep: Endpoint,
		body: unknown,
		opts?: { idempotencyKey?: string; signal?: AbortSignal },
	): Promise<Beds24Response<T>> {
		const url = `${this.baseUrl}${ep.path}`;
		const headers: Record<string, string> = { token };
		if (opts?.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

		let res: Response;
		try {
			const init: RequestInit = { method: ep.method, headers, signal: opts?.signal ?? this.signal };
			if (body !== undefined) {
				headers["Content-Type"] = "application/json";
				init.body = JSON.stringify(body);
			}
			res = await fetch(url, init);
		} catch (e) {
			throw new Beds24Error({
				message: `network error: ${(e as Error).message}`,
				status: 0,
				retryable: true,
			});
		}

		const credits = parseCredits(res);

		let data: unknown;
		const text = await res.text();
		if (text) {
			try {
				data = JSON.parse(text);
			} catch {
				data = text;
			}
		}

		if (!res.ok) {
			throw this.makeError(res.status, data, credits);
		}

		return { data: data as T, credits };
	}

	private makeError(status: number, body: unknown, credits: Credits): Beds24Error {
		const code =
			body && typeof body === "object" && "code" in body
				? ((body as { code: number }).code ?? null)
				: null;
		const message =
			body && typeof body === "object" && "message" in body
				? String((body as { message: unknown }).message)
				: `request failed: ${status}`;
		const retryable = status >= 500 || code === ErrorCode.UsageLimitExceeded;
		return new Beds24Error({ message, status, code, retryable, creditsRemaining: credits.remaining });
	}
}

/** Read credit-limit headers from a response (api-v2/auth-and-setup.md). */
function parseCredits(res: Response): Credits {
	const remaining = res.headers.get("x-five-min-limit-remaining");
	const resetsIn = res.headers.get("x-five-min-limit-resets-in");
	return {
		remaining: remaining ? Number(remaining) : null,
		resetsIn: resetsIn ? Number(resetsIn) : null,
	};
}
