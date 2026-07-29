# Beds24 API V2 — Inventory, Calendar, Pricing, Availability & Offers

> A practical cookbook for working with inventory on API V2. It covers the calendar (read/write per-date prices, min stay, availability, overrides, channel booking limits), availability status, fixed prices, offers, and the beta unit-bookings endpoint. Every fact cites its source. [extracted 2026-07-28]

---

## V1 ↔ V2 mapping (start here)

V1 is deprecated; new projects should use V2. [extracted 2026-07-28] The V1 inventory methods map to V2 as follows:

| V1 method (deprecated) | V2 endpoint | What it does on V2 |
|---|---|---|
| `getRoomDates` | `GET /inventory/rooms/calendar` | Read per-date calendar values (prices, min stay, availability, overrides, channels) [extracted 2026-07-28] |
| `setRoomDates` | `POST /inventory/rooms/calendar` | Write per-date calendar values [extracted 2026-07-28] |
| `getRates` | `GET /inventory/fixedPrices` (+ `GET /inventory/rooms/calendar` for daily prices) | Read fixed prices; daily prices surface through the calendar [extracted 2026-07-28] |
| `setRates` | `POST /inventory/fixedPrices` | Create or modify fixed prices [extracted 2026-07-28] |
| `setDailyPriceSetup` | `POST /inventory/rooms/calendar` (set `price1`…`priceN` per date) | Daily price values are written through the calendar endpoint [extracted 2026-07-28] |

V2 splits V1's combined "rates" concept into two distinct mechanisms you can use independently or together: **Daily Prices** (per-date values via the calendar) and **Fixed Prices** (date-range prices via `/inventory/fixedPrices`). [extracted 2026-07-28]

---

## 1. The V2 inventory model vs V1

V1 exposed room dates and rates through a small set of methods (`getRoomDates`, `setRoomDates`, `getRates`, `setRates`, `setDailyPriceSetup`). [extracted 2026-07-28] V2 replaces them with four resource groups under the `inventory` scope:

| Resource | Endpoints | Purpose |
|---|---|---|
| Calendar | `GET /inventory/rooms/calendar`, `POST /inventory/rooms/calendar` | Per-date prices, min stay, availability, overrides, channel booking limits [extracted 2026-07-28] |
| Availability | `GET /inventory/rooms/availability` | Boolean check-in/check-out status per date [extracted 2026-07-28] |
| Fixed prices | `GET /inventory/fixedPrices`, `POST /inventory/fixedPrices` | Date-range prices with rate codes [extracted 2026-07-28] |
| Offers | `GET /inventory/rooms/offers` | Calculated offers for specific dates/guests [extracted 2026-07-28] |
| Unit bookings (Beta) | `GET /inventory/rooms/unitBookings` | Which dates units have bookings [extracted 2026-07-28] |

### Mandatory price requirement

All inventory endpoints are gated: **they only work if a price is set for the property or room.** [extracted 2026-07-28] The two allowed setups are **Daily Price** and **Fixed Prices**. [extracted 2026-07-28]

### Max 16 prices per room

A room can have up to **16 prices**. [extracted 2026-07-28] In the control panel these live under *Prices → Daily Price Rules*; in the API they surface as `price1`…`priceN` through the calendar. [extracted 2026-07-28]

### Price rules: modify-only

It is **not possible to create new price rules via the API** — you can only modify existing price rules. [extracted 2026-07-28] (You can, however, create new *fixed prices*; see §5.)

### Daily vs Fixed Prices

- **Daily Prices** define a price for every day. Per-date values are read and written through `/inventory/rooms/calendar`. [extracted 2026-07-28] They can also be linked across rooms/properties (price values import from the source, but rules such as occupancy, minimum stay, and channels stay local). [extracted 2026-07-28]
- **Fixed Prices** have a start and end date and apply to a range of dates. [extracted 2026-07-28] They are managed through `/inventory/fixedPrices`. [extracted 2026-07-28]
- The two can be used independently or together. A *Strategy* setting controls whether Fixed Prices may undercut Daily Prices. [extracted 2026-07-28]

---

## 2. Read calendar — `GET /inventory/rooms/calendar`

Gets per-day values from the calendar. [extracted 2026-07-28]

### Semantics

