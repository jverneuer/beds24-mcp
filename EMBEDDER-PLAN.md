# Additive Plan: Pluggable Multi-lingual Embedder + Incremental Re-indexing

> Additive to the main plan (`plan.md`). The existing hybrid search (FTS5 + vector cosine + RRF fusion, k=60) in `beds24-knowledge` **already matches the Turso code-indexing pattern** (`docs.turso.tech/guides/code-indexing#hybrid-search`) — it stays unchanged. This addendum upgrades the *embedding provider* and the *indexer*, which the main plan does not touch.

## 1. What the main plan already has (keep)

`beds24-knowledge` already implements the Turso hybrid-search recipe verbatim:

| Turso pattern | beds24-knowledge | Status |
|---|---|---|
| FTS (BM25) over text | `chunks_fts` FTS5 table + `toFtsQuery` | ✅ done |
| Vector cosine search | `vec_distance_cosine` via sqlite-vec | ✅ done |
| RRF fusion (k=60) | `rrfMerge(lists, k=60)` | ✅ done |
| Merge in app code | `hybridSearch()` | ✅ done |
| Section-boundary chunks | `chunkMarkdown` (heading-aware) | ✅ done |

**None of this changes.** The search module (`search.ts`) is untouched by this addendum.

## 2. What's additive (the gap)

### 2.1 Problem with the current embedder

The current `embed.ts` is hardcoded to `@huggingface/transformers` → `Xenova/all-MiniLM-L6-v2` (384-dim). Three issues:

1. **English-only, weak on non-English.** Beds24 is a global hotel platform — property names, room descriptions, guest messages, and the docs themselves contain German, Spanish, French, etc. `all-MiniLM-L6-v2` degrades sharply outside English.
2. **Heavy dependency.** `@huggingface/transformers` + ONNX runtime is hundreds of MB and slow to load — painful for a published npm package and for CI.
3. **No choice.** No way to use a better model without rewriting the module.

### 2.2 Problem with the current indexer

The current `indexer.ts` re-embeds the whole corpus on every run (modulo `--force`). With a better embedder (or an external API), re-embedding 55 files on every startup is wasteful. The Turso guide's content-hash pattern — skip unchanged files, only (re-)embed what changed — is missing.

## 3. Additive design

### 3.1 Pluggable `Embedder` interface

Introduce one abstraction in `embed.ts`; everything downstream (`indexer.ts`, `search.ts`) depends on the interface, not a concrete model.

```ts
// embed.ts — new core
export interface Embedder {
  readonly id: string;          // "local" | "ollama-bge-m3" | "ollama-bge-small" | ...
  readonly model: string;       // model name (stored in chunks.embedding_model)
  readonly dimension: number;   // 384 | 1024 | ...
  embed(texts: string[]): Promise<number[][]>;   // SAME signature as today
}
```

`embed(texts): Promise<number[][]>` is unchanged — `search.ts` and the tests' mock shape are unaffected.

#### Provider A — `LocalEmbedder` (default, current behavior)

```ts
export class LocalEmbedder implements Embedder {
  readonly id = "local";
  readonly model = "Xenova/all-MiniLM-L6-v2";
  readonly dimension = 384;
  async embed(texts) { /* existing @huggingface/transformers code */ }
}
```

Default. Zero external dependencies. Drop-in for today's behavior → no regression.

#### Provider B — `OllamaEmbedder` (new, multi-lingual)

```ts
export class OllamaEmbedder implements Embedder {
  readonly id: string;
  readonly model: string;       // "bge-m3" | "bge-small-en-v1.5"
  readonly dimension: number;   // 1024 | 384
  constructor(opts: {
    model: "bge-m3" | "bge-small-en-v1.5";
    baseUrl?: string;           // default http://localhost:11434
    signal?: AbortSignal;
  }) { ... }

  async embed(texts: string[]): Promise<number[][]> {
    const res = await fetch(`${this.baseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, input: texts }),
      signal: this.signal,
    });
    const json = await res.json();
    return json.embeddings;      // number[][]
  }
}
```

Two concrete Ollama options:

| Model | Dim | Multi-lingual | Schema change | When to use |
|---|---|---|---|---|
| `bge-small-en-v1.5` | 384 | ✅ 100+ langs | **None** (same dim) | Drop-in multi-lingual upgrade — best first step |
| `bge-m3` | 1024 | ✅ 100+ langs + sparse/colbert | Requires re-index (new dim) | Best quality; needs schema migration |

The `/api/embed` endpoint (Ollama ≥ 0.1.24) accepts batch `input: string[]` — one HTTP call for many chunks, matching the current batch-embed signature.

#### Factory + config

```ts
// env-var driven, zero-config default
export function createEmbedder(opts?: EmbedderOpts): Embedder {
  const provider = opts?.provider ?? process.env.BEDS24_EMBEDDER ?? "local";
  switch (provider) {
    case "local": return new LocalEmbedder();
    case "ollama-bge-small": return new OllamaEmbedder({ model: "bge-small-en-v1.5", ...opts });
    case "ollama-bge-m3":    return new OllamaEmbedder({ model: "bge-m3", ...opts });
    default: throw new Error(`unknown embedder: ${provider}`);
  }
}

