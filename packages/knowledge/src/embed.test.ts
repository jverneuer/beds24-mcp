/**
 * Unit tests for embed.ts — targets 100% statement / branch / line coverage.
 *
 * Three surfaces under test:
 *   - `LocalEmbedder` (default): wraps `@huggingface/transformers`, mocked.
 *   - `OllamaEmbedder` (multi-lingual): calls `/api/embed` via global `fetch`, mocked.
 *   - `createEmbedder` factory + the backward-compat `embed()` wrapper.
 *
 * The `@huggingface/transformers` module is fully mocked (slow/network-bound —
 * never loads in tests). Because `LocalEmbedder` imports it LAZILY (a dynamic
 * `import()`), the `mock.module` registration below intercepts that dynamic
 * import when a `LocalEmbedder` runs. The mock pipeline returns a deterministic,
 * unit-normalized Float32Array tensor whose `dims` we can shape per-test to
 * exercise every branch of the row/col slicing logic in `LocalEmbedder.embed`.
 *
 * Call-count assertions use DELTAS (before/after within a test) because
 * `LocalEmbedder` caches the pipeline per-instance, and the `embed()` wrapper
 * caches the active embedder at module level. Deltas keep each test
 * deterministic and order-independent.
 */

import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";

// Re-establish the REAL embed.js surface when running the combined suite.
//
// indexer.test.ts loads before this file and stashes a COPY of the real embed.js
// exports into globalThis.__realEmbed (a copy is required: bun's `mock.module`
// mutates the live module object in place, so a bare reference would be clobbered
// by the fakes search.test.ts / indexer.test.ts register afterwards). Because we
// load last, re-registering that real surface here wins the process-global mock
// registry; a late dynamic import then binds the real `embed`/`EMBED_DIM`/
// `LocalEmbedder`/`OllamaEmbedder`/`createEmbedder`/`__resetEmbedderForTests`
// stably. search.ts / indexer.ts keep their own fakes via their factories —
// separate objects untouched by this re-registration.
//
// When run standalone the stash is absent, so we fall back to importing the real
// module directly (the `@huggingface/transformers` mock below still intercepts
// the lazy import). See TEST-HARNESS.md.
const realEmbed = (globalThis as any).__realEmbed;
if (realEmbed) {
	mock.module("./embed.js", () => realEmbed);
}
const { embed, EMBED_DIM, LocalEmbedder, OllamaEmbedder, createEmbedder, __resetEmbedderForTests } =
	await import("./embed.js");

/**
 * Mutable mock configuration, read by the fake pipeline. Reset in beforeEach so
 * every test starts from a known state.
 */
const mockState = {
	/** Number of times the (cached) embedder function has been invoked. */
	callCount: 0,
	/** Number of times the pipeline factory (`pipeline(...)`) has been called. */
	pipelineCreateCount: 0,
	/** If set, the embedder returns a tensor with exactly these dims. */
	dims: null as number[] | null,
	/** If true, the embedder rejects to simulate a model failure. */
	shouldThrow: false,
};

/** Frozen embedding dimensionality — mirrored from CONTRACT.md (do not drift). */
const MOCK_DIM = 384;

/**
 * Build a deterministic, L2-normalized vector of length `len`.
 * The real embedder applies `normalize: true`, so our mock returns unit
 * vectors to match — letting us assert output norms are ~1.
 */
function makeUnitVector(seed: number, len: number): Float32Array {
	// Build via a plain array to avoid noUncheckedIndexedAccess complaints on
	// typed-array element access (which types as `number | undefined`).
	const tmp: number[] = new Array<number>(len);
	let sumSq = 0;
	for (let i = 0; i < len; i++) {
		const val = Math.sin(seed + i * 0.137) * 0.5 + Math.cos(seed * 0.7 + i * 0.311);
		tmp[i] = val;
		sumSq += val * val;
	}
	const norm = Math.sqrt(sumSq);
	const v = new Float32Array(len);
	for (let i = 0; i < len; i++) {
		const t = tmp[i] as number;
		v[i] = norm > 0 ? t / norm : 0;
	}
	return v;
}

