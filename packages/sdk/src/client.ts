/**
 * Low-level Beds24 V2 API client — HTTP + auth.
 *
 * Dependency-free: uses global `fetch` (Node 18+). Every V2 endpoint documented
 * in apiV2.yaml is reachable via `client.request("METHOD /path", params)`; POST
 * bodies are validated client-side against the same schemas the local validator
 * uses (fail fast, save a credit).
 *
 * Auth is the V2 model only (the legacy apiKey/propKey flow is intentionally
 * NOT supported here — it lives outside /api/v2). Pass ONE of:
 *   - `inviteCode`  → exchanged once for a token + refreshToken (`/authentication/setup`)
 *   - `refreshToken`→ mints a 24h token (`/authentication/token`)
 *   - `token`       → used directly, no minting
 * The token is sent as a `token:` header. On a 401 it refreshes once via the
 * refreshToken (single-flight — concurrent calls share one refresh promise).
 *
 * Params/serialization:
 *   - GET/DELETE serialize `body` into the query string (arrays become repeated
 *     keys, e.g. `?id=1&id=2`), with no JSON body — the spec gives every
 *     GET/DELETE only `in: query` params and no requestBody.
 *   - POST/PUT/PATCH send a JSON body.
 */

import { getSchema, listEndpoints } from "./schema/schema.ts";
import { validateRequest } from "./schema/validate.ts";
import { defaultSpecDir } from "./paths.ts";
import type { EndpointKey, OpOf, RequestBodyOf, ResponseBodyOf } from "./api-types.ts";

/** Base URL for the Beds24 V2 JSON API. */
export const DEFAULT_BASE_URL = "https://www.beds24.com/api/v2";

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

/** Configuration for the API client (V2 auth model). */
export interface Beds24ClientConfig {
	/**
	 * Invite code (from Settings > Marketplace > API). Exchanged ONCE for a
	 * token + refreshToken via `/authentication/setup`; after that the client
	 * uses the refreshToken to mint fresh 24h tokens.
	 */
	inviteCode?: string;
	/**
	 * Long-lived refresh token. Used to mint a 24h token via
	 * `/authentication/token`. Prefer this for non-interactive use.
	 */
	refreshToken?: string;
	/** Use an existing token directly instead of minting one. */
	token?: string;
	/** Optional device name sent to `/authentication/setup`. */
	deviceName?: string;
	/** API base URL. Defaults to https://www.beds24.com/api/v2. */
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
	private inviteCode?: string;
	private refreshToken?: string;
	private deviceName?: string;
	private baseUrl: string;
	private token: string | null;
	private signal?: AbortSignal;

	/** In-flight token refresh, shared across concurrent calls. */
	private refreshPromise: Promise<string> | null = null;

	/** All `METHOD /path` keys the spec knows about. */
	readonly endpoints: string[];

	constructor(config: Beds24ClientConfig) {
		this.inviteCode = config.inviteCode;
		this.refreshToken = config.refreshToken;
		this.deviceName = config.deviceName;
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
		// Invite codes are single-time-use: exchange once, then live off the
		// refreshToken it returns. See api-v2/auth-and-setup.md.
		if (this.inviteCode) return this.fetchTokenFromInvite();
		if (this.refreshToken) return this.fetchTokenFromRefresh();
		throw new Beds24Error({
			message: "auth failed: pass inviteCode, refreshToken, or token",
			status: 0,
			retryable: false,
		});
	}

	/** GET /authentication/setup — exchange an invite code for token + refreshToken. */
	private async fetchTokenFromInvite(): Promise<string> {
		const headers: Record<string, string> = {
			code: this.inviteCode!,
			accept: "application/json",
		};
		if (this.deviceName) headers.deviceName = this.deviceName;
		const res = await fetch(`${this.baseUrl}/authentication/setup`, {
			method: "GET",
			headers,
			signal: this.signal,
		});
		const body = (await res.json()) as { token?: string; refreshToken?: string };
		if (!res.ok || !body.token) {
			throw new Beds24Error({
				message: `auth setup failed: ${res.status}`,
				status: res.status,
				retryable: res.status >= 500,
			});
		}
		// Persist the refreshToken for future minting; invite codes are one-shot.
		if (body.refreshToken) this.refreshToken = body.refreshToken;
		this.inviteCode = undefined;
		this.token = body.token;
		return body.token;
	}

	/** GET /authentication/token — mint a 24h token from a refresh token. */
	private async fetchTokenFromRefresh(): Promise<string> {
		const res = await fetch(`${this.baseUrl}/authentication/token`, {
			method: "GET",
			headers: { refreshToken: this.refreshToken!, accept: "application/json" },
			signal: this.signal,
		});
		const body = (await res.json()) as { token?: string };
		if (!res.ok || !body.token) {
			throw new Beds24Error({
				message: `token refresh failed: ${res.status}`,
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
	 * For GET/DELETE, `body` is serialized into the query string; for
	 * POST/PUT/PATCH it is validated against the request schema first, then
	 * sent as a JSON body. `opts.idempotencyKey` attaches an `Idempotency-Key`
	 * header.
	 *
	 * `E` is constrained to the `EndpointKey` union (every `METHOD /path` the
	 * spec defines), so the body and response types are inferred from the
	 * generated `paths`: a GET infers its query params, a POST infers its JSON
	 * request body, and the decoded `data` type comes from the 200/201 response.
	 */
	async request<E extends EndpointKey>(
		endpoint: E,
		body?: RequestBodyOf<OpOf<E>>,
		opts?: { idempotencyKey?: string; signal?: AbortSignal },
	): Promise<Beds24Response<ResponseBodyOf<OpOf<E>>>> {
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
			return await this.doFetch<ResponseBodyOf<OpOf<E>>>(token, ep, body, opts);
		} catch (e) {
			if (e instanceof Beds24Error && e.status === 401) {
				this.resetToken();
				const fresh = await this.getToken();
				return await this.doFetch<ResponseBodyOf<OpOf<E>>>(fresh, ep, body, opts);
			}
			throw e;
		}
	}

	/**
	 * Serialize params into a query string. Arrays become repeated keys
	 * (e.g. `id=1&id=2`) per the V2 convention — see api-v2/bookings.md.
	 * Returns "" for undefined/null/non-object params.
	 */
	private buildQueryString(params: unknown): string {
		if (!params || typeof params !== "object") return "";
		const sp = new URLSearchParams();
		for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
			if (value === undefined || value === null) continue;
			if (Array.isArray(value)) {
				for (const v of value) {
					if (v !== undefined && v !== null) sp.append(key, String(v));
				}
			} else {
				sp.append(key, String(value));
			}
		}
		return sp.toString();
	}

	private async doFetch<T>(
		token: string,
		ep: Endpoint,
		body: unknown,
		opts?: { idempotencyKey?: string; signal?: AbortSignal },
	): Promise<Beds24Response<T>> {
		const headers: Record<string, string> = { token, accept: "application/json" };
		if (opts?.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

		// GET/DELETE carry params in the query string (never a JSON body); the
		// spec gives them only `in: query` params and no requestBody.
		const isQueryMethod = ep.method === "GET" || ep.method === "DELETE";
		let url = `${this.baseUrl}${ep.path}`;
		if (isQueryMethod) {
			const qs = this.buildQueryString(body);
			if (qs) url += `?${qs}`;
		}

		let res: Response;
		try {
			const init: RequestInit = { method: ep.method, headers, signal: opts?.signal ?? this.signal };
			if (body !== undefined && !isQueryMethod) {
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
