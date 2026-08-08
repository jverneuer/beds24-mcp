# beds24-mcp

Three independent npm packages for the Beds24 API, plus an MCP server that composes them:

| Package | npm name | What it does |
|---|---|---|
| **SDK** | `beds24-sdk-client` | Typed V2 HTTP client + OpenAPI schema validation + typed domain ops (bookings, pricing, availability, channels, webhooks, inventory, accounts, properties, …). |
| **Knowledge** | `beds24-knowledge` | Markdown knowledge corpus, vector+FTS indexing, local embedding, hybrid (RRF) search. |
| **Server** | `beds24-mcp-server` | MCP server + CLI that wires the two packages into tools, prompts, and resources for an LLM. |

All three packages are published **independently** to npm (Changesets, `access: public`). The root of this repo is a Bun workspace and is **not** itself published.

---

## Architecture

The SDK and knowledge packages have **no dependency on each other** and no MCP or HTTP/embedding framework coupling. They are meant to be imported from other tooling (Inngest functions, Dagster assets, CLIs) without dragging in the server. The server is a thin shell that turns them into MCP tools.

```
┌──────────────────────────────┐
│        beds24-mcp-server     │  CLI (beds24-mcp-server index|status|serve|setup)
│   tools · prompts · resources│  MCP server (@modelcontextprotocol/sdk + zod)
└──────────────┬───────────────┘
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐  ┌──────────────┐
│beds24-sdk   │  │beds24-       │
│  -client    │  │  knowledge   │
│client · ops │  │indexer ·     │
│schema ·     │  │search ·      │
│validate     │  │embed         │
└─────────────┘  └──────────────┘
      │                 │
      ▼                 ▼
 apiV2.yaml        knowledge/*.md
 (bundled)         (bundled)
```

The server exposes the same surfaces in three groups, in the order an LLM should use them:

| Phase | Surface | Why |
|---|---|---|
| **Understand** | `beds24_search*`, `beds24_howto`, `beds24_status`, facts resource | Read the cited docs before writing any code. |
| **Validate** | `beds24_schema`, `beds24_validate`, endpoints resource | Inspect the schema, then check payloads before spending credits. |
| **Operate** | `beds24_booking_*`, `beds24_price_*`, `beds24_availability_*`, `beds24_inventory_*`, `beds24_property_*`, `beds24_account_*`, `beds24_channel_*`, `beds24_webhook_*` | Typed V2 API calls against the live system. |

Operational tools build a per-request `Beds24Client` from the caller's `auth` block (`refreshToken` | `inviteCode` | `token`) — the API key / prop key legacy flow is intentionally unsupported.

---

## Quickstart

### 1. MCP route (end-user, AI harness)

```bash
npm install -g beds24-mcp-server   # publishes the beds24-mcp-server command
beds24-mcp-server setup            # detects Claude Code / Cursor / Windsurf / VS Code, writes their MCP config
```

Restart your harness — the tools appear in every session. `setup` is idempotent (it only touches the `beds24` entry) and supports `--dry-run`, `--harness <name>`, `--skip-index`.

### 2. SDK route (typed V2 calls from your own code)

```ts
import { Beds24Client, BookingOps } from "beds24-sdk-client";

const client = new Beds24Client({ refreshToken: process.env.BEDS24_REFRESH_TOKEN });
const { data, credits } = await new BookingOps(client).get({ arrivalFrom: "2026-09-01" });
console.log(`${credits.remaining} credits left`);
```

Every `METHOD /path` in `apiV2.yaml` is reachable via `client.request("METHOD /path", body)` with inferred types from the generated schemas. Request bodies are validated client-side before sending (fail fast, save a credit). See `packages/sdk/README.md` for the full ops list.

### 3. Knowledge route (search / index pipeline)

```ts
import { buildIndex, search } from "beds24-knowledge";

// One-time (~30s) — builds the .beds24/index.db vector store.
await buildIndex({ knowledgeDir: "./knowledge" });

const hits = await search("how does pricing propagate to channels?", 5);
// hits: SearchHit[] — { text, sourceFile, headingPath, lines, bucket, docUrl, score }
```

Embedding runs locally via `@huggingface/transformers` (Xenova/all-MiniLM-L6-v2). No API keys.

---

## Tools

