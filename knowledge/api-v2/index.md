# API V2 — Cookbook Index

> Practical "how to do X on the NEW Beds24 API V2" guides. V2 replaces V1's per-call `apiKey`/`propKey` with a token-header + scopes + credits model, and adds channel, Stripe, webhook, and inventory APIs that V1 never had. Each file includes a V1 ↔ V2 mapping section for migrants.

**How facts are cited:** every statement ends with a markdown link `[wiki → Page](url)` or `[swagger → path](url)` followed by `[extracted 2026-07-28]`.

---

## Files

### 1. [auth-and-setup.md](auth-and-setup.md)
Token lifecycle (invite code → `/authentication/setup` → 24h token / refresh token / long-life token), immutable scopes (bookings/inventory/properties/accounts + read/write/delete qualifiers), and the credits rate-limit model (100 credits/5-min, dynamic cost, the three credit headers, €10/mo upgrade). Includes a JS example: get token → call endpoint → log credit headers.
**Overarching topics:** auth flow, token types, scopes, credits/rate limits, request conventions, POST-array behavior, V1↔V2 mapping.

### 2. [properties-and-rooms.md](properties-and-rooms.md)
The V2 property model (property → roomTypes → units) vs V1's flat propKey/roomId. Read/create/modify properties, the "include property `id` to update rooms" rule, price rules (read-only + modify-only), offers (bookingType enum renames), and which room endpoints are still Coming Soon.
**Overarching topics:** property lifecycle, room types, units, price rules, offers, V1↔V2 mapping.

### 3. [inventory-and-pricing.md](inventory-and-pricing.md)
The core pricing surface: read/write the per-date calendar (`/inventory/rooms/calendar` — prices, minStay, numAvail, overrides, channel booking limits), read availability (the check-in/check-out boolean logic), fixed prices (max 100/room, rate codes, strategies), offers, and unit bookings (Beta). Maps V1 getRoomDates/setRoomDates/getRates/setDailyPriceSetup to their V2 equivalents.
**Overarching topics:** calendar read/write, availability logic, fixed prices, offers, channel booking limits, V1↔V2 mapping.

### 4. [bookings.md](bookings.md)
The most-used CRUD surface: read bookings (filters, searchString, statuses, the "cancelled excluded by default" gotcha), create/update via the `id`-present-vs-absent array-POST rule, subitem CRUD (invoice/info items, the delete-subitem scope rule), messages (⚠️ OTA-bookings-only restriction), and invoices (Alpha).
**Overarching topics:** booking CRUD, group bookings (masterId), subitems, messages, Stripe token, V1↔V2 mapping.

### 5. [channels-and-webhooks.md](channels-and-webhooks.md)
Everything V1 lacked: channel settings (iCal/Airbnb/Vrbo), Airbnb listings/users/reviews/actions, Booking.com reviews/actions, the full Stripe payment flow (create session → render checkout → card auto-links), the complete channel-source-ID reference table, booking V1 vs V2 webhooks, inventory webhooks (triggers, non-triggers, 30-min retry), and usage-aware accounts.
**Overarching topics:** channel settings, Airbnb, Booking.com, Stripe checkout, webhooks (booking + inventory), channel source IDs, accounts, V1↔V2 mapping.

---

## [schemas.md](schemas.md) 📐 COMPLETE SCHEMA REFERENCE
Field-level schemas for every V2 endpoint, extracted from the authoritative `apiV2.yaml` OpenAPI spec (the machine-readable source). 5 files, 2,108 lines covering 60+ schema objects: auth, bookings, invoices, messages, properties, rooms, priceRules, offers, calendar, availability, fixedPrices, accounts, all channel settings (Airbnb/Vrbo/iCal/Nuki), Stripe, and reviews. Every field with type, required/optional, description, and example — use these to build valid requests and parse responses.
**Overarching topics:** request schemas, response schemas, field types, required markers, enum values, endpoint→schema mapping.

## [version-reference.md](version-reference.md)
The full endpoint-by-endpoint version map: every JSON endpoint classified as **V2-native**, **V1 → V2** (has a V2 equivalent — migrate), **V1-only** (no V2 replacement yet — still required), **bridge** (getV2RefreshToken), or **OTA-standard** (version-agnostic). Includes a decision tree for picking the right surface.
**Overarching topics:** V1 vs V2 classification, migration map, V1-only gaps, OTA standard, CSV, deprecated XML.

## V1 ↔ V2 quick reference

| V1 (this folder + pricing/) | V2 (this folder) |
|------------------------------|------------------|
| per-call `apiKey`/`propKey` | `token:` header (from `/authentication/setup`) |
| `getRates` / `setRate` / `setRates` | `/inventory/rooms/calendar` + `/inventory/fixedPrices` |
| `getRoomDates` / `setRoomDates` | `GET/POST /inventory/rooms/calendar` |
| `getDailyPriceSetup` / `setDailyPriceSetup` | `/inventory/rooms/calendar` (per-date prices) |
| `getAvailabilities` | `GET /inventory/rooms/availability` |
| `getBookings` / `setBooking` | `GET/POST/DELETE /bookings` |
| `getProperties` / `getProperty` / `setProperty` | `GET/POST /properties` |
| `getMessages` / `setMessage` | `GET/POST/PATCH /bookings/messages` |
| `createStripeSession` | `POST /channels/stripe` |
| (none) | `/channels/settings`, `/channels/airbnb`, `/channels/booking`, webhooks |
| (none) | `/accounts` with usage |

## Endpoint maturity

V2 endpoints are tagged by stability in the Swagger docs: **Alpha** (shape may change), **Beta** (stable-ish), **Coming soon** (not yet live). Check the maturity note in each file before building on an endpoint.
