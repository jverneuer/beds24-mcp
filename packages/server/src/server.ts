/**
 * MCP server for the Beds24 API — a thin wrapper over the beds24-knowledge and
 * beds24-sdk-client workspace packages.
 *
 * All reusable logic lives in those packages (zero MCP dependency): search and
 * indexing in beds24-knowledge, schema/validation in beds24-sdk-client. This file only
 * registers MCP tools/resources and forwards calls. The MCP SDK is the only
 * non-dev dependency here, which is what keeps the packages portable.
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, GetPromptResult } from "@modelcontextprotocol/sdk/types.js";
// The SDK defines this as `Record<string, string | string[]>` in its
// uriTemplate module but does not re-export it; mirror it here so our
// resource-read handler signature matches ReadResourceTemplateCallback.
type Variables = Record<string, string | string[]>;
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";

import {
	search,
	searchAll,
	searchInBucket,
	buildIndex,
	getDb,
	dbExists,
	countChunks,
	bucketCounts,
	DB_PATH,
} from "beds24-knowledge";
import type { Bucket } from "beds24-knowledge";

import {
	getSchema,
	listEndpoints,
	flattenObject,
	Beds24Validator,
	Beds24Client,
	BookingOps,
	PricingOps,
	AvailabilityOps,
	ChannelsOps,
	WebhooksOps,
	MessageOps,
	InventoryOps,
	PropertyOps,
	AccountOps,
	InvoicingOps,
	ChannelActionsOps,
	StripeOps,
} from "beds24-sdk-client";
import type { Field } from "beds24-sdk-client";
import type { Beds24Response, BookingCreate, CalendarWrite, FixedPriceWrite, MessageWrite, ChannelSettings, WebhookPayload, InvoiceQuery, AirbnbAction, StripeAction } from "beds24-sdk-client";

/**
 * Knowledge corpus root. The package does not currently export its path helper,
 * so derive it from the exported DB_PATH (`<root>/.beds24/index.db`) and allow an
 * override. The `.beds24` dir is the grandparent of the corpus `knowledge/` dir.
 */
const KNOWLEDGE_DIR = process.env.BEDS24_KNOWLEDGE_DIR ?? join(dirname(dirname(DB_PATH)), "knowledge");

// Shared return shape for every tool handler. The SDK's CallToolResult type is
// structurally compatible with this shape, but the exported handler functions
// declare Promise<CallToolResult> so the registerTool() calls type-check.
type ToolResult = CallToolResult;

/**
 * Server-level instructions surfaced to every connected LLM at initialize time.
 * They encode the search → inspect → validate → operate workflow so the model
 * uses the cheaper inspect/validate tools before spending API credits.
 */
export const SERVER_INSTRUCTIONS = [
	"Follow this workflow when the user wants to DO something on Beds24:",
	"1. SEARCH FIRST — use beds24_search (safe buckets) or beds24_howto for how-to knowledge. Hits include cited facts and a docUrl.",
	"2. INSPECT NEXT — use beds24_schema with the exact 'METHOD /path' (e.g. 'POST /bookings') for the request/response shape.",
	"3. VALIDATE BEFORE SENDING — use beds24_validate on draft payloads to catch errors before they cost credits. Errors are LLM-actionable.",
	"4. THEN OPERATE — call the relevant write tool (beds24_booking_create, beds24_price_set_daily, beds24_webhook_register, ...). Validate large payloads first.",
	"5. AUTH — every operational tool takes an 'auth' block: provide ONE of refreshToken (preferred), inviteCode, or token. Bookings are CANCELLED (beds24_booking_cancel), never deleted.",
].join("\n");

export const server = new McpServer(
	{
		name: "beds24",
		version: "0.1.0",
		description:
			"Semantic search over Beds24 docs (safe / all / per-bucket) + YAML schema validation for the V2 API.",
	},
	{ instructions: SERVER_INSTRUCTIONS },
);

// ---------------------------------------------------------------------------
// Tools — handlers are extracted as named exported functions so they can be
// unit-tested directly (no MCP transport needed). Each registerTool call below
// forwards to its matching handler; behavior is identical to the prior inline
// closures.
// ---------------------------------------------------------------------------

export async function handleSearch({
	query,
	topK,
}: {
	query: string;
	topK?: number;
}): Promise<ToolResult> {
	try {
		const hits = await search(query, topK ?? 5);
		return { content: [{ type: "text" as const, text: JSON.stringify(hits, null, 2) }] };
	} catch (e) {
		return { content: [{ type: "text" as const, text: `search failed: ${(e as Error).message}` }] };
	}
}

server.registerTool(
	"beds24_search",
	{
		title: "Search Beds24 docs (safe)",
		description:
			"Semantic search over the cited Beds24 knowledge base — current apiv2 + general docs only. " +
			"Returns the most relevant sections with source file, heading path, line range, bucket, RRF score, and a docUrl. " +
			"Each hit includes a docUrl linking to the public documentation — offer to open it when a hit looks relevant.",
		inputSchema: {
			query: z
				.string()
				.describe("Natural-language question, e.g. 'how does pricing propagate to channels?'"),
			topK: z
				.number()
				.int()
				.min(1)
				.max(20)
				.optional()
				.describe("Number of sections to return (default 5)"),
		},
	},
	handleSearch,
);

export async function handleSearchAll({
	query,
	topK,
}: {
	query: string;
	topK?: number;
}): Promise<ToolResult> {
	try {
		const hits = await searchAll(query, topK ?? 5);
		return { content: [{ type: "text" as const, text: JSON.stringify(hits, null, 2) }] };
	} catch (e) {
		return { content: [{ type: "text" as const, text: `search failed: ${(e as Error).message}` }] };
	}
}

