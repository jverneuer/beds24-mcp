/**
 * Unit tests for search.ts — targets 100% statement / branch / line coverage.
 *
 * Hybrid search (`hybridSearch`) merges a vector-cosine candidate list with an
 * FTS5 candidate list via Reciprocal Rank Fusion (RRF, k=60). These tests
 * drive every branch of that pipeline in isolation:
 *
 *   - Pure helpers (`toFtsQuery`, `rrfMerge`): table-driven, no mocking.
 *   - DB/search paths: an in-memory libsql store (see TEST-HARNESS.md) seeded
 *     with deterministic 384-dim embeddings so we control vector distances, plus
 *     a module-mocked `embed()` that returns a fixed query vector — making the
 *     whole pipeline deterministic and offline.
 *
 * Environment note (`bun test` + libsql 0.4.7 + sqlite-vec 0.1.9):
 * `vec_distance_cosine(embedding, ?)` only works in the production-shaped query
 * (`ORDER BY distance ASC LIMIT ?`). A bare `SELECT vec_distance_cosine(...)`
 * (no ORDER BY) triggers a native `unwrap()` panic in libsql that aborts the
 * thread. We therefore exercise the vector path exclusively through the real
 * exported search functions and never issue raw cosine queries.
 */

import { test, expect, describe, beforeEach, afterEach, mock } from "bun:test";
import type { Bucket } from "./markdown/frontmatter.js";
import type { SearchHit, HybridSearchOpts } from "./search.js";

// Point the store at an in-memory database BEFORE importing the module graph —
// `paths.ts` reads `BEDS24_DB_PATH` once, at import time.
process.env.BEDS24_DB_PATH = ":memory:";

/** Fixed query vector returned by the mocked embedder for ANY input text. */
const Q = makeUnitVector(1, 384);

/** Mutable mock configuration, reset in beforeEach (see embed.test.ts pattern). */
const embedState = {
  /** "normal" returns Q; "empty" returns [] (simulates embed producing nothing). */
  mode: "normal" as "normal" | "empty",
};

/**
 * Mock the local embed surface: `search.ts` imports only `embed` from this
 * module, so the factory provides exactly that. Returning a constant `Q` makes
 * the query vector deterministic, so seeding a chunk with `Q` guarantees it is
 * the top vector hit (distance 0).
 */
const embedMock = mock(async (texts: string[]): Promise<number[][]> => {
  if (embedState.mode === "empty") return [];
  return texts.map(() => Q);
});
// `db.js` now imports `createEmbedder` from this module (T18's dimension
// handling) in addition to the `embed` that `search.ts` uses — so the mock
// factory must surface both, or the `db` import below throws on load.
mock.module("./embed.js", () => ({
  embed: embedMock,
  createEmbedder: mock(() => ({ id: "local", dimension: 384, embed: embedMock })),
}));

// Import AFTER registering the mock + env so the singleton opens :memory: and
// `embed` resolves to the mock.
const db = await import("./db.js");
const search = await import("./search.js");

/** A deterministic, L2-normalized vector (mirrors embed.test.ts's generator). */
function makeUnitVector(seed: number, len: number): number[] {
  // Build via a plain array first: noUncheckedIndexedAccess types typed-array
  // element access as `number | undefined`.
  const tmp: number[] = new Array<number>(len);
  let sumSq = 0;
  for (let i = 0; i < len; i++) {
    const val = Math.sin(seed + i * 0.137) * 0.5 + Math.cos(seed * 0.7 + i * 0.311);
    tmp[i] = val;
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq);
  for (let i = 0; i < len; i++) {
    const t = tmp[i] as number;
    tmp[i] = norm > 0 ? t / norm : 0;
  }
  return tmp;
}

/**
 * Seed one chunk. `embeddingSeed` picks a unit vector; pass `1` to make the
 * chunk identical to the query vector Q (cosine distance 0 → top vector hit).
 */
function seedChunk(
  tag: string,
  text: string,
  bucket: Bucket,
  embeddingSeed: number,
  headingPath: string[] = ["Section", "Sub"],
  docUrl: string | null = null,
  lineStart = 1,
  lineEnd = 10,
): number {
  return db.insertChunk(
    `${tag}.md`,
    headingPath,
    lineStart,
    lineEnd,
    text,
    makeUnitVector(embeddingSeed, db.EMBED_DIM),
    bucket,
    docUrl,
  );
}

