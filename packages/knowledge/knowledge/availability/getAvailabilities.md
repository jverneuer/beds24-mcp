# getAvailabilities

Retrieves availability and price data for rooms, properties, or accounts. No `apiKey` or `propKey` is needed for this function. [extracted 2026-07-28] [api → json/getAvailabilities](https://www.beds24.com/api/json/getAvailabilities)

**Endpoint:** `https://api.beds24.com/json/getAvailabilities` [extracted 2026-07-28] [api → json/getAvailabilities](https://www.beds24.com/api/json/getAvailabilities)

## Parameters

| Parameter | Type | Required/Optional | Description |
|-----------|------|-------------------|-------------|
| `checkIn` | string | Required | Check-in date (e.g., "20151001") |
| `lastNight` | string | Conditional | Last night of the stay (alternative to checkOut) |
| `checkOut` | string | Conditional | Check-out date (alternative to lastNight) |
| `roomId` | string | Conditional | Filter to a specific room |
| `propId` | string | Conditional | Filter to a specific property |
| `ownerId` | string | Conditional | Filter to a specific owner |
| `numAdult` | string | Conditional | Number of adult guests (needed for price) |
| `numChild` | string | Conditional | Number of child guests (needed for price) |
| `offerId` | string | Optional | Restricts results to a single offer number (1–16) |
| `voucherCode` | string | Optional | Voucher code (default: empty) |
| `referer` | string | Optional | Referrer information (default: empty) |
| `agent` | string | Optional | Agent identifier (default: empty) |
| `apisource` | string | Optional | API source indicator (default: "0") |
| `ignoreAvail` | boolean | Optional | When true, prices returned even if room has no availability (default: false) |
| `ignoreHidden` | boolean | Optional | When false, rooms with sellPriority=hidden are included (default: true) |
| `propIds` | array | Optional | Array of property IDs to limit results (e.g., [1235, 1236]) |
| `roomIds` | array | Optional | Array of room IDs to limit results (e.g., [12347, 12348, 12349]) |

[extracted 2026-07-28] [api → json/getAvailabilities](https://www.beds24.com/api/json/getAvailabilities)

## Required-parameter rules

- At minimum you must supply `checkIn`. [extracted 2026-07-28] [api → json/getAvailabilities](https://www.beds24.com/api/json/getAvailabilities)
- You must supply one of `lastNight` or `checkOut`; if both are passed, `lastNight` takes precedence and `checkOut` is disregarded. [extracted 2026-07-28] [api → json/getAvailabilities](https://www.beds24.com/api/json/getAvailabilities)
- You must supply one of `roomId`, `propId`, or `ownerId`. [extracted 2026-07-28] [api → json/getAvailabilities](https://www.beds24.com/api/json/getAvailabilities)
- At least one of `numAdult` or `numChild` is needed to return a price. [extracted 2026-07-28] [api → json/getAvailabilities](https://www.beds24.com/api/json/getAvailabilities)

## Behavior and constraints

- **Specificity rule:** Using more than one of `roomId`, `propId`, or `ownerId` is discouraged; results are constrained to whichever criterion is most specific. [extracted 2026-07-28] [api → json/getAvailabilities](https://www.beds24.com/api/json/getAvailabilities)
- **Array filtering caveat:** When using `roomIds` or `propIds`, you must still supply `propId` or `ownerId` as a base filter. [extracted 2026-07-28] [api → json/getAvailabilities](https://www.beds24.com/api/json/getAvailabilities)
- **Hidden rooms:** By default rooms flagged with `sellPriority` set to hidden are excluded unless `ignoreHidden` is set to false. [extracted 2026-07-28] [api → json/getAvailabilities](https://www.beds24.com/api/json/getAvailabilities)
- **Availability override:** Setting `ignoreAvail` to true forces price returns regardless of actual availability status. [extracted 2026-07-28] [api → json/getAvailabilities](https://www.beds24.com/api/json/getAvailabilities)

## Sample request

```json
{
    "checkIn": "20160501",
    "checkOut": "20160503",
    "propId": "3103",
    "numAdult": "2",
    "numChild": "0"
}
```

[extracted 2026-07-28] [api → json/getAvailabilities](https://www.beds24.com/api/json/getAvailabilities)

## Response

The API returns JSON containing availability and pricing for the matching rooms/properties based on the supplied criteria. [extracted 2026-07-28] [api → json/getAvailabilities](https://www.beds24.com/api/json/getAvailabilities)
