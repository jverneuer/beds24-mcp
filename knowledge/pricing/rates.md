# Rates — getRates, setRate, setRates

Factual reference for the Beds24 rate-management JSON API methods. A "rate" is a dated price rule attached to a room, with per-occupancy pricing, stay-length and advance-booking constraints, and per-channel OTA rate codes.

---

## getRates

Retrieve rates for a property. Returns rates as a JSON structure; the response field set is the same structure used by `setRate`/`setRates` (the source pages describe the request parameters but do not enumerate the full response fields). [extracted 2026-07-28] [api → json/getRates](https://www.beds24.com/api/json/getRates)

### Parameters

| Parameter | Type | Required / Optional | Description |
|-----------|------|---------------------|-------------|
| `authentication` | object | Required (implied) | Credentials container. [extracted 2026-07-28] [api → json/getRates](https://www.beds24.com/api/json/getRates) |
| `authentication.apiKey` | string | Required (implied) | The API key as configured in account settings ("apiKeyAsSetInAccountSettings"). [extracted 2026-07-28] [api → json/getRates](https://www.beds24.com/api/json/getRates) |
| `authentication.propKey` | string | Required (implied) | The property key set for the property ("propKeyAsSetForTheProperty"). [extracted 2026-07-28] [api → json/getRates](https://www.beds24.com/api/json/getRates) |
| `roomId` | string | Optional | When supplied, restricts the returned rates to a single room. Example value: `"12345"`. [extracted 2026-07-28] [api → json/getRates](https://www.beds24.com/api/json/getRates) |

### Filtering behavior

- Without `roomId`: returns all rates across the property. [extracted 2026-07-28] [api → json/getRates](https://www.beds24.com/api/json/getRates)
- With `roomId`: limits results to the specified room only. [extracted 2026-07-28] [api → json/getRates](https://www.beds24.com/api/json/getRates)

### Unspecified in source

The following are **not** documented on the getRates page: explicit HTTP method (implied POST), exact endpoint URL, full response schema/field list, date-range or rate-type filtering, allowed values or constraints beyond the roomId behavior, pagination, rate-limiting details. [extracted 2026-07-28] [api → json/getRates](https://www.beds24.com/api/json/getRates)

---

## setRate

Create, modify, or delete a single rate. Operates on one rate per request (for bulk operations use `setRates`). [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate)

### Top-level structure

- `authentication` (object, required) — credentials.
- `action` (string, required) — `"new"`, `"modify"`, or `"delete"`. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate)

### Authentication object

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | string | Yes | "apiKeyAsSetInAccountSettings". [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `propKey` | string | Yes | "propKeyAsSetForTheProperty". [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |

### Core rate fields

| Parameter | Type | Required / Conditional | Description |
|-----------|------|------------------------|-------------|
| `rateId` | string | Conditional — do NOT specify for `"new"`; required for `"modify"` and `"delete"` | Auto-assigned on creation; on success the new `rateId` is returned. Must match existing rate for modify/delete. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `roomId` | string | Yes (for all actions) | Room the rate belongs to. An existing rate cannot be moved to a different roomId. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `firstNight` | string (date) | Appears for `"new"` | Start date of the rate, format `YYYY-MM-DD` (e.g. `"2014-10-01"`). [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `lastNight` | string (date) | Appears for `"new"` | End date of the rate, format `YYYY-MM-DD` (e.g. `"2016-10-01"`). [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `name` | string | Appears for `"new"` | Name of the rate (e.g. `"Rate 1"`). [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |

### Minimum / maximum stay and advance booking

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `minNights` | string | `"1"` | Minimum nights stay. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `maxNights` | string | `"30"` | Maximum nights stay. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `minAdvance` | string | `"0"` | Minimum advance booking in days. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `maxAdvance` | string | `"365"` | Maximum advance booking in days. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |

### Strategy

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `strategy` | string | `"0"` | Pricing strategy. Allowed values beyond `"0"` are not specified in source. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |

### Pricing fields (per-occupancy)

Prices are passed as strings; decimals use two places where applicable. Each price has a matching `...Enable` toggle (`"1"` = enabled, `"0"` = disabled). [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate)

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `roomPrice` | string | `"100"` | Base room price. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `roomPriceEnable` | string | `"1"` | Enable/disable room price. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `roomPriceGuests` | string | `"0"` | Guest-related room pricing parameter. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `1pPrice` | string | `"60.00"` | Price for 1 person. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `1pPriceEnable` | string | `"1"` | Enable/disable 1-person price. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `2pPrice` | string | `"85.50"` | Price for 2 persons. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `2pPriceEnable` | string | `"1"` | Enable/disable 2-person price. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `extraPersonPrice` | string | `"20.00"` | Price for each extra person. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `extraPersonPriceEnable` | string | `"1"` | Enable/disable extra-person price. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `extraChildPrice` | string | `"0"` | Price for each extra child. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `extraChildPriceEnable` | string | `"0"` | Enable/disable extra-child price. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |

### Channel / OTA rate codes

String fields, defaulting to empty string `""` in the example. These are per-rate OTA rate identifiers used when pushing to channels. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate)

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `bookingcomRateCode` | string | `""` | Booking.com rate code. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `expediacomRateCode` | string | `""` | Expedia rate code. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `feratelRateCode` | string | `""` | Feratel rate code. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `lastminutecomRateCode` | string | `""` | Lastminute.com rate code. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `tablethotelscomRateCode` | string | `""` | Tablethotels.com rate code. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |
| `travelocitycomRateCode` | string | `""` | Travelocity rate code. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate) |

### Action-specific requirements

- **`"new"`** — Do not include `rateId`; `roomId` required. On success the new `rateId` is returned. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate)
- **`"modify"`** — Both `rateId` and `roomId` required. Only changed fields need be sent; partial updates are preferred. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate)
- **`"delete"`** — Both `rateId` and `roomId` required; both values must be correct. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate)

### Constraints

1. `rateId` is auto-assigned on creation and must not be sent for `"new"`. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate)
2. A rate cannot be moved to a different `roomId`. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate)
3. For modify/delete, `rateId` and `roomId` must both match an existing rate. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate)
4. Partial updates are supported and preferred for `"modify"`. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate)
5. Single-rate operation only — one rate per request. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate)
6. Price fields use string representation of numbers. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate)
7. Date format is ISO 8601 (`YYYY-MM-DD`). [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate)

### Unspecified in source

Which fields are strictly required for `"new"` beyond `roomId`; allowed values for `strategy` beyond `"0"`; allowed values for `*Enable` fields beyond `"0"`/`"1"`; response structure for modify/delete; whether `name` is required; whether `firstNight`/`lastNight` can be modified; min/max values for numeric fields; currency handling. [extracted 2026-07-28] [api → json/setRate](https://www.beds24.com/api/json/setRate)

---

## setRates

Create, modify, or delete rates in bulk. The JSON structure mirrors what `getRates` returns. Each object in the array is processed according to its own `action`, enabling mixed new/modify/delete operations in one request. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates)

### Top-level structure

- `authentication` (object) — credentials (`apiKey`, `propKey`). [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates)
- `setRates` (array) — one or more rate objects. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates)

