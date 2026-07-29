# Availability API

Beds24 availability endpoints for querying and setting room inventory, prices, and date-level status.

## Child files

- [getAvailabilities.md](getAvailabilities.md) — Retrieves availability and price data for rooms, properties, or accounts; no authentication key required, filters by check-in/out dates plus room/property/owner and guest counts. [api → json/getAvailabilities](https://www.beds24.com/api/json/getAvailabilities)
- [getRoomDates.md](getRoomDates.md) — Retrieves per-room price and availability over a date range (default today … +30d), returning inventory, min/max stay, 16 price rows, override status, and multiplier. [api → json/getRoomDates](https://www.beds24.com/api/json/getRoomDates)
- [setRoomDates.md](setRoomDates.md) — Posts JSON to set room price and availability per date (YYYYMMDD keys), supporting price levels, closed status, min/max stay, and a zero-value convention for removals. [api → json/setRoomDates](https://www.beds24.com/api/json/setRoomDates)

## Overarching topics

- Availability querying (by date range, room, property, owner, guest count)
- Price retrieval and price-row model (p1–p16)
- Room-level inventory and closed/override status
- Date-level write operations (set price, availability, min/max stay, multiplier)
- Date format conventions (YYYYMMDD)
- Authentication model (authentication object with apiKey/propKey; getAvailabilities is keyless)
- Hidden-room filtering and availability overrides