export const EMBED_DIM = () => createEmbedder().dimension;  // dynamic (replaces the hardcoded const)
```

Selection: `BEDS24_EMBEDDER=ollama-bge-small bun run index`. Default stays `local`.

### 3.2 DB dimension handling (the crux)

sqlite-vec requires the stored vector length to match the query vector length. Switching from 384 → 1024 invalidates an existing `index.db`. Solution (mirrors the Turso guide's `embedding_model` column):

- Add a `chunks.embedding_model TEXT` column (already implied by the Turso pattern) storing the embedder id + dimension used.
- On `getDb()` / index load: read the active embedder's dimension; if it differs from the one that built the current DB, **force a re-index** (or warn + auto-rebuild). This is a one-time cost per model switch.
- For `bge-small` (384) → no migration, drop-in.
- For `bge-m3` (1024) → automatic re-index on first use.

`EMBED_DIM` becomes a runtime value from the active embedder, not a compile-time `384`. The `chunks` table's `embedding F8_BLOB(N)` is created by the indexer at the active dimension.

### 3.3 Incremental re-indexing (Turso's hash pattern)

Add to `indexer.ts`:

```ts
// Per-file content hash → skip unchanged files
async function fileHash(path: string): Promise<string>;
```

- Before chunking a file, compute its hash; compare to a stored `content_hash` (add column to track, or store alongside chunks).
- **Unchanged** → skip (keep existing chunks + embeddings).
- **Changed** → re-chunk + re-embed only that file; clear its old chunks.
- **New** → chunk + embed.
- `--force` rebuilds everything (current behavior preserved).

This makes `bun run index` cheap in CI/restart: only diffs get embedded. Critical once embedding costs real time (Ollama GPU) or the corpus grows.

### 3.4 Dependency impact

| Package | Change |
|---|---|
| `beds24-knowledge` | `@huggingface/transformers` becomes **optional** (only loaded by `LocalEmbedder`). `OllamaEmbedder` uses global `fetch` (zero deps). Consider `peerDependencies` or lazy `import()` so the published package isn't forced to ship the ONNX runtime. |
| `beds24-sdk-client` | unchanged |
| `beds24-mcp-server` | unchanged (it calls `buildIndex`, which now does incremental + configurable embedder) |

## 4. Sequencing — additive, non-conflicting

This work is in the `knowledge` package only and touches `embed.ts` + `indexer.ts` + `db.ts`. It must run **after** the knowledge test tasks (T2–T6) land, because:

- T4 tests `embed.ts` against `@huggingface/transforming` — redesigning the module mid-test breaks it.
- T6 tests `indexer.ts` — adding hashing changes its contract.

So this is a **Phase 1.5** that slots between the knowledge tests (T2–T6) and the server/integration work:

```
T2–T6 (knowledge tests, RUNNING)
   ↓ when done
T17 — implement Embedder interface + LocalEmbedder + OllamaEmbedder (embed.ts)
T18 — DB dimension handling + embedding_model column (db.ts)
T19 — incremental re-indexing via content hash (indexer.ts)
T20 — update T4/T6 tests for the new embed/indexer surface + add Ollama embed tests
   ↓
resume main plan (T12 server op-tools, T14 integration, ...)
```

T17–T20 are independent of the SDK ops (T8a–d) and server tests (T10–T11) — those proceed in parallel on different packages.

## 5. Out of scope (intentionally)

- Changing the search algorithm (RRF/FTS/vector) — already correct per the Turso pattern.
- Changing chunking strategy (heading-aware sections) — already correct.
- Adding a remote vector DB — libsql + sqlite-vec stays; this is embedded-first.
- Auto-installing Ollama — it's an opt-in external service; document `ollama pull bge-small-en-v1.5`.

## 6. Definition of done (additive)

1. `embed.ts` exports `Embedder`, `LocalEmbedder`, `OllamaEmbedder`, `createEmbedder`.
2. `BEDS24_EMBEDDER=ollama-bge-small bun run index` indexes with Ollama bge-small (384-dim, multi-lingual).
3. `BEDS24_EMBEDDER=ollama-bge-m3 bun run index` indexes with bge-m3 (1024-dim) and auto-re-indexes if the old DB was 384.
4. Default (`local`) behaves exactly like today — no regression.
5. `bun run index` twice without changes → second run skips all files (incremental).
6. `@huggingface/transformers` is optional/lazy (not forced on every install).
7. T4/T6 tests updated + new Ollama embed tests; full `bun test` green; 100% coverage on embed.ts/indexer.ts/db.ts.