- Returns **only** the values you can see in the calendar UI. Values set elsewhere (e.g. per-room) are not returned — **except** `minStay`/`maxStay`: if those are not set in the calendar, the min/max restrictions from the room are returned instead. [extracted 2026-07-28]
- **By default no data is returned.** You must include at least one `includeX` parameter. [extracted 2026-07-28]

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `startDate` | string (date) | **Yes** | Start of the range [extracted 2026-07-28] |
| `endDate` | string (date) | **Yes** | End of the range [extracted 2026-07-28] |
| `roomId` | array of integer | No | Multiple roomIds can be included [extracted 2026-07-28] |
| `propertyId` | array of integer | No | Multiple propertyIds can be included [extracted 2026-07-28] |
| `includePrices` | boolean | No | Include the price fields (`price1`…`priceN`) in the response [extracted 2026-07-28] |
| `includeLinkedPrices` | boolean | No | Include the linked-price fields in the response [extracted 2026-07-28] |
| `includeNumAvail` | boolean | No | Include the `numAvail` field in the response [extracted 2026-07-28] |
| `includeMinStay` | boolean | No | Include the `minStay` field in the response [extracted 2026-07-28] |
| `includeMaxStay` | boolean | No | Include the `maxStay` field in the response [extracted 2026-07-28] |
| `includeMultiplier` | boolean | No | Include the `multiplier` field in the response [extracted 2026-07-28] |
| `includeOverride` | boolean | No | Include the override fields in the response [extracted 2026-07-28] |
| `includeChannels` | boolean | No | Include channel-specific information in the response [extracted 2026-07-28] |
| `page` | integer | No | Pagination [extracted 2026-07-28] |

### Per-date fields (returned when requested via `includeX`)

| Field | Type | Meaning |
|---|---|---|
| `price1`…`priceN` | number | Daily price values (up to 16 per room) [extracted 2026-07-28] |
| `linkedPrices` | — | Prices linked from another room/property [extracted 2026-07-28] |
| `numAvail` | integer | Number of units available [extracted 2026-07-28] |
| `minStay` | integer | Minimum stay in nights for this date [extracted 2026-07-28] |
| `maxStay` | integer | Maximum stay in nights for this date [extracted 2026-07-28] |
| `multiplier` | number | Price multiplier [extracted 2026-07-28] |
| `override` | string | Calendar override, e.g. `"blackout"` [extracted 2026-07-28] |
| `channels` | object | Per-channel booking limits, e.g. `{"airbnb": {"maxBookings": 4}}` [extracted 2026-07-28] |

### Example

```bash
curl -X 'GET' \
  'https://beds24.com/api/v2/inventory/rooms/calendar?startDate=2026-08-01&endDate=2026-08-07&roomId[]=1234567&includePrices=true&includeNumAvail=true&includeMinStay=true&includeOverride=true&includeChannels=true' \
  -H 'accept: application/json' \
  -H 'token: {token}'
```

Response shape (`type` is `"calendar"`):

```json
{
  "type": "calendar",
  "pages": { "total": 1, "current": 1 },
  "data": [
    {
      "propertyId": 12345,
      "calendar": [
        {
          "date": "2026-08-01",
          "price1": 100,
          "numAvail": 1,
          "minStay": 2,
          "override": null,
          "channels": { "airbnb": { "maxBookings": 4 } }
        }
      ]
    }
  ]
}
```

[extracted 2026-07-28]

---

## 3. Write calendar — `POST /inventory/rooms/calendar`

Modifies per-day calendar values. [extracted 2026-07-28]

### Semantics

- Modifies **only** the values you can see in the calendar UI. Values set elsewhere (e.g. per-room) are not modified here. [extracted 2026-07-28]
- To **delete** a value within a range, set the field to `null` (see the *deletePrice* example). [extracted 2026-07-28]
- New sub-items are created by omitting `id`; modifications include `id`. [extracted 2026-07-28]

### Request body

A JSON array of room objects. Each object:

| Field | Type | Description |
|---|---|---|
| `roomId` | integer | The room to modify [extracted 2026-07-28] |
| `calendar` | array of objects | One entry per date range [extracted 2026-07-28] |

Each `calendar` entry:

| Field | Type | Description |
|---|---|---|
| `from` | string (date) | First date of the range (inclusive) [extracted 2026-07-28] |
| `to` | string (date) | Last date of the range (inclusive) [extracted 2026-07-28] |
| `price1` / `price2` / … | number | Set a daily price; send `null` to delete it [extracted 2026-07-28] |
| `minStay` | integer | Minimum stay in nights [extracted 2026-07-28] |
| `numAvail` | integer | Number of units available [extracted 2026-07-28] |
| `override` | string | Override the date, e.g. `"blackout"` [extracted 2026-07-28] |
| `channels` | object | Per-channel booking limits keyed by channel name [extracted 2026-07-28] |

