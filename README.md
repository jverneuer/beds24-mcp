# beds24-mcp

MCP server for the Beds24 API. Two complementary layers over the same source of truth:

1. **Semantic search** — vector index over the cited markdown docs (`beds24-search`). Answers *"how does pricing propagate?"*, *"what are channel source IDs?"*.
2. **Schema validation** — resolves `apiV2.yaml` and validates draft payloads (`beds24-validate`). Answers *"what's wrong with my POST /bookings payload?"*.

The markdown facts in `knowledge/` + `knowledge/apiV2.yaml` are the **source of truth**. The `.beds24/` vector index is a regenerable cache (`bun run index`). The SDK (`src/sdk/`) has zero MCP dependency so it can be imported from other repos (data-plattform, workflows, etc.).

## Install

```bash
bun install
bun run index     # build the vector index from knowledge/*.md (one-time, ~30s)
```

## Using the SDK from another repo

The SDK has no MCP dependency — just point it at the facts + yaml:

```ts
import { Beds24Validator, Beds24Search } from "beds24-mcp/sdk";

const validator = await Beds24Validator.create({ factsDir: "path/to/knowledge" });
const result = await validator.validate("POST /bookings", "request", payload);
// result.valid, result.errors — feed errors back to your LLM to fix the call
```

This lets you run schema validation from a dagster asset, an inngest function, or a CLI — no MCP server needed.

## Configure (Claude Code)

Add to your project or user `.mcp.json`:

```json
{
  "mcpServers": {
    "beds24": {
      "command": "bun",
      "args": ["run", "/Users/matte/projects/beds24-mcp/src/server.ts"]
    }
  }
}
```

Restart Claude Code. The tools appear in every session.

## Tools

| Tool | Input | Output |
|------|-------|--------|
| `beds24_search` | `query: string`, `topK?: number` | top section hits `{text, sourceFile, headingPath, lines, score}` |
| `beds24_schema` | `endpoint: string`, `direction: "request"\|"response"` | resolved field list `{name, type, required, description, enum?}` |
| `beds24_validate` | `endpoint: string`, `direction`, `payload: object` | `{valid, errors: [{path, message, expected, actual}]}` |
| `beds24_howto` | `task: string` | search hits + matching schema + steps summary |
| `beds24_status` | — | `{factsFiles, chunksIndexed, dbSize}` |

## Source layout

```
.
├── knowledge/                                    # facts + OpenAPI spec (source of truth)
│   ├── index.md, api-v2/, pricing/, system-logic/ ...
│   └── apiV2.yaml
├── src/
│   ├── sdk/               # REUSABLE TS SDK (no MCP deps — import from other repos)
│   │   ├── index.ts       # re-exports
│   │   ├── db.ts          # libsql store + sqlite-vec cosine index
│   │   ├── embed.ts       # local embedding model (Xenova/all-MiniLM-L6-v2)
│   │   ├── chunk.ts       # markdown splitter (heading-aware, keeps citations)
│   │   ├── indexer.ts     # walk facts → section chunks → embed → store
│   │   ├── search.ts      # vector search + section lookup
│   │   ├── schema.ts      # parse apiV2.yaml → resolve $ref/allOf/oneOf
│   │   └── validate.ts    # draft payload → structured LLM-friendly errors
│   ├── server.ts          # thin MCP wrapper over the SDK (MCP deps only here)
│   └── cli.ts             # thin CLI wrapper over the SDK (`beds24-mcp index|status`)
├── .beds24/               # generated vector index (gitignored)
└── package.json
```

## Indexing strategy (important)

The facts are already split by statement + source + date. **Do NOT shred into fixed-size chunks** — that destroys citations and mixes unrelated facts ("vector soup").

Instead, split at **section (`##`) / subsection (`###`)** boundaries. Each index entry = one section, storing its heading path, full text (citations inline), source file, and line range. A query lands precisely on the relevant cited section.

Structured-table content (the `schemas-*.md` files and `version-reference.md`) is better served by the **schema/validate** tools (exact lookup) than by vector search — route precise field questions there, fuzzy "how does it work" questions to search.

## Refresh

When facts change: `bun run index` rebuilds the index. The server auto-indexes on startup if `.beds24/` is missing.