/** A structurally-complete `ChunkDataRow` (the type is not exported). */
function chunkRow(id: number): {
  id: number;
  source_file: string;
  heading_path: string;
  line_start: number;
  line_end: number;
  text: string;
  bucket: string;
  doc_url: string | null;
} {
  return {
    id,
    source_file: `f${id}.md`,
    heading_path: "[]",
    line_start: 1,
    line_end: 2,
    text: `row ${id}`,
    bucket: "general",
    doc_url: null,
  };
}

beforeEach(() => {
  // Fresh in-memory db + cleared flags for every test (additive T3 hooks).
  db.__resetDbForTests();
  embedState.mode = "normal";
});

afterEach(() => {
  db.__resetDbForTests();
});

// ---------------------------------------------------------------------------
// toFtsQuery — pure, table-driven
// ---------------------------------------------------------------------------
describe("toFtsQuery (pure)", () => {
  test("the canonical multi-token example", () => {
    expect(search.toFtsQuery("how does pricing work?")).toBe(
      '"how" OR "does" OR "pricing" OR "work"',
    );
  });

  const cases: Array<[string, string, string]> = [
    ["empty string", "", ""],
    ["non-alphanumeric only", "!!! @#$", ""],
    ["whitespace only", "   \t  ", ""],
    ["single token", "pricing", '"pricing"'],
    ["leading/trailing whitespace", "  hello  ", '"hello"'],
    ["multiple tokens + whitespace", "  a   b   c  ", '"a" OR "b" OR "c"'],
    ["hyphen splits tokens", "e-book", '"e" OR "book"'],
    ["apostrophe splits tokens", "it's", '"it" OR "s"'],
    ["digits are indexable", "room 42", '"room" OR "42"'],
    ["quoted phrase tokens stripped", 'say "hello" world', '"say" OR "hello" OR "world"'],
  ];
  for (const [label, input, expected] of cases) {
    test(label, () => {
      expect(search.toFtsQuery(input)).toBe(expected);
    });
  }

  // Tokenization splits on non-alphanumerics, so a double-quote never survives
  // into a token — it is dropped, not escaped. (The source's `"`→`""` replace is
  // defensive but unreachable for quoted input.)
  test("internal quotes are dropped by tokenization, not doubled", () => {
    expect(search.toFtsQuery('a"b"c')).toBe('"a" OR "b" OR "c"');
  });
});

// ---------------------------------------------------------------------------
// rrfMerge — pure, table-driven (Turso-style RRF, k=60)
// ---------------------------------------------------------------------------
describe("rrfMerge (pure, k=60)", () => {
  const K = 60;

  test("single list scores 1/(k+rank), descending, order preserved", () => {
    const rows = [chunkRow(1), chunkRow(2), chunkRow(3)];
    const out = search.rrfMerge([rows]);
    expect(out).toHaveLength(3);
    expect(out.map((s) => s.score)).toEqual([
      1 / (K + 0),
      1 / (K + 1),
      1 / (K + 2),
    ]);
    expect(out.map((s) => s.row.id)).toEqual([1, 2, 3]);
  });

  test("two disjoint lists: both present, each scored by its own rank", () => {
    const out = search.rrfMerge([
      [chunkRow(1), chunkRow(2)],
      [chunkRow(3), chunkRow(4)],
    ]);
    const byId = new Map(out.map((s) => [s.row.id, s.score]));
    const score = (id: number) => byId.get(id) as number;
    expect(score(1)).toBe(1 / (K + 0));
    expect(score(2)).toBe(1 / (K + 1));
    expect(score(3)).toBe(1 / (K + 0));
    expect(score(4)).toBe(1 / (K + 1));
    // Highest contributions (rank 0 in either list) sort to the top.
    expect(out[0]?.row.id).toEqual(1);
    expect(out[1]?.row.id).toEqual(3);
  });

  test("overlapping id accumulates contributions from both lists", () => {
    const out = search.rrfMerge([
      [chunkRow(1), chunkRow(2)],
      [chunkRow(1), chunkRow(3)],
    ]);
    const byId = new Map(out.map((s) => [s.row.id, s.score]));
    const score = (id: number) => byId.get(id) as number;
    // id 1 ranks 0th in both lists → 1/60 + 1/60 = 2/60 (the highest score).
    expect(score(1)).toBeCloseTo(1 / (K + 0) + 1 / (K + 0), 10);
    expect(score(2)).toBe(1 / (K + 1));
    expect(score(3)).toBe(1 / (K + 1));
    // The key RRF property: present in both lists beats present in one.
    expect(out[0]?.row.id).toBe(1);
    expect(out[0]?.score).toBeGreaterThan(score(2));
  });

  test("the k=60 constant is wired correctly (and a custom k overrides it)", () => {
    const out60 = search.rrfMerge([[chunkRow(1)]]);
    expect(out60[0]?.score).toBe(1 / 60);
    const out100 = search.rrfMerge([[chunkRow(1)]], 100);
    expect(out100[0]?.score).toBe(1 / 100);
  });

  test("empty input → []", () => {
    expect(search.rrfMerge([])).toEqual([]);
    expect(search.rrfMerge([[], []])).toEqual([]);
  });

  test("best-first input order is reflected in descending scores", () => {
    // Reverse-id input must still yield monotonically descending scores.
    const out = search.rrfMerge([[chunkRow(3), chunkRow(2), chunkRow(1)]]);
    expect(out.map((s) => s.score)).toEqual([
      1 / (K + 0),
      1 / (K + 1),
      1 / (K + 2),
    ]);
  });
});

