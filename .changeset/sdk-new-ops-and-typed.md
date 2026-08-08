---
"beds24-sdk-client": minor
---

Add typed domain ops for the rest of the V2 surface and drop the dead `openapi-fetch` dev dependency.

New ops classes, each taking a `Beds24Client` and wrapping `client.request(...)` against the generated schemas: `MessageOps` + `InvoicingOps` (booking messages and invoices), `InventoryOps` (offers + unit bookings), `AccountOps` + `PropertyOps` + `OrganizationOps` (accounts, properties, rooms, org users), `ChannelActionsOps` (push to Airbnb / Booking.com), `ReviewsOps` (Airbnb + Booking.com reviews and users), `StripeOps` (setup + charges + payment methods). The SDK now exposes the full V2 workflow surface that the MCP server's operational tools drive.

Dropped the unused `openapi-fetch` dev dependency (it was never imported — the client uses global `fetch` directly). `openapi-typescript` remains a root devDependency, used by `scripts/generate-types.ts` to regenerate `packages/sdk/src/generated/types.d.ts`.