// --- Mock the third-party module BEFORE any LocalEmbedder runs ----------------
// LocalEmbedder only consumes `pipeline` at runtime (FeatureExtractionPipeline
// and Tensor are type-only imports erased by the compiler). The factory is typed
// loosely because we replace a large external surface with a minimal,
// controllable stand-in. See TEST-HARNESS.md embed mocking pattern.
mock.module("@huggingface/transformers", () => ({
	pipeline: mock(
		async (_task: string, _model: string, _opts: unknown) => {
			mockState.pipelineCreateCount++;
			return mock(
				async (texts: string[], _opts: unknown) => {
					mockState.callCount++;
					if (mockState.shouldThrow) {
						throw new Error("mock model failure");
					}
					const n = texts.length;
					// Default shape matches a real 2-D feature-extraction output.
					const dims = mockState.dims ?? [n, MOCK_DIM];
					const cols = dims[dims.length - 1] ?? MOCK_DIM;
					const rows = dims.length >= 2 ? (dims[0] ?? 1) : 1;
					// Size data to cover whatever (rows, cols) the branch under test needs.
					const data = new Float32Array(Math.max(rows, n) * cols);
					for (let r = 0; r < Math.max(rows, n); r++) {
						data.set(makeUnitVector(r + 1, cols), r * cols);
					}
					return { dims, data };
				},
			);
		},
	),
}));

// --- Mock global fetch for OllamaEmbedder -------------------------------------
const originalFetch = globalThis.fetch;

/** Captured (url, body) pairs for the mocked fetch. */
const fetchCalls: Array<{ url: string; body: string | null }> = [];

/**
 * Install a fetch mock that records calls and returns the given Ollama-shaped
 * JSON. Pass `status` != 200 to exercise the error path.
 */
function installFetchMock(result: {
	embeddings: number[][];
	status?: number;
	statusText?: string;
}): void {
	fetchCalls.length = 0;
	const { embeddings, status = 200, statusText = "OK" } = result;
	globalThis.fetch = mock(
		async (url: RequestInfo | URL, init?: RequestInit) => {
			fetchCalls.push({ url: String(url), body: (init?.body as string) ?? null });
			return new Response(JSON.stringify({ embeddings }), { status, statusText });
		},
	) as unknown as typeof fetch;
}

beforeEach(() => {
	mockState.callCount = 0;
	mockState.pipelineCreateCount = 0;
	mockState.dims = null;
	mockState.shouldThrow = false;
	fetchCalls.length = 0;
	delete process.env.BEDS24_EMBEDDER;
	// Force the next embed() to re-pick a provider (and reset the cached
	// active embedder) so provider-selection tests are order-independent.
	__resetEmbedderForTests();
});

afterEach(() => {
	globalThis.fetch = originalFetch;
	delete process.env.BEDS24_EMBEDDER;
	__resetEmbedderForTests();
});

// ---------------------------------------------------------------------------
// LocalEmbedder (default provider)
// ---------------------------------------------------------------------------
describe("LocalEmbedder", () => {
	test("EMBED_DIM constant is 384 (CONTRACT.md frozen)", () => {
		expect(EMBED_DIM).toBe(384);
	});

	test("exposes id/model/dimension", () => {
		const emb = new LocalEmbedder();
		expect(emb.id).toBe("local");
		expect(emb.model).toBe("Xenova/all-MiniLM-L6-v2");
		expect(emb.dimension).toBe(384);
	});

	// Pipeline creation is per-instance: a fresh LocalEmbedder creates the
	// pipeline on first embed and caches it for subsequent calls.
	test("pipeline is created on first embed and cached afterwards", async () => {
		const emb = new LocalEmbedder();
		const before = mockState.pipelineCreateCount;
		await emb.embed(["warmup"]);
		expect(mockState.pipelineCreateCount).toBe(before + 1);
		await emb.embed(["again"]);
		expect(mockState.pipelineCreateCount).toBe(before + 1);
	});

	test("single text -> one 384-dim vector", async () => {
		const emb = new LocalEmbedder();
		const before = mockState.callCount;
		const vecs = await emb.embed(["hello"]);
		expect(vecs).toHaveLength(1);
		expect(vecs[0]?.length).toBe(384);
		expect(mockState.callCount).toBe(before + 1); // mock actually wired
	});

	test("two texts -> two 384-dim vectors, one batched model call", async () => {
		const emb = new LocalEmbedder();
		const before = mockState.callCount;
		const vecs = await emb.embed(["a", "b"]);
		expect(vecs).toHaveLength(2);
		expect(vecs[0]?.length).toBe(384);
		expect(vecs[1]?.length).toBe(384);
		// Batching: both texts embedded in a single forward pass.
		expect(mockState.callCount).toBe(before + 1);
	});

	test("empty input -> [] and NO model call", async () => {
		const emb = new LocalEmbedder();
		const beforeCalls = mockState.callCount;
		const beforeCreates = mockState.pipelineCreateCount;
		const vecs = await emb.embed([]);
		expect(vecs).toEqual([]);
		expect(mockState.callCount).toBe(beforeCalls); // model never touched
		expect(mockState.pipelineCreateCount).toBe(beforeCreates); // pipeline never built
	});

	test("all returned values are finite (no NaN / Infinity)", async () => {
		const vecs = await new LocalEmbedder().embed(["finite", "numbers", "only"]);
		expect(vecs).toHaveLength(3);
		for (const v of vecs) {
			for (const x of v) {
				expect(Number.isFinite(x)).toBe(true);
			}
		}
	});

	test("output vectors are unit-normalized (L2 norm ~1)", async () => {
		const vecs = await new LocalEmbedder().embed(["normalize me"]);
		const vec = vecs[0] as number[] | undefined;
		expect(vec).toBeDefined();
		let sumSq = 0;
		for (const x of vec as number[]) sumSq += x * x;
		expect(Math.sqrt(sumSq)).toBeCloseTo(1, 5);
	});

	test("different rows produce different embeddings", async () => {
		const vecs = await new LocalEmbedder().embed(["row0", "row1"]);
		const a = vecs[0] as number[] | undefined;
		const b = vecs[1] as number[] | undefined;
		expect(a).toHaveLength(EMBED_DIM);
		expect(b).toHaveLength(EMBED_DIM);
		// Different inputs -> different embeddings.
		expect(a).not.toEqual(b);
	});

	test("embed rejects when the model throws", async () => {
		mockState.shouldThrow = true;
		await expect(new LocalEmbedder().embed(["boom"])).rejects.toThrow("mock model failure");
	});

	test("dims.length < 2 falls back to a single row", async () => {
		mockState.dims = [EMBED_DIM]; // 1-D shape
		const vecs = await new LocalEmbedder().embed(["edge", "case"]);
		// Slicing collapses to one row regardless of input count.
		expect(vecs).toHaveLength(1);
		expect(vecs[0]?.length).toBe(EMBED_DIM);
	});

	test("nullish dims[0] falls back to rows = 1", async () => {
		// dims.length >= 2 but dims[0] is undefined -> ?? 1.
		mockState.dims = [undefined as unknown as number, EMBED_DIM];
		const vecs = await new LocalEmbedder().embed(["x"]);
		expect(vecs).toHaveLength(1);
		expect(vecs[0]?.length).toBe(EMBED_DIM);
	});

	test("nullish last dim falls back to cols = EMBED_DIM", async () => {
		mockState.dims = [2, undefined as unknown as number];
		const vecs = await new LocalEmbedder().embed(["p", "q"]);
		expect(vecs).toHaveLength(2);
		for (const v of vecs) expect(v).toHaveLength(EMBED_DIM);
	});
});