### Examples

#### changeValues — set minStay, numAvail and a price for a range

```json
[
  {
    "roomId": 1234567,
    "calendar": [
      { "from": "2022-04-01", "to": "2022-05-01", "minStay": 3, "price1": 450, "numAvail": 1 }
    ]
  }
]
```

[extracted 2026-07-28]

#### deletePrice — delete a price within a range (set it to `null`)

```json
[
  {
    "roomId": 1234567,
    "calendar": [
      { "from": "2022-04-01", "to": "2022-05-01", "price1": null }
    ]
  }
]
```

[extracted 2026-07-28]

#### multiplePrices — change multiple prices for one room

```json
[
  {
    "roomId": 1234567,
    "calendar": [
      { "from": "2022-04-01", "to": "2022-05-01", "price1": 350, "price2": 300 }
    ]
  }
]
```

[extracted 2026-07-28]

#### multipleRooms — different values for different rooms

```json
[
  {
    "roomId": 1111111,
    "calendar": [ { "from": "2022-04-01", "to": "2022-05-01", "minStay": 1 } ]
  },
  {
    "roomId": 2222222,
    "calendar": [ { "from": "2022-04-01", "to": "2022-05-01", "override": "blackout" } ]
  }
]
```

[extracted 2026-07-28]

#### channelBookingLimits — set or remove a channel's booking limit

```json
[
  {
    "roomId": 1111111,
    "calendar": [
      {
        "from": "2022-04-01", "to": "2022-05-01",
        "channels": {
          "airbnb": { "maxBookings": 4 },
          "expedia": { "maxBookings": null }
        }
      }
    ]
  }
]
```

`maxBookings` sets the maximum number of concurrent bookings allowed on that channel for the date range; send `null` to remove the limit. [extracted 2026-07-28]

---

## 4. Read availability — `GET /inventory/rooms/availability`

Gets the availability status of dates. [extracted 2026-07-28]

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `roomId` | array of integer | No | Filter by room [extracted 2026-07-28] |
| `propertyId` | array of integer | No | Filter by property [extracted 2026-07-28] |
| `startDate` | string (date) | No | Start of range [extracted 2026-07-28] |
| `endDate` | string (date) | No | **The last night to be booked (i.e. the day before check-out)** [extracted 2026-07-28] |
| `page` | integer | No | Pagination [extracted 2026-07-28] |

### Check-in / check-out availability logic

The endpoint returns a per-date boolean map. The rules:

- If a date is **`false`**, it is **not available for check-in**. [extracted 2026-07-28]
- However, if the **previous date is available (true)**, then the date **is available for check-out**. [extracted 2026-07-28]

Worked example:

```json
"availability": {
  "2024-01-01": true,
  "2024-01-02": true,
  "2024-01-03": false
}
```

Interpretation: a booking **cannot check in on 2024-01-03** because that date is unavailable; but because 2024-01-02 is available, **2024-01-03 is usable as a check-out day**. [extracted 2026-07-28]

Response `type` is `"availability"`. [extracted 2026-07-28]

---

## 5. Fixed prices — `GET /inventory/fixedPrices` & `POST /inventory/fixedPrices`

Fixed prices have a start and end date and apply to a range of dates. [extracted 2026-07-28] They can be used independently of, or together with, Daily Prices. [extracted 2026-07-28]

### Limits

- **Maximum 100 fixed prices per room.** If you need more, Daily Prices may be a better fit. [extracted 2026-07-28]
- Fixed-price linking is a separate feature (see the GET note below). [extracted 2026-07-28]

### `GET /inventory/fixedPrices` — read fixed prices

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | array of integer | No | The ID of the fixed price; multiple can be included [extracted 2026-07-28] |
| `roomId` | array of integer | No | Filter by room; multiple can be included [extracted 2026-07-28] |
| `propertyId` | array of integer | No | Filter by property; multiple can be included [extracted 2026-07-28] |
| `includeRateCodes` | boolean | No | Include rate codes in the response [extracted 2026-07-28] |
| `page` | integer | No | Pagination [extracted 2026-07-28] |

Note: fixed-price linking is not yet supported. [extracted 2026-07-28] Response `type` is `"fixedPrice"`. [extracted 2026-07-28]

### `POST /inventory/fixedPrices` — create or modify fixed prices

- **Create** a new fixed price → omit the `id` field. [extracted 2026-07-28]
- **Modify** an existing fixed price → include `id`. [extracted 2026-07-28]
- Maximum of 100 fixed prices per room. [extracted 2026-07-28]
- Daily prices are set separately in `/inventory/rooms/calendar`. [extracted 2026-07-28]

