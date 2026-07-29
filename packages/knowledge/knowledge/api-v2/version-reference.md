# API Version Reference — Every JSON Endpoint Classified

> For each JSON endpoint: is it V1, V2, a bridge between them, or V1-only (still needed)? This is the map an LLM needs to pick the right surface. OTA endpoints (XML/JSON OTA standard) are classified separately at the bottom.

**Legend:**
- **V2-native** — only exists in V2 (`/authentication/*`, `/channels/*`, etc.)
- **V1 → V2** — V1 endpoint works, but V2 has a preferred equivalent (migrate these)
- **V1-only** — no V2 equivalent yet; you still must call V1 for this
- **Bridge** — V1 endpoint whose sole purpose is V1→V2 migration
- **OTA std** — version-agnostic OTA/JSON standard protocol, still current

---

## 1. V2-native endpoints (V1 has NO equivalent)

These only exist in API V2. If you need them, you must use V2 auth (token header).

| Endpoint | Method | Status | What it does |
|----------|--------|--------|--------------|
| `/authentication/setup` | GET | current | Exchange invite code → token + refreshToken |
| `/authentication/token` | GET | current | Refresh token → 24h token |
| `/authentication/token` | DELETE | current | Delete a refresh token |
| `/authentication/details` | GET | current | Token info + diagnostics |
| `/accounts` | GET | Alpha | Get accounts + usage |
| `/accounts` | POST | Alpha | Create/modify accounts |
| `/channels/settings` | GET/POST | Alpha | Channel settings (iCal/Airbnb/Vrbo) |
| `/channels/airbnb/users` | GET | Beta | Airbnb user ids on account |
| `/channels/airbnb/listings` | GET | Alpha | Airbnb listings for a user |
| `/channels/airbnb/reviews` | GET | Beta | Airbnb guest reviews |
| `/channels/airbnb` | POST | Alpha | Perform Airbnb actions |
| `/channels/booking/reviews` | GET | Alpha | Booking.com reviews |
| `/channels/booking` | POST | Alpha | Perform Booking.com actions |
| `/channels/stripe` | POST | Alpha | Stripe actions (create session, capture, refund) |
| `/channels/stripe/charges` | GET | Alpha | Stripe charges |
| `/channels/stripe/paymentMethods` | GET | Alpha | Stripe payment methods |
| `/inventory/fixedPrices` | GET/POST | current | Fixed prices |
| `/inventory/rooms/unitBookings` | GET | Beta | Which dates units have bookings |
| Webhooks — bookings | POST | Alpha | Configure booking webhooks |

---

## 2. V1 endpoints WITH a V2 equivalent (migrate to V2)

Call these on V1 today, but the V2 column is the replacement. V2 uses the token header + array POSTs.

| V1 endpoint | V1 path | V2 equivalent | V2 path | Notes |
|-------------|---------|---------------|---------|-------|
| getAccount | `/json/getAccount` | GET /accounts | `/accounts` | V2 adds usage |
| setAccount | `/json/setAccount` | POST /accounts | `/accounts` | |
| createAccount | `/json/createAccount` | POST /accounts | `/accounts` | |
| getProperties | `/json/getProperties` | GET /properties | `/properties` | V2 Beta; use `includePriceRules`, `includeOffers` |
| getProperty | `/json/getProperty` | GET /properties`?id=` | `/properties` | |
| setProperty | `/json/setProperty` | POST /properties | `/properties` | |
| createProperties | `/json/createProperties` | POST /properties | `/properties` | |
| getPropertyContent | `/json/getPropertyContent` | GET /properties?includeX | `/properties` | V2 partial — texts via properties |
| setPropertyContent | `/json/setPropertyContent` | POST /properties | `/properties` | V2 partial |
| getBookings | `/json/getBookings` | GET /bookings | `/bookings` | V2 adds searchString, includeBookingGroup |
| setBooking | `/json/setBooking` | POST /bookings | `/bookings` | V2 array-POST; id-present = update |
| getAvailabilities | `/json/getAvailabilities` | GET /inventory/rooms/availability | `/inventory/rooms/availability` | |
| getRoomDates | `/json/getRoomDates` | GET /inventory/rooms/calendar | `/inventory/rooms/calendar` | |
| setRoomDates | `/json/setRoomDates` | POST /inventory/rooms/calendar | `/inventory/rooms/calendar` | |
| getRates | `/json/getRates` | GET /inventory/rooms/calendar + fixedPrices | see note | V2 splits: per-date prices via calendar, rate-plans via fixedPrices |
| setRate | `/json/setRate` | POST /inventory/rooms/calendar | `/inventory/rooms/calendar` | |
| setRates | `/json/setRates` | POST /inventory/rooms/calendar | `/inventory/rooms/calendar` | |
| getDailyPriceSetup | `/json/getDailyPriceSetup` | GET /inventory/rooms/calendar | `/inventory/rooms/calendar` | Daily prices = per-date prices in V2 |
| setDailyPriceSetup | `/json/setDailyPriceSetup` | POST /inventory/rooms/calendar | `/inventory/rooms/calendar` | |
| getInvoices | `/json/getInvoices` | GET /bookings/invoices | `/bookings/invoices` | V2 Alpha |
| getMessages | `/json/getMessages` | GET /bookings/messages | `/bookings/messages` | V2 adds source filter, host/internalNote/system types |
| setMessage | `/json/setMessage` | POST /bookings/messages | `/bookings/messages` | V2: OTA-bookings-only restriction still applies |
| createStripeSession | `/json/createStripeSession` | POST /channels/stripe | `/channels/stripe` | V2 is the canonical path; V1 endpoint still works |