### Per-rate-object parameters

The per-object field set is identical to `setRate`. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates)

| Parameter | Type (inferred) | Required / Optional | Notes |
|-----------|-----------------|---------------------|-------|
| `action` | string | Required | `"new"`, `"modify"`, or `"delete"`. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `rateId` | string | Conditional | Omit for `"new"`; required for modify/delete; must match existing. New `rateId` returned on success. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `roomId` | string | Conditional | Required for modify/delete; must match existing. Rate cannot move to a different roomId. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `firstNight` | string (date) | Optional | Start date `YYYY-MM-DD`. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `lastNight` | string (date) | Optional | End date `YYYY-MM-DD`. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `name` | string | Optional | Rate name. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `minNights` | string | Optional | Minimum stay. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `maxNights` | string | Optional | Maximum stay. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `minAdvance` | string | Optional | Minimum advance booking. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `maxAdvance` | string | Optional | Maximum advance booking. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `strategy` | string | Optional | Example `"0"`. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `roomPrice` | string (decimal) | Optional | Base room price. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `roomPriceEnable` | string | Optional | Toggle. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `roomPriceGuests` | string | Optional | Guest-related pricing. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `1pPrice` | string (decimal) | Optional | 1-person price. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `1pPriceEnable` | string | Optional | Toggle. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `2pPrice` | string (decimal) | Optional | 2-person price. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `2pPriceEnable` | string | Optional | Toggle. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `extraPersonPrice` | string (decimal) | Optional | Extra adult charge. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `extraPersonPriceEnable` | string | Optional | Toggle. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `extraChildPrice` | string (decimal) | Optional | Extra child charge. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `extraChildPriceEnable` | string | Optional | Toggle. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `bookingcomRateCode` | string | Optional | Booking.com rate code. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `expediacomRateCode` | string | Optional | Expedia rate code. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `feratelRateCode` | string | Optional | Feratel rate code. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `lastminutecomRateCode` | string | Optional | Lastminute.com rate code. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `tablethotelscomRateCode` | string | Optional | Tablethotels.com rate code. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |
| `travelocitycomRateCode` | string | Optional | Travelocity rate code. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates) |

### Constraints

1. `rateId` must not be specified when adding a new rate. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates)
2. For modify/delete, both `rateId` and `roomId` must be correct. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates)
3. A rate cannot be reassigned to a different `roomId`. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates)
4. Partial updates encouraged — only include changed fields when modifying. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates)
5. Each array element is processed by its own `action`, so a single request can mix new/modify/delete. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates)

### Return value

On successful creation of a new rate, the `rateId` of the new rate is returned. The response format for modify/delete is not specified. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates)

### Unspecified in source

Precise data types (integer vs string vs boolean) beyond the JSON examples; which fields are truly required for `"new"` beyond the logical necessity of `roomId`; defaults for omitted fields; maximum array size for bulk operations; HTTP method/URL/content-type; error response format. [extracted 2026-07-28] [api → json/setRates](https://www.beds24.com/api/json/setRates)

---

## General JSON API rules (apply to all rate methods)

- Only one API call at a time is allowed; wait for completion before the next. [extracted 2026-07-28] [api → json/index.php](https://www.beds24.com/api/json/index.php)
- Space multiple calls a few seconds apart. [extracted 2026-07-28] [api → json/index.php](https://www.beds24.com/api/json/index.php)
- Send and receive only the minimum required data. [extracted 2026-07-28] [api → json/index.php](https://www.beds24.com/api/json/index.php)
- Excessive usage within a 5-minute period will block the account without warning. [extracted 2026-07-28] [api → json/index.php](https://www.beds24.com/api/json/index.php)
- `apiKey` and `propKey` are each 16–64 characters long and must be kept secure. [extracted 2026-07-28] [api → json/index.php](https://www.beds24.com/api/json/index.php)
- `roomId` is a system-generated number unique to each room. [extracted 2026-07-28] [api → json/index.php](https://www.beds24.com/api/json/index.php)
