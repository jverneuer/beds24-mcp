# beds24-mcp-server

MCP server + CLI host for Beds24. Depends on [`beds24-sdk-client`](../sdk/README.md) (typed API client, schema introspection, validation) and [`beds24-knowledge`](../knowledge/README.md) (hybrid vector+FTS search over the cited docs) and composes them into MCP **tools**, **prompts**, and **resources**. The server itself contains no reusable SDK/knowledge logic — it wires the two workspace packages.

- **MCP on stdio** — works with any MCP client (Claude Code, Cursor, Windsurf, VS Code Copilot, goose, OpenCode, …).
- **Global bin** (`beds24-mcp-server`) — ships a Node-bundled CLI at `dist/cli.mjs` so the published package is usable without `bun`.
- **`setup` subcommand** — detects the user's AI harness(es) and writes (merges) the MCP config for each.

Published independently to npm. See the [root README](../../README.md) for the workspace layout.

---

## Install

### Global (recommended)

```bash
npm install -g beds24-mcp-server   # publishes the beds24-mcp-server command
beds24-mcp-server setup            # detects + writes harness configs
```

`setup` is idempotent: it only touches the `beds24` entry in each config file, backs up a corrupt one (`.bak`), and never clobbers your other MCP servers. Flags:

| Flag | Effect |
|---|---|
| `--dry-run` | Preview every write without touching the filesystem. |
| `--harness claude --harness cursor` | Pick specific harnesses (repeatable). |
| `--all` | Configure every detected harness, non-interactively. |
| `--skip-install` | Skip the `bun install` step. |
| `--skip-index` | Skip the `bun run index` step (you can build later). |

If stdin is non-interactive and nothing is detected, `setup` exits non-zero and tells you to pass `--harness <name>`.

Restart your harness; the tools appear.

### From source

```bash
bun install
bun run index    # build the vector index from knowledge/*.md (one-time, ~30s)
bun run serve    # start the MCP server on stdio (same as the global command)
bun run setup    # same harness auto-config as the global command
```

The server auto-indexes on startup if `.beds24/index.db` is missing, so `bun run index` is optional. `bun run reindex` forces a rebuild.

---

## Using the SDK from another repo

The SDK has no MCP dependency — just point it at the facts + yaml:

```ts
import { Beds24Validator, Beds24Search } from "beds24-sdk-client";     // validation only
import { Beds24Client, BookingOps } from "beds24-sdk-client";          // full client

const validator = Beds24Validator.create();
const result = await validator.validate("POST /bookings", "request", payload);
// result.valid, result.errors — feed errors back to your LLM to fix the call
```

This lets you run schema validation from a Dagster asset, an Inngest function, or a CLI — no MCP server needed.

## Using the client directly

```ts
import { Beds24Client } from "beds24-sdk-client";

const client = new Beds24Client({ refreshToken });
const { data, credits } = await client.request("GET /bookings", {
  arrival: "2026-08-01",
  departure: "2026-08-05",
});
// credits.remaining / credits.resetsIn — the 5-minute rate-limit window
```

Every `METHOD /path` in `apiV2.yaml` is reachable via `client.request(key, body)`, with body + response types inferred from the generated schemas. Request bodies are validated before sending (fail fast, save a credit). Throws `Beds24Error` (`status`, `code`, `retryable`, `creditsRemaining`).

---

## Tools

Each operational tool additionally takes an `auth` block:

```ts
{ refreshToken?: string; inviteCode?: string; token?: string; baseUrl?: string }
```

Provide **one** of `refreshToken` (preferred), `inviteCode`, or `token`. `baseUrl` defaults to `https://www.beds24.com/api/v2`.

### Search & knowledge

| Tool | Input | Output |
|---|---|---|
| `beds24_search` | `query: string`, `topK?: number` | top section hits (safe buckets) |
| `beds24_search_all` | `query`, `topK?` | hits across all buckets |
| `beds24_search_in_bucket` | `bucket`, `query`, `topK?` | hits in one bucket |
| `beds24_schema` | `endpoint: "METHOD /path"`, `direction: "request"\|"response"` | flat field list (`name, type, required, description, enum?`) |
| `beds24_validate` | `endpoint`, `direction`, `payload: unknown` | `{valid, errors: [{path, message, expected, actual, suggestion?}]}` |
| `beds24_howto` | `task: string` | search hits + matched endpoint + request schema + steps |
| `beds24_status` | — | index + corpus status (`chunksIndexed`, `byBucket`, `dbSizeBytes`, `apiEndpoints`, `factsFiles`) |

