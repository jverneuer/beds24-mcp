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
import type { EndpointKey, OpOf, RequestBodyOf, ResponseBodyOf } from "./api-types.js";
/** Base URL for the Beds24 V2 JSON API. */
export declare const DEFAULT_BASE_URL = "https://www.beds24.com/api/v2";
/** V2 token scopes (from api-v2/auth-and-setup.md). */
export declare const Scopes: {
    readonly Bookings: "bookings";
    readonly Inventory: "inventory";
    readonly Properties: "properties";
    readonly Accounts: "accounts";
    readonly Channels: "channels";
    readonly Webhooks: "webhooks";
};
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
export declare const ErrorCode: {
    readonly NotAllowedForRole: 1009;
    readonly NoWriteAccess: 1010;
    readonly UsageLimitExceeded: 1016;
    readonly UsageLimitExceededAlt: 1020;
    readonly InvalidRequest: 1021;
    readonly Unauthorized: 1022;
};
/** Typed error thrown by the client. */
export declare class Beds24Error extends Error {
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
    });
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
export declare class Beds24Client {
    private inviteCode?;
    private refreshToken?;
    private deviceName?;
    private baseUrl;
    private token;
    private signal?;
    /** In-flight token refresh, shared across concurrent calls. */
    private refreshPromise;
    /** All `METHOD /path` keys the spec knows about. */
    readonly endpoints: string[];
    constructor(config: Beds24ClientConfig);
    /** Fetch (or refresh) the 24h token. Single-flight under concurrency. */
    private getToken;
    private fetchToken;
    /** GET /authentication/setup — exchange an invite code for token + refreshToken. */
    private fetchTokenFromInvite;
    /** GET /authentication/token — mint a 24h token from a refresh token. */
    private fetchTokenFromRefresh;
    /** Invalidate the cached token (e.g. after a 401). */
    private resetToken;
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
    request<E extends EndpointKey>(endpoint: E, body?: RequestBodyOf<OpOf<E>>, opts?: {
        idempotencyKey?: string;
        signal?: AbortSignal;
    }): Promise<Beds24Response<ResponseBodyOf<OpOf<E>>>>;
    /**
     * Serialize params into a query string. Arrays become repeated keys
     * (e.g. `id=1&id=2`) per the V2 convention — see api-v2/bookings.md.
     * Returns "" for undefined/null/non-object params.
     */
    private buildQueryString;
    private doFetch;
    private makeError;
}
//# sourceMappingURL=client.d.ts.map