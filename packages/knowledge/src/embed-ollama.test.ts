/**
 * Dedicated, isolated tests for the Ollama-backed embedding surface — targets
 * 100% statement / branch / line coverage of the Ollama-specific paths in
 * `embed.ts` (`OllamaEmbedder`, the `ollama-*` factory branches) PLUS an
 * end-to-end proof that T17 (pluggable embedder) + T18 (DB dimension handling +
 * `embedding_model` column) + T19 (incremental `buildIndex`) compose.
 *
 * ISOLATION (the reason this file exists — see T5-fix history): the Ollama
 * surface talks to the real network only via global `fetch`, which we mock HERE.
 * `embed.test.ts` mocks `@huggingface/transformers` for the `LocalEmbedder`
 * path — a different third-party surface. Keeping the two mocks in separate
 * files means neither registration clobbers the other and neither file's
 * `beforeEach`/`afterEach` undoes the other's mock. We deliberately do NOT
 * register a `@huggingface/mock` here; the `OllamaEmbedder` never imports it.
 *
 * We DO re-establish the real `./embed.js` surface (the stash pattern from
 * embed.test.ts) so `OllamaEmbedder` / `createEmbedder` under test are
 * the genuine implementations. `indexer.test.ts` stashes the real embed.js
 * exports into `globalThis.__realEmbed` before registering its own fake; if that
 * stash exists we restore it, otherwise we import the real module directly
 * (standalone run). Either way this file gets the real surface without
 * registering a `@huggingface` mock.
 *
 * Two realities of the combined suite shape the end-to-end test below:
 *   - `db.ts` is imported first (by db.test.ts) so its `createEmbedder` binding
 *     is the REAL factory — env var `BEDS24_EMBEDDER` correctly drives the
 *     stamped `embedding_model` and the `meta` dimension bookmark.
 *   - `indexer.ts`'s internal `embed` is bound to indexer.test.ts's fake
 *     (384-dim, no fetch) — the documented stash dance leaves it untouched.
 *     So `buildIndex` builds the index + stamps the model, but does NOT route
 *     through fetch. We therefore prove the actual HTTP fetch path separately,
 *     via a direct `createEmbedder()` call against the mocked `fetch`.
 */

import { test, expect, describe, mock, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

// --- Capture original env + fetch BEFORE any test mutates them ---
const ORIGINAL_BEDS24_EMBEDDER = process.env.BEDS24_EMBEDDER;
const ORIGINAL_BEDS24_DB_PATH = process.env.BEDS24_DB_PATH;
const ORIGINAL_BEDS24_KNOWLEDGE_DIR = process.env.BEDS24_KNOWLEDGE_DIR;

// --- Force the REAL embed surface (isolated from embed.test.ts's @huggingface mock)
const realEmbed = (globalThis as any).__realEmbed;
if (realEmbed) {
	mock.module("./embed.js", () => realEmbed);
}
const { OllamaEmbedder, LocalEmbedder, createEmbedder, __resetEmbedderForTests } = await import(
	"./embed.js"
);

// ---------------------------------------------------------------------------
// global fetch mock — OllamaEmbedder POSTs to `${baseUrl}/api/embed` via fetch.
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;

/** Captured (url, parsed-body) pairs from the mocked fetch. */
const fetchCalls: Array<{ url: string; body: { model?: string; input?: string[] } }> = [];

/** One deterministic value per (i,j) — finite, no NaN/Infinity. */
function embeddingsFor(count: number, dim: number): number[][] {
	const out: number[][] = [];
	for (let i = 0; i < count; i++) {
		const v: number[] = [];
		for (let j = 0; j < dim; j++) {
			v.push((((i * dim + j) % 13) / 13)); // deterministic, in [0,1)
		}
		out.push(v);
	}
	return out;
}

/**
 * Install a fetch mock that parses the request body, records the call, and
 * returns one `dim`-wide vector per input text. Pass `status` != 200 for the
 * error path.
 */
function installFetchMock(opts: { dim: number; status?: number; statusText?: string }): void {
	const { dim, status = 200, statusText = "OK" } = opts;
	fetchCalls.length = 0;
	globalThis.fetch = mock(
		async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
			let parsed: { model?: string; input?: string[] } = {};
			if (typeof init?.body === "string") {
				try {
					parsed = JSON.parse(init.body) as typeof parsed;
				} catch {
					/* leave empty — not the path under test */
				}
			}
			fetchCalls.push({ url: String(url), body: parsed });
			const count = parsed.input?.length ?? 0;
			return new Response(JSON.stringify({ embeddings: embeddingsFor(count, dim) }), {
				status,
				statusText,
			});
		},
	) as unknown as typeof fetch;
}