server.registerTool(
	"beds24_search_all",
	{
		title: "Search Beds24 docs (all buckets)",
		description:
			"Like beds24_search but across ALL buckets, including legacy/deprecated (apiv1, deprecated). " +
			"May surface outdated or removed APIs — prefer beds24_search unless the user explicitly wants legacy behavior.",
		inputSchema: {
			query: z
				.string()
				.describe("Natural-language question, e.g. 'long-term booking window'"),
			topK: z
				.number()
				.int()
				.min(1)
				.max(20)
				.optional()
				.describe("Number of sections to return (default 5)"),
		},
	},
	handleSearchAll,
);

export async function handleSearchInBucket({
	bucket,
	query,
	topK,
}: {
	bucket: Bucket;
	query: string;
	topK?: number;
}): Promise<ToolResult> {
	try {
		const hits = await searchInBucket(bucket, query, topK ?? 5);
		return { content: [{ type: "text" as const, text: JSON.stringify(hits, null, 2) }] };
	} catch (e) {
		return { content: [{ type: "text" as const, text: `search failed: ${(e as Error).message}` }] };
	}
}

server.registerTool(
	"beds24_search_in_bucket",
	{
		title: "Search one Beds24 bucket",
		description:
			"Semantic search restricted to a single bucket. " +
			"Use 'apiv2' for the current API, 'general' for concepts, 'apiv1' or 'deprecated' for legacy behavior.",
		inputSchema: {
			bucket: z
				.enum(["deprecated", "apiv1", "apiv2", "general"])
				.describe("Which bucket to search"),
			query: z
				.string()
				.describe("Natural-language question, e.g. 'set daily prices for Airbnb'"),
			topK: z
				.number()
				.int()
				.min(1)
				.max(20)
				.optional()
				.describe("Number of sections to return (default 5)"),
		},
	},
	handleSearchInBucket,
);

export async function handleSchema({
	endpoint,
	direction,
}: {
	endpoint: string;
	direction: "request" | "response";
}): Promise<ToolResult> {
	try {
		const schema = getSchema(endpoint, direction);
		if (!schema || typeof schema !== "object") {
			return {
				content: [
					{
						type: "text" as const,
						text: `no ${direction} schema found for "${endpoint}". Try one of: ${listEndpoints().join(", ")}`,
					},
				],
			};
		}
		const fields = flattenObject(schema);
		return { content: [{ type: "text" as const, text: JSON.stringify(fields, null, 2) }] };
	} catch (e) {
		return { content: [{ type: "text" as const, text: `schema lookup failed: ${(e as Error).message}` }] };
	}
}

server.registerTool(
	"beds24_schema",
	{
		title: "Get endpoint schema",
		description:
			"Resolve the request or response schema for a V2 endpoint (e.g. 'POST /bookings') into a flat field list with types, required flags, descriptions, and enums.",
		inputSchema: {
			endpoint: z
				.string()
				.describe("'METHOD /path', e.g. 'POST /bookings' or 'GET /inventory/rooms/calendar'"),
			direction: z.enum(["request", "response"]).describe("Which body to inspect"),
		},
	},
	handleSchema,
);

export async function handleValidate({
	endpoint,
	direction,
	payload,
}: {
	endpoint: string;
	direction: "request" | "response";
	payload: unknown;
}): Promise<ToolResult> {
	try {
		const validator = Beds24Validator.create();
		const result = validator.validate(endpoint, direction, payload);
		return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
	} catch (e) {
		return { content: [{ type: "text" as const, text: `validation failed: ${(e as Error).message}` }] };
	}
}

server.registerTool(
	"beds24_validate",
	{
		title: "Validate a payload",
		description:
			"Validate a draft request/response payload against the resolved schema for an endpoint. Returns structured, LLM-actionable errors (missing fields, wrong types, unknown fields with 'did you mean?').",
		inputSchema: {
			endpoint: z.string().describe("'METHOD /path', e.g. 'POST /bookings'"),
			direction: z.enum(["request", "response"]).describe("Which body to validate against"),
			payload: z.unknown().describe("The JSON payload to validate (object, or array for V2 POST endpoints)"),
		},
	},
	handleValidate,
);

export async function handleHowto({ task }: { task: string }): Promise<ToolResult> {
	try {
		const hits = await search(task, 5);
		// Best-guess endpoint from the top hit's text (heuristic: first
		// 'METHOD /path' mention). Fall back to a generic message.
		const endpointMatch = hits[0]?.text.match(/(GET|POST|PUT|DELETE|PATCH)\s+\/[A-Za-z0-9/_{}-]+/);
		const requestSchema: Field[] = endpointMatch
			? flattenObject(getSchema(endpointMatch[0]!, "request"))
			: [];

		const summary = {
			query: task,
			steps: hits.slice(0, 3).map((h) => ({
				section: h.headingPath.join(" > "),
				lines: h.lines,
				snippet: h.text.slice(0, 280),
			})),
			matchedEndpoint: endpointMatch?.[0] ?? null,
			requestSchema,
		};
		return { content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }] };
	} catch (e) {
		return { content: [{ type: "text" as const, text: `howto failed: ${(e as Error).message}` }] };
	}
}

server.registerTool(
	"beds24_howto",
	{
		title: "How to do X on Beds24",
		description:
			"End-to-end helper: semantic search (safe buckets) for the task, fetch the matching endpoint schema, and summarize the steps. Use when you need both the 'what the docs say' and 'what the API expects'.",
		inputSchema: {
			task: z
				.string()
				.describe("What you want to do, e.g. 'create a booking' or 'set daily prices for Airbnb'"),
		},
	},
	handleHowto,
);

