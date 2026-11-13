# @jverneuer/beds24-sdk-client

## 1.4.0

### Minor Changes

- ab59068: Expose per-request credit cost, treat 1020 like 1016, carry full credit state on errors:

  - `Credits.requestCost` — parsed from the `x-request-cost` response header (the dynamic per-request cost documented in Beds24 §3; previously only the two `x-five-min-*` window headers were exposed)
  - error code **1020** (`UsageLimitExceededAlt`) is now `retryable`, identical to 1016 — both mean "usage limit exceeded in the last 5 minutes" and both end the current window
  - `Beds24Error.credits` — the full `Credits` object off the failing response (incl. `resetsIn`, which rate-limit/freeze handling needs), alongside the existing `creditsRemaining`

## 1.3.0

### Minor Changes

- Expose the invite-code bootstrap result on `Beds24Client`: a `refreshToken` getter (the current refreshToken — undefined until an invite exchange or a config refreshToken provides one) and an `ensureAuthenticated()` method (runs the single-flight token fetch once, so bootstrap consumers can exchange an invite code via `/authentication/setup` without a dummy API call and then persist the returned refreshToken to a secret store).

## 1.2.0

### Minor Changes

- 659b3e1: Add typed domain ops for the full V2 surface and drop the dead `openapi-fetch` dev dependency.

  New ops classes, each taking a `Beds24Client` and wrapping `client.request(...)` against the generated schemas: `MessageOps` + `InvoicingOps` (booking messages and invoices), `InventoryOps` (offers + unit bookings), `AccountOps` + `PropertyOps` + `OrganizationOps` (accounts, properties, rooms, org users), `ChannelActionsOps` (push to Airbnb / Booking.com), `ReviewsOps` (Airbnb + Booking.com reviews and users), `StripeOps` (setup + charges + payment methods). The SDK now exposes the full V2 workflow surface that the MCP server's operational tools drive.

  Documentation-only: rewrite the root README to reflect the current `packages/{sdk,knowledge,server}` workspace layout and add per-package READMEs (`packages/sdk/README.md`, `packages/knowledge/README.md`, `packages/server/README.md`).

  Dropped the unused `openapi-fetch` dev dependency (it was never imported — the client uses global `fetch` directly).

- e50828f: Make SDK strictly typed against generated OpenAPI types. Every SDK type now wraps a generated `openapi-typescript` type instead of redefining wire fields: `BookingCreate`/`BookingUpdate` wrap `newBooking`+`bookingActions`, `CalendarWrite`/`FixedPriceWrite` are generated-element aliases, `ChannelSettings` is the union of the four generated post shapes, `WebhookPayload` wraps the inline generated body, and enum constants (`BookingStatus`, `OverrideCode`) are locked to the spec with `satisfies`.