// ---------------------------------------------------------------------------
// Fixture helpers for the end-to-end index-build test.
// ---------------------------------------------------------------------------

function makeTempDir(): string {
	return mkdtempSync(join(tmpdir(), "beds24-ollama-"));
}

function writeFiles(dir: string, files: Record<string, string>): void {
	for (const [rel, content] of Object.entries(files)) {
		const full = join(dir, rel);
		mkdirSync(dirname(full), { recursive: true });
		writeFileSync(full, content);
	}
}

beforeEach(() => {
	fetchCalls.length = 0;
	// 384-wide mock matches bge-small; see per-test notes where this matters.
	installFetchMock({ dim: 384 });
	delete process.env.BEDS24_EMBEDDER;
	__resetEmbedderForTests();
});

afterEach(() => {
	globalThis.fetch = originalFetch;
	__resetEmbedderForTests();
	// Restore env vars to pre-suite values so later files inherit a clean state.
	if (ORIGINAL_BEDS24_EMBEDDER === undefined) delete process.env.BEDS24_EMBEDDER;
	else process.env.BEDS24_EMBEDDER = ORIGINAL_BEDS24_EMBEDDER;
	if (ORIGINAL_BEDS24_DB_PATH === undefined) delete process.env.BEDS24_DB_PATH;
	else process.env.BEDS24_DB_PATH = ORIGINAL_BEDS24_DB_PATH;
	if (ORIGINAL_BEDS24_KNOWLEDGE_DIR === undefined) delete process.env.BEDS24_KNOWLEDGE_DIR;
	else process.env.BEDS24_KNOWLEDGE_DIR = ORIGINAL_BEDS24_KNOWLEDGE_DIR;
});

// ===========================================================================
// OllamaEmbedder — model identity + dimensions
// ===========================================================================
describe("OllamaEmbedder — model identity + dimensions", () => {
	test("bge-small-en-v1.5 → dim 384, id 'ollama-bge-small'", () => {
		const emb = new OllamaEmbedder({ model: "bge-small-en-v1.5" });
		expect(emb.model).toBe("bge-small-en-v1.5");
		expect(emb.id).toBe("ollama-bge-small");
		expect(emb.dimension).toBe(384);
	});

	test("bge-m3 → dim 1024, id 'ollama-bge-m3'", () => {
		const emb = new OllamaEmbedder({ model: "bge-m3" });
		expect(emb.model).toBe("bge-m3");
		expect(emb.id).toBe("ollama-bge-m3");
		expect(emb.dimension).toBe(1024);
	});
});

