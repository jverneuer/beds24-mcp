# Daily Prices — getDailyPriceSetup, setDailyPriceSetup

Factual reference for the Beds24 daily-price JSON API methods. A "daily price" is a per-room price configuration identified by a `dailyPriceNumber`; daily prices are the unit the channel manager typically syncs to OTAs.

---

## getDailyPriceSetup

Return the daily-price setup for a room. [extracted 2026-07-28] [api → json/getDailyPriceSetup](https://www.beds24.com/api/json/getDailyPriceSetup)

### Parameters

| Parameter | Type | Required / Optional | Description |
|-----------|------|---------------------|-------------|
| `authentication` | object | Required (implied) | Credentials container. [extracted 2026-07-28] [api → json/getDailyPriceSetup](https://www.beds24.com/api/json/getDailyPriceSetup) |
| `authentication.apiKey` | string | Required (implied) | API key as configured in account settings. [extracted 2026-07-28] [api → json/getDailyPriceSetup](https://www.beds24.com/api/json/getDailyPriceSetup) |
| `authentication.propKey` | string | Required (implied) | Property key set for the property. [extracted 2026-07-28] [api → json/getDailyPriceSetup](https://www.beds24.com/api/json/getDailyPriceSetup) |
| `roomId` | string | **Required** | Identifies the room whose daily-price setup is queried. Example: `"12345678"`. [extracted 2026-07-28] [api → json/getDailyPriceSetup](https://www.beds24.com/api/json/getDailyPriceSetup) |
| `dailyPriceNumber` | string | Optional | Specifies a single daily-price entry to retrieve. Example: `"2"`. [extracted 2026-07-28] [api → json/getDailyPriceSetup](https://www.beds24.com/api/json/getDailyPriceSetup) |

### Behavior

- If `dailyPriceNumber` is omitted, the response includes all daily prices for the room. [extracted 2026-07-28] [api → json/getDailyPriceSetup](https://www.beds24.com/api/json/getDailyPriceSetup)
- If `dailyPriceNumber` is supplied, only the matching daily-price entry is returned. [extracted 2026-07-28] [api → json/getDailyPriceSetup](https://www.beds24.com/api/json/getDailyPriceSetup)

### Unspecified in source

The getDailyPriceSetup page documents the request structure but does not enumerate the response fields. The following are **not** specified: exact response schema, full field list (including any channel-mapping fields), allowed values/constraints/defaults for `roomId` and `dailyPriceNumber`, HTTP method (implied POST), endpoint URL, error format. [extracted 2026-07-28] [api → json/getDailyPriceSetup](https://www.beds24.com/api/json/getDailyPriceSetup)

---

## setDailyPriceSetup

Modify the daily-price setup. Posts JSON whose structure resembles what `getDailyPriceSetup` returns. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup)

### Top-level structure

- `authentication` (object, required) — credentials (`apiKey`, `propKey`). [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup)
- `setDailyPriceSetup` (array of objects, required) — collection of daily-price modification objects. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup)

### Per-entry parameters

| Parameter | Type | Required / Optional | Description |
|-----------|------|---------------------|-------------|
| `action` | string | Required | Specifies the action; the only allowed value documented is `"modify"`. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup) |
| `roomId` | string | Required | Room identifier; cannot be changed with modify. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup) |
| `dailyPrices` | array | Required (within entry) | Array of daily-price objects to modify. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup) |
| `dailyPriceNumber` | string | Required (within `dailyPrices`) | Identifies the specific daily price; cannot be changed with modify. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup) |
| `name` | string | Optional (shown in example) | Name for the daily price. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup) |

### Linking fields (optional)

Used to source a daily price's value from another daily price instead of setting it directly. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup)

| Parameter | Type | Required / Optional | Description |
|-----------|------|---------------------|-------------|
| `linkRoomId` | string | Optional | Room ID of the master/source daily price. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup) |
| `linkDailyPriceNum` | string | Optional | Daily price number to link from. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup) |
| `linkOffset` | string | Optional | Offset amount applied to the linked value. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup) |
| `linkPercent` | string | Optional | Offset percentage applied to the linked value. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup) |

### Constraints

- The `action` documented is `"modify"` only. (The source does not document `"new"` or `"delete"` for this method.) [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup)
- `roomId` and `dailyPriceNumber` are immutable during a modify action. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup)
- When a daily price is linked from another daily price, its value cannot be set directly. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup)
- Only changed fields need be included in modify requests; unchanged fields need not be sent. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup)
- The number of daily-price rows (`dailyPriceCount`) cannot be changed via this function; use `setProperty` JSON to increase or decrease the count. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup)

### Return value / response

Not specified in source. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup)

---

## Channel sync rules for daily prices

A channel-sync-rules section is referenced on the setDailyPriceSetup page but its specific content was not included in the fetched material. [extracted 2026-07-28] [api → json/setDailyPriceSetup](https://www.beds24.com/api/json/setDailyPriceSetup)

The following are **not confirmed** by any fetched source and should be treated as unverified: which specific channels daily prices sync to, the mapping of `dailyPriceNumber` to channels, and any rule stating that only daily prices (not standard rates) sync to channels. The Beds24 wiki (wiki.beds24.com) was blocked (HTTP 403) and could not be checked. [extracted 2026-07-28] [](https://wiki.beds24.com/)

### Related channel facts (from getProperty / setProperty)

These are documented channel-manager facts that accompany daily-price configuration, though they are not themselves daily-price sync rules:

- Room-level per-channel enable toggles exist (inventory / price / booking export): `airbnbComEnableInventory`, `airbnbComEnableBooking`, `bookingComEnableInventory`, `bookingComEnableBooking`, `expediaComEnableInventory`, `expediaComEnablePrice`, `expediaComEnableBooking`, `agodaComEnableInventory`, `agodaComEnablePrice`, `agodaComEnableBooking`. [extracted 2026-07-28] [api → json/setProperty](https://www.beds24.com/api/json/setProperty)
- Occupancy sync fields `p1Sync`–`p4Sync` exist at the room level. [extracted 2026-07-28] [api → json/setProperty](https://www.beds24.com/api/json/setProperty)
- Property-level per-channel connection identifiers and price multipliers exist (`airbnbMultiplier`, `bookingComMultiplier`, `vrboMultiplier`, `bookvisitMultiplier`, etc.) plus channel property codes and `bookingComPriceImport`. [extracted 2026-07-28] [api → json/getProperty](https://www.beds24.com/api/json/getProperty)
- Property-level pricing fields: `currency` (3-char code) and `vatRate` (decimal). [extracted 2026-07-28] [api → json/getProperty](https://www.beds24.com/api/json/getProperty)
