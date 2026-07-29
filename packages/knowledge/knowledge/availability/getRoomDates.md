# getRoomDates

Retrieves room price and availability data per room over a date range. [extracted 2026-07-28] [api → json/getRoomDates](https://www.beds24.com/api/json/getRoomDates)

**Endpoint:** `https://api.beds24.com/json/getRoomDates` [extracted 2026-07-28] [api → json/getRoomDates](https://www.beds24.com/api/json/getRoomDates)

**HTTP Method:** POST [extracted 2026-07-28] [api → json/getRoomDates](https://www.beds24.com/api/json/getRoomDates)

## Request parameters

| Field | Type | Required | Description | Default / Allowed Values |
|---|---|---|---|---|
| `apiKey` | string | required | apiKey for account | — |
| `propKey` | string | required | propKey for property | — |
| `roomId` | integer | required | room id for room | — |
| `from` | date (yyyymmdd) | optional | from date | default=today |
| `to` | date (yyyymmdd) | optional | to date | default=+30 days |
| `incMaxStay` | integer | optional | include maximum stay | default=0; 0=no, 1=yes |
| `incMultiplier` | integer | optional | include multiplier | default=0; 0=no, 1=yes |
| `incOverride` | integer | optional | include override status | default=0; 0=no, 1=yes |
| `allowInventoryNegative` | integer | optional | allow negative inventory values | default=0; 0=no, 1=yes |
| `incChannelBookingLimit` | integer | optional | include the maximum booking override for each channel | default=0; 0=no, 1=yes |

[extracted 2026-07-28] [api → json/getRoomDates](https://www.beds24.com/api/json/getRoomDates)

- Both `apiKey` and `propKey` are nested under an `authentication` object in the JSON payload. [extracted 2026-07-28] [api → json/getRoomDates](https://www.beds24.com/api/json/getRoomDates)

## Response fields (returned per date/room)

| Field | Type | Description |
|---|---|---|
| `i` | integer | "Inventory" — Number of units available |
| `m` | integer | "Minimum Stay" |
| `mx` | integer | "Maximum Stay" (returned when `incMaxStay=1`) |
| `p1`–`p16` | decimal | "Price row 1" through "Price row 16" |
| `o` | integer | "Override status" — missing or 0=none, 1=blackout, 2=no checkin, 3=no checkout, 4=nocheckin/out, 5=exceptional period |
| `x` | integer | "Multiplier" — Percentage value of normal price; missing=auto (100%) |

[extracted 2026-07-28] [api → json/getRoomDates](https://www.beds24.com/api/json/getRoomDates)

## Other details

- **Date format:** `yyyymmdd` (e.g., `20260729`). [extracted 2026-07-28] [api → json/getRoomDates](https://www.beds24.com/api/json/getRoomDates)
- The `from`/`to` range is optional; if omitted, it defaults to a 30-day window starting today. [extracted 2026-07-28] [api → json/getRoomDates](https://www.beds24.com/api/json/getRoomDates)
- Price rows run from `p1` up to `p16`. [extracted 2026-07-28] [api → json/getRoomDates](https://www.beds24.com/api/json/getRoomDates)
- Multiplier (`x`) is a percentage of the normal price; when absent it auto-defaults to 100%. [extracted 2026-07-28] [api → json/getRoomDates](https://www.beds24.com/api/json/getRoomDates)
- Override status (`o`) has six defined states (0–5) covering blackout, check-in/check-out restrictions, and exceptional periods. [extracted 2026-07-28] [api → json/getRoomDates](https://www.beds24.com/api/json/getRoomDates)