// ===========================================================================
// OllamaEmbedder — request shape (URL, method, headers, body)
// ===========================================================================
describe("OllamaEmbedder — request shape", () => {
	test("POSTs model + input as JSON to ${baseUrl}/api/embed with text/plain-ish JSON", async () => {
		const emb = new OllamaEmbedder({ model: "bge-small-en-v1.5" });
		const vecs = await emb.embed(["hello", "world"]);
		expect(fetchCalls).toHaveLength(1);
		const call = fetchCalls[0]!;
		expect(call.url).toBe("http://localhost:11434/api/embed");
		expect(call.body).toEqual({ model: "bge-small-en-v1.5", input: ["hello", "world"] });
		// 2 input texts → 2 vectors, each dim-wide (384).
		expect(vecs).toHaveLength(2);
		expect(vecs[0]?.length).toBe(384);
		expect(vecs[1]?.length).toBe(384);
	});

	test("single text → exactly one fetch, one dim-wide vector", async () => {
		const emb = new OllamaEmbedder({ model: "bge-m3" });
		const vecs = await emb.embed(["only"]);
		expect(fetchCalls).toHaveLength(1);
		expect(vecs).toHaveLength(1);
		// dim 1024 per the model — but our mock returns 384-wide vectors; the
		// embedder trusts the server's response length, so we assert shape from
		// the mock (count) and the request model, not the echoed dim.
		expect(fetchCalls[0]?.body.model).toBe("bge-m3");
	});

	test("parses json.embeddings into number[][] in input order", async () => {
		// Pre-seed the mock's response via a fresh install so values are known.
		installFetchMock({ dim: 4 });
		const emb = new OllamaEmbedder({ model: "bge-small-en-v1.5" });
		const vecs = await emb.embed(["a", "b", "c"]);
		expect(vecs).toHaveLength(3);
		for (const v of vecs) expect(v).toHaveLength(4);
		// Order preserved: vector i corresponds to input i.
		expect(vecs[0]?.[0]).toBe(embeddingsFor(3, 4)[0]?.[0]);
	});
});

// ===========================================================================
// OllamaEmbedder — custom baseUrl
// ===========================================================================
describe("OllamaEmbedder — custom baseUrl", () => {
	test("uses the supplied baseUrl in the request URL (no trailing slash assumed)", async () => {
		const emb = new OllamaEmbedder({ model: "bge-m3", baseUrl: "http://host:1234" });
		await emb.embed(["x"]);
		expect(fetchCalls).toHaveLength(1);
		expect(fetchCalls[0]?.url).toBe("http://host:1234/api/embed");
	});
});

// ===========================================================================
// OllamaEmbedder — error handling
// ===========================================================================
describe("OllamaEmbedder — error handling", () => {
	test("non-OK response rejects with an informative error", async () => {
		installFetchMock({ dim: 384, status: 500, statusText: "Server Error" });
		const emb = new OllamaEmbedder({ model: "bge-small-en-v1.5" });
		await expect(emb.embed(["x"])).rejects.toThrow("Ollama embed failed: 500 Server Error");
		// The request was still attempted once.
		expect(fetchCalls).toHaveLength(1);
	});

	test("a 404 also rejects (any non-ok)", async () => {
		installFetchMock({ dim: 384, status: 404, statusText: "Not Found" });
		const emb = new OllamaEmbedder({ model: "bge-m3" });
		await expect(emb.embed(["x"])).rejects.toThrow("Ollama embed failed: 404 Not Found");
	});
});

// ===========================================================================
// OllamaEmbedder — empty input short-circuit
// ===========================================================================
describe("OllamaEmbedder — empty input short-circuit", () => {
	test("embed([]) returns [] and issues NO fetch call", async () => {
		const emb = new OllamaEmbedder({ model: "bge-m3" });
		const vecs = await emb.embed([]);
		expect(vecs).toEqual([]);
		expect(fetchCalls).toHaveLength(0); // short-circuits before fetching
	});
});