All tools live in the server package. Each operational tool additionally takes an `auth` block:

```ts
{ refreshToken?: string; inviteCode?: string; token?: string; baseUrl?: string }
```

Provide **one** of `refreshToken` (preferred), `inviteCode`, or `token`. `baseUrl` defaults to `https://www.beds24.com/api/v2`.

### Search & knowledge

| Tool | Summary |
|---|---|
| `beds24_search` | Hybrid (vector + FTS) search — current apiv2 + general docs only. |
| `beds24_search_all` | Same, across ALL buckets (including deprecated apiv1). |
| `beds24_search_in_bucket` | Search one bucket (`apiv2` / `general` / `apiv1` / `deprecated`). |
| `beds24_howto` | End-to-end: search + schema + summarized steps for a task. |
| `beds24_status` | Index + corpus status (chunks, buckets, endpoints, facts files). |

### Schema & validation

| Tool | Summary |
|---|---|
| `beds24_schema` | Resolve request/response schema for `METHOD /path` → flat field list. |
| `beds24_validate` | Validate a draft payload against the schema → structured errors. |

### Bookings

| Tool | Summary |
|---|---|
| `beds24_booking_get` | GET /bookings (filter by status, dates, property/room). |
| `beds24_booking_create` | POST /bookings (typed `newBooking` shape). |
| `beds24_booking_cancel` | Cancel by id (cancellations, never deletes). |
| `beds24_booking_message_list` | GET /bookings/messages. |
| `beds24_booking_message_send` | POST /bookings/messages (OTA only). |

### Pricing

| Tool | Summary |
|---|---|
| `beds24_price_set_daily` | POST /inventory/rooms/calendar (per-day prices). |
| `beds24_price_get_calendar` | GET /inventory/rooms/calendar. |
| `beds24_price_set_fixed` | POST /inventory/fixedPrices (date-range prices). |

### Availability

| Tool | Summary |
|---|---|
| `beds24_availability_get` | GET /inventory/rooms/availability. |

### Inventory, properties, accounts

| Tool | Summary |
|---|---|
| `beds24_inventory_offers` | GET /inventory/rooms/offers (arrival + departure + numAdults). |
| `beds24_property_list` | GET /properties (expand rooms, pictures, offers, …). |
| `beds24_account_list` | GET /accounts. |

### Channels & webhooks

| Tool | Summary |
|---|---|
| `beds24_channel_settings_get` | GET /channels/settings. |
| `beds24_channel_settings_configure` | POST /channels/settings. |
| `beds24_webhook_register` | POST the webhook payload shape your URL receives. |

### Prompts

| Prompt | Summary |
|---|---|
| `beds24_prompt_create_booking` | Walks through creating a booking (search → schema → validate → create). |
| `beds24_prompt_set_daily_prices` | Walks through setting daily prices. |
| `beds24_prompt_register_webhook` | Walks through the webhook payload shape. |

### Resources

| URI | Contents |
|---|---|
| `beds24://facts/{path}` | One raw markdown facts file from the knowledge base. |
| `beds24://endpoints` | All V2 request/response endpoints as JSON. |

---

## Install from source

```bash
bun install      # install workspace deps
bun run index    # build the vector index from knowledge/*.md (one-time, ~30s)
bun run setup    # same harness auto-config as the global command
bun test         # run the full test suite
bun run typecheck
```

The server auto-indexes on startup if `.beds24/index.db` is missing, so `bun run index` is optional. `bun run reindex` forces a rebuild.

---

## Source layout

