# setRoomDates

Post JSON data here to set room price and availability. The request structure mirrors what is returned by `getRoomDates`. [extracted 2026-07-28] [api → json/setRoomDates](https://www.beds24.com/api/json/setRoomDates)

**Endpoint:** `https://api.beds24.com/json/setRoomDates` [extracted 2026-07-28] [api → json/setRoomDates](https://www.beds24.com/api/json/setRoomDates)

## Top-level fields

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `authentication` | Object | Required | Contains authentication credentials |
| `roomId` | String | Required | Identifier for the room (e.g., "12345") |
| `dates` | Object | Required | Collection of date entries keyed by date string |

[extracted 2026-07-28] [api → json/setRoomDates](https://www.beds24.com/api/json/setRoomDates)

## authentication object

| Parameter | Type | Description |
|-----------|------|-------------|
| `apiKey` | String | Value configured in account settings |
| `propKey` | String | Value set for the property |

[extracted 2026-07-28] [api → json/setRoomDates](https://www.beds24.com/api/json/setRoomDates)

## dates object

Each key is a date in **YYYYMMDD** format (e.g., "20141015", "20141016", "20141019"). [extracted 2026-07-28] [api → json/setRoomDates](https://www.beds24.com/api/json/setRoomDates)

## Per-date fields

| Parameter | Type | Description |
|-----------|------|-------------|
| `p1` | String | Price level 1 (e.g., "45.00") |
| `p2` | String | Price level 2 (e.g., "55.00") |
| `p3` | String | Price level 3 (e.g., "65.00") |
| `p4` | String | Price level 4 (e.g., "75.00") |
| `i` | String | Availability/closed status — "1" for available, "0" for closed |
| `o` | String | When present with "1", indicates the date is closed |
| `m` | String | Minimum stay value (e.g., "2") |
| `mx` | String | Maximum stay value (e.g., "3") |
| (multiplier) | String | Multiplier field — setting to "0" deletes it and reverts to auto |

[extracted 2026-07-28] [api → json/setRoomDates](https://www.beds24.com/api/json/setRoomDates)

## Constraints and rules

- **Date format:** YYYYMMDD (compact, no separators). [extracted 2026-07-28] [api → json/setRoomDates](https://www.beds24.com/api/json/setRoomDates)
- **Removing min/max stay:** To remove a min stay or max stay, set its value to 0 (zero). [extracted 2026-07-28] [api → json/setRoomDates](https://www.beds24.com/api/json/setRoomDates)
- **Deleting multiplier:** To delete a multiplier and set the date to auto, set the multiplier value to 0 (zero). [extracted 2026-07-28] [api → json/setRoomDates](https://www.beds24.com/api/json/setRoomDates)
- **Closing a room:** Set `i` to "0" and include `o` set to "1". [extracted 2026-07-28] [api → json/setRoomDates](https://www.beds24.com/api/json/setRoomDates)
- **All values are strings** (numbers and prices are quoted). [extracted 2026-07-28] [api → json/setRoomDates](https://www.beds24.com/api/json/setRoomDates)

## Field behavior summary

- When pricing applies: include `p1`–`p4` and set `i` to "1". [extracted 2026-07-28] [api → json/setRoomDates](https://www.beds24.com/api/json/setRoomDates)
- When closed: set `i` to "0" and add `o` as "1". [extracted 2026-07-28] [api → json/setRoomDates](https://www.beds24.com/api/json/setRoomDates)
- Multiplier removal is done via the zero-value convention (exact field name not specified in examples; see `getRoomDates` for field details). [extracted 2026-07-28] [api → json/setRoomDates](https://www.beds24.com/api/json/setRoomDates)
