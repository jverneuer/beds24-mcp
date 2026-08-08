# beds24-knowledge

Knowledge processing, indexing, and **hybrid search** over the Beds24 documentation corpus: bucket-aware markdown chunking, a `libsql` + `sqlite-vec` + FTS5 vector store, local embedding via `@huggingface/transformers`, and Reciprocal Rank Fusion (RRF) fusion.

- **Zero MCP / OpenAPI dependency.** Import from anything that needs semantic search over the docs.
- **Self-contained.** Ships its own `knowledge/` corpus and resolves its own DB path; no reference to the SDK or the server.
- **Self-hosted.** Embedding runs locally (no API keys); the index is a single `.beds24/index.db` file.

Published independently to npm. See the [root README](../../README.md) for the workspace layout.

---

## Install

```bash
npm install beds24-knowledge
```

Requires Node ≥ 24 (uses global `fetch` for the optional Ollama embed path; the default local path uses `@huggingface/transformers`).

---

## Quickstart

```ts
import { buildIndex, search, searchAll, searchInBucket, hybridSearch } from "beds24-knowledge";

// One-time (~30s) — builds .beds24/index.db from the bundled knowledge/ corpus.
await buildIndex({ knowledgeDir: "./knowledge" });

// Search the safe buckets (apiv2 + general).
const hits = await search("how does pricing propagate to channels?", 5);
// hits: SearchHit[] — { id, text, sourceFile, headingPath, lines, bucket, docUrl, score }
```

For the MCP server use case, the server wraps these directly into `beds24_search` / `beds24_search_all` / `beds24_search_in_bucket`.

---

## Corpus layout

The bundled corpus lives in `packages/knowledge/knowledge/` (shipped as `knowledge/` in the npm package). Each file is a **cited markdown** doc — a single source of truth, split at section (`##`) / subsection (`###`) boundaries so every chunk preserves its heading path and line range.

```
knowledge/
├── index.md
├── api-v2/            # current V2 reference (bucket: apiv2)
├── api-basics/        # auth, rate limits, error codes
├── system-logic/      # pricing model, booking lifecycle, channel sync (bucket: general)
├── availability/      # legacy (bucket: apiv1)
├── bookings/          # legacy (bucket: apiv1)
├── pricing/           # legacy (bucket: apiv1)
├── properties/        # legacy (bucket: apiv1)
├── invoicing/         # legacy (bucket: apiv1)
├── messages/          # legacy (bucket: apiv1)
├── account/           # legacy (bucket: apiv1)
├── ota/               # general
├── csv/               # general
├── utilities/         # general
└── xml-deprecated/     # bucket: deprecated
```

### Buckets

Every chunk is tagged with a `bucket`, read from its frontmatter when present and falling back to a path-derived value:

| Bucket | Meaning | Searched by default? |
|---|---|---|
| `apiv2` | Current V2 reference | ✅ (safe) |
| `general` | Concepts, system logic | ✅ (safe) |
| `apiv1` | Legacy V1 reference | ❌ |
| `deprecated` | Removed XML/deprecated APIs | ❌ |

`SAFE_BUCKETS = ["apiv2", "general"]`, `KNOWN_BUCKETS = ["deprecated","apiv1","apiv2","general"]`.

---

## Search

```ts
await search(query, topK?);                 // SAFE_BUCKETS only
await searchAll(query, topK?);              // all buckets
await searchInBucket(bucket, query, topK?); // one bucket
await hybridSearch({ query, buckets?, topK?, candidateK? }); // explicit hybrid call
```

`SearchHit.score` is an **RRF fusion score** (higher is better, unbounded) — not a cosine similarity. A chunk that ranks in the top candidates of *both* the semantic and lexical results scores highest.

`Beds24Search` is a stateful facade exposing the same `search` / `searchAll` / `searchInBucket` methods.

### How hybrid search works