### Fixed-price fields

The following fields define a fixed price in the control panel (and map to the fixed-price entity you post). [extracted 2026-07-28]

| Field | Type | Description |
|---|---|---|
| `id` | integer | Omit to create new; include to modify [extracted 2026-07-28] |
| `name` | string | Internal only — does not display on the booking page [extracted 2026-07-28] |
| `color` | string | Custom color; default `#4aa41c` [extracted 2026-07-28] |
| `firstNight` / `lastNight` | string (date) | The price's validity window (First Night / Last Night) [extracted 2026-07-28] |
| `sliceByDate` | boolean | Divides the price into individual prices each with a different start/end date [extracted 2026-07-28] |
| `minStay` | integer | Minimum nights required (also used to set cheaper prices for longer stays) [extracted 2026-07-28] |
| `minDaysUntilCheckin` | integer | e.g. 365 lets booking up to a year out; 7 means only within a week (early-bird specials) [extracted 2026-07-28] |
| `maxDaysInAdvance` | integer | e.g. 0 allows tonight; 3 requires booking at least 3 days ahead (last-minute specials) [extracted 2026-07-28] |
| `allowed` | … | Weekday checkboxes — price is only offered if **all** dates of the stay fall on checked days [extracted 2026-07-28] |
| `checkinAllowed` | … | Restricts which day a booking may start [extracted 2026-07-28] |
| `checkoutAllowed` | … | Restricts which day a booking may end (vacate day) [extracted 2026-07-28] |
| `pricePer` | string | Default `'Night'` [extracted 2026-07-28] |
| `roomPrice` | number | Room price (only offered if enabled) [extracted 2026-07-28] |
| `roomPriceFor` | integer | Valid up to this headcount or the room's max occupancy [extracted 2026-07-28] |
| `singlePrice` | number | Offered for one-person occupancy when enabled [extracted 2026-07-28] |
| `doublePrice` | number | Offered for two-person occupancy; if no single price is defined this is also offered for single occupancy [extracted 2026-07-28] |
| `extraPerson` | number | Per-person surcharge for additional guests (does not send to channels) [extracted 2026-07-28] |
| `extraChild` | number | Like extraPerson but for children (does not send to channels) [extracted 2026-07-28] |
| `strategy` | string | Override when multiple fixed prices apply to a date (see below) [extracted 2026-07-28] |
| `channels` | object | Tick the booking channels the price applies to (different prices per channel) [extracted 2026-07-28] |

#### Strategy values (when multiple fixed prices match a date)

| Strategy | Behavior |
|---|---|
| `Default` (Allow lower prices) | Always apply the lowest price for the guest selection [extracted 2026-07-28] |
| `Do not allow lower prices or minimum stays` | Block lower prices or shorter stays for that rate code only [extracted 2026-07-28] |
| `Do not allow any other prices` | Override all other fixed prices [extracted 2026-07-28] |

[extracted 2026-07-28]

When multiple occupancies exist, "Allow lower prices" must be selected. [extracted 2026-07-28] Fixed-price rules do not influence Daily Prices. [extracted 2026-07-28]

---

## 6. Offers — `GET /inventory/rooms/offers`

Gets offers based on specified criteria. [extracted 2026-07-28]

Offer **setup rules** are retrieved separately via `GET /properties?includeOffers=true`. [extracted 2026-07-28] This endpoint returns the **calculated offer instances** for specific dates and guest counts. [extracted 2026-07-28]

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `propertyId` | array of integer | No | Filter by property [extracted 2026-07-28] |
| `roomId` | array of integer | No | Filter by room [extracted 2026-07-28] |
| `offerId` | array of integer | No | Filter by offer [extracted 2026-07-28] |
| `arrival` | string (date) | **Yes** | Arrival date [extracted 2026-07-28] |
| `departure` | string (date) | **Yes** | Departure date [extracted 2026-07-28] |
| `numAdults` | integer | **Yes** | Number of adults [extracted 2026-07-28] |
| `numChildren` | integer | No | Number of children [extracted 2026-07-28] |
| `includeTexts` | array of string (length 2) | No | Include descriptive texts for a language — use a 2-character country code, e.g. `?includeTexts=en` [extracted 2026-07-28] |
| `agentCode` | string | No | Agent code [extracted 2026-07-28] |
| `page` | integer | No | Pagination [extracted 2026-07-28] |

### Response shape

Response `type` is `"offer"`. Each item carries `propertyId`, `roomId`, and an `offers` array. [extracted 2026-07-28]

