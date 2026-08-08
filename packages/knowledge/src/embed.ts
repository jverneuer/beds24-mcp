/**
 * Pluggable multi-lingual embedding.
 *
 * The `Embedder` interface abstracts over embedding providers so the knowledge
 * base can use a better multi-lingual model (e.g. BAAI/bge-m3 via Ollama,
 * critical for a global hotel platform) without changing callers: `search.ts`
 * and `indexer.ts` depend only on the frozen `embed(texts)` signature, which
 * routes through the active embedder here.
 *
 * Default provider is `LocalEmbedder` (Xenova/all-MiniLM-L6-v2, 384-dim) — the
 * previous behavior, unchanged. `@huggingface/transformers` is imported LAZILY
 * inside `LocalEmbedder` (a dynamic `import()`), so the published package does
 * not force the ONNX runtime on every install; the type-only import below is
 * erased at compile time and loads nothing.
 */

import type { FeatureExtractionPipeline, Tensor } from "@huggingface/transformers";

/** An embedding provider. Swap implementations without touching callers. */
export interface Embedder {
	/** Provider id, e.g. "local" | "ollama-bge-small" | "ollama-bge-m3". */
	readonly id: string;
	/** Model name — stored in chunks.embedding_model once T18 lands. */
	readonly model: string;
	/** Embedding dimensionality (384 | 1024). */
	readonly dimension: number;
	/**
	 * Embed one or more texts. Returns one vector per input, in order.
	 * SAME signature as the pre-refactor `embed()` — frozen by CONTRACT.md.
	 */
	embed(texts: string[]): Promise<number[][]>;
}

/** Options for `createEmbedder`. */
export interface EmbedderOpts {
	/** Provider id. Defaults to `BEDS24_EMBEDDER` env, then "local". */
	provider?: string;
	/** Ollama model — only meaningful for the `ollama-*` providers. */
	model?: "bge-m3" | "bge-small-en-v1.5";
	/** Ollama base URL (default http://localhost:11434). Ignored by `local`. */
	baseUrl?: string;
	/** AbortSignal for the Ollama request. Ignored by `local`. */
	signal?: AbortSignal;
}

/**
 * Default embedding dimensionality (LocalEmbedder). CONTRACT.md frozen at 384.
 * NOTE: dimension is now per-embedder (OllamaEmbedder is 384 or 1024); this
 * constant remains the default/local value until T18 handles DB-side dimension.
 */
export const EMBED_DIM = 384;

/**
 * Default provider — wraps `@huggingface/transformers` (Xenova/all-MiniLM-L6-v2).
 * Drop-in for the pre-refactor behavior. The model is mean-pooled over tokens
 * and normalized to unit length so cosine distance == cosine similarity.
 *
 * `@huggingface/transformers` is imported LAZILY (dynamic `import()`), so the
 * dependency loads only when this provider is actually used.
 */
export class LocalEmbedder implements Embedder {
	readonly id = "local";
	readonly model = "Xenova/all-MiniLM-L6-v2";
	readonly dimension = 384;

	private pipelinePromise: Promise<FeatureExtractionPipeline> | null = null;
	private readyLog = false;

	// Explicit (empty) constructor keeps Istanbul's function accounting aligned
	// with the source: the class fields above are initialized here, so there is
	// exactly one constructor function and no synthetic field-init function.
	constructor() {}

	async embed(texts: string[]): Promise<number[][]> {
		if (texts.length === 0) return [];

		const pipeline = await this.getPipeline();
		const output: Tensor = await pipeline(texts, { pooling: "mean", normalize: true });

		const dims = output.dims; // [N, EMBED_DIM]
		const data = output.data as Float32Array;

		const rows = dims.length >= 2 ? (dims[0] ?? 1) : 1;
		const cols = dims[dims.length - 1] ?? this.dimension;

		const vecs: number[][] = [];
		for (let i = 0; i < rows; i++) {
			const start = i * cols;
			const slice = data.slice(start, start + cols);
			vecs.push(Array.from(slice));
		}
		return vecs;
	}

