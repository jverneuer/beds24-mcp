/**
 * Beds24 — the SDK/knowledge composition root for the server package.
 *
 * One object you configure once (`Beds24.create({ apiKey, propKey })`) and call
 * for everything: remote API calls (`.request()`), local doc search
 * (`.search()`), schema lookup (`.schema()`), validation (`.validate()`), and
 * domain workflows (`.booking`, `.pricing`, `.availability`, `.channels`,
 * `.webhooks`).
 *
 * Unlike the module-level functions it wraps, the facade holds its client,
 * validator, and search as *instance* state — so two instances with different
 * knowledgeDir don't collide, and nothing depends on global singletons.
 *
 * This file is the composition root: it imports from the two workspace packages
 * and wires them into the facade. It contains no SDK/knowledge logic of its own.
 *
 *  - `beds24-sdk`        → client, ops, validator, schema introspection
 *  - `beds24-knowledge`  → indexer + hybrid search over the cited docs
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
	Beds24Client,
	BookingOps,
	PricingOps,
	AvailabilityOps,
	ChannelsOps,
	WebhooksOps,
	Beds24Validator,
	getSchema,
	listEndpoints,
	flattenObject,
	type Beds24ClientConfig,
	type Beds24Response,
	type Field,
	type ValidationResult,
} from "beds24-sdk";

import {
	search,
	Beds24Search,
	buildIndex,
	dbExists,
	type Bucket,
	type SearchHit,
} from "beds24-knowledge";

/** Full configuration for the facade. */
export interface Beds24Config extends Beds24ClientConfig {
	/** Knowledge corpus root for search. Defaults to the bundled `knowledge/` dir. */
	readonly knowledgeDir?: string;
	/** Build the index on startup if it's missing (default true). */
	readonly ensureIndex?: boolean;
}

export class Beds24 {
	/** Raw API client for direct `request("METHOD /path", body)` calls. */
	readonly client: Beds24Client;
	/** Knowledge corpus root used for search. */
	readonly knowledgeDir: string;

	/** Domain workflows. */
	readonly booking: BookingOps;
	readonly pricing: PricingOps;
	readonly availability: AvailabilityOps;
	readonly channels: ChannelsOps;
	readonly webhooks: WebhooksOps;

	private readonly validator: Beds24Validator;
	private readonly searcher: Beds24Search;

	private constructor(config: Required<Beds24Config>) {
		this.client = new Beds24Client(config);
		this.knowledgeDir = config.knowledgeDir;
		this.validator = Beds24Validator.create();
		this.searcher = new Beds24Search();
		this.booking = new BookingOps(this.client);
		this.pricing = new PricingOps(this.client);
		this.availability = new AvailabilityOps(this.client);
		this.channels = new ChannelsOps(this.client);
		this.webhooks = new WebhooksOps(this.client);
	}

	/**
	 * Create a configured instance. Builds the vector index (if `ensureIndex` is
	 * set) before resolving.
	 */
	static async create(config: Beds24Config): Promise<Beds24> {
		const knowledgeDir = config.knowledgeDir ?? defaultKnowledgeDir();
		const fullConfig = {
			knowledgeDir,
			ensureIndex: true,
			...config,
		} as Required<Beds24Config>;
		if (fullConfig.ensureIndex && !dbExists()) {
			await buildIndex({ knowledgeDir, force: false });
		}
		return new Beds24(fullConfig);
	}

	// --- local knowledge surface (instance methods) ---

	/** Semantic search over the cited docs (safe buckets only). */
	search(query: string, topK = 5): Promise<SearchHit[]> {
		return search(query, topK);
	}

	/** Search every bucket. */
	searchAll(query: string, topK?: number): Promise<SearchHit[]> {
		return this.searcher.searchAll(query, topK);
	}

	/** Search a single bucket, returning [] for any unknown bucket. */
	searchInBucket(bucket: Bucket, query: string, topK?: number): Promise<SearchHit[]> {
		return this.searcher.searchInBucket(bucket, query, topK);
	}

	// --- local SDK surface (instance methods) ---

	/** Resolve an endpoint's request/response schema to a flat field list. */
	schema(endpoint: string, direction: "request" | "response"): Field[] {
		const node = getSchema(endpoint, direction);
		return node ? flattenObject(node) : [];
	}

	/** List every documented `METHOD /path`. */
	endpoints(): string[] {
		return listEndpoints();
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

/**
 * Default knowledge corpus root.
 *
 * The knowledge package owns this path (`defaultKnowledgeDir()` in its paths.ts)
 * but does not export it from its public barrel, so the facade resolves the
 * bundled `knowledge/` dir that ships with `beds24-knowledge`. Honors the
 * `BEDS24_KNOWLEDGE_DIR` override. This is a faithful port of the knowledge
 * package's own path resolution (walk up to the dir holding package.json +
 * knowledge/).
 */
function defaultKnowledgeDir(): string {
	if (process.env.BEDS24_KNOWLEDGE_DIR) return process.env.BEDS24_KNOWLEDGE_DIR;
	try {
		const barrel = import.meta.resolve("beds24-knowledge");
		let dir = dirname(fileURLToPath(barrel));
		for (let i = 0; i < 8; i++) {
			if (existsSync(join(dir, "package.json")) && existsSync(join(dir, "knowledge"))) {
				return join(dir, "knowledge");
			}
			const parent = dirname(dir);
			if (parent === dir) break; // filesystem root
			dir = parent;
		}
		// The barrel lives at <pkg>/src/index.ts; the corpus is <pkg>/knowledge.
		return join(dirname(fileURLToPath(barrel)), "..", "knowledge");
	} catch {
		return process.cwd();
	}
}