export async function handleStatus(): Promise<ToolResult> {
	try {
		const indexExists = dbExists();
		let chunksIndexed = 0;
		let dbSizeBytes = 0;
		let byBucket: Record<Bucket, number> = { deprecated: 0, apiv1: 0, apiv2: 0, general: 0 };
		if (indexExists) {
			chunksIndexed = countChunks();
			dbSizeBytes = statSync(DB_PATH).size;
			byBucket = bucketCounts();
		}
		const status = {
			indexKnowledgeDir: KNOWLEDGE_DIR,
			indexExists,
			chunksIndexed,
			dbSizeBytes,
			byBucket,
			factsFiles: countFactsFiles(KNOWLEDGE_DIR),
			apiEndpoints: listEndpoints().length,
		};
		return { content: [{ type: "text" as const, text: JSON.stringify(status, null, 2) }] };
	} catch (e) {
		return { content: [{ type: "text" as const, text: `status failed: ${(e as Error).message}` }] };
	}
}

server.registerTool(
	"beds24_status",
	{
		title: "Index status",
		description:
			"Report the current state of the local vector index: the knowledge dir, whether it exists, how many chunks are indexed (total + per bucket), its on-disk size, and how many facts files / API endpoints are known.",
		inputSchema: {},
	},
	handleStatus,
);

// ---------------------------------------------------------------------------
// Operational tools — let an LLM OPERATE the Beds24 API (not just inspect it).
//
// Each handler builds a per-request Beds24Client from the caller's auth fields
// (via getClient), instantiates the matching SDK op, and forwards the call. No
// API logic is reimplemented here — see beds24-sdk-client. Auth is the V2 model
// only (inviteCode / refreshToken / token); the legacy apiKey flow is unsupported.
//
// Schema strategy: GET-query tools expose the common filter axes as explicit
// optional fields that match the generated query types exactly (no cast). Write
// tools carry large, evolving request bodies, so their schemas pin the core
// required fields and use .passthrough() for the rest — documented in each
// description, with beds24_schema pointed to for the full shape. The SDK's own
// client-side validation is the source of truth for the wire format.
// ---------------------------------------------------------------------------

/** A request body too large/evolving to pin faithfully — defer to the SDK. */
type Passthrough = Record<string, unknown>;

/** Per-request V2 auth. Provide ONE of refreshToken / inviteCode / token. */
interface AuthFields {
  /** Long-lived refresh token. Preferred for non-interactive use; mints a 24h token via /authentication/token. */
  readonly refreshToken?: string;
  /** One-time invite code from Settings > Marketplace > API. Exchanged once for a token + refreshToken via /authentication/setup. */
  readonly inviteCode?: string;
  /** Use an existing 24h token directly instead of minting one. */
  readonly token?: string;
  /** Override the V2 API base URL. Defaults to https://www.beds24.com/api/v2. */
  readonly baseUrl?: string;
}

const authInput = {
  refreshToken: z
    .string()
    .optional()
    .describe(
      "Long-lived refresh token. Preferred for non-interactive use; mints a 24h token via /authentication/token.",
    ),
  inviteCode: z
    .string()
    .optional()
    .describe(
      "One-time invite code from Settings > Marketplace > API. Exchanged once for a token + refreshToken via /authentication/setup.",
    ),
  token: z
    .string()
    .optional()
    .describe("Use an existing 24h token directly instead of minting one."),
  baseUrl: z
    .string()
    .url()
    .optional()
    .describe("Override the V2 API base URL. Defaults to https://www.beds24.com/api/v2."),
};

const bookingStatusEnum = z.enum(["confirmed", "request", "new", "cancelled", "black", "inquiry"]);

/** Build a per-request client from the caller's auth fields. */
function getClient(auth: AuthFields): Beds24Client {
  return new Beds24Client({ ...auth });
}

function ok(data: Beds24Response<unknown>): ToolResult {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

/**
 * Surface a genuine MCP error (isError: true). Operational handlers call the
 * Beds24 API over the network, so a thrown error is a real failure (auth /
 * network / rate-limit) — distinct from a normal "no results" text response.
 * Keeping the text prefix preserves the existing failure message format.
 */
function fail(prefix: string, e: unknown): ToolResult {
  return {
    isError: true,
    content: [{ type: "text" as const, text: `${prefix}: ${(e as Error).message}` }],
  };
}

export async function handleBookingGet(args: AuthFields & {
  status?: Array<"confirmed" | "request" | "new" | "cancelled" | "black" | "inquiry">;
  arrival?: string;
  departure?: string;
  arrivalFrom?: string;
  arrivalTo?: string;
  departureFrom?: string;
  departureTo?: string;
  propertyId?: number[];
  roomId?: number[];
  id?: number[];
  masterId?: number[];
  filter?: "arrivals" | "departures" | "new" | "current";
  searchString?: string;
  page?: number;
}): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, ...query } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new BookingOps(client).get(query);
    return ok(data);
  } catch (e) {
    return fail("booking get failed", e);
  }
}

