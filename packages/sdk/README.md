# beds24-sdk-client

Typed wrapper over the Beds24 **V2 JSON API**: HTTP client, OpenAPI schema validation, and typed domain workflows (bookings, pricing, availability, channels, webhooks, inventory, accounts, properties, organizations, channel actions, reviews, Stripe).

- **Zero MCP dependency.** Import from any Node/Bun process — an Inngest function, a Dagster asset, a CLI, an MCP server.
- **Strictly typed against generated schemas** from `apiV2.yaml`. Every request body and response `data` is inferred from the endpoint key.
- **V2 auth only** — `inviteCode` / `refreshToken` / `token`. The legacy `apiKey`+`propKey` flow is intentionally not supported (it predates `/api/v2`).

Published independently to npm. See the [root README](../../README.md) for the workspace layout.

---

## Install

```bash
npm install beds24-sdk-client
```

Requires Node ≥ 24 (uses global `fetch`). The package ships its own copy of `apiV2.yaml`.

---

## Quickstart

```ts
import { Beds24Client, BookingOps } from "@jverneuer/beds24-sdk-client";

const client = new Beds24Client({ refreshToken: process.env.BEDS24_REFRESH_TOKEN });
const booking = new BookingOps(client);

// Read (cancelled bookings excluded by default)
const { data, credits } = await booking.get({ arrivalFrom: "2026-09-01" });
console.log(`${data.bookings.length} bookings, ${credits.remaining} credits left`);

// Create — roomId/arrival/departure are enforced at compile time
const created = await booking.create({
  roomId: 12345,
  arrival: "2026-09-01",
  departure: "2026-09-05",
});
```

Every `METHOD /path` the spec defines is also reachable directly with inferred types:

```ts
const res = await client.request("GET /bookings", { arrivalFrom: "2026-09-01" });
//    ^? Beds24Response<BookingListResponse>
```

POST bodies are validated client-side against the schema **before** sending — fail fast, save a credit. A `Beds24Error` (with `status`, `code`, `retryable`, `creditsRemaining`) is thrown on any failure; a 401 triggers a single automatic token refresh.

---

## Auth

Provide **one** of:

| Field | Use | Notes |
|---|---|---|
| `refreshToken` | Long-lived token → mints a 24h token via `GET /authentication/token` | Preferred for non-interactive use |
| `inviteCode` | One-time code from Settings → Marketplace → API → exchanged via `GET /authentication/setup` | Converted to a `refreshToken` on first use |
| `token` | Use an existing 24h token directly | No minting |

`baseUrl` overrides the V2 endpoint (default `https://www.beds24.com/api/v2`). Arrays in GET/DELETE params serialize to repeated keys (`?id=1&id=2`).

---

## Ops

Each class wraps `client.request(...)` with a typed method per endpoint, and encodes the system-logic rules documented in the knowledge corpus. Instantiate with a `Beds24Client`.

| Ops | Module | Covers |
|---|---|---|
| `BookingOps` | `booking` | get / create / update / cancel (`POST /bookings`, `GET /bookings`) |
| `PricingOps` | `pricing` | `setDailyPrices` / `getCalendar` / `setFixedPrices` |
| `AvailabilityOps` | `availability` | `GET /inventory/rooms/availability` |
| `ChannelsOps` | `channels` | `get` / `configure` channel settings |
| `WebhooksOps` | `webhooks` | post the webhook payload shape |
| `MessageOps` | `message-ops` | list / send booking messages |
| `InvoicingOps` | `message-ops` | list invoices |
| `InventoryOps` | `inventory-ops` | `getOffers`, `getUnitBookings` |
| `AccountOps` | `accounts-ops` | list / create accounts |
| `PropertyOps` | `accounts-ops` | list / create / delete properties; list / delete rooms |
| `OrganizationOps` | `accounts-ops` | list organization users |
| `ChannelActionsOps` | `channel-actions-ops` | push to Airbnb / Booking.com |
| `ReviewsOps` | `channel-actions-ops` | Airbnb + Booking.com reviews and users |
| `StripeOps` | `channel-actions-ops` | setup Stripe, list charges / payment methods |

The full request/response types are exported from `packages/sdk/src/ops/index.ts`. Inspect any endpoint programmatically:

```ts
import { getSchema, flattenObject, listEndpoints } from "beds24-sdk-client-schema";
console.log(listEndpoints());                                  // ["GET /bookings", "POST /bookings", ...]
const fields = flattenObject(getSchema("POST /bookings", "request"));
```

(For the schema helpers, import from `"beds24-sdk-client/schema"` or `"beds24-sdk-client/validate"`.)

---

## Validation (standalone)

Without calling the API, validate a draft payload against the bundled schema:

```ts
import { Beds24Validator } from "@jverneuer/beds24-sdk-client";

const v = Beds24Validator.create();
const result = v.validate("POST /bookings", "request", draft);
// result.valid: boolean
// result.errors: { path, message, expected?, actual?, suggestion? }[]
```

Errors are LLM-actionable: `required field missing`, `unknown field (did you mean x?)`, `wrong type`, `invalid value (expected one of …)`.

`validateRequest(endpoint, direction, body, specDir?)` does the same in one shot. Use `Beds24Validator.create({ specDir })` to validate against a custom spec — otherwise it resolves the bundled `apiV2.yaml` (override with `BEDS24_SPEC_DIR`).

---

## Exports

```ts
import { Beds24Client, Beds24Error, Scopes, ErrorCode } from "@jverneuer/beds24-sdk-client";
import type { Beds24ClientConfig, Beds24Response, Credits, Scope } from "@jverneuer/beds24-sdk-client";

// generated-type helpers
import type { EndpointKey, OpOf, RequestBodyOf, ResponseBodyOf, paths, components } from "@jverneuer/beds24-sdk-client";

// ops + their types
import { BookingOps, BookingStatus, PricingOps, AvailabilityOps, ... } from "@jverneuer/beds24-sdk-client";

// validation
import { Beds24Validator, validateRequest } from "@jverneuer/beds24-sdk-client";
import type { ValidationError, ValidationResult } from "@jverneuer/beds24-sdk-client";

// schema introspection
import { getSchema, listEndpoints, resolveSchema, flattenObject } from "@jverneuer/beds24-sdk-client";
import type { Field, EndpointSchema } from "@jverneuer/beds24-sdk-client";
```

Subpath exports: `"beds24-sdk-client/client"`, `"/ops"`, `"/validate"`, `"/schema"`, `"/types"`.

---

## Boundaries

- This package **must not** import `libsql`, `sqlite-vec`, `@huggingface/transformers`, or the MCP SDK (enforced by `CONTRACT.md`).
- It owns its spec (`apiV2.yaml` in the package root) — it has no reference to the knowledge corpus.

Source layout:

```
packages/sdk/
├── apiV2.yaml                 # V2 OpenAPI spec (source of truth for the SDK)
├── src/
│   ├── client.ts              # HTTP + V2 auth
│   ├── api-types.ts           # EndpointKey / OpOf / RequestBodyOf / ResponseBodyOf
│   ├── index.ts               # public barrel
│   ├── ops/                   # one file per domain (booking, pricing, channels, …)
│   ├── schema/                # schema resolution + ajv validation
│   ├── paths.ts               # resolves the package root / spec dir
│   └── generated/types.d.ts   # auto-generated from apiV2.yaml
├── tests/                     # client + ops tests (mock fetch, recording client)
└── package.json
```

Regenerate the types: `bun run generate-types.ts` (root). Rebuild: `bun run build:sdk` (root) or `bun run build` (this package).
