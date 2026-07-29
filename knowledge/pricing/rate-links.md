# Rate Links — getRateLinks, setRateLinks

Factual reference for the Beds24 rate-linking JSON API methods. A "rate link" connects a base rate (identified by `rateId` + `roomId` + `offerId`) to a channel/offer with an offset calculation method, so channel prices can be derived from a base rate.

---

## getRateLinks

Retrieve the rate-linking parameters for a given base rate. [extracted 2026-07-28] [api → json/getRateLinks](https://www.beds24.com/api/json/getRateLinks)

### Parameters

| Parameter | Type | Required / Optional | Description |
|-----------|------|---------------------|-------------|
| `authentication` | object | Required (implied) | Credentials container. [extracted 2026-07-28] [api → json/getRateLinks](https://www.beds24.com/api/json/getRateLinks) |
| `authentication.apiKey` | string | Required (implied) | API key from account settings. [extracted 2026-07-28] [api → json/getRateLinks](https://www.beds24.com/api/json/getRateLinks) |
| `authentication.propKey` | string | Required (implied) | Property key for the property. [extracted 2026-07-28] [api → json/getRateLinks](https://www.beds24.com/api/json/getRateLinks) |
| `rateId` | string | **Required** | Identifies the base rate whose links are returned. The base rate must be owned by the property used for authentication. Example: `"12345678"`. [extracted 2026-07-28] [api → json/getRateLinks](https://www.beds24.com/api/json/getRateLinks) |

### What is returned

- Information about the rate linking parameters is returned. [extracted 2026-07-28] [api → json/getRateLinks](https://www.beds24.com/api/json/getRateLinks)
- Information about the base rate itself is **not** returned (explicitly excluded). [extracted 2026-07-28] [api → json/getRateLinks](https://www.beds24.com/api/json/getRateLinks)

### Unspecified in source

HTTP method (implied POST from "Post JSON data here"); exact endpoint URL; explicit response structure/field list; allowed values beyond the example; defaults; rate limiting; error codes; formal definition of "rate links"; whether authentication lives in body or headers. [extracted 2026-07-28] [api → json/getRateLinks](https://www.beds24.com/api/json/getRateLinks)

---

## setRateLinks

Create, modify, or delete rate links. The JSON data structure mirrors what `getRateLinks` returns. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks)

### Top-level structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `authentication` | object | Yes | Contains `apiKey` and `propKey`. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks) |
| `setRateLinks` | array | Yes | One or more rate-link objects to process. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks) |

### Authentication object

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | string | Yes | API key configured in account settings. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks) |
| `propKey` | string | Yes | Property key set for the specific property. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks) }

### Per-link-object parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | Operation: `"new"`, `"modify"`, or `"delete"`. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks) |
| `rateId` | string | Yes | Rate identifier; immutable on modify. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks) |
| `roomId` | string | Yes | Room identifier; immutable on modify. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks) |
| `offerId` | string | Yes | Offer identifier; immutable on modify. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks) |
| `linkType` | string | No (required for `"new"`) | Defines the offset calculation method. See allowed values table. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks) |
| `offset` | string | No | Offset amount; can be negative (e.g. `"-5"`). [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks) |
| `bookingcomRateCode` | string | No | Booking.com-specific rate code (used in the modify example). [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks) |

### linkType allowed values

The `linkType` field defines how the channel price is offset from the base rate. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks)

| Value | Description |
|-------|-------------|
| `"1"` | percentage offset |
| `"2"` | per booking offset |
| `"3"` | per day offset |
| `"4"` | per person per day offset |
| `"5"` | no offset |
| `"6"` | per period offset |

### Action-specific requirements

- **`"new"`** — Must include `rateId`, `roomId`, `offerId`, and `linkType`. `offset` may also be included. Example uses `linkType: "5"`, `offset: "10"`. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks)
- **`"modify"`** — Must include `rateId`, `roomId`, and `offerId`. Only changed fields need be sent. The three ID fields cannot be altered. Example uses `linkType: "4"`, `offset: "-5"`, `bookingcomRateCode: "123456"`. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks)
- **`"delete"`** — Only `rateId`, `roomId`, and `offerId` are required (plus `action: "delete"`). [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks)

### Constraints

- `rateId`, `roomId`, and `offerId` must all be specified together. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks)
- These three identifiers are immutable once created and cannot be changed via modify. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks)
- For modify, send only changed fields rather than the full object. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks)

### Channel connections documented

- **Booking.com** is referenced via the optional `bookingcomRateCode` parameter (shown in the modify example). [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks)
- No other channels (Airbnb, Expedia, etc.) are mentioned on the setRateLinks page. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks)

### Return value

Not specified. The documentation states the JSON data sent is "similar to that returned by getRateLinks," suggesting the response may mirror that endpoint, but no explicit return schema is documented. [extracted 2026-07-28] [api → json/setRateLinks](https://www.beds24.com/api/json/setRateLinks)

---

## Channel context (from related sources)

The rate-link mechanism is the per-rate way to derive channel prices from a base rate. Complementary channel facts from related API documentation:

- Room-level channel enable/disable toggles exist per channel (inventory / price / booking export), e.g. `airbnbComEnableInventory`, `airbnbComEnableBooking`, `bookingComEnableInventory`, `bookingComEnableBooking`, `expediaComEnableInventory`, `expediaComEnablePrice`, `expediaComEnableBooking`, `agodaComEnableInventory`, `agodaComEnablePrice`, `agodaComEnableBooking`. [extracted 2026-07-28] [api → json/setProperty](https://www.beds24.com/api/json/setProperty)
- Occupancy sync fields `p1Sync`, `p2Sync`, `p3Sync`, `p4Sync` exist at the room level. [extracted 2026-07-28] [api → json/setProperty](https://www.beds24.com/api/json/setProperty)
- Property-level channel connection identifiers and per-channel price multipliers exist, e.g. `airbnbMultiplier`, `bookingComMultiplier`, `vrboMultiplier`, `bookvisitMultiplier`, plus channel property codes (`airbnbPropertyCode`, `bookingComPropertyCode`, `expediaComPropertyCode`, etc.). [extracted 2026-07-28] [api → json/getProperty](https://www.beds24.com/api/json/getProperty)
- Channel price-import settings exist, e.g. `bookingComPriceImport`. [extracted 2026-07-28] [api → json/getProperty](https://www.beds24.com/api/json/getProperty)

These channel facts live on `setProperty`/`getProperty`, not on the rate-links pages themselves.
