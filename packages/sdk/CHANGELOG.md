# @jverneuer/beds24-sdk-client

## 1.2.0

### Minor Changes

- 659b3e1: Add typed domain ops for the full V2 surface and drop the dead `openapi-fetch` dev dependency.

  New ops classes, each taking a `Beds24Client` and wrapping `client.request(...)` against the generated schemas: `MessageOps` + `InvoicingOps` (booking messages and invoices), `InventoryOps` (offers + unit bookings), `AccountOps` + `PropertyOps` + `OrganizationOps` (accounts, properties, rooms, org users), `ChannelActionsOps` (push to Airbnb / Booking.com), `ReviewsOps` (Airbnb + Booking.com reviews and users), `StripeOps` (setup + charges + payment methods). The SDK now exposes the full V2 workflow surface that the MCP server's operational tools drive.

  Documentation-only: rewrite the root README to reflect the current `packages/{sdk,knowledge,server}` workspace layout and add per-package READMEs (`packages/sdk/README.md`, `packages/knowledge/README.md`, `packages/server/README.md`).

  Dropped the unused `openapi-fetch` dev dependency (it was never imported — the client uses global `fetch` directly).

- e50828f: Make SDK strictly typed against generated OpenAPI types. Every SDK type now wraps a generated `openapi-typescript` type instead of redefining wire fields: `BookingCreate`/`BookingUpdate` wrap `newBooking`+`bookingActions`, `CalendarWrite`/`FixedPriceWrite` are generated-element aliases, `ChannelSettings` is the union of the four generated post shapes, `WebhookPayload` wraps the inline generated body, and enum constants (`BookingStatus`, `OverrideCode`) are locked to the spec with `satisfies`.
