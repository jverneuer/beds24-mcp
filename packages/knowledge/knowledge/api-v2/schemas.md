# API V2 — Complete Schema Reference

> Field-level schemas for every V2 endpoint, extracted from the authoritative `apiV2.yaml` OpenAPI spec (the machine-readable source the Swagger UI renders). Each schema lists every field with its type, required/optional marker, description, and example. Use these to construct valid requests and parse responses.

**Source:** `apiV2.yaml` (Beds24 OpenAPI 3.x spec) — 8,349 lines, 60+ schema objects. [extracted 2026-07-28]

---

## Files

### [schemas-auth-bookings.md](schemas-auth-bookings.md) (460 lines)
Auth, common, booking, invoice, and message schemas.
- **Auth:** `SuccessfulApiResponse`, `UnsuccessfulApiResponse`, `pages`, `token`, `refreshToken`, `tokenDetails`
- **Common:** `multiplePostResponse`
- **Bookings:** `booking`, `newBooking`, `bookingGuests`, `bookingActions`, `offerResponse`
- **Invoicing:** `invoiceItemPost`, `invoiceItem`, `invoice`
- **Messages:** `message`, `hostMessage`

### [schemas-properties.md](schemas-properties.md) (406 lines)
Property, room, pricing-rules, and offer schemas.
- `property` — account, bookingRules, paymentCollection (13 gateways, 11 cardSettings), 20+ bookingQuestions, webhooks, texts[]
- `room` — pricing/stay/occupancy, dependencies (combinationLogic), units[], featureCodes
- `priceRules` — 30 channels, agentCodes, HRS rateCode enum
- `offer` — minimumStay, allowCancellation

### [schemas-inventory.md](schemas-inventory.md) (395 lines)
Calendar, availability, fixed-price, and unit-booking schemas.
- `calendar` — per-date: numAvail, min/maxStay, multiplier, override, price1-price16, 28 channel maxBookings
- `availability` — date boolean map
- `unitBookings` — date→unitId→count
- `fixedPrice` — window/restriction/pricing, discounts[], 34 channels, HRS rateCode (50 values)

### [schemas-channels-1.md](schemas-channels-1.md) (516 lines)
Account and channel settings (Airbnb, Vrbo, iCal, Nuki).
- `account` — usage (68 channel keys), subAccounts
- `airbnbListing`, `airbnbSettingsPost`/`Get` (57-currency enum, 39-language, per-room-type)
- `vrboSettingsPost`/`Get`, `vrboPaymentSchedule`
- `iCalExportSettingsGet`/`Post`, `iCalImportSettingsGet`/`Post`, `iCalImportTools`
- `nukiSettingsGet`/`Post`, `channelSettingsTemplate`, `textLanguages` (39-language enum)

### [schemas-channels-2.md](schemas-channels-2.md) (331 lines)
Stripe, reviews, and misc schemas.
- Stripe: `stripeCreateSession`, `stripeChargePaymentMethod`, `stripeRefundCharge`, `stripeReleaseCharge`, `stripeCaptureCharge`, `stripeAddPaymentMethod`, `stripeDetachPaymentMethod`, `stripePaymentMethod`, `stripeCharge`
- Reviews: `bookingReview`, `airbnbReview`
- Misc: `organizationUser`, `page`, `token`, `organization`

---

## Quick lookup: endpoint → schemas

| Endpoint | Request schema | Response schema |
|----------|---------------|-----------------|
| GET /authentication/setup | — | `refreshToken` |
| GET /authentication/token | — | `token` |
| GET /authentication/details | — | `tokenDetails` |
| GET /bookings | — | `booking[]` + `multiplePostResponse` |
| POST /bookings | `newBooking[]` | `multiplePostResponse` |
| DELETE /bookings | `{id[]}` | `multiplePostResponse` |
| GET /bookings/messages | — | `message[]` |
| POST /bookings/messages | `hostMessage` | `multiplePostResponse` |
| GET /bookings/invoices | — | `invoice[]` |
| GET /properties | — | `property[]` |
| POST /properties | `property[]` | `multiplePostResponse` |
| GET /inventory/rooms/calendar | — | `calendar` |
| POST /inventory/rooms/calendar | `calendar` | `multiplePostResponse` |
| GET /inventory/rooms/availability | — | `availability` |
| GET /inventory/rooms/offers | — | `offerResponse` |
| GET /inventory/rooms/unitBookings | — | `unitBookings` |
| GET /inventory/fixedPrices | — | `fixedPrice[]` |
| POST /inventory/fixedPrices | `fixedPrice[]` | `multiplePostResponse` |
| GET /accounts | — | `account[]` |
| GET/POST /channels/settings | channel-specific | channel-specific |
| POST /channels/stripe | `stripeCreateSession` | Stripe session |
| GET /channels/stripe/charges | — | `stripeCharge[]` |
| GET /channels/stripe/paymentMethods | — | `stripePaymentMethod[]` |
| POST /channels/airbnb | action-specific | — |
| POST /channels/booking | action-specific | — |

## Notes
- `multiplePostResponse` wraps all POST array responses: it mirrors request order, each item has `success` boolean + optional `new`/`modified`/`errors`/`warnings`/`info`.
- `booking` is a composite (`allOf`): core fields + `newBooking` + status fragment — the doc expands all three.
- Several channel schemas use `allOf` aliases (e.g. `airbnbSettingsGet` = userId + Post + roomType status) — all inherited fields are listed inline.
- `calendar[].price1`-`price16` map to the 16 per-occupancy prices; `override` and `multiplier` decouple availability from pricing.