### Bookings

| Tool | Verb |
|---|---|
| `beds24_booking_get` | GET /bookings (filter by status, dates, property/room) |
| `beds24_booking_create` | POST /bookings |
| `beds24_booking_cancel` | cancel by id |
| `beds24_booking_message_list` | GET /bookings/messages |
| `beds24_booking_message_send` | POST /bookings/messages (OTA only) |

### Pricing

| Tool | Verb |
|---|---|
| `beds24_price_set_daily` | POST /inventory/rooms/calendar (per-day prices) |
| `beds24_price_get_calendar` | GET /inventory/rooms/calendar |
| `beds24_price_set_fixed` | POST /inventory/fixedPrices (date-range prices) |

### Availability / inventory / properties / accounts

| Tool | Verb |
|---|---|
| `beds24_availability_get` | GET /inventory/rooms/availability |
| `beds24_inventory_offers` | GET /inventory/rooms/offers |
| `beds24_property_list` | GET /properties |
| `beds24_account_list` | GET /accounts |

### Channels / webhooks

| Tool | Verb |
|---|---|
| `beds24_channel_settings_get` | GET /channels/settings |
| `beds24_channel_settings_configure` | POST /channels/settings |
| `beds24_webhook_register` | POST the webhook payload shape your URL receives |

### Prompts

| Prompt | Workflow |
|---|---|
| `beds24_prompt_create_booking` | search → schema → validate → `beds24_booking_create` |
| `beds24_prompt_set_daily_prices` | search → schema → validate → `beds24_price_set_daily` |
| `beds24_prompt_register_webhook` | search → schema → `beds24_webhook_register` |

### Resources

| URI | Handler |
|---|---|
| `beds24://facts/{path}` | read one raw markdown facts file |
| `beds24://endpoints` | full V2 endpoint index as JSON |

---

## Server instructions

At initialize time the server sends the connected LLM a fixed block that encodes the **search → inspect → validate → operate** workflow. The intent: make the model use the cheaper inspect/validate tools before spending API credits. Defined in `server.ts` as `SERVER_INSTRUCTIONS`.

---

## Harness config (MCP)

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
- **"bun not found"** — launch the harness from a terminal, or add the bun dir to the config's `env.PATH`.
- **No tools after restart** — the server auto-indexes on first run and logs to stderr. Open the harness's MCP panel and look for `[beds24] MCP server connected on stdio.`.
- **Stale facts** — after updating `knowledge/`, run `bun run reindex` (or delete `.beds24/` and restart; it rebuilds).

---

## Boundaries

- This package **must not** implement SDK or knowledge logic. All reusable code lives in `beds24-sdk-client` / `beds24-knowledge`.
- Per `CONTRACT.md`, the SDK **must not** import libsql/sqlite-vec/the MCP SDK, and the knowledge package **must not** import openapi-fetch/ajv/js-yaml/the MCP SDK. The server is the only package that depends on all of `@modelcontextprotocol/sdk`, `beds24-sdk-client`, and `beds24-knowledge`.

---

## Source layout

```
packages/server/
├── src/
│   ├── server.ts              # MCP tools / prompts / resources registration
│   ├── cli.ts                 # index | status | serve | setup
│   ├── setup.ts               # harness auto-config (Claude / Cursor / Windsurf / VS Code)
│   ├── index.ts               # package barrel (startServer, runSetup)
│   ├── integration-harness.ts # real three-package end-to-end scenarios (spawned in isolation)
│   └── *.test.ts              # unit + integration tests
└── package.json               # bin: { "beds24-mcp-server": "dist/cli.mjs" }
```

---

## Building & testing

```bash
# from repo root
bun run build:server        # tsc + bun build src/cli.ts → dist/cli.mjs
bun run typecheck           # tsc --noEmit across the workspace
bun test                    # run the whole suite

# this package only
cd packages/server && bun test
```

The `build` script emits `dist/index.js` (for `import`) and `dist/cli.mjs` (the bin, with a `#!/usr/bin/env node` banner and `chmod +x`). `bun run prepublishOnly` (typecheck + build) runs automatically before `npm publish`.

---

## Exports

```ts
import { startServer } from "beds24-mcp-server";   // build the index (if missing) + connect on stdio
import { runSetup } from "beds24-mcp-server";      // programmatic harness auto-config
import type { SetupOptions } from "beds24-mcp-server";
```