1. **Embed** the query (`embed([query])`) and fetch `candidateK` vector candidates by ascending cosine distance from the `sqlite-vec` index.
2. **Lexical** pass: turn the query into a safe FTS5 MATCH (`toFtsQuery`) and fetch `candidateK` candidates by ascending `bm25(...)`.
3. **Fuse** with RRF (k=60): a chunk accumulates `1/(k + rank)` from each list it appears in; the merged list is sorted by descending score.
4. Return the top `topK`.

Constants: `RRF_K = 60`, `DEFAULT_TOP_K = 8`, default `candidateK = max(topK * 5, 50)`.

### Indexing

```ts
import { buildIndex } from "beds24-knowledge";

const { files, chunks } = await buildIndex({
  knowledgeDir: "./knowledge",
  force: false,          // true → drop + recreate the schema + FTS before re-indexing
});
```

Pipeline per file: read → `chunkMarkdown` (heading-aware, frontmatter-aware) → `embed` (one batched call per file) → `insertChunk`. The `bucket` comes from the chunker (frontmatter wins over the path fallback).

The DB is opened lazily on first use (`getDb()`), and the server auto-indexes on startup if the DB is missing.

---

## Embedding

```ts
import { embed, EMBED_DIM } from "beds24-knowledge";

const [vec] = await embed(["hello world"]);
// vec: number[384] — mean-pooled, unit-normalized (so cosine distance == cosine similarity)
```

Default: `Xenova/all-MiniLM-L6-v2` (384-dim, local, no network after first load). The embedding provider is being made pluggable (see `EMBEDDER-PLAN.md` in the repo root) — the `embed(texts): Promise<number[][]>` signature is the stable boundary.

Override the knowledge root with `BEDS24_KNOWLEDGE_DIR`; the default is the bundled `knowledge/` dir next to the package.

---

## Exports

```ts
// search
import { search, searchAll, searchInBucket, hybridSearch, Beds24Search } from "beds24-knowledge";
import type { SearchHit, HybridSearchOpts } from "beds24-knowledge";

// indexing
import { buildIndex } from "beds24-knowledge";
import type { BuildResult } from "beds24-knowledge";

// db + store
import {
  getDb, dbExists, clearChunks, resetDatabase,
  countChunks, bucketCounts, insertChunk, DB_PATH, EMBED_DIM,
} from "beds24-knowledge";
import type { ChunkRow } from "beds24-knowledge";

// embedding
import { embed } from "beds24-knowledge";

// markdown
import { chunkMarkdown } from "beds24-knowledge";
import type { Chunk } from "beds24-knowledge";
import { KNOWN_BUCKETS, SAFE_BUCKETS, parseFrontmatter } from "beds24-knowledge";
import type { Bucket, Frontmatter } from "beds24-knowledge";

// paths
import { defaultKnowledgeDir } from "beds24-knowledge";
```

---

## Boundaries

- This package **must not** import `openapi-fetch`, `ajv`, `js-yaml`, or the MCP SDK (enforced by `CONTRACT.md`).
- It owns the markdown corpus and the `.beds24/index.db` vector store — no reference to the API client or to OpenAPI.

Source layout:

```
packages/knowledge/
├── knowledge/                  # cited markdown facts (shipped)
├── src/
│   ├── db.ts                   # libsql + sqlite-vec + FTS5 schema + migrations
│   ├── embed.ts                # local Xenova/all-MiniLM-L6-v2 embedding
│   ├── indexer.ts              # walk → chunk → embed → store
│   ├── search.ts               # hybrid search (FTS + vector + RRF)
│   ├── paths.ts                # knowledge dir + DB path resolution
│   ├── markdown/
│   │   ├── chunk.ts            # heading-aware markdown splitter
│   │   └── frontmatter.ts      # bucket/docUrl frontmatter parser
│   └── index.ts                # public barrel
└── package.json
```

Rebuild: `bun run build:knowledge` (root) or `bun run build` (this package).