server.registerTool(
  "beds24_booking_get",
  {
    title: "Get bookings",
    description:
      "Search bookings (GET /bookings). Returns the matching bookings plus credit state. " +
      "By default cancelled bookings are excluded — include 'cancelled' in status to surface them. " +
      "Dates are YYYY-MM-DD. Wrapped by BookingOps.get.",
    inputSchema: {
      ...authInput,
      status: z.array(bookingStatusEnum).optional().describe("Filter by status. Cancelled excluded unless included."),
      arrival: z.string().optional().describe("Arrival date YYYY-MM-DD (exact)."),
      departure: z.string().optional().describe("Departure date YYYY-MM-DD (exact)."),
      arrivalFrom: z.string().optional().describe("Arrival on or after YYYY-MM-DD."),
      arrivalTo: z.string().optional().describe("Arrival on or before YYYY-MM-DD."),
      departureFrom: z.string().optional().describe("Departure on or after YYYY-MM-DD."),
      departureTo: z.string().optional().describe("Departure on or before YYYY-MM-DD."),
      propertyId: z.array(z.number()).optional().describe("Filter by property IDs."),
      roomId: z.array(z.number()).optional().describe("Filter by room IDs."),
      id: z.array(z.number()).optional().describe("Filter by booking IDs."),
      masterId: z.array(z.number()).optional().describe("Filter by master booking IDs."),
      filter: z
        .enum(["arrivals", "departures", "new", "current"])
        .optional()
        .describe("Convenience time filter: arrivals, departures, new (last 24h), current."),
      searchString: z.string().optional().describe("Match guest name, email, apiRef or bookingId."),
      page: z.number().int().min(1).optional().describe("Page number."),
    },
  },
  handleBookingGet,
);

export async function handleBookingCreate(args: AuthFields & { bookings: Passthrough[] }): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, bookings } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new BookingOps(client).create(bookings as unknown as BookingCreate[]);
    return ok(data);
  } catch (e) {
    return fail("booking create failed", e);
  }
}

server.registerTool(
  "beds24_booking_create",
  {
    title: "Create bookings",
    description:
      "Create bookings (POST /bookings). Each item needs at least roomId, arrival, departure. " +
      "The full newBooking shape has many optional fields (invoiceItems, infoItems, guest data, ...); " +
      "use beds24_schema on 'POST /bookings' for the authoritative list. Wrapped by BookingOps.create.",
    inputSchema: {
      ...authInput,
      bookings: z
        .array(
          z
            .object({
              roomId: z.number().describe("Room ID to book (required)."),
              arrival: z.string().describe("Arrival date YYYY-MM-DD (required)."),
              departure: z.string().describe("Departure date YYYY-MM-DD (required)."),
            })
            .passthrough(),
        )
        .describe("Bookings to create. Each needs at least roomId, arrival, departure."),
    },
  },
  handleBookingCreate,
);

export async function handleBookingCancel(args: AuthFields & { id: number }): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, id } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new BookingOps(client).cancel(id);
    return ok(data);
  } catch (e) {
    return fail("booking cancel failed", e);
  }
}

server.registerTool(
  "beds24_booking_cancel",
  {
    title: "Cancel a booking",
    description:
      "Cancel a booking by id — sets status 'cancelled' (bookings can be cancelled but never deleted). " +
      "Wrapped by BookingOps.cancel.",
    inputSchema: { ...authInput, id: z.number().describe("Booking ID to cancel.") },
  },
  handleBookingCancel,
);

export async function handleMessageList(args: AuthFields & {
  id?: number[];
  propertyId?: number[];
  roomId?: number[];
  bookingId?: number[];
  masterId?: number[];
  filter?: "read" | "unread";
  source?: "host" | "guest" | "internalNote" | "system";
  maxAge?: number;
  page?: number;
}): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, ...query } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new MessageOps(client).list(query);
    return ok(data);
  } catch (e) {
    return fail("message list failed", e);
  }
}

server.registerTool(
  "beds24_booking_message_list",
  {
    title: "List booking messages",
    description:
      "List messages for bookings (GET /bookings/messages). Filter by booking/property/room/master id, " +
      "read state, source (host/guest/internalNote/system) and max age. Wrapped by MessageOps.list.",
    inputSchema: {
      ...authInput,
      id: z.array(z.number()).optional().describe("Message IDs."),
      propertyId: z.array(z.number()).optional().describe("Property IDs."),
      roomId: z.array(z.number()).optional().describe("Room IDs."),
      bookingId: z.array(z.number()).optional().describe("Booking IDs."),
      masterId: z.array(z.number()).optional().describe("Master booking IDs."),
      filter: z.enum(["read", "unread"]).optional().describe("Filter by read state."),
      source: z
        .enum(["host", "guest", "internalNote", "system"])
        .optional()
        .describe("Filter by message source."),
      maxAge: z.number().int().min(0).optional().describe("Max age in days."),
      page: z.number().int().min(1).optional().describe("Page number."),
    },
  },
  handleMessageList,
);

export async function handleMessageSend(args: AuthFields & { messages: Passthrough[] }): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, messages } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new MessageOps(client).create(messages as unknown as MessageWrite[]);
    return ok(data);
  } catch (e) {
    return fail("message send failed", e);
  }
}

server.registerTool(
  "beds24_booking_message_send",
  {
    title: "Send booking messages",
    description:
      "Send messages (POST /bookings/messages). Each item needs at least bookingId + message. " +
      "OTA bookings only — messages to direct bookings are not delivered. " +
      "Use beds24_schema on 'POST /bookings/messages' for the full hostMessage shape. Wrapped by MessageOps.create.",
    inputSchema: {
      ...authInput,
      messages: z
        .array(
          z
            .object({
              bookingId: z.number().describe("Booking ID to message (required)."),
              message: z.string().describe("Message text (required)."),
            })
            .passthrough(),
        )
        .describe("Messages to send. Each needs at least bookingId + message."),
    },
  },
  handleMessageSend,
);

export async function handlePriceSetDaily(args: AuthFields & { rows: Passthrough[] }): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, rows } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new PricingOps(client).setDailyPrices(rows as unknown as CalendarWrite[]);
    return ok(data);
  } catch (e) {
    return fail("price set daily failed", e);
  }
}