// ---------------------------------------------------------------------------
// embed() backward-compat wrapper
// ---------------------------------------------------------------------------
describe("embed() wrapper", () => {
	test("routes to the default LocalEmbedder", async () => {
		const vecs = await embed(["hi"]);
		expect(vecs).toHaveLength(1);
		expect(vecs[0]?.length).toBe(384);
	});

	test("empty input -> [] and NO model call", async () => {
		const beforeCalls = mockState.callCount;
		const beforeCreates = mockState.pipelineCreateCount;
		const vecs = await embed([]);
		expect(vecs).toEqual([]);
		expect(mockState.callCount).toBe(beforeCalls);
		expect(mockState.pipelineCreateCount).toBe(beforeCreates);
	});

	test("caches the active embedder for the process lifetime", async () => {
		const before = mockState.pipelineCreateCount;
		await embed(["first"]); // creates the active embedder + its pipeline
		const afterFirst = mockState.pipelineCreateCount;
		expect(afterFirst).toBe(before + 1);
		await embed(["second"]); // reuses the cached embedder + pipeline
		expect(mockState.pipelineCreateCount).toBe(afterFirst);
	});

	test("respects BEDS24_EMBEDDER env to pick a provider", async () => {
		process.env.BEDS24_EMBEDDER = "ollama-bge-small";
		installFetchMock({ embeddings: [[0.1, 0.2, 0.3]] });
		const vecs = await embed(["hi"]);
		expect(vecs).toEqual([[0.1, 0.2, 0.3]]);
		expect(fetchCalls).toHaveLength(1);
		expect(fetchCalls[0]?.url).toBe("http://localhost:11434/api/embed");
	});
});

