# Beds24 API V2.0 — System Logic

> Source: Beds24 Wiki, extracted 2026-07-28 via Jina Reader.
> Facts are system-behavior / logic focused. Every statement cites the exact Jina URL it was fetched from.
> If a source omits a detail, this is noted — nothing is guessed.

---

## 1. Auth Flow

### 1.1 Token types and lifetimes
- **Long life tokens** provide read-only access and expire after 90 days if unused. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- **Refresh tokens** are used to generate tokens that can read AND make changes; they do not expire if used within the past 30 days. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- **Tokens** (generated from refresh tokens) expire after 24 hours and are 152–172 characters long. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- **Invite codes** expire after 24 hours. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 1.2 Obtaining credentials (manual first step, then automatable)
1. Generate an invite code or long life token manually at `beds24.com/control3.php?pagetype=apiv2`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
2. If using an invite code, call `GET /authentication/setup` — it returns a `token` and a `refreshToken`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
3. Include the token as the HTTP header `token: {token}` on subsequent calls. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
4. Use `GET /authentication/token` with the refresh token to get new tokens when old ones expire. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- **This manual step is the only one that must be done manually; all other steps can be automated programmatically.** [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 1.3 Linked-properties access
- Tokens do **not** provide access to linked properties/bookings by default. The checkbox "Allow linked properties" must be ticked when selecting scopes. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- Linking must be done under **Account Management > Manage Account > Manage Property**. Other linking methods are not supported in API V2. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 1.4 IP whitelisting
- Optional when creating an invite code. Multiple IPs are separated by commas (IPv4 and IPv6 both supported, e.g. `192.168.0.1, 127.0.0.1, 2001:0db8:85a3:0000:0000:8a2e:0370:7334`). [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

---

## 2. Scopes

- Each category (except `/authentication`) requires a corresponding scope. Scopes are set at invite-code creation and **cannot be changed later** — a new invite code is required to change them. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- Method qualifiers: `read:`, `write:`, `delete:`, or `all:` (shortcut for all methods). Example: `read:bookings` grants read access; `write:bookings` is needed to create bookings; `all:bookings` allows reading, updating, creating, deleting. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 2.1 Scope list and what they gate
- **bookings** — basic info for `GET /bookings`, `POST /bookings`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- **bookings-personal** — personal info (in addition to `bookings` scope) for `GET /bookings`, `POST /bookings`, `GET /bookings/messages`, `POST /bookings/messages`, `PATCH /bookings/messages`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- **bookings-financial** — financial info (in addition to `bookings` scope) for `GET /bookings`, `POST /bookings`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- **inventory** — `GET /inventory/offers`, `GET /inventory/availability`, `GET /inventory/calendar`, `POST /inventory/calendar`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- **properties** — `GET /properties`, `POST /properties`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- **accounts** — `GET /accounts`, `POST /accounts`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 2.2 What the booking scopes actually return (semantics)
- `bookings` gives basic info (check-in/check-out dates). [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- `bookings-personal` is needed for the guest name. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- `bookings-financial` is needed for invoices. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

---

## 3. Rate Limits / Credit System

- Default limit: **100 credits per 5-minute window**. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- Cost is calculated **dynamically per request based on complexity**. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- When over the limit, **no additional calls are allowed until the 5-minute period ends**. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- The limit can be increased to **200 credits per 5 minutes for 10 € per month** (contact support via the ticketing system); it can be increased further beyond that. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- The limit is **account-level, not per token** — all tokens under the same account share the limit; different accounts (including sub-accounts) have separate limits. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 3.1 Credit-limit response headers
- `x-five-min-limit-remaining` — credits left for the current 5-minute period. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- `x-five-min-limit-resets-in` — seconds until the period resets. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- `x-request-cost` — how many credits the request cost. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 3.2 Token reuse (credit implication)
- Tokens last 24 hours, so you do not need a new token for each request. **Getting a new token costs credits, so reuse an existing one when possible.** [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

---

## 4. Endpoint List

### 4.1 Authentication
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/authentication/setup` | Exchange invite code for token + refresh token |
| GET | `/authentication/token` | Refresh an expired token |
[extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 4.2 Bookings
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/bookings` | Get bookings matching criteria |
| POST | `/bookings` | Create or update bookings |
| DELETE | `/bookings` | Delete bookings by id |
| GET | `/bookings/messages` | Get messages for a booking |
| POST | `/bookings/messages` | Send messages or mark as read (OTA bookings only — NOT direct booking-page bookings) |
| PATCH | `/bookings/messages` | Make changes in all messages in a selection |
| GET | `/bookings/invoices` | Get invoices for bookings |
[extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 4.3 Inventory
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/inventory/rooms/offers` | Get offers based on criteria |
| GET | `/inventory/rooms/availability` | Get availability status of dates |
| GET | `/inventory/rooms/calendar` | Get per-day values from calendar |
| POST | `/inventory/rooms/calendar` | Modify per-day calendar values |
[extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- **Prerequisite:** these inventory endpoints only work if a price is set for the property or room (use Daily Price or Fixed Prices setup). [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 4.4 Properties
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/properties` | Get properties matching criteria |
| POST | `/properties` | Create or modify properties |
| DELETE | `/properties` | Delete properties by id |
| DELETE | `/properties/rooms` | Delete rooms of properties by id |
[extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 4.5 Accounts
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/accounts` | Get accounts and sub-accounts |
| POST | `/accounts` | Create or modify accounts |
[extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 4.6 Channels — Settings
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/channels/settings` | Get channel-specific settings |
| POST | `/channels/settings` | Modify channel settings |
[extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 4.7 Channels — Airbnb
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/channels/airbnb/users` | Get all Airbnb user ids connected to account |
| GET | `/channels/airbnb/listings` | Get all Airbnb listings for a specified Airbnb user id |
| POST | `/channels/airbnb` | Perform actions at Airbnb |
[extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 4.8 Channels — Booking.com
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/channels/booking` | Perform actions at Booking.com |
| GET | `/channels/booking/reviews` | Get reviews from Booking.com |
[extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 4.9 Channels — Stripe
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/channels/stripe` | Perform actions at Stripe |
| GET | `/channels/stripe/paymentMethods` | Get payment methods for a booking from Stripe |
| GET | `/channels/stripe/charges` | Get charges for a booking from Stripe |
[extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 4.10 Webhooks
- `POST Webhooks - bookings` — payload sent to the URL configured at **Settings > Properties > Access > Booking Webhook**. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- Enable booking webhooks under **Settings > Properties > Access > Booking webhooks**. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

---

## 5. Inventory / Booking Model

### 5.1 Create vs. update convention
- **To create** an item, simply do **not** include an `id` in the POST request. Including an `id` modifies an existing item. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 5.2 Group bookings
- Add a booking to a group by setting `"masterId": 1234567`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- Remove a booking from a group by setting `"masterId": null`. (This avoids needing the `makeGroup` action.) [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 5.3 StripeToken
- For direct bookings with Stripe payment, the `StripeToken` field must be set with a Stripe-generated token. If present, a "Stripe button will appear in the Charges and Payments tab" allowing viewing of transactions and saved cards. It is empty for other payment methods. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 5.4 Prices / price rules
- A room can have up to **16 prices**. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- In the control panel these are under **Prices > Daily Price Rules**; via API they are read/set through `GET /inventory/calendar` and `POST /inventory/calendar`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- Retrieve price rules via `GET /properties?includePriceRules=true`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- Price rule format includes `"price1"`, `"price2"`, `"price3"`, etc. per calendar day. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- **It is currently not possible to create new price rules via API; you can only modify existing price rules.** (Example modification: change name via property id → roomTypes → priceRules with `priceruleid` and `name`.) [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 5.5 Offers
- Retrieve offer setup rules via `GET /properties?includeOffers=true`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- Retrieve calculated prices for specific dates via `/inventory/rooms/offers`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 5.6 Availability semantics (`GET /inventory/rooms/availability`)
- If a date is `false`, it is **NOT available for check-in**. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- If the previous date IS available, then the `false` date **IS available for check-out**. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- Worked example: `2024-01-01: true, 2024-01-02: true, 2024-01-03: false` → cannot check in on 2024-01-03, but **can** check out on 2024-01-03 (because 2024-01-02 is available). [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 5.7 Per-date calendar values
- Min stay, availability, and prices for specific dates (like the UI calendar) are read/set via `/inventory/rooms/calendar`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

---

## 6. POST Request Behavior

### 6.1 Multi-item payloads
- All POST endpoints accept an **array of items**. You can create and modify different items in one request. Top-level array items correspond to response items **in the same order**. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 6.2 Payload limits
- Approximately **1 MB per POST payload**. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- **10,000 top-level JSON array items** per POST request. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 6.3 Subitem lifecycle (e.g. invoice items, info items on bookings)
- **Add** a new subitem: include the subitem **without** an id, inside the parent. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- **Update** an existing subitem: include the subitem's id. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- **Delete** a subitem: include **only** the subitem's id. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- Deleting a subitem requires the **write** scope method; deleting the subitem's parent requires the **delete** scope method. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

### 6.4 Property/room update note
- To update room-level settings you **must include the property id** in the request. If it is missing, the system may return an error or **incorrectly report success without applying any changes**. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

---

## 7. Response Structure (POST)

- The response is an array with one item per request item, **in the same order**. Each response item contains:
  - `success`: boolean — `false` if any errors occurred (`false` does **not** necessarily mean nothing changed). [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- Optional fields per item:
  - **New** — info about newly created items/subitems (e.g. new booking id, new info item id).
  - **Modified** — info about modified items/subitems.
  - **Errors** — fatal issues; the attempt to create/change failed.
  - **Warnings** — non-fatal issues; the item was created/changed but a non-required field had invalid data.
  - **Info** — general information about what happened.
  [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- Worked example: a valid booking with an invalid info item → booking is created, info item is not created, `success` = `false`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

---

## 8. Best Practices

1. **Reuse tokens** — they last 24 hours; getting new ones costs credits. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
2. **Use webhooks** instead of frequent polling for new messages/bookings. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
3. **Bulk POST** — group large volumes (e.g. messages) into single requests (e.g. one every 30 seconds) rather than one request per item. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
4. **Multi-ID GETs** — retrieve multiple items in one call by specifying multiple IDs rather than one request per item. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
5. **Multi-item POSTs** — create/update multiple properties/bookings/etc. in one call. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

---

## 9. Feature Status Tags

- **Coming soon** — endpoint not developed; schema is indicative only and may change. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- **Alpha** — usable but in development; not all features implemented; breaking changes unlikely but possible. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- **Beta** — mostly finished and being tested; most features implemented; breaking changes not planned. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

---

## 10. Reference Links

- Interactive API UI: `beds24.com/api/v2`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- API V2 changelog: `wiki.beds24.com/index.php/API_V2.0_changelog`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- apiSourceId values: `wiki.beds24.com/index.php/API_V2.0_apisourceids`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- API V1 (deprecated): `wiki.beds24.com/index.php/Category:API`. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)

---

## 11. Changelog (behavioral highlights)

> Full version-by-version list. Breaking / behavioral changes called out; minor additions summarized.

- **2022-11-22 — Breaking:** in `GET /bookings`, the guests field `name` was renamed to `lastName`. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- **2022-11-15:** in `GET /properties`, `ownerId` was relocated to `data → account → ownerId`. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- **2023-01-24:** invoice items added to `/properties`. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- **2023-02-16:** new Stripe endpoints: `/channels/stripe`, `/channels/stripe/paymentMethods`, `/channels/stripe/charges`. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- **2023-02-21:** upsell items added to `/properties`. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- **2023-03-06:** search criteria added to `/accounts`; texts added to `/properties` (custom questions, upsell item names/descriptions, offer names/descriptions, "offer more details", offer marketing). [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- **2023-04-03:** new endpoint `/authentication/details`. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- **2023-05-18 — Breaking enum changes** for offers → bookingType and roomType → offers → bookingType under `/properties`: `request`→`requestWithManualConfirmation`; `requestCard`→`requestWithCreditCard`; `confirmedCard`→`confirmedWithCreditCard`; `confirmedDepost1`→`confirmedWithDepositCollection1`; `confirmedDepost2`→`confirmedWithDepositCollection2`. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- **2023-10-30:** parameters `makeGroup` and `autoInvoiceItemCharge` relocated under booking body → `actions`. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- **2024-01-09:** new parameter `includeBookingGroup` on `GET /bookings`; returns additional group-booking info. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- **2024-01-10:** new parameter `searchString` on `GET /bookings`; searches guest name, email, apiref, and bookingId fields. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- **2024-02-27:** new endpoint `GET /channels/booking/reviews`. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- **2024-04-04:** Airbnb channel added to `/settings/channels`. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- **2024-05-28:** personal information added to V2 booking webhooks. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- **2024-06-03:** long-life tokens added; usage info and `includeUsage` parameter added to `GET /accounts`. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- **2024-07-30:** support added for adding different message types to bookings: `guest`, `host`, `internalNote`, `system`. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)
- **2024-10-03:** `GET /channels/airbnb/reviews` entered beta. [extracted 2026-07-28] [wiki → API V2.0 changelog](https://wiki.beds24.com/index.php/API_V2.0_changelog)

### Notes on omitted/uncertain items
- The API V2.0 page notes that sending pictures or webhooks is "currently no, however these features are coming soon" (status at time of fetch). [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
- Channel management only via API requires contacting Beds24 support via ticket. [extracted 2026-07-28] [wiki → API V2.0](https://wiki.beds24.com/index.php/API_V2.0)
