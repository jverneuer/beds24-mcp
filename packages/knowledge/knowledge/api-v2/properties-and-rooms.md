# Beds24 API V2 — Properties, Rooms & Room Setup

> **Audience:** integrators migrating from API V1 or building new on V2.
> **Scope:** the `property` resource and the property → roomTypes → units model.
> **Status note:** most Properties endpoints are **Beta**; the rooms read/delete
> endpoints are **Coming soon** (see [Rooms endpoints](#7-rooms-endpoints-coming-soon)).

---

## 1. V1 ↔ V2 mapping

V1 is deprecated and Beds24 publishes no field-by-field mapping. [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0

The resource-level correspondence is:

| V1 | V2 |
|---|---|
| `getProperty` | `GET /properties` |
| `setProperty` | `POST /properties` |

The key conceptual shift is the **identifier + nesting model**:

- **V1** identifies a listing by `propKey` and a room by a flat `roomId`. [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0
- **V2** uses a nested hierarchy: **`property` → `roomTypes[]` → `units[]`**,
  each with its own numeric `id`. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml

So a "room" in V2 is not a top-level object — it lives inside its parent
property's `roomTypes` array, and a bookable unit lives inside that room type's
`units` array. To touch room-level data you must carry the parent property `id`
(see [Create / modify properties](#3-create--modify-properties-post)).

---

## 2. Auth, base URL & general rules

These apply to every call below.

- **Auth header:** `token: {token}`. [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0
- **Token types:** long-life tokens are read-only; refresh tokens can read and
  write. Refresh tokens issue tokens that expire after 24 h. A refresh token stays
  valid if used within 30 days; a long-life token stays valid if used within
  90 days. [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0
- **Base path:** `/api/v2/`. [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0
- **POST accepts arrays.** Send a JSON array of items; the response returns one
  item per request item **in the same order**, each with a `success` boolean.
  [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0
- **Payload limits:** ~1 MB max payload; max **10 000** top-level JSON array
  items per POST. [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0
- **Create vs. modify:** omit `id` to create, include `id` to modify.
  [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0
- **Scopes:** each category needs a matching scope (`properties`, `inventory`,
  …) with a method qualifier — `read:`, `write:`, or `all:`. Scopes are set when
  the invite code is created and cannot be changed later.
  [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0
- **Rate limits:** default 100 credits / 5 min (shared across an account's
  tokens). Track via response headers `x-five-min-limit-remaining`,
  `x-five-min-limit-resets-in`, `x-request-cost`. Upgrade to 200 credits for
  €10/month. [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0

---

## 3. Read properties — `GET /properties`

**Status:** Beta. [extracted 2026-07-28] https://beds24.com/api/v2/#/Properties/get_properties

### 3.1 Query parameters (spec-verified)

| Param | Type | Purpose |
|---|---|---|
| `id` | array of integer | one or more property IDs to fetch. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml |
| `roomId` | array of integer | filter to properties containing specific room IDs. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml |
| `includeLanguages` | array of string | language codes for translatable texts, e.g. `en`, `de`, `all`. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml |
| `includeTexts` | array of string | which text blocks to return: `all`, `property`, `roomType`. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml |
| `includePictures` | boolean | include picture data. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml |
| **`includePriceRules`** | boolean | **read the property's price rules.** [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml |
| **`includeOffers`** | boolean | **read offer-setup rules.** [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml |
| `includeUpsellItems` | boolean | include upsell items. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml |
| `includeAllRooms` | boolean | include all rooms. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml |
| `includeUnitDetails` | boolean | by default only unit names are returned; set `true` for full unit detail. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml |
| `page` | integer | pagination page. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml |

> **Clarification — fields vs. filters.** The property's own attributes
> (`name`, `propertyType`, `currency`, `address`, `city`, `state`, `country`,
> `postcode`, `mobile`) are **resource fields** that appear in the request body
> (POST) and the response — they are **not** `GET /properties` query filters.
> [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml
> The primary query filter is `id`.

### 3.2 Example response shape (property with roomTypes/units)

The response is an array of `property` objects. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml
Fields are drawn from the verified `property` schema. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml

```json
[{
  "id": 12345678,
  "name": "My Property",
  "propertyType": "apartment",
  "currency": "USD",
  "address": "123 Main St",
  "city": "Melbourne",
  "state": "Victoria",
  "country": "Australia",
  "postcode": "3000",
  "mobile": "123456789",
  "roomTypes": [
    {
      "id": 90123456,
      "name": "Standard room",
      "qty": 1,
      "maxAdult": 2,
      "maxChildren": 2,
      "units": [
        { "id": 1, "name": "Unit A" }
      ]
    }
  ]
}]
```

**Property fields** (verified): `id`, `name`, `propertyType`, `currency`,
`address`, `city`, `state`, `country`, `postcode`, `mobile`, `roomTypes`.
[extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml

**roomType fields** (verified): `id`, `name`, `qty`, `maxAdult`, `maxChildren`,
`units`. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml

**unit fields** (verified): `id`, `name`. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml

> `propertyType` values follow the control panel (the spec example uses
> `"apartment"`). The full enum was not present in the fetched sources.
> [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml

---

## 4. Create / modify properties — `POST /properties`

**Status:** Beta — "Create or modify properties." [extracted 2026-07-28] https://beds24.com/api/v2/#/Properties/post_properties

### 4.1 The "include the property id to update rooms" rule

Room types and units are **subitems** of a property. To modify any room-level
setting you **must include the parent property `id`** in the payload. Without
it, room-level changes may error or report false success. [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0

The same create/modify convention applies at every level:
- **create** a property / roomType / unit → omit its `id`;
- **modify** → include its `id`;
- **delete** a subitem → send only the subitem `id` (WRITE scope required).
[extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0

### 4.2 Payload shapes (spec-verified examples)

**Create a new property** (omit `id`): [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml

```json
[{
  "name": "My New Property",
  "propertyType": "apartment",
  "currency": "USD",
  "address": "123 Main St",
  "city": "Melbourne",
  "state": "Victoria",
  "country": "Australia",
  "postcode": "3000",
  "mobile": "123456789"
}]
```

**Add a room type to an existing property** (property `id` present, roomType
has no `id`): [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml

```json
[{
  "id": 12345678,
  "roomTypes": [
    {
      "name": "Standard room",
      "qty": 1,
      "maxAdult": 2,
      "maxChildren": 2
    }
  ]
}]
```

**Rename a property and a room** (include the `id` at each level you change):
[extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml

```json
[{
  "id": 12345678,
  "name": "New Property Name",
  "roomTypes": [
    { "id": 90123456, "name": "New Room Name" }
  ]
}]
```

**Rename a unit** (carry property `id` + roomType `id`, then set unit `id`):
[extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml

```json
[{
  "id": 12345678,
  "roomTypes": [
    {
      "id": 90123456,
      "units": [ { "id": 1, "name": "Unit A" } ]
    }
  ]
}]
```

### 4.3 What is editable

- Property-level attributes (`name`, `propertyType`, `currency`, `address`,
  `city`, `state`, `country`, `postcode`, `mobile`). [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml
- Room-type attributes (`name`, `qty`, `maxAdult`, `maxChildren`) and units
  (`name`) — when the parent `id` is supplied. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml
- `priceRules`: existing rules can be modified (e.g. renamed); new rules cannot
  be created via API (see [Price rules](#5-price-rules-read-via-api-modify-only)).
  [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0
- Invoice items and upsell items were added to `/properties`.
  [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0_changelog

---

## 5. Price rules (read via API, modify only)

- A room can have up to **16 prices**. [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0
- **Read** price rules with `GET /properties?includePriceRules=true`.
  [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0
  In the control panel these live under **Prices → Daily Price Rules**.
  [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0
- Price rules are also accessible via `GET` and `POST /inventory/calendar`.
  [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0
- **New price rules cannot be created through the API**, but existing ones can
  be modified — for example renaming a rule. [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0
- Schema name: `priceRules`. [extracted 2026-07-28] https://beds24.com/api/v2/#/Properties/get_properties

---

## 6. Offers

- **Read offer-setup rules** with `GET /properties?includeOffers=true`.
  [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0
- **Retrieve calculated prices** for specific dates via
  `GET /inventory/rooms/offers` (params include `arrival`, `departure`,
  `numAdults` (required), `numChildren`, `includeTexts`, `agentCode`).
  [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml
- Schema name: `offer`. [extracted 2026-07-28] https://beds24.com/api/v2/#/Properties/get_properties

### 6.1 `bookingType` enum (renamed 2023-05-18)

Applied to both `offers.bookingType` and `roomType.offers.bookingType`.
[extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0_changelog

| Old value | New value |
|---|---|
| `request` | `requestWithManualConfirmation` |
| `requestCard` | `requestWithCreditCard` |
| `confirmedCard` | `confirmedWithCreditCard` |
| `confirmedDepost1` | `confirmedWithDepositCollection1` |
| `confirmedDepost2` | `confirmedWithDepositCollection2` |

> Use the **new** values in V2 requests. The full enum list was not present in
> the fetched sources — only the renames above are verified.
> [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0_changelog

### 6.2 New translatable text fields (2023-03-06)

Custom questions, upsell item names/descriptions, and offer names/descriptions/
more-details/marketing texts were added to `/properties`. [extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0_changelog

---

## 7. Rooms endpoints (Coming soon)

The room read/delete endpoints exist in the spec but are not yet released.
Use the nested `roomTypes`/`units` on `GET`/`POST /properties` for now.

| Endpoint | Status | Purpose |
|---|---|---|
| `GET /properties/rooms` | **Coming soon** | get rooms matching criteria (`id`, `propertyId`, plus the `include*` flags). [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml |
| `DELETE /properties/rooms` | **Coming soon** | delete rooms by `id`. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml |
| `DELETE /properties` | **Coming soon** | delete properties by `id`. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml |

`GET /properties/rooms` returns items of schema `room`. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml

> There is no released top-level `GET /properties/rooms/setup` endpoint in the
> fetched spec; room setup is currently managed through the nested `roomTypes`
> on `POST /properties`. [extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml

---

## 8. Quick example — create a property with a room type

Combine the verified create-property payload with an inline `roomTypes` entry.
[extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml

```bash
curl -X POST https://beds24.com/api/v2/properties \
  -H "token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{
    "name": "My New Property",
    "propertyType": "apartment",
    "currency": "USD",
    "address": "123 Main St",
    "city": "Melbourne",
    "state": "Victoria",
    "country": "Australia",
    "postcode": "3000",
    "mobile": "123456789",
    "roomTypes": [
      {
        "name": "Standard room",
        "qty": 1,
        "maxAdult": 2,
        "maxChildren": 2
      }
    ]
  }]'
```

A successful response is an array whose item carries `success: true`.
[extracted 2026-07-28] https://wiki.beds24.com/index.php/API_V2.0

To **later edit** that room, resend the property with the property `id` and the
roomType `id` (see [§4.1](#41-the-include-the-property-id-to-update-rooms-rule)).
[extracted 2026-07-28] https://beds24.com/api/v2/apiV2.yaml

---

## Appendix — source URLs

- Swagger `GET /properties`: https://beds24.com/api/v2/#/Properties/get_properties
- Swagger `POST /properties`: https://beds24.com/api/v2/#/Properties/post_properties
- Raw OpenAPI spec (authoritative params/payloads): https://beds24.com/api/v2/apiV2.yaml
- API V2.0 overview: https://wiki.beds24.com/index.php/API_V2.0
- API V2.0 changelog: https://wiki.beds24.com/index.php/API_V2.0_changelog