```
.
├── packages/
│   ├── sdk/                       # beds24-sdk-client
│   │   ├── apiV2.yaml             # V2 OpenAPI spec (source of truth for the SDK)
│   │   ├── src/
│   │   │   ├── client.ts          # HTTP + V2 auth (inviteCode / refreshToken / token)
│   │   │   ├── api-types.ts       # generated-type helpers (EndpointKey, OpOf, …)
│   │   │   ├── ops/               # domain workflows (booking, pricing, channels, …)
│   │   │   ├── schema/            # spec resolution + ajv validation
│   │   │   └── generated/types.d.ts
│   │   ├── tests/                 # integration-style tests (mock fetch, recording client)
│   │   └── package.json
│   ├── knowledge/                 # beds24-knowledge
│   │   ├── knowledge/             # cited markdown facts + api-v2/, system-logic/, …
│   │   ├── src/
│   │   │   ├── db.ts              # libsql + sqlite-vec + FTS5
│   │   │   ├── embed.ts           # local Xenova/all-MiniLM-L6-v2 embedding
│   │   │   ├── indexer.ts         # walk → chunk → embed → store
│   │   │   ├── search.ts          # hybrid search (FTS + vector + RRF)
│   │   │   ├── markdown/          # heading-aware chunker + frontmatter parser
│   │   │   └── paths.ts
│   │   └── package.json
│   └── server/                    # beds24-mcp-server
│       ├── src/
│       │   ├── server.ts          # MCP tools / prompts / resources registration
│       │   ├── beds24.ts          # composition root (Beds24 facade over sdk + knowledge)
│       │   ├── cli.ts             # index | status | serve | setup
│       │   ├── setup.ts           # harness auto-config (Claude / Cursor / Windsurf / VS Code)
│       │   └── integration*.ts
│       └── package.json
├── .changeset/                    # Changesets (per-package independent versioning)
├── .github/workflows/
│   ├── ci.yml                     # typecheck + test on every push/PR
│   └── release.yml                # Version Packages PR → publish to npm on merge
├── scripts/
│   ├── fetch-spec.ts              # mirror apiV2.yaml from beds24.com
│   └── generate-types.ts          # generate types.d.ts from apiV2.yaml
├── CONTRACT.md                    # frozen cross-package interface contract
├── TEST-HARNESS.md                # test conventions every subagent follows
├── TYPESCRIPT-RULES.md            # codebase-wide TS discipline
└── package.json                   # Bun workspace root (private)
```

---

## Publishing

Each package carries its own version and is released independently via [Changesets](https://github.com/changesets/changesets). To propose a bump:

```bash
bun changeset        # interactive — pick package(s) + bump type
```

That writes a `.changeset/*.md` like:

```md
---
"beds24-sdk-client": minor
---

Add InvoicingOps and InventoryOps
```

The `release` GitHub Actions workflow opens (or updates) a **Version Packages** PR that consumes pending changesets, bumps the affected packages, and writes changelog entries. When that PR lands on `main` (no pending changesets left), the same action runs `changeset publish`, which publishes **only** the packages whose version advanced. The server's `workspace:*` deps on its siblings are rewritten to concrete versions at publish time; `updateInternalDependencies: "patch"` in `.changeset/config.json` makes a dep bump flow a patch to dependents.

Required secret: `NPM_TOKEN` (Automation type). See `.changeset/README.md` for details.

---

## Configure your harness (MCP)

All harnesses speak the same JSON shape; only the **config file location** differs.

The shared block (`command` / `args`). **Prefer the global command** when installed via npm — it survives reinstalls and doesn't hard-code a checkout path:

```json
{ "command": "beds24-mcp-server", "args": ["serve"] }
```

Falling back to a source checkout (replace `/ABS/PATH/to/beds24-mcp`):

```json
{ "command": "bun", "args": ["run", "/ABS/PATH/to/beds24-mcp/packages/server/src/server.ts"] }
```

> Run `beds24-mcp-server setup` (or `bun run setup`) to write these files automatically — no hand-editing needed.

### Claude Code
`~/.claude/.mcp.json` (user) or project `.mcp.json`. Uses the `mcpServers` key. Restart after editing.

### Cursor
`~/.cursor/mcp.json`. Uses the `mcpServers` key. Open **Settings → MCP**; restart servers if it's not green.

### Windsurf
`~/.codeium/windsurf/mcp_config.json`. Uses the `mcpServers` key. Reload the window.

### VS Code (Copilot)
Project `.vscode/mcp.json`. Uses the `servers` key (note: **not** `mcpServers`). Restart after editing.

### Troubleshooting
- **"bun not found"** — launch the harness from a terminal (so it inherits `$PATH`), or add the bun dir to the config's `env.PATH`.
- **No tools after restart** — the server auto-indexes on first run and logs to stderr. Open the harness's MCP panel and look for `[beds24] MCP server connected on stdio.`.
- **Stale facts** — after updating `knowledge/`, run `bun run reindex` (or delete `.beds24/` and restart; it rebuilds).
