# Beds24 API V2 — Bookings Cookbook

A practical, example-driven guide to the **Bookings** CRUD surface on Beds24 API V2. This is aNEW-API cookbook: every recipe shows how to do the task on V2, not V1. [extracted 2026-07-28]

> **Audience:** Engineers integrating with Beds24 for the first time on V2, or migrating a V1 integration.
> **Scope:** The booking lifecycle — read, create, update, delete — plus the booking sub-surfaces: invoice items, info items, messages, and invoices.

---

## Key to every fact in this guide

Every factual statement ends with two markers:

- **`{source URL}`** — where the fact was verified.
- **`[extracted 2026-07-28]`** — the date it was extracted.

If a fact lacks both markers, it is an inference or a cross-check, not a direct citation.

---

## V1 ↔ V2 mapping (start here if you know V1)

V1 is deprecated; Beds24 does not recommend it for new projects. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

| Concept | V1 | V2 |
|---|---|---|
| Get bookings | `getBookings` | `GET /bookings` [extracted 2026-07-28] {https://beds24.com/api/v2/#/Bookings/get_bookings} |
| Create / update a booking | `setBooking` | `POST /bookings` (omit `id` to create, include `id` to update) [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0} |
| Delete a booking | (no direct V1 equivalent) | `DELETE /bookings?id=...` [extracted 2026-07-28] {https://beds24.com/api/v2/#/Bookings/delete_bookings} |
| Get messages | V1 messages API | `GET /bookings/messages` [extracted 2026-07-28] {https://beds24.com/api/v2/#/Bookings/get_bookings_messages} |
| Send / mark-read message | V1 messages API | `POST /bookings/messages` (OTA bookings only) [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0} |
| Get invoices | — | `GET /bookings/invoices` (Alpha) [extracted 2026-07-28] {https://beds24.com/api/v2/#/Bookings/get_bookings_invoices} |

**Structural differences that bite migrants:**

- **V2 endpoints accept arrays.** Every POST takes an array of items; the response mirrors request order, one result per item. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}
- **Create vs. update is decided by `id`.** Omit `id` to create; include `id` to modify. There is no separate "set" call. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}
- **Guest "name" became "lastName".** V1 returned a guest field called `name`; V2 renamed it to `lastName`. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0_changelog}

---

## General V2 mechanics (apply to every endpoint below)

**Authentication.** Send the header `token: {token}`. Tokens obtained via refresh token last 24 hours; reuse them across requests. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

**Scopes** are set at invite-code creation and cannot be changed later (create a new code to change them). Booking-relevant scopes: [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

| Scope | Grants |
|---|---|
| `bookings` | Basic booking info — `GET`/`POST` `/bookings` |
| `bookings-personal` | Personal data + message endpoints |
| `bookings-financial` | Financial data |
| `write:bookings` | Modify / delete subitems |
| Method suffixes | `read:` / `write:` / `all:` apply to each scope |

**POST payload limits:** ~1 MB per request and a maximum of 10,000 top-level JSON array items per POST. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

**Response shape for POST/DELETE.** Each response item carries a `success` boolean plus any of: `new` (created IDs), `modified`, `errors`, `warnings`, `info`. **Important:** `success: false` does NOT necessarily mean nothing changed — e.g. a booking with one invalid info item can still be created while the overall item returns `success: false`. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

**Rate limits.** Default 100 credits per 5-minute window (dynamic cost per request), increaseable to 200 for 10€/month, shared across all tokens/sub-accounts. Watch response headers `x-five-min-limit-remaining`, `x-five-min-limit-resets-in`, `x-request-cost`. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

---

## 1. Read bookings — `GET /bookings`

Returns bookings matching criteria. **By default only upcoming bookings are returned** — use the date-range params to go beyond that. [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

### 1.1 Filter parameters

| Param | Type | Description |
|---|---|---|
| `filter` | string enum | `arrivals` (arriving today), `departures` (confirmed/new/request departing today), `new` (created in past 24h), `current` (checked in today and out today or later) [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `propertyId` | array of integer | Multiple allowed [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `roomId` | array of integer | Multiple allowed [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `id` | array of integer | Booking IDs; multiple allowed [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `masterId` | array of integer | Group master IDs; multiple allowed [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `apiReference` | array of string | Multiple allowed [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `channel` | string enum | Source channel — see full list in §1.4 below [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `arrival` / `arrivalFrom` / `arrivalTo` | date `YYYY-MM-DD` | Match / after / before arrival [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `departure` / `departureFrom` / `departureTo` | date `YYYY-MM-DD` | Match / after / before departure [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `bookingTimeFrom` / `bookingTimeTo` | datetime `YYYY-MM-DDTHH:MM:SS` (UTC) | Creation-time window [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `modifiedFrom` / `modifiedTo` | datetime `YYYY-MM-DDTHH:MM:SS` | Last-modified window [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `searchString` | string | Searches guest name, email, apiref, and bookingId fields [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0_changelog} |
| `status` | array of string enum | See §1.2; defaults to `confirmed, request, new, black, inquiry` if omitted [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `includeInvoiceItems` | boolean | Include invoice items in response [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `includeInfoItems` | boolean | Include info items in response [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `includeGuests` | boolean | Guest data — requires the `bookings-personal` scope [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `includeBookingGroup` | boolean | Returns the `bookingGroup` field with IDs of other bookings in the group [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0_changelog} |
| `page` | integer | Pagination [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |

### 1.2 Status enum values

`confirmed`, `request`, `new`, `cancelled`, `black`, `inquiry`. [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

If you omit `status`, the API defaults to returning `confirmed`, `request`, `new`, `black`, and `inquiry` — **note `cancelled` is excluded by default**, so explicitly pass it if you need cancelled bookings. [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

### 1.3 searchString and includeBookingGroup — what they actually do

- `searchString` does a cross-field match over guest name, email, `apiref`, and `bookingId`. It was added 2024-01-10. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0_changelog}
- `includeBookingGroup` adds a `bookingGroup` field listing the IDs of the other bookings in the same group. It was added 2024-01-09. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0_changelog}

### 1.4 Channel enum (full list)

`agoda`, `airbnb`, `asiatravel`, `atraveode`, `booking`, `bookingpage`, `despegar`, `direct`, `edreamsodigeo`, `expedia`, `feratel`, `goibibo`, `hometogo`, `hostelworld`, `hotelbeds`, `hrs`, `jomres`, `marriott`, `ostrovokru`, `ota`, `tiket`, `tomastravel`, `traveloka`, `travia`, `traum`, `trip`, `tripadvisorrentals`, `vacationstay`, `vrbo`, `airbnbical`, `bedandbreakfasteu`, `bedandbreakfastnl`, `bookeasycomau`, `bookitconz`, `flipkey`, `googlecal`, `googleads`, `guestlinkcouk`, `holidaylettingscouk`, `hostelinternational`, `hostelsclub`, `housetripcom`, `icalimport1`, `icalimport2`, `icalimport3`, `lastminute`, `nzaa`, `reserva`, `rezintelnet`, `tablethotels`, `traumferienwohnungen`, `trivagocom`, `visitscotlandcom`, `vrboical`, `webroomsconz`. [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

### 1.5 Example: pull all confirmed arrivals for a property this week

```http
GET /bookings?filter=arrivals&propertyId=12345&status=confirmed
Host: beds24.com
token: <REDACTED>
accept: application/json
```

---

## 2. Create / update bookings — `POST /bookings`

Create new bookings or modify existing ones in a single endpoint. The request body is an **array** of booking objects. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

### 2.1 The `id` rule (memorize this)

| `id` present? | Effect |
|---|---|
| **Omitted** | **Create** a new booking [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0} |
| **Included** | **Modify** the existing booking with that `id` (`id` is required to update) [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |

You can mix creates and updates in one request because each array item is independent. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

### 2.2 Booking field table

Fields are drawn from the `newBooking` schema and POST examples. [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

| Field | Type | Notes |
|---|---|---|
| `id` | integer | Required to update; omit to create [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `roomId` | integer | Which room [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `status` | string enum | `confirmed` / `request` / `new` / `cancelled` / `black` / `inquiry` [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `arrival` | date `YYYY-MM-DD` | Check-in [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `departure` | date `YYYY-MM-DD` | Check-out [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `numAdult` | integer | Adults [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `numChild` | integer | Children [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `title` | string | e.g. "Mr" [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `firstName` | string | Guest first name [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `lastName` | string | Guest last name (renamed from V1 `name`) [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0_changelog} |
| `email` | string | [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `mobile` | string / integer | Phone [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `address` | string | Street [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `city` | string | [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `state` | string | [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `postcode` | string | [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `country` | string | [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `comment` | string | Free-text note [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `actions` | object | Side-effects — see §2.3 [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `infoItems` | array | Booking info subitems — see §3 [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `invoiceItems` | array | Invoice subitems — see §3 [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `masterId` | integer / null | Group booking membership — see §2.4 [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0} |
| `stripeToken` | string | Stripe direct-booking payment token — see §2.5 [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0} |

### 2.3 The `actions` object

Side-effects are nested under the booking body's `actions` field. This was a 2023-10-30 change: `makeGroup` and `autoInvoiceItemCharge` were **moved under `actions`** (they used to sit at the booking top level). [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0_changelog}

| `actions` field | Type | Effect |
|---|---|---|
| `makeGroup` | boolean | `true` to make the booking a group [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `autoInvoiceItemCharge` | (moved here 2023-10-30) | Auto-add an invoice charge item [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0_changelog} |

Example:

```json
"actions": { "makeGroup": true }
```

[extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

### 2.4 Group bookings (`masterId`)

A booking belongs to a group via `masterId`: set it to the group's master booking ID to **add** the booking to the group, or set it to `null` to **remove** it. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

To inspect a group, pass `includeBookingGroup: true` to `GET /bookings` and read the returned `bookingGroup` field. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0_changelog}

### 2.5 Stripe direct bookings

For Stripe payments, set the `stripeToken` field on the booking. This makes a "Stripe button" appear in the Charges and Payments tab — the token is normally generated when you collect card details securely through Stripe, avoiding PCI DSS obligations. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

### 2.6 Response

Returns HTTP 201 with an array of `multiplePostResponse` objects, one per request item, in the **same order** as sent. Each carries `success` plus `new` / `modified` / `errors` / `warnings` / `info`. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

---

## 3. Booking subitems — invoice items and info items

Bookings contain two kinds of subitems, both following the same create/update/delete pattern:

- **Invoice items** (`invoiceItems[]`) — charges, fees, etc.
- **Info items** (`infoItems[]`) — arbitrary key-value notes.

The rule is identical to bookings themselves and to every V2 subitem: [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

| `id` present? | Effect |
|---|---|
| **Omitted** | **Add** a new subitem [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0} |
| **Included, with other fields** | **Modify** that subitem [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0} |
| **Included, alone** | **Delete** that subitem [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0} |

### 3.1 Invoice item fields

Drawn from `invoiceItem` / `invoiceItemPost` schemas and examples. [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

| Field | Type | Notes |
|---|---|---|
| `id` | integer | Required to modify or delete [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `type` | string | e.g. `"charge"` [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `qty` | integer | Quantity [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `amount` | number | Amount [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `code` | string | Item code [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `text` | string | Description [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |

### 3.2 Info item fields

| Field | Type | Notes |
|---|---|---|
| `id` | integer | Required to modify or delete [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `code` | string | Key [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `text` | string | Value [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |

### 3.3 The delete-subitem rule — scopes matter

This is the part that trips people up:

- **Deleting a subitem** (invoice or info item) requires the **WRITE** scope (`write:bookings`). [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}
- **Deleting the parent booking** requires the **DELETE** scope. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}
- To delete a subitem, POST the booking with the subitem object containing **only its `id`** — no other fields. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

---

## 4. Delete bookings — `DELETE /bookings`

Delete one or more bookings by ID. Pass `id` as a query parameter; multiple IDs allowed. [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

| Param | Type | Description |
|---|---|---|
| `id` | array of integer | Booking IDs to delete; multiple allowed [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |

Requires DELETE scope on bookings. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

```http
DELETE /bookings?id=98765&id=98766
Host: beds24.com
token: <REDACTED>
```

Response is the standard `multiplePostResponse` array (one `success` per ID, same order). [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

---

## 5. Messages — `GET` / `POST` / `PATCH /bookings/messages`

Messages attached to bookings. Supports four message types: `guest`, `host`, `internalNote`, `system` (added 2024-07-30). [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0_changelog}

### 5.1 Get messages — `GET /bookings/messages`

| Param | Type | Description |
|---|---|---|
| `id` | array of integer | Message IDs; multiple allowed [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `propertyId` | array of integer | [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `roomId` | array of integer | [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `bookingId` | array of integer | [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `masterId` | array of integer | [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `filter` | string enum | `read` or `unread` [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `maxAge` | integer (1–999) | Maximum age in days of messages to return [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `source` | string enum | `host`, `guest`, `internalNote`, `system` [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `page` | integer | Pagination [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |

Response: paginated list of `message` objects, each with `id`, `bookingId`, `dateTime`, `read`, `source`, `message`, `attachment`, `attachmentName`, `attachmentMimeType`. [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

### 5.2 Send / mark-read — `POST /bookings/messages`

Sends a message or marks messages as read. Request body is an array of `hostMessage` objects. [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

| Field | Type | Notes |
|---|---|---|
| `bookingId` | integer | Target booking (for sending) [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `id` | integer | Target message (for mark-read) [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `message` | string | Message body [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `read` | boolean | Set to mark read/unread [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `attachment` | string | Base64-encoded file [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `attachmentName` | string | File name [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `attachmentMimeType` | string | MIME type [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |

#### ⚠️ OTA-bookings-only restriction

**This endpoint only works for messages for an OTA booking, not bookings made directly from the booking page.** [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

If you POST a message against a direct booking, it will not be delivered. This is the single most important operational constraint in the messages API.

### 5.3 Modify messages in bulk — `PATCH /bookings/messages`

Changes all messages in a selection (currently used to set `read` state). [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

Query parameters select the messages (same axes as GET): `messageId`, `propertyId`, `roomId`, `bookingId`, `masterId`. [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

Request body:

```json
{ "read": true }
```

[extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

---

## 6. Invoices (Alpha) — `GET /bookings/invoices`

Marked **Alpha**: usable but still in development. [extracted 2026-07-28] {https://beds24.com/api/v2/#/Bookings/get_bookings_invoices}

| Param | Type | Description |
|---|---|---|
| `bookingId` | array of integer | Booking IDs to fetch invoices for [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |
| `page` | integer | Pagination [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml} |

Response: paginated list of `invoice` objects, each with an `invoiceId` (integer, nullable). [extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

---

## 7. End-to-end example: create a booking, then add an invoice item

This shows the two-step pattern: create (omit `id`), then update (include the new `id`) to attach a subitem. Both calls are POST arrays.

### Step 1 — create the booking

```http
POST /bookings
Host: beds24.com
token: <REDACTED>
accept: application/json
Content-Type: application/json

[
  {
    "roomId": 1234567,
    "status": "confirmed",
    "arrival": "2026-08-10",
    "departure": "2026-08-15",
    "numAdult": 2,
    "numChild": 1,
    "title": "Mr",
    "firstName": "John",
    "lastName": "Doe",
    "email": "johndoe@example.com",
    "mobile": "123456789",
    "address": "123 Fake st",
    "city": "Melbourne",
    "state": "Victoria",
    "postcode": "3000",
    "country": "Australia",
    "comment": "This is a new booking"
  }
]
```

[extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

The response returns the new booking's `id` in the `new` field of the first response item. Suppose it is `998877`.

### Step 2 — add an invoice item to the new booking

```http
POST /bookings
Host: beds24.com
token: <REDACTED>
accept: application/json
Content-Type: application/json

[
  {
    "id": 998877,
    "invoiceItems": [
      { "type": "charge", "qty": 1, "amount": 150.00, "code": "ACCOM", "text": "Accommodation" }
    ]
  }
]
```

[extracted 2026-07-28] {https://beds24.com/api/v2/apiV2.yaml}

Because the invoice item has **no `id`**, it is created. To later change the amount, include the invoice item's `id` alongside the new `qty`/`amount`; to delete it, send the invoice item with **only its `id`**. [extracted 2026-07-28] {https://wiki.beds24.com/index.php/API_V2.0}

---

## Quick-reference card

| Goal | Method | Endpoint | Key gotcha |
|---|---|---|---|
| List / search bookings | GET | `/bookings` | Default excludes cancelled; default only upcoming |
| Create booking | POST | `/bookings` | Omit `id` |
| Update booking | POST | `/bookings` | Include `id` |
| Delete booking | DELETE | `/bookings` | Needs DELETE scope |
| Add subitem | POST | `/bookings` | Subitem without `id` |
| Modify subitem | POST | `/bookings` | Subitem with `id` + changed fields |
| Delete subitem | POST | `/bookings` | Subitem with **only** `id`; needs WRITE scope |
| Get messages | GET | `/bookings/messages` | `filter`, `maxAge`, `source` axes |
| Send message | POST | `/bookings/messages` | **OTA bookings only** |
| Mark messages read | PATCH | `/bookings/messages` | Query selects; body sets `read` |
| Get invoices | GET | `/bookings/invoices` | Alpha |
| Group membership | both | `masterId` = group id / null | `includeBookingGroup` to inspect |
| Stripe payment | POST | `/bookings` | Set `stripeToken` |

---

## Sources

- API V2 interactive docs: {https://beds24.com/api/v2}
- API V2 wiki reference: {https://wiki.beds24.com/index.php/API_V2.0}
- API V2 changelog: {https://wiki.beds24.com/index.php/API_V2.0_changelog}
- Raw OpenAPI spec: {https://beds24.com/api/v2/apiV2.yaml}
- GET /bookings: {https://beds24.com/api/v2/#/Bookings/get_bookings}
- POST /bookings: {https://beds24.com/api/v2/#/Bookings/post_bookings}
- DELETE /bookings: {https://beds24.com/api/v2/#/Bookings/delete_bookings}
- GET /bookings/messages: {https://beds24.com/api/v2/#/Bookings/get_bookings_messages}
- POST /bookings/messages: {https://beds24.com/api/v2/#/Bookings/post_bookings_messages}
- GET /bookings/invoices: {https://beds24.com/api/v2/#/Bookings/get_bookings_invoices}
