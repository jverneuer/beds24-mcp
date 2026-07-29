/**
 * Public surface of the beds24-sdk package.
 *
 * A typed V2 API wrapper: the HTTP client, request validation against the
 * package-owned OpenAPI spec, the domain ops that compose the client, and the
 * schema introspection helpers. There is NO MCP dependency and NO vector index
 * here — the facade, indexer, search, chunking, and embedding live in the
 * server/knowledge packages.
 *
 * ```
 * const client = new Beds24Client({ apiKey, propKey });
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
} from "./client.ts";

export * from "./ops/index.ts";

export {
	Beds24Validator,
	validateRequest,
	type ValidationError,
	type ValidationResult,
} from "./schema/validate.ts";

export {
	getSchema,
	listEndpoints,
	resolveSchema,
	flattenObject,
	__resetSchemaIndex,
	type Field,
	type EndpointSchema,
} from "./schema/schema.ts";
