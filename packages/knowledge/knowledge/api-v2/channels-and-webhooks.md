# Beds24 API V2 — Channels & Webhooks Cookbook

> **New-API cookbook.** This guide shows how to manage channels (Airbnb, Booking.com,
> iCal, Stripe) and webhooks on **API V2**. It is a practical reference: what endpoints
> exist, how to call them, the schemas that matter, and the gotchas.
>
> **Auth (all endpoints below):** send header `token: {token}`. V1 is deprecated — use V2
> for all new work. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

---

## 1. V1 ↔ V2 mapping — what changed

The single biggest conceptual shift: **V1 had no channel API at all.** Channels could
only be configured in the Beds24 UI. V2 adds a full `/channels` surface. [extracted 2026-07-28]
{https://wiki.beds24.com/index.php/API_V2.0}

| Capability | V1 | V2 |
|---|---|---|
| Channel settings (Airbnb, Vrbo, iCal…) | UI only | `GET/POST /channels/settings` (Alpha) |
| Airbnb users / listings / reviews | Not available | `GET /channels/airbnb/users` (Beta), `GET /channels/airbnb/listings` (Alpha), `GET /channels/airbnb/reviews` (Beta) |
| Booking.com reviews | Not available | `GET /channels/booking/reviews` (Alpha) |
| Channel actions (Airbnb, Booking.com) | Not available | `POST /channels/airbnb` (Alpha), `POST /channels/booking` (Alpha) |
| Stripe checkout integration | Not available | `POST /channels/stripe` (Alpha) + charges/payment-methods |
| Booking webhook | `GET` (query-string, template vars) | `POST` (JSON body) — enables personal-info fields |
| Accounts usage / sub-accounts | Limited | `GET /accounts` with `includeUsage`, `includeSubAccounts`, `includeLanguages` |

**Maturity model** (applies to every endpoint below): [extracted 2026-07-28]
{https://wiki.beds24.com/index.php/API_V2.0}

- **Coming soon** — not usable yet; schema is indicative only.
- **Alpha** — usable but still in development; breaking changes unlikely but possible.
- **Beta** — mostly finished and tested; breaking changes not planned.

> Treat Alpha endpoints as shippable but watch the changelog for field additions.

---

## 2. Channel settings — `GET/POST /channels/settings`

Retrieve and modify per-channel configuration: iCal import/export, Vrbo, and Airbnb
settings (multiplier, room-type discounts, cancellation policy). [extracted 2026-07-28]
{https://beds24.com/api/v2/#/Channels/get_settings}

| | Method | Status | Purpose |
|---|---|---|---|
| Get settings | `GET /channels/settings` | Alpha | Read channel settings |
| Set settings | `POST /channels/settings` | Alpha | Modify channel settings |

**Channel enum** (the `channel` field / query param): `iCalExport`, `iCalImport`,
`airbnb`, `vrbo`. [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

### 2.1 GET response shape

The GET response wraps a paginated `data` array. Each element is one of the
channel-specific settings objects: [extracted 2026-07-28]
{https://beds24.com/api/v2/apiV2.yaml}

```
{
  "success": true,
  "type": "channelSetting",
  "pages": { ... },
  "data": [
    { "channel": "airbnb",   "properties": [ { "id": 12345678, "multiplier": 1.3 } ] },
    { "channel": "vrbo",     "properties": [ { "id": 12345678, "roomTypes": [ { "id": 9012345, "7DayDiscountPercent": 35, "cancellationPolicy": "noRefund" } ] } ] },
    { "channel": "iCalExport", ... },
    { "channel": "iCalImport",  ... }
  ]
}
```

Referenced GET schemas: `airbnbSettingsGet`, `vrboSettingsGet`, `iCalExportSettingsGet`,
`iCalImportSettingsGet`. [extracted 2026-07-28]
{https://beds24.com/api/v2/#/Channels/get_settings}

### 2.2 POST request body

POST an **array** of channel-setting objects. Each item is one of: `vrboSettingsPost`,
`airbnbSettingsPost`, `iCalExportSettingsPost`, `iCalImportSettingsPost`. [extracted 2026-07-28]
{https://beds24.com/api/v2/apiV2.yaml}

Referenced POST schemas: `vrboSettingsPost`, `airbnbSettingsPost`,
`iCalExportSettingsPost`, `iCalImportSettingsPost`, plus `vrboPaymentSchedule` and
`iCalImportTools`. [extracted 2026-07-28]
{https://beds24.com/api/v2/#/Channels/post_settings}

### 2.3 Airbnb settings schema (`airbnbSettings`)

The Airbnb settings control the channel multiplier and per-room-type overrides.
[extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

```
{
  "channel": "airbnb",
  "properties": [
    {
      "id": 12345678,                 // property id
      "multiplier": 1.3,              // price multiplier for this property
      "roomTypes": [
        {
          "id": 9012345,              // room type id
          "7DayDiscountPercent": 35,  // 7-day discount, percent
          "cancellationPolicy": "noRefund"
        }
      ]
    }
  ]
}
```

- `channel` — literal `"airbnb"`.
- `properties[].id` — Beds24 property id.
- `properties[].multiplier` — factor applied to prices pushed to Airbnb (e.g. `1.3` = +30%).
- `properties[].roomTypes[].id` — room type id within the property.
- `properties[].roomTypes[].7DayDiscountPercent` — percent discount for 7-day stays.
- `properties[].roomTypes[].cancellationPolicy` — cancellation policy enum
  (e.g. `"noRefund"`).

> The `multiplier` is the lever most automations adjust to reprice a listing for a
> channel without touching the base price.

### 2.4 Vrbo settings (`vrboSettings`)

Mirrors the Airbnb structure with room-type-level fields; uses `vrboSettingsPost`/`Get`
and the nested `vrboPaymentSchedule`. [extracted 2026-07-28]
{https://beds24.com/api/v2/#/Channels/post_settings}

### 2.5 iCal import / export

- `iCalExportSettingsPost/Get` — configure iCal feed export.
- `iCalImportSettingsPost/Get` — configure iCal import per property/URL.
- `iCalImportTools` — helper object for import operations.

[extracted 2026-07-28] {https://beds24.com/api/v2/#/Channels/get_settings}

---

## 3. Airbnb channel

The Airbnb channel endpoints let you enumerate connected Airbnb accounts, their listings,
and reviews, and perform actions at Airbnb programmatically. [extracted 2026-07-28]
{https://wiki.beds24.com/index.php/API_V2.0}

| Endpoint | Method | Status | Returns |
|---|---|---|---|
| `/channels/airbnb/users` | GET | Beta | All Airbnb user ids connected to the account |
| `/channels/airbnb/listings` | GET | Alpha | All Airbnb listings for a given Airbnb user id (`airbnbListing` schema) |
| `/channels/airbnb/reviews` | GET | Beta | Guest reviews from Airbnb (`airbnbReview` schema) |
| `/channels/airbnb` | POST | Alpha | Perform actions at Airbnb |

### 3.1 `GET /channels/airbnb/users` (Beta)

Returns every Airbnb user id linked to the authenticated Beds24 account. Use the ids to
drive the listings endpoint below. [extracted 2026-07-28]
{https://beds24.com/api/v2/#/Channels/get_airbnb_users}

### 3.2 `GET /channels/airbnb/listings` (Alpha)

Requires an Airbnb user id (from 3.1). Returns that user's Airbnb listings using the
`airbnbListing` schema. [extracted 2026-07-28]
{https://beds24.com/api/v2/#/Channels/get_airbnb_listings}

### 3.3 `GET /channels/airbnb/reviews` (Beta)

Pulls guest reviews from Airbnb. Response uses the `airbnbReview` schema. Added to the API
on 2024-10-03. [extracted 2026-07-28]
{https://wiki.beds24.com/index.php/API_V2.0_changelog}

### 3.4 `POST /channels/airbnb` (Alpha)

Performs actions at Airbnb (the specific `action` enum values are defined in the Swagger
contract). Send the action in the request body as an array. [extracted 2026-07-28]
{https://beds24.com/api/v2/#/Channels/post_airbnb}

---

## 4. Booking.com channel

| Endpoint | Method | Status | Returns |
|---|---|---|---|
| `/channels/booking/reviews` | GET | Alpha | Reviews from Booking.com (`bookingReview` schema) |
| `/channels/booking` | POST | Alpha | Perform actions at Booking.com |

### 4.1 `GET /channels/booking/reviews` (Alpha)

Fetches Booking.com reviews. Response uses the `bookingReview` schema. Added to the API
on 2024-02-27. [extracted 2026-07-28]
{https://wiki.beds24.com/index.php/API_V2.0_changelog}

### 4.2 `POST /channels/booking` (Alpha)

Performs actions at Booking.com. Send the action in the request body as an array.
[extracted 2026-07-28] {https://beds24.com/api/v2/#/Channels/post_booking}

---

## 5. Stripe channel — payments integration

The Stripe channel turns a Beds24 booking into a Stripe Checkout session and lets you
manage charges and payment methods. All Stripe endpoints are **Alpha**. Added on
2023-02-16. [extracted 2026-07-28]
{https://wiki.beds24.com/index.php/API_V2.0_changelog}

| Endpoint | Method | Status | Purpose |
|---|---|---|---|
| `/channels/stripe` | POST | Alpha | Create session / charge / refund / capture / manage payment methods |
| `/channels/stripe/charges` | GET | Alpha | Get Stripe charges for a booking |
| `/channels/stripe/paymentMethods` | GET | Alpha | Get Stripe payment methods for a booking |

### 5.1 Stripe actions (POST `/channels/stripe`)

The POST body is an **array** of action objects. Each action is identified by its `action`
string. The full set of actions and their fields: [extracted 2026-07-28]
{https://beds24.com/api/v2/apiV2.yaml}

| Action | Purpose | Key fields |
|---|---|---|
| `createStripeSession` | Create a Checkout session linked to a booking | `bookingId`, `line_items[]`, `success_url`, `cancel_url`, `capture` |
| `chargePaymentMethod` | Charge an attached payment method | `bookingId`, `stripePaymentMethodId`, `capture`, `amount`, `currency`, `description`, `moto`, `source` |
| `refundCharge` | Refund a captured charge | `bookingId`, `stripeChargeId`, `amount` |
| `releaseCharge` | Release (void) an authorized-only charge | `bookingId`, `stripeChargeId` |
| `captureCharge` | Capture a previously authorized charge | `bookingId`, `stripeChargeId`, `amount` |
| `addPaymentMethod` | Attach a card to a booking | `bookingId`, `card` (`number`, `expiryMonth`, `expiryYear`, `name`, `cvc`, `type`) |
| `detachPaymentMethod` | Detach a payment method from a booking | `bookingId`, `stripePaymentMethodId` |

Referenced schemas: `stripeCreateSession`, `stripeChargePaymentMethod`,
`stripeRefundCharge`, `stripeReleaseCharge`, `stripeCaptureCharge`,
`stripeAddPaymentMethod`, `stripeDetachPaymentMethod`, `stripePaymentMethod`,
`stripeCharge`. [extracted 2026-07-28]
{https://beds24.com/api/v2/#/Channels/post_stripe}

### 5.2 The `createStripeSession` payload

This is the core of the integration — it creates a Stripe Checkout session for an existing
booking. [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

```json
{
  "action": "createStripeSession",
  "bookingId": 12345678,
  "line_items": [
    {
      "price_data": {
        "currency": "usd",
        "product_data": {
          "name": "Booking #12345678"
        },
        "unit_amount": 15000
      },
      "quantity": 1
    }
  ],
  "success_url": "https://yoursite.com/success",
  "cancel_url": "https://yoursite.com/cancel",
  "capture": true
}
```

Field notes:

- `action` — literal `"createStripeSession"`.
- `bookingId` — the Beds24 booking id to link the session to.
- `line_items[]` — Stripe checkout line items.
  - `line_items[].price_data.currency` — three-letter ISO currency code.
  - `line_items[].price_data.product_data.name` — line-item name shown to the guest.
  - `line_items[].price_data.unit_amount` — amount in the currency's minor unit (cents).
  - `line_items[].quantity` — quantity.
- `success_url` — where Stripe redirects after a successful payment.
- `cancel_url` — where Stripe redirects if the guest cancels.
- `capture` — `true` to capture funds immediately; `false` to **authorize only** (you
  capture later with `captureCharge`).

### 5.3 End-to-end Stripe payment flow

1. **Make a booking** via the Beds24 API (`POST /bookings`) so you have a `bookingId`.
   [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}
2. **Create the session** — `POST /channels/stripe` with `action: "createStripeSession"`,
   the `bookingId`, and `line_items` in Stripe checkout format. [extracted 2026-07-28]
   {https://beds24.com/api/v2/#/Channels/post_stripe}
3. **Render Stripe Checkout** — the response contains session data. Initialize Stripe.js
   with the provided `pk_live` publishable key **and** the `stripe_account` value
   (the connected-account id, prefixed `acct_`) from the session response.
   [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}
4. **Card auto-links** — once the guest completes checkout, the payment method is
   automatically attached to the booking, so later `chargePaymentMethod` /
   `captureCharge` calls work without re-collecting card details. [extracted 2026-07-28]
   {https://wiki.beds24.com/index.php/API_V2.0}
5. **Post-payment** — use `GET /channels/stripe/charges` and
   `GET /channels/stripe/paymentMethods` to inspect charges and the attached methods for
   a booking. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

> If you created the session with `"capture": false`, the funds are only authorized.
> Capture them later with `action: "captureCharge"` and the `stripeChargeId`. Release
> (void) with `action: "releaseCharge"`.

---

## 6. Channel source ID reference table

Every booking in Beds24 carries an `apiSourceId` indicating where it originated. Use this
to filter `/bookings` by source. The complete list: [extracted 2026-07-28]
{https://wiki.beds24.com/index.php/API_V2.0_apisourceids}

| apiSourceId | apiSource | Channel |
|---:|---|---|
| 0 | direct | Direct |
| 1 | bookingpage | Booking Page |
| 2 | bookitconz | Bookit |
| 3 | | NZAA |
| 8 | | Laterooms |
| 10 | | Airbnb iCal |
| 12 | flipkey | Flipkey |
| 13 | guestlinkcouk | Guestlink |
| 14 | expedia | Expedia |
| 15 | | Wimdu |
| 16 | | iCal Export |
| 17 | agoda | Agoda |
| 18 | | Travelocity |
| 19 | booking | **Booking.com** |
| 20 | | Tripadvisor |
| 21 | | iCal import 1 |
| 22 | | Budgetplaces |
| 23 | tablethotels | Tablethotels |
| 24 | hostelworld | Hostelworld |
| 25 | | Visitscotland |
| 26 | | Holidaylettings |
| 27 | bedandbreakfasteu | Bedandbreakfast EU |
| 28 | | iCal import 2 |
| 29 | | iCal import 3 |
| 30 | vrbo | **Homeaway XML (Vrbo)** |
| 31 | bedandbreakfastnl | Bedandbreakfast NL |
| 32 | atraveo | Atraveo |
| 33 | feratel | Feratel |
| 34 | webroomsconz | Webrooms NZ |
| 35 | lastminute | Lastminute |
| 36 | hotelbeds | Hotelbeds |
| 37 | | Housetrip |
| 38 | | Nineflats |
| 40 | | Homeaway iCal |
| 42 | ota | OTA |
| 43 | | Trivago |
| 44 | hostelinternational | Hostellinginternational |
| 46 | airbnb | **Airbnb XML** |
| 50 | tomastravel | Tomas |
| 51 | ostrovokru | Ostrovok |
| 52 | bookeasycomau | Bookeasy AU |
| 53 | trip | Ctrip |
| 54 | | Asiatravel |
| 55 | tripadvisorrentals | Tripadvisor Rentals |
| 56 | traveloka | Traveloka |
| 57 | hrs | HRS |
| 58 | googleads | **Google** |
| 59 | despegar | Despegar |
| 63 | vacationstay | Vacationstay |
| 64 | hostelsclub | Hostelsclub |
| 66 | edreamsodigeo | eDreams Odigeo |
| 70 | | Rezintel |
| 72 | jomres | Jomres |
| 73 | goibibo | Goibibo |
| 76 | travia | Travia |
| 78 | hometogo | Hometogo |
| 80 | googlecal | Google Calendar |
| 83 | traumferienwohnungen | Traum |
| 86 | tiket | Tiket |
| 87 | marriott | Mariott |
| 92 | bookvisit | BookVisit |
| 999 | agent | Agent |

**The channels this cookbook focuses on:**

- **Direct** = 0
- **Booking Page** = 1
- **Booking.com** = 19 (`booking`)
- **Airbnb XML** = 46 (`airbnb`)
- **Airbnb iCal** = 10
- **Homeaway XML / Vrbo** = 30 (`vrbo`)
- **Google** = 58 (`googleads`)
- **OTA** = 42
- **Agent** = 999

Note that iCal is split across several distinct ids: Airbnb iCal (10), iCal Export (16),
and three separate iCal imports (21, 28, 29). [extracted 2026-07-28]
{https://wiki.beds24.com/index.php/API_V2.0_apisourceids}

---

## 7. Webhooks

Beds24 uses two webhook families: **booking webhooks** (notify your server about booking
events) and **inventory webhooks** (notify about availability/price changes). The official
best practice is to **prefer webhooks over frequent polling**. [extracted 2026-07-28]
{https://wiki.beds24.com/index.php/API_V2.0}

> **Async, not instant.** All webhooks are asynchronous with an **average delay of about
> one minute** between the change and delivery. [extracted 2026-07-28]
> {https://wiki.beds24.com/index.php/Category:Webhooks}

### 7.1 Booking webhooks — V1 vs V2

| | V1 | V2 |
|---|---|---|
| Method | `GET` | `POST` |
| Body | Query string | JSON object |
| Enable at | (SETTINGS) PROPERTIES > ACCESS | Settings > Properties > Access > Booking webhooks |
| Personal info | Not included | **Added 2024-05-28** |
| Follow-up API call | Often needed | Usually **not needed** — data is in the payload |

[extracted 2026-07-28] {https://wiki.beds24.com/index.php/Category:Webhooks}

**V1 (GET):** you configure a per-property URL such as
`https://yourdomain.com/page?property=1`. You can embed template variables like
`[PROPERTYID]`, e.g. `https://yourdomain.com/page?property=[PROPERTYID]`. **Gotcha:** the
template-variable data is inserted into the URL, so it must be URL-safe — guest names can
contain characters that break delivery. [extracted 2026-07-28]
{https://wiki.beds24.com/index.php/Category:Webhooks}

**V2 (POST):** booking data is delivered as a JSON object in the request body, which
usually eliminates the need for a follow-up API call. Personal information was added to the
V2 booking-webhook payload on 2024-05-28. [extracted 2026-07-28]
{https://wiki.beds24.com/index.php/API_V2.0_changelog}

The V2 booking webhook payload (`POST /Webhooks/bookings`, Alpha) is an object with a
`timeStamp` and a `booking` object. The `booking` object fields include: [extracted 2026-07-28]
{https://beds24.com/api/v2/apiV2.yaml}

```
{
  "timeStamp": "2024-05-28T12:34:56",
  "booking": {
    "id": 12345678,
    "bookingGroup": { "master": 123, "ids": [123, 456] },
    "masterId": 123,
    "propertyId": 456789,
    "roomId": 9012345,
    "unitId": 0,
    "roomQty": 1,
    "offerId": 0,
    "status": "confirmed",
    "subStatus": null,
    "arrival": "2024-06-01",
    "departure": "2024-06-05",
    "numAdult": 2,
    "numChild": 0,
    "country": "US",
    "country2": "US",
    "...": "personal-info fields added 2024-05-28"
  }
}
```

> Use V2 (POST) for new integrations — you get JSON, personal info, and avoid the
> URL-encoding pitfalls of V1.

### 7.2 Inventory webhooks

Configure at **Settings > Marketplace > Webhooks**. [extracted 2026-07-28]
{https://wiki.beds24.com/index.php/Inventory_Webhooks}

- **Public URL** — the publicly-facing URL to receive the request.
- **Custom headers** — optional headers for authentication. Template variables are **not
  available** here because the webhook operates at the room level (they only exist in
  booking contexts). [extracted 2026-07-28] {https://wiki.beds24.com/index.php/Inventory_Webhooks}

**Triggers** — fired when any of these occur:

- New booking
- Modification to booked dates
- Cancellation
- Inventory change
- Price change on a room type

**Does NOT trigger:** restriction changes (e.g. minimum-stay restriction changes).
[extracted 2026-07-28] {https://wiki.beds24.com/index.php/Inventory_Webhooks}

**Payload:**

```json
{"roomId": "123456", "propId": "12345", "ownerId": "1234", "action": "SYNC_ROOM"}
```

[extracted 2026-07-28] {https://wiki.beds24.com/index.php/Inventory_Webhooks}

- `action` — currently `SYNC_ROOM`, signaling the room needs syncing with external services.
- The `roomId` that triggered the request is included so you can sync just that room.

**Retry behavior:** Beds24 expects an HTTP 200–299 response. If it does not get one, the
request is **retried multiple times over a 30-minute window** before giving up.
[extracted 2026-07-28] {https://wiki.beds24.com/index.php/Inventory_Webhooks}

### 7.3 Auto Action webhook

Fires when an auto action is executed. Configure at **(SETTINGS) GUEST MANAGEMENT > AUTO
ACTIONS**. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/Category:Webhooks}

---

## 8. Accounts (Alpha)

The `/accounts` endpoints let you read and manage accounts, sub-accounts, usage, and
languages. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

| Endpoint | Method | Status | Purpose |
|---|---|---|---|
| `/accounts` | GET | Alpha | Get accounts (with usage, sub-accounts, languages) |
| `/accounts` | POST | Alpha | Create or modify accounts |

### 8.1 `GET /accounts` query parameters

- `includeSubAccounts` — include sub-accounts in the response.
- `includeUsage` — include usage information (added 2024-06-03).
- `includeLanguages` — language filter; enum values include `"all"`, `"en"`, `"ar"`, `"bg"`,
  and others. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0_changelog}

Search criteria were added to `/accounts` on 2023-03-06; long-life tokens, usage info, and
the `includeUsage` parameter were added on 2024-06-03. [extracted 2026-07-28]
{https://wiki.beds24.com/index.php/API_V2.0_changelog}

---

## 9. Quick example — create a Stripe checkout session for a booking

End-to-end: create a booking, then open a Stripe Checkout session linked to it so the
guest can pay, with the card auto-attached to the booking.

```js
// 1. Auth header used on every V2 call
const AUTH = { headers: { token: process.env.BEDS24_TOKEN } };

// 2. Create the booking first (you need a bookingId)
const booking = await fetch("https://beds24.com/api/v2/bookings", {
  method: "POST",
  ...AUTH,
  headers: { ...AUTH.headers, "Content-Type": "application/json" },
  body: JSON.stringify([{
    propertyId: 456789,
    roomId: 9012345,
    arrival: "2024-06-01",
    departure: "2024-06-05",
    numAdult: 2,
    name: "Ada Lovelace",
    email: "ada@example.com"
  }]),
}).then(r => r.json());

const bookingId = booking[0].new;

// 3. Create a Stripe Checkout session linked to the booking
const session = await fetch("https://beds24.com/api/v2/channels/stripe", {
  method: "POST",
  ...AUTH,
  headers: { ...AUTH.headers, "Content-Type": "application/json" },
  body: JSON.stringify([{
    action: "createStripeSession",
    bookingId: bookingId,
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: `Booking #${bookingId}` },
        unit_amount: 15000            // $150.00, in minor unit (cents)
      },
      quantity: 1
    }],
    success_url: "https://yoursite.com/success",
    cancel_url: "https://yoursite.com/cancel",
    capture: true                    // false = authorize-only
  }]),
}).then(r => r.json());

// 4. Render Stripe Checkout using the session response
//    Initialize Stripe.js with the pk_live key AND the stripe_account (acct_...)
const stripe = Stripe(session.pk_live, { stripe_account: session.stripe_account });
stripe.redirectToCheckout({ sessionId: session.id });
```

> After checkout completes, the card is automatically attached to the booking — so a later
> `chargePaymentMethod` / `captureCharge` call works without re-collecting card details.

---

## Appendix A — API-wide conventions that affect every call

These are not channel-specific but you will hit them in every integration:
[extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

- **Base URL:** `https://beds24.com/api/v2`.
- **Auth header:** `token: {token}`.
- **Token types:** long-life tokens (read-only, expire after 90 days of disuse) and refresh
  tokens (read + write, valid if used within a 30-day window). Tokens expire after 24 hours.
  Invite codes expire after 24 hours.
- **Scopes** are set at invite-code creation and **cannot be changed afterward**. Categories
  include `bookings`, `bookings-personal`, `bookings-financial`, `inventory`, `properties`,
  `accounts`, `channels`, `webhooks`. Method qualifiers: `read:`, `write:`, `all:` (e.g.
  `all:bookings` grants full access).
- **POST arrays:** all POST endpoints accept arrays — send multiple items in one request.
  Omit `id` to create; include `id` to update.
- **POST response:** array with one entry per submitted item, each with a `success`
  boolean plus optional `new`, `modified`, `errors`, `warnings`, `info`.
- **Rate limits:** 100 credits per 5-minute window, shared across tokens on the same
  account. Upgradable to 200 for €10/month. Watch headers `x-five-min-limit-remaining`,
  `x-five-min-limit-resets-in`, `x-request-cost`.
- **Request limits:** POST payloads capped at ~1 MB, max 10,000 top-level JSON array items.
- **Best practices:** reuse tokens (new tokens cost credits), prefer webhooks over polling,
  batch bulk operations.

**Generate tokens / invite codes:** `https://beds24.com/control3.php?pagetype=apiv2`
[extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

**Reference:** V2 changelog {https://wiki.beds24.com/index.php/API_V2.0_changelog} ·
source IDs {https://wiki.beds24.com/index.php/API_V2.0_apisourceids} ·
Swagger UI {https://beds24.com/api/v2} · OpenAPI spec {https://beds24.com/api/v2/apiV2.yaml}