---

## 3. V1-only endpoints (NO V2 equivalent yet — still required)

You MUST call these on V1. There is no V2 replacement as of the latest changelog/Swagger.

| V1 endpoint | Path | Why it's still V1-only |
|-------------|------|------------------------|
| getRateLinks | `/json/getRateLinks` | Rate-to-channel links. V2 has no equivalent yet (channel mapping is UI-driven via `/channels/settings`) |
| setRateLinks | `/json/setRateLinks` | Same — rate link types (percentage/per-booking/per-day/per-person/none/per-period) are V1-only |
| getInvoicees | `/json/getInvoicees` | Payables. V2 `/bookings/invoices` covers invoices, not invoicees |
| setInvoicees | `/json/setInvoicees` | Same |
| getDescriptions | `/json/getDescriptions` | BETA, IP-whitelisted, no API key. V2 has no equivalent |

---

## 4. Bridge endpoint (V1→V2 migration helper)

| Endpoint | Path | Classification | Purpose |
|----------|------|----------------|---------|
| getV2RefreshToken | `/json/getV2RefreshToken` | **Bridge** | V1 endpoint (apiKey/propKey auth) that returns a V2 refresh token. Use it to migrate existing V1 credentials to V2. After migration, ignore it. |

---

## 5. OTA-standard endpoints (version-agnostic, still current)

These use the OpenTravel Alliance (OTA2015A) protocol + JSON hotel-avail. They predate the V2 split and are still the current way to do OTA-native availability/price lookup and booking push. Auth is HTTP Basic (propid + channel-manager password), not V1 apiKey or V2 token.

| Endpoint | Path | Protocol | Classification |
|----------|------|----------|----------------|
| JSON_HotelAvail | `/ota/JSON_HotelAvail` | JSON POST | OTA standard — current |
| OTA_HotelAvail | `/ota/OTA_HotelAvail` | XML (OTA2015A) | OTA standard — current |
| OTA_HotelRes | `/ota/OTA_HotelRes` | XML (OTA2015A) | OTA standard — current |

---

## 6. CSV endpoints (V1-era, still current)

CSV import/export has no V2 equivalent. Auth is username/password (not apiKey/propKey, not V2 token). Still required for bulk operations.

| Endpoint | Path | Direction |
|----------|------|-----------|
| getRatesCSV | `/csv/getratescsv` | export |
| putRatesCSV | `/csv/putratescsv` | import |
| getRoomDailyCSV | `/csv/getroomdailycsv` | export |
| putRoomDailyCSV | `/csv/putroomdailycsv` | import |
| getBookingsCSV | `/csv/getbookingscsv` | export |
| putBookingsCSV | `/csv/putbookingscsv` | import |
| getGuestsCSV | `/csv/getguestscsv` | export |
| getInvoicesCSV | `/csv/getinvoicescsv` | export |
| putInvoicesCSV | `/csv/putinvoicescsv` | import |
| getInvoiceesCSV | `/csv/getinvoiceescsv` | export |
| putInvoiceesCSV | `/csv/putinvoiceescsv` | import |

---

## 7. XML endpoints (deprecated)

All deprecated — use the JSON V1 equivalents (then migrate to V2 per §2). Listed for completeness.

| XML endpoint | JSON replacement |
|--------------|------------------|
| xml/getAccount, putAccount | getAccount / setAccount |
| xml/getProperties, putProperties | getProperties / setProperty |
| xml/getInventories, putInventories | getAvailabilities / setRoomDates |
| xml/getBookings, putBookings | getBookings / setBooking |

---

## Decision tree: which API do I call?

```
Need auth, accounts, channels, Stripe, webhooks, fixedPrices?
  → V2-native (§1). Use token header.

Need rate links, invoicees, or descriptions?
  → V1-only (§3). Use apiKey/propKey. No V2 option yet.

Have V1 apiKey/propKey and want to move to V2?
  → Call getV2RefreshToken (§4) once, then use V2.

Doing OTA-native availability lookup or booking push?
  → OTA standard (§5). Use Basic Auth, not V1/V2.

Bulk import/export?
  → CSV (§6). Use username/password auth.

Anything else (bookings, properties, calendar, prices, messages)?
  → V1 works today (§2). V2 equivalent exists — prefer V2 for new builds.
```

---

**Caveat:** V2 is still adding endpoints (the changelog notes "under construction" endpoints may not be documented). The V1-only list (§3) may shrink as V2 ships replacements. When in doubt, check the Swagger: `https://beds24.com/api/v2/`. [extracted 2026-07-28]