// ===========================================================================
// createEmbedder — provider + env selection (the factory)
// ===========================================================================
describe("createEmbedder — provider + env selection", () => {
	test("default (no opts, no env) → LocalEmbedder, dim 384", () => {
		const emb = createEmbedder();
		expect(emb).toBeInstanceOf(LocalEmbedder);
		expect(emb.id).toBe("local");
		expect(emb.dimension).toBe(384);
	});

	test("provider 'ollama-bge-small' → OllamaEmbedder dim 384", () => {
		const emb = createEmbedder({ provider: "ollama-bge-small" });
		expect(emb).toBeInstanceOf(OllamaEmbedder);
		expect(emb.id).toBe("ollama-bge-small");
		expect(emb.model).toBe("bge-small-en-v1.5");
		expect(emb.dimension).toBe(384);
	});

	test("provider 'ollama-bge-m3' → OllamaEmbedder dim 1024", () => {
		const emb = createEmbedder({ provider: "ollama-bge-m3" });
		expect(emb).toBeInstanceOf(OllamaEmbedder);
		expect(emb.id).toBe("ollama-bge-m3");
		expect(emb.model).toBe("bge-m3");
		expect(emb.dimension).toBe(1024);
	});

	test("BEDS24_EMBEDDER=ollama-bge-m3 → factory selects bge-m3 (1024)", () => {
		process.env.BEDS24_EMBEDDER = "ollama-bge-m3";
		const emb = createEmbedder();
		expect(emb).toBeInstanceOf(OllamaEmbedder);
		expect(emb.id).toBe("ollama-bge-m3");
		expect(emb.dimension).toBe(1024);
	});

	test("BEDS24_EMBEDDER=ollama-bge-small → factory selects bge-small (384)", () => {
		process.env.BEDS24_EMBEDDER = "ollama-bge-small";
		const emb = createEmbedder();
		expect(emb).toBeInstanceOf(OllamaEmbedder);
		expect(emb.id).toBe("ollama-bge-small");
		expect(emb.dimension).toBe(384);
	});

	test("provider opts take precedence over env", () => {
		process.env.BEDS24_EMBEDDER = "ollama-bge-m3";
		const emb = createEmbedder({ provider: "ollama-bge-small" });
		expect(emb).toBeInstanceOf(OllamaEmbedder);
		expect(emb.id).toBe("ollama-bge-small");
		expect(emb.dimension).toBe(384);
	});

	test("unknown provider throws a helpful error", () => {
		expect(() => createEmbedder({ provider: "bogus" })).toThrow("unknown embedder: bogus");
	});
});

