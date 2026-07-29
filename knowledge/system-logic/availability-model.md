# Availability Model

How Beds24 tracks and constrains availability — inventory counts, closed dates, min/max stay, multipliers, and per-date overrides.

## Inventory (the `i` field)

Availability is tracked per date, per room type, as a simple unit count.

- `i` = "Number of units available" — the inventory count for that date and room type. [extracted 2026-07-28]
- When a booking consumes a unit, this count decrements; when the count reaches 0 the room type is sold out for that date. [extracted 2026-07-28]
- `ignoreAvail = true` will return prices even if the room has no availability — useful for reading prices independently of inventory. [extracted 2026-07-28]
- `ignoreHidden = false` will include rooms with `sellPriority` set to hidden. [extracted 2026-07-28]

## Closed / override status (the `o` field)

Per-date exceptions are encoded in the `o` (override status) field with integer codes:

- **missing or 0** = none (no override) [extracted 2026-07-28]
- **1** = blackout (date is blocked) [extracted 2026-07-28]
- **2** = no checkin [extracted 2026-07-28]
- **3** = no checkout [extracted 07-28]
- **4** = nocheckin/out (neither arrival nor departure allowed) [extracted 2026-07-28]
- **5** = exceptional period (special rate period) [extracted 2026-07-28]

These flags suppress availability or modify check-in/check-out rules independently of the price data, so rates and restrictions can be managed separately per date. [extracted 2026-07-28]

## Minimum and maximum stay (the `m` and `mx` fields)

Stay-length constraints are set per date.

- `m` = "Minimum stay for this date" [extracted 2026-07-28]
- `mx` = "Maximum stay for this date" [extracted 2026-07-28]
- To **remove** a min stay or max stay, set its value to **0 (zero)**. [extracted 2026-07-28]
- Both are integers that constrain bookings for that day. [extracted 2026-07-28]

## Price multiplier (the `x` field)

A per-date percentage modifier that scales the base price rather than replacing it.

- `x` = "Multiplier" — a "Percentage value of normal price". [extracted 2026-07-28]
- When the value is **missing**, the system defaults to **auto (100%)**, meaning standard pricing applies. [extracted 2026-07-28]
- Example: a value of 120 means 120% of normal price. [extracted 2026-07-28]
- To **delete** a multiplier and return the date to auto, set the multiplier value to **0 (zero)**. [extracted 2026-07-28]
- This allows rates to be scaled by percentage rather than by fixed amounts. [extracted 2026-07-28]

## Per-date prices (the `p1`–`p16` fields)

Each date can carry up to 16 price rows.

- `p1` through `p16` are decimal values representing "Price row 1" through "Price row 16". [extracted 2026-07-28]
- These store the actual daily price tiers for each date, allowing up to 16 different price points per day. [extracted 2026-07-28]
- The price rows hold base amounts, while the multiplier (`x`) adjusts those amounts by percentage. [extracted 2026-07-28]

## Request-level control flags

The `getRoomDates` / `setRoomDates` request gates which optional fields are returned, each defaulting to 0 (no):

- `incMaxStay` controls whether `m`/`mx` are returned [extracted 2026-07-28]
- `incMultiplier` controls whether `x` is returned [extracted 2026-07-28]
- `incOverride` controls whether `o` is returned [extracted 2026-07-28]

## How availability is consumed

When a booking is committed (via `setBooking` or OTA `OTA_HotelRes`):

- If `unitId` is not set, the booking is auto-assigned into an available unit of the specified room type. [extracted 2026-07-28]
- `checkAvailability` will refuse to save the booking if the room has no availability. [extracted 2026-07-28]
- `assignBooking` can use room dependency settings to assign the booking to a different room type or the first free unit. [extracted 2026-07-28]
- In OTA messages, `NumberOfUnits` on the `RoomType` element signals the unit count being reserved. [extracted 2026-07-28]
- Bookings can also be mirrored/copied to other room types via `assignBookingsRoomId2`–`4`, so one booking can consume inventory across multiple configured room types. [extracted 2026-07-28]

## Channel booking limits

- Overbooking protection scope is configurable: `overbookingProtection` = **0 (room)** or **1 (property)**, determining whether capacity is enforced per room type or aggregated across the property. [extracted 2026-07-28]
- Room dependency logic (`dependentRoomLogic`: All / Any / Sum) lets availability of one room type be constrained by occupancy across a set of other rooms. [extracted 2026-07-28]
- `includeBookingsRoomId1`–`12` pulls bookings from other rooms into this room's availability calculation. [extracted 2026-07-28]

## Modification best practice

- "It is not necessary to send unchanged fields when modifying data, it is better to only include the fields which have changed." [extracted 2026-07-28]

## Sources

- https://www.beds24.com/api/json/getRoomDates — i/o/m/mx/x/p1-p16 field definitions, request flags
- https://www.beds24.com/api/json/setRoomDates — removing restrictions (set to 0), multiplier delete
- https://www.beds24.com/api/json/getAvailabilities — ignoreAvail, ignoreHidden, roomIds/propIds filtering
- https://www.beds24.com/api/json/setBooking — unit assignment, checkAvailability, assignBooking
- https://www.beds24.com/api/ota/OTA_HotelRes — NumberOfUnits reservation
- https://www.beds24.com/api/json/getProperty — overbooking protection, room dependency
