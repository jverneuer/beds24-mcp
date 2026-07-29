# Beds24 — Facts Index

> Structured, cited facts extracted from the Beds24 API docs (`beds24.com/api/`) and wiki (`wiki.beds24.com`). Every fact links to its source so an LLM can jump straight into the detail. **Pricing and channel-sync facts are the highest-priority section** — start there if you only read one. **New to Beds24? Start with the API V2 cookbook below** if you're building on the current API.

**How facts are cited:** every statement ends with a markdown link `[wiki → Page](url)` or `[api → path](url)` followed by `[extracted 2026-07-28]`. Link targets point directly to the real source (`wiki.beds24.com` or `beds24.com/api/`).

---

## Categories

### 0. [api-v2/](api-v2/index.md) 🆕 API V2 COOKBOOK + SCHEMAS
Practical "how to do X on the NEW API V2" guides (auth, properties, inventory, bookings, channels) PLUS a **complete schema reference** (5 files, 2,108 lines, 60+ schemas extracted from `apiV2.yaml`) with every field/type/required/example, and a **version-reference** classifying every JSON endpoint as V2-native / V1→V2 / V1-only / bridge / OTA-standard.
**Overarching topics:** V2 auth, token lifecycle, scopes, credits, properties, inventory calendar, fixed prices, booking CRUD, channels, Stripe, webhooks, request/response schemas, field types, enum values, V1↔V2 migration.

### 1. [pricing/](pricing/index.md) ⭐ START HERE
Rates, rate-links, and daily prices — the three price types and how they map to OTA push. Covers getRates/setRate/setRates, rate link types (percentage/per-booking/per-day/per-person/none/per-period) and the bookingcomRateCode mapping, and the daily-price setup that actually syncs to channels.
**Overarching topics:** rate types, daily prices, rate links, OTA price push, per-occupancy pricing, channel sync controls, pricing constraints.

### 2. [system-logic/](system-logic/index.md) ⭐ HOW IT ACTUALLY WORKS
The behavioral model behind Beds24: how prices propagate to channels, the pricing model (rates vs daily prices vs linked/slave prices), booking lifecycle and statuses, availability logic (overrides, multipliers, 16 price rows), property/room-type structure, API V2 auth/scopes/credits, channel source IDs, webhooks, and the wiki page on setting prices for booking channels.
**Overarching topics:** pricing propagation, channel manager, booking lifecycle, availability model, property structure, API V2, rate limits/credits, webhooks, channel source IDs.

### 3. [api-basics/](api-basics/index.md)
Authentication (apiKey/propKey, token lifecycle), rate limits (one-call-at-a-time, 5-min window, no-warning block), and the six documented error codes.
**Overarching topics:** token auth, rate limits, error codes, JSON request format.

### 4. [availability/](availability/index.md)
getAvailabilities (keyless price/availability lookup), getRoomDates and setRoomDates (per-room price/availability over a date range — the `i`/`o`/`m`/`mx`/`p1`–`p16` field model).
**Overarching topics:** availability lookup, per-date pricing, min/max stay, closed dates, multipliers.

### 5. [properties/](properties/index.md)
Property lifecycle (getProperties/getProperty/setProperty/createProperties), identity (propId/propKey), room types, channel settings per property, and property content (texts, images, booking data).
**Overarching topics:** property lifecycle, propId/propKey, room types, channel management, property content.

### 6. [bookings/](bookings/index.md)
getBookings (filters, pagination, statuses, include flags) and setBooking (create/update, bulk, cancel-but-not-delete, Stripe charge, invoice/info-item CRUD, Booking.com channel actions).
**Overarching topics:** booking retrieval, booking creation, bulk ops, cancellation, Stripe payments, invoice items.

### 7. [invoicing/](invoicing/index.md)
getInvoices (date/status filters) and getInvoicees/setInvoicees (payables, partial updates, batch).
**Overarching topics:** invoice retrieval, invoicee management, batch operations.

### 8. [messages/](messages/index.md)
getMessages (filter by booking, paginated 100/page) and setMessage (one message per request, Airbnb/Booking.com only).
**Overarching topics:** message retrieval, sending, OTA restrictions.

### 9. [account/](account/index.md)
getAccount/setAccount/createAccount — account info, sub-account management, roles.
**Overarching topics:** account data, sub-accounts, roles.

### 10. [csv/](csv/index.md)
Bulk CSV import/export for pricing (rates + room-daily), bookings, and invoicing. Bidirectional with preview-then-save workflow; room-daily explicitly excludes rate-based prices.
**Overarching topics:** CSV import/export, bulk pricing, booking CSV, invoice CSV, batch caps.

### 11. [ota/](ota/index.md)
OTA-standard endpoints: JSON_HotelAvail and OTA_HotelAvail (availability/price lookup), OTA_HotelRes (booking save via OTA2015A XML with Basic Auth).
**Overarching topics:** OTA availability, booking push, XML/JSON OTA, channel connection.

### 12. [utilities/](utilities/index.md)
createStripeSession (Stripe Checkout into the property's own Stripe account) and getV2RefreshToken (V1→V2 token migration).
**Overarching topics:** Stripe Checkout, V2 token migration.

### 13. [xml-deprecated/](xml-deprecated/index.md)
Deprecated XML methods (getAccount/putAccount, getProperties/putProperties, getInventories/putInventories, getBookings/putBookings) — use JSON for new designs.
**Overarching topics:** deprecated XML, JSON replacements.

---

## Key system facts (quick reference)

- **Only Daily Prices are recommended for channel sync**; Fixed Prices can send per-night only, and the system offers the lowest price meeting all rules when both exist. [extracted 2026-07-28] {system-logic/wiki-channel-pricing.md}
- **Per-day selection logic:** lowest minimum stay first, then highest occupancy. [extracted 2026-07-28] {system-logic/wiki-channel-pricing.md}
- **Rate limits (V1):** one API call at a time, space calls a few seconds apart, 5-minute window triggers no-warning block. [extracted 2026-07-28] {api-basics/rate-limits.md}
- **Rate limits (V2):** 100 credits / 5-min window, dynamic cost per request, upgradeable to 200 for 10€/mo; headers expose remaining/reset/cost. [extracted 2026-07-28] {system-logic/wiki-api-v2.md}
- **Booking statuses:** 0=Cancelled, 1=Confirmed, 2=New/unread, 3=Request, 4=Black, 5=Inquiry; bookings can be cancelled but never deleted. [extracted 2026-07-28] {system-logic/booking-lifecycle.md}
- **Availability:** up to 16 price rows (`p1`–`p16`) per date; `o` override codes decouple availability from pricing; `x` multiplier scales base price by percentage. [extracted 2026-07-28] {system-logic/availability-model.md}
- **Channel source IDs:** Direct=0, Booking Page=1, Booking.com=19, Airbnb XML=46, Airbnb iCal=10, VRBO=30, Google=58. [extracted 2026-07-28] {system-logic/wiki-apisourceids.md}
- **Webhooks:** async with ~1 min average delay; inventory webhooks retry across 30 minutes on non-2xx; minimum-stay restriction changes do NOT trigger inventory webhooks. [extracted 2026-07-28] {system-logic/wiki-webhooks.md}