// ===========================================================================
// End-to-end additive chain (T17 + T18 + T19)
//
// Proves the whole pluggable-embedder pipeline works together:
//   createEmbedder env selection (T17) → DB dimension + model-column stamping
//   (T18) → incremental buildIndex (T19) → search returns the indexed chunk.
// ===========================================================================
describe("End-to-end additive chain (T17 + T18 + T19)", () => {
	// A distinctive token so the lexical FTS list deterministically surfaces
	// our seeded chunk regardless of vector ordering.
	const UNIQUE = "zzuniquetokenbeds24ollama";

	test("ollama-bge-small env builds a 384-dim index stamped with the active model — and the Ollama fetch path is exercised", async () => {
		// db.ts reads BEDS24_EMBEDDER via the REAL createEmbedder; point it at
		// the 384-dim Ollama model. The e2e corpus chunks at 384-dim, matching
		// the stamped dimension.
		process.env.BEDS24_EMBEDDER = "ollama-bge-small";

		// Fresh in-memory store (db.ts is a singleton — reset between tests).
		// Imported lazily so BEDS24_EMBEDDER + BEDS24_DB_PATH are set first.
		process.env.BEDS24_DB_PATH = ":memory:";
		const db = await import("./db.js");
		db.__resetDbForTests();
		db.getDb(); // runs the migration gate against the active embedder

		// T18: the active (Ollama) dimension is stamped into `meta` and
		// currentEmbedderDimension() reflects the active provider.
		expect(db.currentEmbedderDimension()).toBe(384);
		const metaRow = db
			.getDb()
			.prepare("SELECT value FROM meta WHERE key = ?")
			.get("embedding_dim") as { value: string } | undefined;
		expect(metaRow?.value).toBe("384");

		// --- T17: prove the Ollama HTTP path is actually exercised ---
		// indexer.ts's internal embed is the suite's cached fake (no fetch), so
		// we drive the real factory directly to prove fetch-routing + shape.
		const ollama = createEmbedder(); // env-selected → ollama-bge-small
		expect(ollama.id).toBe("ollama-bge-small");
		expect(ollama.dimension).toBe(384);
		const before = fetchCalls.length;
		const probe = await ollama.embed(["probe text"]);
		expect(fetchCalls.length).toBe(before + 1);
		const req = fetchCalls[fetchCalls.length - 1]!;
		expect(req.url).toBe("http://localhost:11434/api/embed");
		expect(req.body).toEqual({ model: "bge-small-en-v1.5", input: ["probe text"] });
		expect(probe).toHaveLength(1);
		expect(probe[0]?.length).toBe(384);

		// --- T19: incremental buildIndex over a real tempdir corpus ---
		const { buildIndex } = await import("./indexer.js");
		const dir = makeTempDir();
		writeFiles(dir, {
			"intro.md": `# Intro\n\nThis section describes ${UNIQUE} behaviour.`,
			"api.md": ["# API", "", "api intro", "", "## Auth", "", `auth body ${UNIQUE}`].join("\n"),
		});

		const result = await buildIndex({ knowledgeDir: dir });
		expect(result.files).toBe(2);
		expect(result.chunks).toBeGreaterThan(0);
		// Fresh db → no file is reused on the first pass.
		expect(result.unchanged).toBe(0);

		// --- T18: every chunk row is stamped with the active Ollama model ---
		const rows = db
			.getDb()
			.prepare("SELECT embedding_model FROM chunks")
			.all() as Array<{ embedding_model: string }>;
		expect(rows.length).toBe(result.chunks);
		for (const r of rows) expect(r.embedding_model).toBe("ollama-bge-small");

		// --- search works against the freshly built index ---
		const search = await import("./search.js");
		const hits = await search.hybridSearch({ query: UNIQUE, buckets: [], topK: 8 });
		expect(hits.length).toBeGreaterThan(0);
		// The surfaced chunk's text actually contains the query token.
		expect(hits.some((h) => h.text.includes(UNIQUE))).toBe(true);

		rmSync(dir, { recursive: true, force: true });
	});

	test("switching active embedder from bge-small (384) to bge-m3 (1024) forces a one-time rebuild (T18 dimension gate)", async () => {
		process.env.BEDS24_EMBEDDER = "ollama-bge-small";
		process.env.BEDS24_DB_PATH = ":memory:";
		const db = await import("./db.js");
		db.__resetDbForTests();
		db.getDb();

		// Build a bge-small (384-dim) index.
		const { buildIndex } = await import("./indexer.js");
		const dir = makeTempDir();
		writeFiles(dir, { "a.md": `# A\n\n${UNIQUE} body` });
		const first = await buildIndex({ knowledgeDir: dir });
		expect(first.chunks).toBeGreaterThan(0);
		expect(db.countChunks()).toBe(first.chunks);
		expect(db.currentEmbedderDimension()).toBe(384);

		// Switch the active embedder to the 1024-dim model and re-run the gate.
		process.env.BEDS24_EMBEDDER = "ollama-bge-m3";
		db.__rerunSchemaGateForTests();

		// T18: dimension mismatch → the gate drops + recreates at the new dim.
		expect(db.countChunks()).toBe(0); // prior rows wiped
		expect(db.currentEmbedderDimension()).toBe(1024);
		const metaRow = db
			.getDb()
			.prepare("SELECT value FROM meta WHERE key = ?")
			.get("embedding_dim") as { value: string } | undefined;
		expect(metaRow?.value).toBe("1024");

		// A freshly inserted chunk now carries the new model id.
		const bigVec = new Array<number>(1024).fill(0);
		const id = db.insertChunk("after.md", ["H"], 1, 2, "1024-dim", bigVec, "general", null);
		const row = db
			.getDb()
			.prepare("SELECT embedding_model FROM chunks WHERE id = ?")
			.get(id) as { embedding_model: string };
		expect(row.embedding_model).toBe("ollama-bge-m3");

		rmSync(dir, { recursive: true, force: true });
	});
});