// ---------------------------------------------------------------------------
// search / searchAll / searchInBucket / hybridSearch
// ---------------------------------------------------------------------------
describe("search entry points (mock embed + in-memory db)", () => {
  test("search() restricts to SAFE_BUCKETS — deprecated chunk is excluded", async () => {
    const safeId = seedChunk("safe", "pricing rules", "apiv2", 1);
    const unsafeId = seedChunk("old", "pricing rules", "deprecated", 1);
    const hits = await search.search("pricing", 8);
    const ids = hits.map((h) => h.id);
    expect(ids).toContain(safeId);
    expect(ids).not.toContain(unsafeId);
    expect(hits.every((h) => h.bucket === "apiv2" || h.bucket === "general")).toBe(true);
  });

  test("searchAll() returns across all buckets, including deprecated", async () => {
    const apiv2 = seedChunk("v2", "pricing rules", "apiv2", 1);
    const deprecated = seedChunk("old", "pricing rules", "deprecated", 2);
    const hits = await search.searchAll("pricing", 8);
    const ids = hits.map((h) => h.id);
    expect(ids).toContain(apiv2);
    expect(ids).toContain(deprecated);
  });

  test("searchInBucket() returns only the chosen bucket", async () => {
    const apiv2 = seedChunk("v2", "pricing rules", "apiv2", 1);
    seedChunk("gen", "pricing rules", "general", 2);
    const hits = await search.searchInBucket("apiv2", "pricing", 8);
    expect(hits.map((h) => h.id)).toEqual([apiv2]);
  });

  test("searchInBucket() returns [] for an unknown bucket (no embed call)", async () => {
    const before = embedMock.mock.calls.length;
    const hits = await search.searchInBucket("not_a_bucket" as Bucket, "pricing", 8);
    expect(hits).toEqual([]);
    expect(embedMock.mock.calls.length).toBe(before); // short-circuits before embed
  });

  test("hybridSearch() embeds the query exactly once", async () => {
    seedChunk("v2", "pricing rules", "apiv2", 1);
    const before = embedMock.mock.calls.length;
    await search.hybridSearch({ query: "pricing", buckets: [], topK: 5 });
    expect(embedMock.mock.calls.length).toBe(before + 1);
  });

  test("hybridSearch() embeds each query exactly once (batching assertion)", async () => {
    seedChunk("v2", "pricing rules", "apiv2", 1);
    const before = embedMock.mock.calls.length;
    await search.hybridSearch({ query: "how does pricing work", buckets: [], topK: 5 });
    // The pipeline embeds a single-element array [query] per call.
    expect(embedMock.mock.calls.length).toBe(before + 1);
  });

  test("hybridSearch() returns [] on an empty index — and NEVER embeds", async () => {
    expect(db.countChunks()).toBe(0);
    const before = embedMock.mock.calls.length;
    const hits = await search.hybridSearch({ query: "anything", buckets: [], topK: 5 });
    expect(hits).toEqual([]);
    expect(embedMock.mock.calls.length).toBe(before); // embed must not be called
  });

  test("hybridSearch() returns [] when embed produces nothing", async () => {
    seedChunk("v2", "pricing rules", "apiv2", 1); // index non-empty so we reach embed
    embedState.mode = "empty";
    const before = embedMock.mock.calls.length;
    const hits = await search.hybridSearch({ query: "pricing", buckets: [], topK: 5 });
    expect(hits).toEqual([]);
    expect(embedMock.mock.calls.length).toBe(before + 1); // embed WAS called, returned []
  });

  test("hybridSearch() slices output to topK", async () => {
    for (let i = 1; i <= 5; i++) seedChunk(`c${i}`, "pricing rules here", "general", i);
    const hits = await search.hybridSearch({ query: "pricing", buckets: [], topK: 3 });
    expect(hits.length).toBe(3);
  });

  test("hybridSearch() passes candidateK through to the per-modality fetch", async () => {
    for (let i = 1; i <= 3; i++) seedChunk(`c${i}`, "pricing rules here", "general", i);
    // candidateK:1 caps each list at 1 candidate → at most 2 distinct results.
    const hits = await search.hybridSearch({
      query: "pricing",
      buckets: [],
      topK: 8,
      candidateK: 1,
    });
    expect(hits.length).toBeLessThanOrEqual(2);
  });

  test("hybridSearch() buckets []/undefined = all buckets; otherwise restricted", async () => {
    const deprecated = seedChunk("old", "pricing rules", "deprecated", 1);
    seedChunk("v2", "pricing rules", "apiv2", 2);
    const allBuckets = await search.hybridSearch({ query: "pricing", buckets: [], topK: 8 });
    const deprecatedBuckets = await search.hybridSearch({
      query: "pricing",
      buckets: ["deprecated"],
      topK: 8,
    });
    const undefinedBuckets = await search.hybridSearch({
      query: "pricing",
      buckets: undefined,
      topK: 8,
    });
    const allIds = allBuckets.map((h) => h.id);
    expect(allIds).toContain(deprecated); // [] → no filter
    expect(undefinedBuckets.map((h) => h.id)).toContain(deprecated); // undefined → no filter
    expect(deprecatedBuckets.map((h) => h.id)).toEqual([deprecated]); // explicit filter
  });

  test("hybridSearch() topK/candidateK default branches execute", async () => {
    for (let i = 1; i <= 2; i++) seedChunk(`c${i}`, "pricing rules here", "general", i);
    // No topK (→ default 8), no candidateK (→ default max(topK*5,50)=50).
    const hits = await search.hybridSearch({ query: "pricing", buckets: [] });
    expect(hits.length).toBeLessThanOrEqual(8);
    expect(hits.length).toBeGreaterThan(0);
  });

  test("hybridSearch() with a no-token query falls back to vector-only results", async () => {
    const id = seedChunk("c", "any text here", "general", 1);
    // "!!!" tokenizes to nothing → toFtsQuery("") → FTS list empty; vector still works.
    const hits = await search.hybridSearch({ query: "!!!", buckets: [], topK: 8 });
    expect(hits.map((h) => h.id)).toContain(id);
  });
});