// ---------------------------------------------------------------------------
// OllamaEmbedder (multi-lingual)
// ---------------------------------------------------------------------------
describe("OllamaEmbedder", () => {
	test("bge-small: dim 384, id ollama-bge-small, default baseUrl", () => {
		const emb = new OllamaEmbedder({ model: "bge-small-en-v1.5" });
		expect(emb.model).toBe("bge-small-en-v1.5");
		expect(emb.id).toBe("ollama-bge-small");
		expect(emb.dimension).toBe(384);
	});

	test("bge-m3: dim 1024, id ollama-bge-m3", () => {
		const emb = new OllamaEmbedder({ model: "bge-m3" });
		expect(emb.model).toBe("bge-m3");
		expect(emb.id).toBe("ollama-bge-m3");
		expect(emb.dimension).toBe(1024);
	});

	test("custom baseUrl is used in the request URL", async () => {
		installFetchMock({ embeddings: [[0.1]] });
		const emb = new OllamaEmbedder({ model: "bge-m3", baseUrl: "http://example.com:1234" });
		await emb.embed(["x"]);
		expect(fetchCalls[0]?.url).toBe("http://example.com:1234/api/embed");
	});

	test("embed POSTs model + input and returns embeddings", async () => {
		installFetchMock({ embeddings: [[0.1, 0.2], [0.3, 0.4]] });
		const emb = new OllamaEmbedder({ model: "bge-small-en-v1.5" });
		const vecs = await emb.embed(["a", "b"]);
		expect(fetchCalls).toHaveLength(1);
		expect(fetchCalls[0]?.url).toBe("http://localhost:11434/api/embed");
		expect(JSON.parse(fetchCalls[0]!.body as string)).toEqual({
			model: "bge-small-en-v1.5",
			input: ["a", "b"],
		});
		expect(vecs).toEqual([[0.1, 0.2], [0.3, 0.4]]);
	});

	test("embed empty -> [] and NO fetch", async () => {
		installFetchMock({ embeddings: [[0.1]] });
		const before = fetchCalls.length;
		const vecs = await new OllamaEmbedder({ model: "bge-m3" }).embed([]);
		expect(vecs).toEqual([]);
		expect(fetchCalls.length).toBe(before); // short-circuits before fetching
	});

	test("embed throws on non-OK response", async () => {
		installFetchMock({ embeddings: [], status: 500, statusText: "Server Error" });
		const emb = new OllamaEmbedder({ model: "bge-small-en-v1.5" });
		await expect(emb.embed(["x"])).rejects.toThrow("Ollama embed failed: 500 Server Error");
	});
});

// ---------------------------------------------------------------------------
// createEmbedder factory
// ---------------------------------------------------------------------------
describe("createEmbedder", () => {
	test("default (no opts, no env) -> LocalEmbedder", () => {
		const emb = createEmbedder();
		expect(emb).toBeInstanceOf(LocalEmbedder);
		expect(emb.id).toBe("local");
		expect(emb.dimension).toBe(384);
	});

	test("provider 'ollama-bge-small' -> OllamaEmbedder dim 384", () => {
		const emb = createEmbedder({ provider: "ollama-bge-small" });
		expect(emb).toBeInstanceOf(OllamaEmbedder);
		expect(emb.id).toBe("ollama-bge-small");
		expect(emb.dimension).toBe(384);
	});

	test("provider 'ollama-bge-m3' -> OllamaEmbedder dim 1024", () => {
		const emb = createEmbedder({ provider: "ollama-bge-m3" });
		expect(emb).toBeInstanceOf(OllamaEmbedder);
		expect(emb.id).toBe("ollama-bge-m3");
		expect(emb.dimension).toBe(1024);
	});

	test("env BEDS24_EMBEDDER overrides the default", () => {
		process.env.BEDS24_EMBEDDER = "ollama-bge-m3";
		const emb = createEmbedder();
		expect(emb).toBeInstanceOf(OllamaEmbedder);
		expect(emb.dimension).toBe(1024);
	});

	test("provider opts take precedence over env", () => {
		process.env.BEDS24_EMBEDDER = "ollama-bge-m3";
		const emb = createEmbedder({ provider: "ollama-bge-small" });
		expect(emb).toBeInstanceOf(OllamaEmbedder);
		expect(emb.dimension).toBe(384);
	});

	test("unknown provider throws a helpful error", () => {
		expect(() => createEmbedder({ provider: "bogus" })).toThrow("unknown embedder: bogus");
	});
});

// ---------------------------------------------------------------------------
// __resetEmbedderForTests
// ---------------------------------------------------------------------------
describe("__resetEmbedderForTests", () => {
	test("forces the next embed() to re-pick the provider", async () => {
		process.env.BEDS24_EMBEDDER = "ollama-bge-small";
		installFetchMock({ embeddings: [[0.5]] });
		const first = await embed(["x"]);
		expect(first).toEqual([[0.5]]); // ollama path (fetch mocked)

		// Switch provider via env, reset the cache, embed again.
		delete process.env.BEDS24_EMBEDDER;
		__resetEmbedderForTests();
		const before = mockState.callCount;
		const vecs = await embed(["y"]);
		expect(mockState.callCount).toBe(before + 1); // local path actually ran
		expect(vecs[0]?.length).toBe(384);
	});
});
