# Pricing Model

How the Beds24 pricing system works: the relationship between rates and daily prices, how prices are calculated per night and per occupancy, how overrides apply, and which prices flow to channels.

## Rates vs. Daily Prices — the core distinction

Beds24 separates **a pricing plan** from **the actual nightly amounts**.

- A **Rate** is a pricing plan/template (e.g. "Standard Rate", "Non-Refundable Rate"). It contains rules like min stay, max stay, cancellation policy, meal plans, and channel rate codes. [extracted 2026-07-28]
- **Daily Prices** are the actual nightly amounts assigned to specific calendar dates within a rate. These are the values that get pushed to OTAs. [extracted 2026-07-28]
- The channel manager documentation describes the engine as sending "your daily prices from beds24 to external booking channels, with optional per-channel adjustments." [extracted 2026-07-28]

## Daily price structure

Each room can have multiple **daily price rows** (numbered), and each row holds the per-night amounts.

- `dailyPriceNumber` identifies a specific daily price row for a room; it "must be specified and cannot be changed with the modify action." [extracted 2026-07-28]
- The number of daily price rows (`dailyPriceCount`) **cannot** be changed with `setDailyPriceSetup`; to increase or decrease the number of rows you must use `setProperty`. [extracted 2026-07-28]
- Each date stores up to 16 price rows (`p1`–`p16`, decimal) — "Price row 1" through "Price row 16" — allowing up to 16 different price points per day. [extracted 2026-07-28]
- A specific `dailyPriceNumber` can be requested individually; otherwise all daily prices for the room are returned. [extracted 2026-07-28]

## Occupancy-based pricing

Rates support per-occupancy price tiers, each with its own enable flag.

- A rate controls: `roomPrice` (base), **1-person price**, **2-person price**, **extra person price**, and **extra child price** — each with an enable flag. [extracted 2026-07-28]
- This allows the per-night amount to vary with the number of guests. [extracted 2026-07-28]

## Linked daily prices

One daily price can derive its value from another, rather than being set independently.

- `linkRoomId` = room ID of the **master** daily price. [extracted 2026-07-28]
- `linkDailyPriceNum` = daily price number to link from. [extracted 2026-07-28]
- `linkOffset` = optional fixed offset amount. [extracted 2026-07-28]
- `linkPercent` = optional offset percentage. [extracted 2026-07-28]
- Critical rule: **"You cannot set the daily price directly when it is linked from another daily price."** Its value is computed from the master price plus/minus the offset/percentage. [extracted 2026-07-28]
- This linkage lets a slave price track a master with a fixed or percentage differential. [extracted 2026-07-28]

## Per-date price overrides and scaling

Two mechanisms modify the base price on a per-date basis:

- **Override price rows** (`p1`–`p16` in `setRoomDates`/`getRoomDates`) — explicit nightly amounts set directly per date. [extracted 2026-07-28]
- **Multiplier** (`x` field) — a "Percentage value of normal price" that scales the base price. Missing = auto (100%). Set to 0 to delete and return to auto. [extracted 2026-07-28]
- Override flags (`o` field) can mark a date as an "exceptional period" (code 5), signaling a special rate period. [extracted 2026-07-28]

## What controls the final price a guest sees

The final nightly price is a composition of:

1. The **daily price row** (`p1`–`p16`) for that date and occupancy, which may itself be **linked** (computed from a master price ± offset/percent); [extracted 2026-07-28]
2. Scaled by the **multiplier** (`x`) if present; [extracted 2026-07-28]
3. Constrained by the **rate's** rules (min/max stay, channel rate codes, booking window). [extracted 2026-07-28]

## Rate modification rules

- `rateId` must **not** be specified when adding a new rate; on success the new `rateId` is returned. [extracted 2026-07-28]
- When modifying or deleting a rate, **both** `rateId` and `roomId` must be correct. [extracted 2026-07-28]
- **"An existing rate cannot be moved to a different roomId."** A rate is permanently bound to the room it was created under. [extracted 2026-07-28]
- Action field can be **new, modify, or delete**. [extracted 2026-07-28]
- When modifying, only include changed fields. [extracted 2026-07-28]

## Rate rules that affect pricing

A rate carries more than just price — it carries booking-window and stay rules:

- `minNights` / `maxNights` — stay length [extracted 2026-07-28]
- `minAdvance` / `maxAdvance` — how far in advance a booking can be made [extracted 2026-07-28]
- `strategy` field (purpose not explained in the API reference) [extracted 2026-07-28]

## Sources

- https://www.beds24.com/api/json/setDailyPriceSetup — dailyPriceCount, dailyPriceNumber, linked prices, modify-only action
- https://www.beds24.com/api/json/setRates — rate creation/modification rules
- https://www.beds24.com/api/json/setRate — per-occupancy prices, min/max stay, booking window, channel rate codes, strategy
- https://www.beds24.com/api/json/getRoomDates — p1-p16 price rows, x multiplier, o override flags
- https://www.beds24.com/api/json/setRoomDates — per-date price/override setting
- https://www.beds24.com/api/json/getDailyPriceSetup — dailyPriceNumber filtering
