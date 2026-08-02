/**
 * Generated-type helpers — the single place that derives request/response
 * shapes for `client.request(...)` from the OpenAPI spec.
 *
 * Everything in the SDK's public surface is typed against the generated
 * `paths` / `components` (see src/generated/types.d.ts). These helpers turn the
 * `paths` map into per-endpoint body/response types so `request()` is fully
 * inferred: calling `request("POST /bookings", [...])` knows its body is the
 * newBooking array and its response the multiplePostResponse array — no casts.
 *
 * The `EndpointKey` union is built from `paths`, so a new endpoint added to
 * apiV2.yaml flows through automatically and can never drift out of sync.
 */

import type { paths, components } from "./generated/types.d.ts";

export type { paths, components };

/**
 * HTTP methods as they appear (lowercase) on each `paths[P]` item. The spec
 * also declares `options` / `head` / `trace` as `?: never` on every path, so
 * they are listed only so the `EndpointKey` filter can exclude them.
 */
type HttpMethod = "get" | "post" | "put" | "delete" | "patch" | "options" | "head" | "trace";

/**
 * The exhaustive union of valid `"METHOD /path"` keys the spec defines — the
 * exact callable surface of `request()`. Built by mapping each path to its real
 * methods, filtering out:
 *   - the path-level `parameters` key (not a method), and
 *   - methods declared `?: never` (reserved in the spec but not implemented).
 *
 * The Webhooks path (`"Webhooks - bookings"`) is included verbatim, so its key
 * is `"POST Webhooks - bookings"` — the split in `OpOf` is on the FIRST space
 * only, which correctly keeps the path intact.
 */
export type EndpointKey = {
	[P in keyof paths]: keyof paths[P] & string extends infer M
		? M extends HttpMethod
			? paths[P][M] extends never
				? never
				: `${Uppercase<M>} ${P & string}`
			: never
		: never;
}[keyof paths];

/** The operation object (parameters + requestBody + responses) for an endpoint key. */
export type OpOf<E extends EndpointKey> = E extends `${infer M} ${infer P}`
	? P extends keyof paths
		? Lowercase<M> extends keyof paths[P]
			? paths[P][Lowercase<M>]
			: never
		: never
	: never;

/**
 * The type a caller passes as `body` for a single `request()` call:
 *   - POST/PUT/PATCH → the JSON request body (e.g. the newBooking array).
 *   - GET/DELETE     → the query-params object.
 *   - an endpoint with neither → `undefined` (nothing to pass).
 *
 * The generated types declare both `requestBody` and `query` as OPTIONAL
 * (`requestBody?:`, `query?:`), so the constraints match optional props. That
 * makes a GET — whose `requestBody?:never` infers `B = never` — fall through to
 * the query branch, while an endpoint with no query infers `Q = never` and
 * resolves to `undefined`. The `[X] extends [never]` guards are what turn the
 * optional-prop inference into the right dispatch.
 */
export type RequestBodyOf<Op> = [Op] extends [never]
	? undefined
	: Op extends { requestBody?: { content: { "application/json": infer B } } }
		? [B] extends [never]
			? Op extends { parameters?: { query?: infer Q } }
				? [Q] extends [never]
					? undefined
					: Q
				: undefined
			: B
		: undefined;

/**
 * The decoded response `data` type. Prefers the 200 representation, falls back
 * to 201 (the success code the spec uses for POST writes), else `unknown`.
 */
export type ResponseBodyOf<Op> = Op extends {
	responses: { 200: { content: { "application/json": infer D } } };
}
	? D
	: Op extends { responses: { 201: { content: { "application/json": infer D } } } }
		? D
		: unknown;
