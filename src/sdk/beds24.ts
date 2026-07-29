/**
 * Beds24 — the SDK entry point.
 *
 * One object you configure once (`Beds24.create({ apiKey, propKey })`) and call
 * for everything: remote API calls (`.request()`), local doc search
 * (`.search()`), schema lookup (`.schema()`), validation (`.validate()`), and
 * domain workflows (`.booking`, `.pricing`, `.availability`, `.channels`,
 * `.webhooks`).
 *
 * Unlike the module-level functions it wraps, the facade holds its client,
 * validator, and index as *instance* state — so two instances with different
 * factsDir don't collide, and nothing depends on global singletons.
 */

import { buildIndex } from "./indexer.ts";
import { search, type SearchHit } from "./search.ts";
import { flattenObject, getSchema, listEndpoints, type Field } from "./schema.ts";
import { Beds24Validator, type ValidationResult } from "./validate.ts";
import { dbExists } from "./db.ts";
import { defaultKnowledgeDir } from "./paths.ts";

import { Beds24Client, type Beds24ClientConfig, type Beds24Response } from "./client.ts";
import { BookingOps } from "./ops/booking.ts";
import { PricingOps } from "./ops/pricing.ts";
import { AvailabilityOps } from "./ops/availability.ts";
import { ChannelsOps } from "./ops/channels.ts";
import { WebhooksOps } from "./ops/webhooks.ts";

/** Full configuration for the facade. */
export interface Beds24Config extends Beds24ClientConfig {
	/** Knowledge root for search/validation. Defaults to <packageRoot>/knowledge. */
	factsDir?: string;
	/** Build the index on startup if it's missing (default true). */
	ensureIndex?: boolean;
}

export class Beds24 {
	/** Raw API client for direct `request("METHOD /path", body)` calls. */
	readonly client: Beds24Client;
	/** Knowledge root used for search + validation. */
	readonly factsDir: string;

	/** Domain workflows. */
	readonly booking: BookingOps;
	readonly pricing: PricingOps;
	readonly availability: AvailabilityOps;
	readonly channels: ChannelsOps;
	readonly webhooks: WebhooksOps;

	private validator: Beds24Validator;

	private constructor(config: Required<Beds24Config>) {
		this.factsDir = config.factsDir;
		this.client = new Beds24Client(config);
		this.validator = Beds24Validator.create({ factsDir: config.factsDir });
		this.booking = new BookingOps(this);
		this.pricing = new PricingOps(this);
		this.availability = new AvailabilityOps(this);
		this.channels = new ChannelsOps(this);
		this.webhooks = new WebhooksOps(this);
	}

	/**
	 * Create a configured instance. Loads the embedding model and builds the
	 * vector index (if `ensureIndex` is set) before resolving.
	 */
	static async create(config: Beds24Config): Promise<Beds24> {
		const factsDir = config.factsDir ?? defaultKnowledgeDir();
		const full = { factsDir, ensureIndex: true, ...config };
		if (full.ensureIndex && !dbExists()) {
			await buildIndex({ factsDir });
		}
		return new Beds24(full as Required<Beds24Config>);
	}

	// --- local SDK surface (instance methods) ---

	/** Semantic search over the cited docs. */
	search(query: string, topK = 5): Promise<SearchHit[]> {
		return search(query, topK);
	}

	/** Resolve an endpoint's request/response schema to a flat field list. */
	schema(endpoint: string, direction: "request" | "response"): Field[] {
		const node = getSchema(this.factsDir, endpoint, direction);
		return node ? flattenObject(node as Record<string, unknown>) : [];
	}

	/** List every documented `METHOD /path`. */
	endpoints(): string[] {
		return listEndpoints(this.factsDir);
	}

	/** Validate a payload against an endpoint schema. */
	validate(endpoint: string, direction: "request" | "response", payload: unknown): ValidationResult {
		return this.validator.validate(endpoint, direction, payload);
	}

	/**
	 * End-to-end helper: search for the task, fetch the matching endpoint
	 * schema, and summarize. Ported from the MCP server's `beds24_howto` tool.
	 */
	async howto(task: string): Promise<{
		query: string;
		steps: Array<{ section: string; lines: [number, number]; snippet: string }>;
		matchedEndpoint: string | null;
		requestSchema: Field[];
	}> {
		const hits = await this.search(task, 5);
		const endpointMatch = hits[0]?.text.match(/(GET|POST|PUT|DELETE|PATCH)\s+\/[A-Za-z0-9/_{}-]+/);
		const requestSchema = endpointMatch ? this.schema(endpointMatch[0], "request") : [];
		return {
			query: task,
			steps: hits.slice(0, 3).map((h) => ({
				section: h.headingPath.join(" > "),
				lines: h.lines,
				snippet: h.text.slice(0, 280),
			})),
			matchedEndpoint: endpointMatch?.[0] ?? null,
			requestSchema,
		};
	}

	/** Direct pass-through to the API client for any documented endpoint. */
	request<T = unknown>(
		endpoint: string,
		body?: unknown,
		opts?: { idempotencyKey?: string; signal?: AbortSignal },
	): Promise<Beds24Response<T>> {
		return this.client.request<T>(endpoint, body, opts);
	}
}

// Types are re-exported from the barrel (src/sdk/index.ts) — do not re-export
// here to avoid duplicate-identifier errors.