server.registerTool(
  "beds24_price_set_daily",
  {
    title: "Set daily prices",
    description:
      "Set per-day prices (POST /inventory/rooms/calendar). Each row targets a room with a calendar of " +
      "{from, to, multiplier, ...} days (max 16 price tiers: price1-price16). multiplier is required per day. " +
      "Use beds24_schema on 'POST /inventory/rooms/calendar' for the full calendar shape. Wrapped by PricingOps.setDailyPrices.",
    inputSchema: {
      ...authInput,
      rows: z
        .array(
          z
            .object({
              roomId: z.number().describe("Room ID (required)."),
              calendar: z
                .array(
                  z
                    .object({
                      from: z.string().describe("Start date YYYY-MM-DD (required)."),
                      to: z.string().describe("End date YYYY-MM-DD (required)."),
                      multiplier: z.number().describe("Price multiplier (required)."),
                    })
                    .passthrough(),
                )
                .describe("Per-day entries for this room."),
            })
            .passthrough(),
        )
        .describe("Daily-price rows. Each needs roomId + calendar[]. Each calendar day needs from/to/multiplier."),
    },
  },
  handlePriceSetDaily,
);

export async function handlePriceGetCalendar(args: AuthFields & {
  startDate: string;
  endDate: string;
  roomId?: number[];
  propertyId?: number[];
  includeNumAvail?: boolean;
  includeMinStay?: boolean;
  includeMaxStay?: boolean;
  includeMultiplier?: boolean;
  includeOverride?: boolean;
  includePrices?: boolean;
  includeLinkedPrices?: boolean;
  includeChannels?: boolean;
  page?: number;
}): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, ...query } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new PricingOps(client).getCalendar(query);
    return ok(data);
  } catch (e) {
    return fail("price get calendar failed", e);
  }
}

server.registerTool(
  "beds24_price_get_calendar",
  {
    title: "Get the price calendar",
    description:
      "Read per-day prices + availability (GET /inventory/rooms/calendar). Requires startDate + endDate " +
      "(YYYY-MM-DD); select which fields to return via the includeX flags. Wrapped by PricingOps.getCalendar.",
    inputSchema: {
      ...authInput,
      startDate: z.string().describe("First date YYYY-MM-DD (required)."),
      endDate: z.string().describe("Last date YYYY-MM-DD (required)."),
      roomId: z.array(z.number()).optional().describe("Filter by room IDs."),
      propertyId: z.array(z.number()).optional().describe("Filter by property IDs."),
      includeNumAvail: z.boolean().optional().describe("Include numAvail."),
      includeMinStay: z.boolean().optional().describe("Include minStay."),
      includeMaxStay: z.boolean().optional().describe("Include maxStay."),
      includeMultiplier: z.boolean().optional().describe("Include multiplier."),
      includeOverride: z.boolean().optional().describe("Include override."),
      includePrices: z.boolean().optional().describe("Include prices."),
      includeLinkedPrices: z.boolean().optional().describe("Include linkedPrices."),
      includeChannels: z.boolean().optional().describe("Include channel limits."),
      page: z.number().int().min(1).optional().describe("Page number."),
    },
  },
  handlePriceGetCalendar,
);

export async function handlePriceSetFixed(args: AuthFields & { rows: Passthrough[] }): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, rows } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new PricingOps(client).setFixedPrices(rows as unknown as FixedPriceWrite[]);
    return ok(data);
  } catch (e) {
    return fail("price set fixed failed", e);
  }
}

server.registerTool(
  "beds24_price_set_fixed",
  {
    title: "Set fixed prices",
    description:
      "Set fixed (date-range) prices (POST /inventory/fixedPrices). Max 100 fixed prices per room. " +
      "Each row targets a room with firstNight/lastNight and per-occupancy pricing. " +
      "Use beds24_schema on 'POST /inventory/fixedPrices' for the full fixedPrice shape. Wrapped by PricingOps.setFixedPrices.",
    inputSchema: {
      ...authInput,
      rows: z
        .array(
          z
            .object({
              roomId: z.number().describe("Room ID (required)."),
              firstNight: z.string().describe("First night YYYY-MM-DD."),
              lastNight: z.string().describe("Last night YYYY-MM-DD."),
            })
            .passthrough(),
        )
        .describe("Fixed-price rows. Each needs roomId + the date range and pricing fields."),
    },
  },
  handlePriceSetFixed,
);

export async function handleAvailabilityGet(args: AuthFields & {
  roomId?: number[];
  propertyId?: number[];
  startDate?: string;
  endDate?: string;
  page?: number;
}): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, ...query } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new AvailabilityOps(client).get(query);
    return ok(data);
  } catch (e) {
    return fail("availability get failed", e);
  }
}

server.registerTool(
  "beds24_availability_get",
  {
    title: "Get availability",
    description:
      "Read availability booleans for a date range (GET /inventory/rooms/availability). " +
      "Wrapped by AvailabilityOps.get.",
    inputSchema: {
      ...authInput,
      roomId: z.array(z.number()).optional().describe("Filter by room IDs."),
      propertyId: z.array(z.number()).optional().describe("Filter by property IDs."),
      startDate: z.string().optional().describe("Start date YYYY-MM-DD."),
      endDate: z.string().optional().describe("End date YYYY-MM-DD (last night bookable)."),
      page: z.number().int().min(1).optional().describe("Page number."),
    },
  },
  handleAvailabilityGet,
);

export async function handleInventoryOffers(args: AuthFields & {
  arrival: string;
  departure: string;
  numAdults: number;
  propertyId?: number[];
  roomId?: number[];
  offerId?: number[];
  numChildren?: number;
  includeTexts?: string[];
  agentCode?: string;
  page?: number;
}): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, ...query } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new InventoryOps(client).getOffers(query);
    return ok(data);
  } catch (e) {
    return fail("inventory offers failed", e);
  }
}