	/** Lazily create (once) the shared feature-extraction pipeline. */
	private async getPipeline(): Promise<FeatureExtractionPipeline> {
		if (this.pipelinePromise === null) {
			if (!this.readyLog) {
				console.error("[beds24] loading embedding model (Xenova/all-MiniLM-L6-v2)...");
				this.readyLog = true;
			}
			const { pipeline } = await import("@huggingface/transformers");
			this.pipelinePromise = (
				pipeline as (
					task: "feature-extraction",
					model: string,
					options: { dtype: "fp32" },
				) => Promise<FeatureExtractionPipeline>
			)("feature-extraction", this.model, { dtype: "fp32" as const });
		}
		return this.pipelinePromise;
	}
}

/**
 * Ollama-backed embedder — multi-lingual BAAI models served via a local Ollama
 * instance's `/api/embed` endpoint (Ollama >=0.1.24). Uses global `fetch`
 * (zero dependencies).
 *
 *   - bge-small-en-v1.5: 384-dim, 100+ languages — drop-in multi-lingual upgrade
 *   - bge-m3:             1024-dim, 100+ languages + sparse/colbert — best quality
 */
export class OllamaEmbedder implements Embedder {
	readonly id: string;
	readonly model: string;
	readonly dimension: number;
	private readonly baseUrl: string;
	private readonly signal: AbortSignal | undefined;

	constructor(opts: {
		model: "bge-m3" | "bge-small-en-v1.5";
		baseUrl?: string;
		signal?: AbortSignal;
	}) {
		this.model = opts.model;
		this.id = opts.model === "bge-m3" ? "ollama-bge-m3" : "ollama-bge-small";
		this.dimension = opts.model === "bge-m3" ? 1024 : 384;
		this.baseUrl = opts.baseUrl ?? "http://localhost:11434";
		this.signal = opts.signal;
	}

	async embed(texts: string[]): Promise<number[][]> {
		if (texts.length === 0) return [];
		const res = await fetch(`${this.baseUrl}/api/embed`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ model: this.model, input: texts }),
			signal: this.signal,
		});
		if (!res.ok) {
			throw new Error(`Ollama embed failed: ${res.status} ${res.statusText}`);
		}
		const json = (await res.json()) as { embeddings: number[][] };
		return json.embeddings;
	}
}

/**
 * Build an embedder. Selection via `opts.provider`, else `BEDS24_EMBEDDER` env,
 * else "local". Unknown providers throw.
 */
export function createEmbedder(opts?: EmbedderOpts): Embedder {
	const provider = opts?.provider ?? process.env.BEDS24_EMBEDDER ?? "local";
	switch (provider) {
		case "local":
			return new LocalEmbedder();
		case "ollama-bge-small":
			return new OllamaEmbedder({
				model: "bge-small-en-v1.5",
				baseUrl: opts?.baseUrl,
				signal: opts?.signal,
			});
		case "ollama-bge-m3":
			return new OllamaEmbedder({
				model: "bge-m3",
				baseUrl: opts?.baseUrl,
				signal: opts?.signal,
			});
		default:
			throw new Error(`unknown embedder: ${provider}`);
	}
}

// ---------------------------------------------------------------------------
// Backward-compat surface (CONTRACT.md frozen)
// ---------------------------------------------------------------------------

let activeEmbedder: Embedder | null = null;

/**
 * Batch-embed via the active embedder. CONTRACT.md frozen signature. Routes
 * through `createEmbedder()` so the `BEDS24_EMBEDDER` env var selects the
 * provider; the embedder (and the ONNX model for `local`) are created lazily
 * and cached for the process lifetime.
 */
export async function embed(texts: string[]): Promise<number[][]> {
	if (texts.length === 0) return [];
	if (activeEmbedder === null) {
		activeEmbedder = createEmbedder();
	}
	return activeEmbedder.embed(texts);
}

/**
 * Reset the cached active embedder so the next `embed()` re-runs
 * `createEmbedder()`. Lets unit tests isolate the "first call picks a provider"
 * path and force each provider in turn without leaking state across tests.
 * Test-only (NOT part of the public API); leaves every frozen signature intact.
 */
export function __resetEmbedderForTests(): void {
	activeEmbedder = null;
}