### Offers 2–4

"Offer 1" is the default standard offer. Offers 2–4 require activation. [extracted 2026-07-28]

---

## 7. Unit bookings (Beta) — `GET /inventory/rooms/unitBookings`

> **Beta** — Get information about which dates units have bookings. [extracted 2026-07-28]

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `roomId` | array of integer | No | Filter by room [extracted 2026-07-28] |
| `propertyId` | array of integer | No | Filter by property [extracted 2026-07-28] |
| `startDate` | string (date) | No | Start of range [extracted 2026-07-28] |
| `endDate` | string (date) | No | **The last night to be booked (i.e. the day before check-out)** [extracted 2026-07-28] |
| `page` | integer | No | Pagination [extracted 2026-07-28] |

Response `type` is `"unitBookings"`. [extracted 2026-07-28]

---

## 8. Quick code example — set a price + availability for a date range

This example sets `price1`, `minStay`, and `numAvail` for a date range on one room, using the write-calendar endpoint.

```javascript
const BASE = 'https://beds24.com/api/v2';

// Set price + availability for a date range on a single room.
async function setPriceAndAvailability(token, { roomId, from, to, price, minStay, numAvail }) {
  const body = [
    {
      roomId,
      calendar: [
        { from, to, price1: price, minStay, numAvail }
      ]
    }
  ];

  const res = await fetch(`${BASE}/inventory/rooms/calendar`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', token },
    body: JSON.stringify(body),
  });

  // Inspect credit state (see auth-and-setup.md §5)
  console.log('remaining:', res.headers.get('x-five-min-limit-remaining'));
  console.log('cost:',      res.headers.get('x-request-cost'));

  if (!res.ok) throw new Error(`calendar write failed: ${res.status}`);
  return res.json(); // array of items, each: { success, New, Modified, Errors, Warnings, Info }
}

// Usage
const token = process.env.BEDS24_TOKEN;
await setPriceAndAvailability(token, {
  roomId: 1234567,
  from: '2026-09-01',
  to: '2026-09-07',
  price: 120,
  minStay: 2,
  numAvail: 1,
});
```

[extracted 2026-07-28]

To **remove** a price for a range, send `price1: null` instead of a number. [extracted 2026-07-28] To **blackout** a range, add `override: "blackout"`. [extracted 2026-07-28] To cap a channel's concurrent bookings, add `channels: { airbnb: { maxBookings: 4 } }`. [extracted 2026-07-28]

---

## 9. Cross-cutting rules & limits

- **Price is mandatory.** Inventory endpoints only work if a price is set for the property or room (Daily Price or Fixed Prices). [extracted 2026-07-28]
- **Max 16 prices per room** (Daily Prices). [extracted 2026-07-28]
- **Max 100 fixed prices per room.** [extracted 2026-07-28]
- **Price rules are modify-only** — you cannot create new price rules via the API, only modify existing ones. [extracted 2026-07-28]
- **POST payload limits:** approximately **1 MB** per payload and up to **10,000** top-level JSON array items per request. [extracted 2026-07-28]
- **Auth scope:** reading the calendar/availability/offers requires `read:inventory`; writing the calendar requires `write:inventory`. [extracted 2026-07-28]
- **Retrieve related setup data:** price rules via `GET /properties?includePriceRules=true`; offer setup rules via `GET /properties?includeOffers=true`. [extracted 2026-07-28]

---

## Source notes

- Endpoint paths, parameters, POST request-body schemas, and the verbatim POST examples (changeValues, deletePrice, multiplePrices, multipleRooms, channelBookingLimits) come from the authoritative OpenAPI spec: `https://beds24.com/api/v2/apiV2.yaml`. [extracted 2026-07-28]
- Inventory semantics (mandatory price requirement, max 16 prices, modify-only price rules, check-in/check-out availability logic, offer/price-rule retrieval, payload limits, V1 deprecation) come from the Beds24 API V2 wiki: `https://wiki.beds24.com/index.php/API_V2.0`. [extracted 2026-07-28]
- Daily Prices structure (price1–price16, extra person/child, offers, linking, channel activation) comes from `https://wiki.beds24.com/index.php/Category:Daily_Prices`. [extracted 2026-07-28]
- Fixed Prices fields and strategy behavior come from `https://wiki.beds24.com/index.php/Category:Fixed_Prices`. [extracted 2026-07-28]
- Auth, token lifecycle, scopes, and credit headers are covered in the sibling doc `auth-and-setup.md`. [extracted 2026-07-28]