server.registerTool(
  "beds24_inventory_offers",
  {
    title: "Get inventory offers",
    description:
      "Get calculated offers for dates + guest counts (GET /inventory/rooms/offers). " +
      "Requires arrival, departure, numAdults. Wrapped by InventoryOps.getOffers.",
    inputSchema: {
      ...authInput,
      arrival: z.string().describe("Arrival YYYY-MM-DD (required)."),
      departure: z.string().describe("Departure YYYY-MM-DD (required)."),
      numAdults: z.number().int().min(1).describe("Number of adults (required)."),
      propertyId: z.array(z.number()).optional().describe("Filter by property IDs."),
      roomId: z.array(z.number()).optional().describe("Filter by room IDs."),
      offerId: z.array(z.number()).optional().describe("Filter by offer IDs."),
      numChildren: z.number().int().min(0).optional().describe("Number of children."),
      includeTexts: z.array(z.string()).optional().describe("Language codes for descriptive texts."),
      agentCode: z.string().optional().describe("Agent code."),
      page: z.number().int().min(1).optional().describe("Page number."),
    },
  },
  handleInventoryOffers,
);

export async function handlePropertyList(args: AuthFields & {
  id?: number[];
  roomId?: number[];
  includePictures?: boolean;
  includeOffers?: boolean;
  includePriceRules?: boolean;
  includeUpsellItems?: boolean;
  includeAllRooms?: boolean;
  includeUnitDetails?: boolean;
  page?: number;
}): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, ...query } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new PropertyOps(client).list(query);
    return ok(data);
  } catch (e) {
    return fail("property list failed", e);
  }
}

server.registerTool(
  "beds24_property_list",
  {
    title: "List properties",
    description:
      "List properties (GET /properties). Optionally expand rooms, pictures, offers, price rules, upsell items. " +
      "Wrapped by PropertyOps.list.",
    inputSchema: {
      ...authInput,
      id: z.array(z.number()).optional().describe("Filter by property IDs."),
      roomId: z.array(z.number()).optional().describe("Filter by room IDs."),
      includePictures: z.boolean().optional().describe("Include pictures."),
      includeOffers: z.boolean().optional().describe("Include offers."),
      includePriceRules: z.boolean().optional().describe("Include price rules."),
      includeUpsellItems: z.boolean().optional().describe("Include upsell items."),
      includeAllRooms: z.boolean().optional().describe("Include all rooms."),
      includeUnitDetails: z.boolean().optional().describe("Include unit details."),
      page: z.number().int().min(1).optional().describe("Page number."),
    },
  },
  handlePropertyList,
);

export async function handleAccountList(args: AuthFields & {
  includeSubAccounts?: boolean;
  includeUsage?: boolean;
}): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, ...query } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new AccountOps(client).list(query);
    return ok(data);
  } catch (e) {
    return fail("account list failed", e);
  }
}

server.registerTool(
  "beds24_account_list",
  {
    title: "List accounts",
    description:
      "List accounts (GET /accounts). Alpha. Optionally include sub-accounts and usage. Wrapped by AccountOps.list.",
    inputSchema: {
      ...authInput,
      includeSubAccounts: z.boolean().optional().describe("Include sub-accounts."),
      includeUsage: z.boolean().optional().describe("Include usage data."),
    },
  },
  handleAccountList,
);

export async function handleChannelSettingsGet(args: AuthFields & {
  propertyId: string;
  roomId?: number[];
  channel?: Array<"iCalExport" | "iCalImport" | "airbnb" | "vrbo">;
}): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, ...query } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new ChannelsOps(client).get(query);
    return ok(data);
  } catch (e) {
    return fail("channel settings get failed", e);
  }
}

server.registerTool(
  "beds24_channel_settings_get",
  {
    title: "Get channel settings",
    description:
      "Read channel settings (GET /channels/settings). Requires propertyId. Alpha. Wrapped by ChannelsOps.get.",
    inputSchema: {
      ...authInput,
      propertyId: z.string().describe("Property ID (required)."),
      roomId: z.array(z.number()).optional().describe("Filter by room IDs."),
      channel: z
        .array(z.enum(["iCalExport", "iCalImport", "airbnb", "vrbo"]))
        .optional()
        .describe("Filter by channel."),
    },
  },
  handleChannelSettingsGet,
);

export async function handleChannelSettingsConfigure(
  args: AuthFields & { settings: Passthrough[] },
): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, settings } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new ChannelsOps(client).configure(settings as unknown as ChannelSettings[]);
    return ok(data);
  } catch (e) {
    return fail("channel settings configure failed", e);
  }
}

server.registerTool(
  "beds24_channel_settings_configure",
  {
    title: "Configure channel settings",
    description:
      "Configure a channel (POST /channels/settings). API and iCal are mutually exclusive per room. " +
      "The per-channel shapes differ (vrbo / airbnb / iCal export / iCal import); use beds24_schema on " +
      "'POST /channels/settings' for the exact fields. Wrapped by ChannelsOps.configure.",
    inputSchema: {
      ...authInput,
      settings: z
        .array(z.object({}).passthrough())
        .describe("Channel settings to write. Shape depends on the target channel."),
    },
  },
  handleChannelSettingsConfigure,
);

export async function handleWebhookRegister(args: AuthFields & { payload: Passthrough }): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, payload } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new WebhooksOps(client).register(payload as unknown as WebhookPayload);
    return ok(data);
  } catch (e) {
    return fail("webhook register failed", e);
  }
}

