/**
 * Public surface of the beds24-sdk-client package.
 *
 * A typed V2 API wrapper: the HTTP client, request validation against the
 * package-owned OpenAPI spec, the domain ops that compose the client, and the
 * schema introspection helpers. There is NO MCP dependency and NO vector index
 * here — the facade, indexer, search, chunking, and embedding live in the
 * server/knowledge packages.
 *
 * ```
 * const client = new Beds24Client({ refreshToken });
 * const bookings = new BookingOps(client);
 * ```
 */

export {
	Beds24Client,
	Beds24Error,
	Scopes,
	ErrorCode,
	DEFAULT_BASE_URL,
	type Beds24ClientConfig,
	type Beds24Response,
	type Credits,
	type Scope,
} from "./client.js";

// Generated-type helpers — let callers (and the server facade) derive strict
// request/response types from an endpoint key. See api-types.ts.
export {
	type EndpointKey,
	type OpOf,
	type RequestBodyOf,
	type ResponseBodyOf,
	type paths,
	type components,
} from "./api-types.js";

export * from "./ops/index.js";

export {
	Beds24Validator,
	validateRequest,
	type ValidationError,
	type ValidationResult,
} from "./schema/validate.js";

export {
	getSchema,
	listEndpoints,
	resolveSchema,
	flattenObject,
	__resetSchemaIndex,
	type Field,
	type EndpointSchema,
} from "./schema/schema.js";