// ---------------------------------------------------------------------------
// SearchHit shape
// ---------------------------------------------------------------------------
describe("SearchHit shape", () => {
  test("a hit exposes the full frozen shape, headingPath parsed from JSON", async () => {
    const id = seedChunk(
      "doc",
      "pricing rules",
      "apiv2",
      1,
      ["API", "Pricing", "Rules"],
      "https://example.com/pricing",
      5,
      42,
    );
    const hits = await search.searchInBucket("apiv2", "pricing", 8);
    const hit = hits.find((h) => h.id === id);
    expect(hit).toBeDefined();

    const h = hit as SearchHit;
    expect(typeof h.id).toBe("number");
    expect(h.text).toBe("pricing rules");
    expect(h.sourceFile).toBe("doc.md");
    // heading_path is stored as JSON and parsed back into an array.
    expect(h.headingPath).toEqual(["API", "Pricing", "Rules"]);
    expect(h.lines).toEqual([5, 42]);
    expect(h.bucket).toBe("apiv2");
    expect(h.docUrl).toBe("https://example.com/pricing");
    expect(typeof h.score).toBe("number");
    expect(h.score).toBeGreaterThan(0); // RRF score, unbounded, higher = better
  });

  test("a malformed heading_path is tolerated (→ []) by the JSON parse guard", async () => {
    // Seed directly via SQL with invalid JSON in heading_path, bypassing
    // insertChunk's JSON.stringify, to exercise the catch branch of toSearchHit.
    const conn = db.getDb();
    const blob = Buffer.from(new Float32Array(makeUnitVector(1, db.EMBED_DIM)).buffer);
    const info = conn
      .prepare(
        `INSERT INTO chunks
           (source_file, heading_path, line_start, line_end, text, embedding, bucket, doc_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run("bad.md", "{ not valid json", 1, 2, "pricing rules", blob, "general", null);
    const badId = Number((info as { lastInsertRowid: number | bigint }).lastInsertRowid);

    const hits = await search.searchAll("pricing", 8);
    const hit = hits.find((h) => h.id === badId);
    expect(hit).toBeDefined();
    expect((hit as SearchHit).headingPath).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Hybrid quality — the RRF point
// ---------------------------------------------------------------------------
describe("hybrid quality (RRF fusion)", () => {
  test("a chunk top in BOTH modalities outscores one top in only one", async () => {
    // "both": identical to Q (vector rank 0) AND matches the query lexically (FTS rank 0).
    const bothId = seedChunk("both", "pricing", "general", 1);
    // "vecOnly": does not match the query lexically (excluded from FTS list) but is
    // the next-closest vector (vector rank 1).
    const vecOnlyId = seedChunk("vec", "zzzznomatch", "general", 2);

    const hits = await search.hybridSearch({ query: "pricing", buckets: [], topK: 8 });
    const byId = new Map(hits.map((h) => [h.id, h.score]));

    const bothScore = byId.get(bothId) as number;
    const vecScore = byId.get(vecOnlyId) as number;

    // both = 1/60 (vec rank 0) + 1/60 (fts rank 0) = 2/60.
    expect(bothScore).toBeCloseTo(1 / 60 + 1 / 60, 10);
    // vecOnly = 1/61 (vec rank 1) + 0 (absent from FTS).
    expect(vecScore).toBeCloseTo(1 / 61, 10);
    // The whole point of RRF: consensus across modalities wins.
    expect(bothScore).toBeGreaterThan(vecScore);
    expect(hits[0]?.id).toBe(bothId);
  });
});

// ---------------------------------------------------------------------------
// Beds24Search facade
// ---------------------------------------------------------------------------
describe("Beds24Search facade", () => {
  test("delegates search/searchAll/searchInBucket to the entry points", async () => {
    const apiv2 = seedChunk("v2", "pricing rules", "apiv2", 1);
    const deprecated = seedChunk("old", "pricing rules", "deprecated", 2);

    const facade = new search.Beds24Search();

    const directSearch = await search.search("pricing", 8);
    const facadeSearch = await facade.search("pricing", 8);
    expect(facadeSearch.map((h) => h.id)).toEqual(directSearch.map((h) => h.id));

    const directAll = await search.searchAll("pricing", 8);
    const facadeAll = await facade.searchAll("pricing", 8);
    expect(facadeAll.map((h) => h.id)).toEqual(directAll.map((h) => h.id));
    // searchAll includes the deprecated bucket; search() does not.
    expect(facadeAll.map((h) => h.id)).toContain(deprecated);
    expect(facadeSearch.map((h) => h.id)).not.toContain(deprecated);

    const directBucket = await search.searchInBucket("apiv2", "pricing", 8);
    const facadeBucket = await facade.searchInBucket("apiv2", "pricing", 8);
    expect(facadeBucket.map((h) => h.id)).toEqual(directBucket.map((h) => h.id));
    expect(facadeBucket.map((h) => h.id)).toEqual([apiv2]);
  });

  test("facade exposes the same SearchHit shape the entry points return", async () => {
    seedChunk("v2", "pricing rules", "apiv2", 1);
    const hits = await new search.Beds24Search().search("pricing", 8);
    expect(hits.length).toBeGreaterThan(0);
    const h = hits[0] as SearchHit;
    expect(h).toHaveProperty("id");
    expect(h).toHaveProperty("text");
    expect(h).toHaveProperty("sourceFile");
    expect(h).toHaveProperty("headingPath");
    expect(h).toHaveProperty("lines");
    expect(h).toHaveProperty("bucket");
    expect(h).toHaveProperty("docUrl");
    expect(h).toHaveProperty("score");
  });
});

// ---------------------------------------------------------------------------
// HybridSearchOpts typing
// ---------------------------------------------------------------------------
describe("HybridSearchOpts (type contract)", () => {
  test("the opts object shape matches the frozen interface", async () => {
    seedChunk("v2", "pricing rules", "apiv2", 1);
    const opts: HybridSearchOpts = {
      query: "pricing",
      buckets: ["apiv2", "general"],
      topK: 4,
      candidateK: 10,
    };
    const hits = await search.hybridSearch(opts);
    expect(hits.length).toBeLessThanOrEqual(4);
    expect(hits.length).toBeGreaterThan(0);
  });
});