server.registerTool(
  "beds24_webhook_register",
  {
    title: "Post a webhook payload",
    description:
      "Post a webhook payload (POST Webhooks - bookings) — this is the shape your webhook URL RECEIVES, " +
      "not a registration call (URLs are set in Settings > Properties > Access). " +
      "Use beds24_schema on 'POST Webhooks - bookings' for the full payload. Wrapped by WebhooksOps.register.",
    inputSchema: {
      ...authInput,
      payload: z
        .object({
          timeStamp: z.string().optional().describe("ISO timestamp."),
          booking: z.object({}).optional().describe("Booking payload."),
        })
        .passthrough()
        .describe("The webhook payload to post."),
    },
  },
  handleWebhookRegister,
);

export async function handleInvoiceList(args: AuthFields & { query?: InvoiceQuery }): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, query } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new InvoicingOps(client).list(query ?? {});
    return ok(data);
  } catch (e) {
    return fail("invoice list failed", e);
  }
}

server.registerTool(
  "beds24_invoice_list",
  {
    title: "List invoices",
    description:
      "List invoices (GET /bookings/invoices, Alpha). Each result carries a nullable invoiceId. " +
      "Wrapped by InvoicingOps.list.",
    inputSchema: {
      ...authInput,
      query: z
        .object({
          bookingId: z.array(z.number()).optional().describe("Filter by booking IDs."),
        })
        .passthrough()
        .optional()
        .describe("GET /bookings/invoices query params."),
    },
  },
  handleInvoiceList,
);

export async function handleChannelAirbnbPush(args: AuthFields & { drafts: Passthrough[] }): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, drafts } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new ChannelActionsOps(client).pushToAirbnb(drafts as unknown as AirbnbAction[]);
    return ok(data);
  } catch (e) {
    return fail("channel Airbnb push failed", e);
  }
}

server.registerTool(
  "beds24_channel_airbnb_push",
  {
    title: "Push actions to Airbnb",
    description:
      "Perform actions at Airbnb (POST /channels/airbnb, Alpha) — import a property, " +
      "connect a room, or disconnect one. Each element is discriminated by its action enum. " +
      "Use beds24_schema on 'POST /channels/airbnb' for the exact action shapes. Wrapped by ChannelActionsOps.pushToAirbnb.",
    inputSchema: {
      ...authInput,
      drafts: z
        .array(
          z
            .object({
              action: z
                .enum(["importAsNewProperty", "importToExistingProperty", "connectToExistingRoom", "disconnectRoom"])
                .describe("Airbnb action to perform (required)."),
            })
            .passthrough(),
        )
        .describe("Airbnb actions to perform. Each is discriminated by its action enum."),
    },
  },
  handleChannelAirbnbPush,
);

export async function handleStripeSetup(args: AuthFields & { drafts: Passthrough[] }): Promise<ToolResult> {
  try {
    const { refreshToken, inviteCode, token, baseUrl, drafts } = args;
    const client = getClient({ refreshToken, inviteCode, token, baseUrl });
    const data = await new StripeOps(client).setupStripe(drafts as unknown as StripeAction[]);
    return ok(data);
  } catch (e) {
    return fail("stripe setup failed", e);
  }
}

server.registerTool(
  "beds24_stripe_setup",
  {
    title: "Set up Stripe payments",
    description:
      "Perform a Stripe action (POST /channels/stripe, Alpha) — create a Checkout session, " +
      "charge / refund / capture a payment, or attach / detach a payment method. Each element is " +
      "discriminated by its action enum. Use beds24_schema on 'POST /channels/stripe' for the exact shapes. " +
      "Wrapped by StripeOps.setupStripe.",
    inputSchema: {
      ...authInput,
      drafts: z
        .array(
          z
            .object({
              action: z
                .string()
                .describe("Stripe action to perform (required) — see beds24_schema 'POST /channels/stripe'."),
            })
            .passthrough(),
        )
        .describe("Stripe actions to perform. Each is discriminated by its action enum."),
    },
  },
  handleStripeSetup,
);

// ---------------------------------------------------------------------------
// Prompts — short workflow guides surfaced to the LLM at prompt-list time.
// Each returns a prompt message that walks the model through the search →
// inspect → validate → operate flow for a common task.
// ---------------------------------------------------------------------------

/** "Create a booking" — search → schema → validate → beds24_booking_create. */
export function promptCreateBooking(): GetPromptResult {
	return {
		description: "Create a booking on Beds24",
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: [
						"To create a booking on Beds24:",
						"1. Run beds24_search (query: 'create a booking') to read the how-to and find the docUrl.",
						"2. Run beds24_schema (endpoint: 'POST /bookings', direction: 'request') for the exact booking shape.",
						"3. Build the payload, then run beds24_validate (endpoint: 'POST /bookings', direction: 'request', payload: ...) to catch errors.",
						"4. Call beds24_booking_create with auth + the validated bookings array.",
						"Auth: provide ONE of refreshToken (preferred), inviteCode, or token.",
					].join("\n"),
				},
			},
		],
	};
}

/** "Set daily prices for a room" — search → schema → validate → beds24_price_set_daily. */
export function promptSetDailyPrices(): GetPromptResult {
	return {
		description: "Set per-day prices for a room",
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: [
						"To set daily prices on Beds24:",
						"1. Run beds24_search (query: 'set daily prices for a room') to read the how-to.",
						"2. Run beds24_schema (endpoint: 'POST /inventory/rooms/calendar', direction: 'request') for the calendar shape (roomId + calendar[] with from/to/multiplier).",
						"3. Run beds24_validate on the draft rows before sending.",
						"4. Call beds24_price_set_daily with auth + the validated rows.",
						"Auth: provide ONE of refreshToken (preferred), inviteCode, or token.",
					].join("\n"),
				},
			},
		],
	};
}

/** "Register a webhook" — search → schema → beds24_webhook_register. */
export function promptRegisterWebhook(): GetPromptResult {
	return {
		description: "Register / understand a webhook payload",
		messages: [
			{
				role: "user",
				content: {
					type: "text",
					text: [
						"To work with webhooks on Beds24:",
						"1. Run beds24_search (query: 'webhook payload shape') to read the how-to.",
						"2. Run beds24_schema (endpoint: 'POST Webhooks - bookings', direction: 'request') for the payload shape your webhook URL receives.",
						"3. Call beds24_webhook_register with auth + the payload.",
						"Note: webhook URLs are set in Settings > Properties > Access — this tool posts the payload shape, it does not register the URL.",
						"Auth: provide ONE of refreshToken (preferred), inviteCode, or token.",
					].join("\n"),
				},
			},
		],
	};
}

server.registerPrompt(
	"beds24_prompt_create_booking",
	{
		title: "Create a booking",
		description:
			"Walks through creating a booking: search the docs, inspect the POST /bookings schema, validate the payload, then call beds24_booking_create.",
	},
	promptCreateBooking,
);

server.registerPrompt(
	"beds24_prompt_set_daily_prices",
	{
		title: "Set daily prices for a room",
		description:
			"Walks through setting daily prices: search the docs, inspect the calendar schema, validate the rows, then call beds24_price_set_daily.",
	},
	promptSetDailyPrices,
);

server.registerPrompt(
	"beds24_prompt_register_webhook",
	{
		title: "Register a webhook",
		description:
			"Walks through the webhook payload shape: search the docs, inspect the Webhooks schema, then call beds24_webhook_register.",
	},
	promptRegisterWebhook,
);

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

/** Count markdown facts files under the knowledge corpus root. */
export function countFactsFiles(dir: string): number {
	if (!existsSync(dir)) return 0;
	let n = 0;
	const walk = (d: string): void => {
		for (const e of readdirSync(d, { withFileTypes: true })) {
			const p = join(d, e.name);
			if (e.isDirectory()) walk(p);
			else if (e.name.endsWith(".md")) n += 1;
		}
	};
	walk(dir);
	return n;
}

// ---------------------------------------------------------------------------
// Resources — handlers extracted as named exported functions for unit testing.
// ---------------------------------------------------------------------------

/** List every markdown facts file under the knowledge root as a resource. */
export async function handleFactsList(): Promise<{
	resources: Array<{ uri: string; name: string; mimeType: string }>;
}> {
	const resources: Array<{ uri: string; name: string; mimeType: string }> = [];
	const walk = (d: string): void => {
		for (const e of readdirSync(d, { withFileTypes: true })) {
			const p = join(d, e.name);
			if (e.isDirectory()) walk(p);
			else if (e.name.endsWith(".md")) {
				resources.push({
					uri: `beds24://facts/${p.slice(KNOWLEDGE_DIR.length + 1).split("\\").join("/")}`,
					name: e.name,
					mimeType: "text/markdown",
				});
			}
		}
	};
	if (existsSync(KNOWLEDGE_DIR)) walk(KNOWLEDGE_DIR);
	return { resources };
}

/** Read one facts file by its template `path`, rejecting path-traversal escapes. */
export async function handleFactsRead(uri: URL, variables: Variables) {
	const raw = variables.path;
	const path = (Array.isArray(raw) ? raw[0] : raw) ?? "";
	const rel = path.replace(/^\/+/, "");
	const full = join(KNOWLEDGE_DIR, rel);
	// Contain the read inside the knowledge root (no path traversal).
	if (!full.startsWith(KNOWLEDGE_DIR)) {
		throw new Error(`access denied: ${path}`);
	}
	const text = readFileSync(full, "utf8");
	return {
		contents: [{ uri: uri.href, name: rel, mimeType: "text/markdown", text }],
	};
}

// Raw markdown facts: beds24://facts/path/to/file.md
server.registerResource(
	"facts",
	new ResourceTemplate("beds24://facts/{path}", {
		list: handleFactsList,
	}),
	{
		title: "Beds24 fact files",
		description: "Raw cited markdown facts from the knowledge base.",
	},
	handleFactsRead,
);

/** Return the full V2 endpoint index as a JSON resource. */
export async function handleEndpoints(uri: URL) {
	const endpoints = listEndpoints();
	return {
		contents: [
			{
				uri: uri.href,
				name: "endpoints",
				mimeType: "application/json",
				text: JSON.stringify(endpoints, null, 2),
			},
		],
	};
}

// Endpoint index: beds24://endpoints
server.registerResource(
	"endpoints",
	"beds24://endpoints",
	{
		title: "Beds24 V2 endpoint index",
		description: "All request/response endpoints parsed from apiV2.yaml.",
	},
	handleEndpoints,
);

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

/** Build the index (if missing) then connect the MCP server on stdio. */
export async function startServer(): Promise<void> {
	// Auto-build the index on startup if it's missing. Log to stderr so we
	// never corrupt the stdio JSON-RPC stream.
	if (!dbExists()) {
		console.error("[beds24] index missing — building from knowledge base...");
		try {
			getDb();
			const res = await buildIndex({ knowledgeDir: KNOWLEDGE_DIR });
			console.error(`[beds24] index built: ${res.files} files, ${res.chunks} chunks.`);
		} catch (e) {
			console.error(`[beds24] auto-index failed: ${(e as Error).message}`);
		}
	}

	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("[beds24] MCP server connected on stdio.");
}

/** CLI entry point: start the server, log fatals to stderr, exit non-zero on failure. */
export async function main(): Promise<void> {
	try {
		await startServer();
	} catch (err) {
		console.error("[beds24] fatal:", err);
		process.exit(1);
	}
}

// Run directly (`bun run src/server.ts`) — not when imported by the CLI.
if (import.meta.main) void main();
