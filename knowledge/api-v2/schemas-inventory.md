# Beds24 API V2 — Schema Inventory (Inventory domain)

Field-level reference for the inventory schemas extracted from `apiV2.yaml`.
All fields are listed verbatim from the source — no fields invented, no nested
objects collapsed. Channel sub-objects are enumerated in full.

---

## offer

- **Base type:** `object`
- **Usage:** response (array of offers nested under `offers`)
- **Defined at:** `apiV2.yaml:5749`
- **Used by:** `GET /organizations/users` — the `offers` array items reference `#/components/schemas/offer`

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| offerId | number | — | Offer identifier |
| enable | string | — | Enum: `onlyIfAvailable`, `no`, `always`, `internal`, `internalManual` |
| name | string | — | Offer name |
| position | integer | — | Display position. Min `1`, max `16` |
| bookingType | string | — | Enum: `default`, `requestWithManualConfirmation`, `requestWithCreditCard`, `confirmedWithCreditCard`, `confirmedWithDepositCollection1`, `confirmedWithDepositCollection2` |
| minimumStay | object | — | Nested stay rule (see below) |
| minimumStay.type | string | — | Enum: `numberOfDays`, `default` |
| minimumStay.numberOfDaysValue | integer | — | Number of days when `minimumStay.type` = `numberOfDays`. Nullable. Min `1`, max `99` |
| allowCancellation | object | — | Nested cancellation rule (see below) |
| allowCancellation.type | string | — | Enum: `daysBeforeArrival`, `propertyRule`, `always`, `never` |
| allowCancellation.daysBeforeArrivalValue | integer | — | Days before arrival when `allowCancellation.type` = `daysBeforeArrival`. Nullable. Min `1`, max `360` |

**Endpoint:** `GET /organizations/users` (response `offers[]`).

---

## availability

- **Base type:** `object`
- **Usage:** response
- **Defined at:** `apiV2.yaml:5807`
- **Used by:** `GET /inventory/rooms/availability`

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| roomId | integer | — | Room identifier |
| propertyId | integer | — | Property identifier |
| name | string | — | Room name |
| availability | object | — | Map of date → availability |
| availability.`"<date>"` | boolean | — | Per-date availability flag. Example: `"2021-01-01": true` |

The `availability` object uses `additionalProperties: boolean`, so every key is an
ISO date string (`YYYY-MM-DD`) and every value is a boolean.

**Endpoint:** `GET /inventory/rooms/availability`.

---

## unitBookings

- **Base type:** `object`
- **Usage:** response
- **Defined at:** `apiV2.yaml:5822`
- **Used by:** `GET /inventory/rooms/unitBookings` (Beta)

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| roomId | integer | — | Room identifier |
| propertyId | integer | — | Property identifier |
| name | string | — | Room name |
| qty | integer | — | Quantity |
| unitBookings | object | — | Container keyed by date (see below) |
| unitBookings.`"<date>"` | object | — | Per-date unit booking counts. Example key: `2021-01-01` |
| unitBookings.`"<date>"`.`"<unitId>"` | integer | — | Number of bookings assigned to a unit (unit IDs start at `1`). Example: `1: 0`, `2: 3` |
| unitBookings.`"<date>"`.unassigned | integer | — | Number of bookings not assigned to any unit on that date |

The outer `unitBookings` is "Contains dates as keys". Each date value is an object
whose keys are unit IDs (strings like `"1"`, `"2"`) plus the literal `unassigned`.

**Endpoint:** `GET /inventory/rooms/unitBookings`.

---

## calendar

- **Base type:** `object`
- **Usage:** response **and** request body (POST)
- **Defined at:** `apiV2.yaml:5852`
- **Used by:**
  - `GET /inventory/rooms/calendar` (response)
  - `POST /inventory/rooms/calendar` (request body)

> **Note:** For GET, you must specify via query parameters the fields to be
> returned, otherwise `calendar` will be an empty array. `POST` description:
> "Values that are set in other places, such as per room, are not modified here —
> only values that you can see in the calendar." To remove any property, set its
> value to `null`.

### Top-level

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| roomId | integer | — | Room identifier |
| calendar | array | — | Per-date calendar entries (see item below) |

### calendar[] (item object)

Each item represents a date (or date range). All fields are optional.

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| from | string (date) | — | Start date of the entry, e.g. `2021-01-01` |
| to | string (date) | — | End date of the entry |
| numAvail | integer | — | Number of units available. **May be negative** (e.g. overbooked). If you change `override` from `blackout` to `none` without setting `numAvail`, it resets to the maximum possible |
| minStay | integer | — | Minimum stay in nights. Min `1`, max `365` |
| maxStay | integer | — | Maximum stay in nights. Min `1`, max `364` |
| multiplier | number | — | Price multiplier. Min `0.1`, max `100`, default `1` |
| override | string | — | Availability override. Enum: `none`, `blackout`, `exception`, `noCheckIn`, `noCheckOut`, `noCheckInOrCheckOut`. See note on `numAvail` interaction above |
| price1 | number (double) | — | Price tier 1 |
| price2 | number (double) | — | Price tier 2 |
| price3 | number (double) | — | Price tier 3 |
| price4 | number (double) | — | Price tier 4 |
| price5 | number (double) | — | Price tier 5 |
| price6 | number (double) | — | Price tier 6 |
| price7 | number (double) | — | Price tier 7 |
| price8 | number (double) | — | Price tier 8 |
| price9 | number (double) | — | Price tier 9 |
| price10 | number (double) | — | Price tier 10 |
| price11 | number (double) | — | Price tier 11 |
| price12 | number (double) | — | Price tier 12 |
| price13 | number (double) | — | Price tier 13 |
| price14 | number (double) | — | Price tier 14 |
| price15 | number (double) | — | Price tier 15 |
| price16 | number (double) | — | Price tier 16 |
| channels | object | — | Per-channel max-booking limits (see below). Set to `null` to remove the limit |

### calendar[].channels — per channel

Each channel sub-object has a single `maxBookings` integer (nullable). The full
channel list:

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| channels.agoda.maxBookings | integer (nullable) | — | Agoda max bookings |
| channels.airbnb.maxBookings | integer (nullable) | — | Airbnb max bookings |
| channels.asiatravel.maxBookings | integer (nullable) | — | Asiatravel max bookings |
| channels.atraveode.maxBookings | integer (nullable) | — | Atraveo DE max bookings |
| channels.booking.maxBookings | integer (nullable) | — | Booking.com max bookings |
| channels.despegar.maxBookings | integer (nullable) | — | Despegar max bookings |
| channels.edreamsodigeo.maxBookings | integer (nullable) | — | eDreams ODIGEO max bookings |
| channels.expedia.maxBookings | integer (nullable) | — | Expedia max bookings |
| channels.feratel.maxBookings | integer (nullable) | — | Feratel max bookings |
| channels.goibibo.maxBookings | integer (nullable) | — | Goibibo max bookings |
| channels.hometogo.maxBookings | integer (nullable) | — | HomeToGo max bookings |
| channels.hostelworld.maxBookings | integer (nullable) | — | Hostelworld max bookings |
| channels.hotelbeds.maxBookings | integer (nullable) | — | Hotelbeds max bookings |
| channels.hrs.maxBookings | integer (nullable) | — | HRS max bookings |
| channels.jomres.maxBookings | integer (nullable) | — | Jomres max bookings |
| channels.marriott.maxBookings | integer (nullable) | — | Marriott max bookings |
| channels.ostrovokru.maxBookings | integer (nullable) | — | Ostrovok RU max bookings |
| channels.ota.maxBookings | integer (nullable) | — | OTA max bookings |
| channels.reserva.maxBookings | integer (nullable) | — | Reserva max bookings |
| channels.tiket.maxBookings | integer (nullable) | — | Tiket max bookings |
| channels.tomastravel.maxBookings | integer (nullable) | — | Tomas Travel max bookings |
| channels.traveloka.maxBookings | integer (nullable) | — | Traveloka max bookings |
| channels.travia.maxBookings | integer (nullable) | — | Travia max bookings |
| channels.traum.maxBookings | integer (nullable) | — | Traum max bookings |
| channels.trip.maxBookings | integer (nullable) | — | Trip max bookings |
| channels.tripadvisorrentals.maxBookings | integer (nullable) | — | TripAdvisor Rentals max bookings |
| channels.vacationstay.maxBookings | integer (nullable) | — | VacationStay max bookings |
| channels.vrbo.maxBookings | integer (nullable) | — | Vrbo max bookings |

**Endpoints:** `GET /inventory/rooms/calendar` (response), `POST /inventory/rooms/calendar` (request body).

---

## fixedPrice

- **Base type:** `object`
- **Usage:** response **and** request body (POST, as an array of fixedPrice)
- **Defined at:** `apiV2.yaml:7801`
- **Used by:**
  - `GET /inventory/fixedPrices` (response array items)
  - `POST /inventory/fixedPrices` (request body array items)

> **Notes:** "fixed price linking is not yet supported." To create a new fixed
> price, omit the `id` field. Maximum of **100 fixed prices per room**. Daily
> prices for fixed prices are set in `/inventory/rooms/calendar`.

### Identity & window

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| id | integer | — | Fixed price ID (omit to create new) |
| roomId | integer | — | Room identifier |
| propertyId | integer | — | Property identifier |
| offerId | integer | — | Associated offer ID |
| firstNight | string (date) | — | First night of the window |
| lastNight | string (date) | — | Last night of the window |
| name | string | — | Fixed price name |

### Stay & advance restrictions

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| minNights | integer | — | Minimum nights. Min `0`, max `99` |
| maxNights | integer | — | Maximum nights. Min `1`, max `365` |
| minAdvance | integer | — | Minimum advance booking days. Min `0`, max `999` |
| maxAdvance | integer | — | Maximum advance booking days. Min `0`, max `999` |
| strategy | string | — | Price strategy. Enum: `default`, `noLowerPriceOrShorterStays`, `noOtherPrices` |
| restrictionStrategy | string | — | Restriction strategy. Enum: `stayThrough`, `arrival`, `gapFill` |
| bookingType | string | — | Enum: `default`, `requestWithManualConfirmation`, `requestWithCreditCard`, `confirmedWithCreditCard`, `confirmedWithDepositCollection1`, `confirmedWithDepositCollection2` |
| allowEnquiry | boolean | — | Allow enquiry |
| allowMultiplier | boolean | — | Allow multiplier |
| pricesPerNights | integer | — | Prices per night. Min `1`, max `31` |

### Pricing

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| color | string | — | Display color |
| roomPrice | number | — | Room price |
| roomPriceEnable | boolean | — | Enable room price |
| roomPriceGuests | integer | — | Guest count for room price. Min `0`. If `0`, max room capacity is used |
| 1PersonPrice | number | — | Single-person price |
| 1PersonPriceEnable | boolean | — | Enable single-person price |
| 2PersonPrice | number | — | Two-person price |
| 2PersonPriceEnable | boolean | — | Enable two-person price |
| extraPersonPrice | number | — | Extra person price |
| extraPersonPriceEnable | boolean | — | Enable extra person price |
| extraChildPrice | number | — | Extra child price |
| allowAloneChildren | boolean | — | Allow children to stay alone |
| extraChildPriceEnable | boolean | — | Enable extra child price |

### Channel management & agent

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| channelManagement | string | — | Channel management mode. Enum: `notUsed`, `exportPrice`, `normalPrice` |
| exportPrice | number | — | Export price used when `channelManagement` = `exportPrice` |
| agentCodes | array of string | — | Agent codes |

### Day-of-week rules

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| allowedDays | object | — | Days the price is allowed |
| allowedDays.mon | boolean | — | Monday allowed |
| allowedDays.tue | boolean | — | Tuesday allowed |
| allowedDays.wed | boolean | — | Wednesday allowed |
| allowedDays.thu | boolean | — | Thursday allowed |
| allowedDays.fri | boolean | — | Friday allowed |
| allowedDays.sat | boolean | — | Saturday allowed |
| allowedDays.sun | boolean | — | Sunday allowed |
| checkInDays | object | — | Allowed check-in days |
| checkInDays.mon … checkInDays.sun | boolean | — | Monday–Sunday check-in (7 boolean fields) |
| checkOutDays | object | — | Allowed check-out days |
| checkOutDays.mon … checkOutDays.sun | boolean | — | Monday–Sunday check-out (7 boolean fields) |

### discounts[]

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| discounts[].index | integer | — | Discount slot. Min `1`, max `8` |
| discounts[].nights | integer | — | Nights threshold |
| discounts[].percent | number | — | Discount percent |
| discounts[].perNight | number | — | Per-night discount |
| discounts[].onceOff | number | — | One-off discount |
| discounts[].priceCap | number | — | Price cap |

### refererDiscounts[]

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| refererDiscounts[].index | integer | — | Referer discount slot. Min `1`, max `4` |
| refererDiscounts[].code | string | — | Discount code |
| refererDiscounts[].percent | number | — | Discount percent |
| refererDiscounts[].perNight | number | — | Per-night discount |
| refererDiscounts[].onceOff | number | — | One-off discount |

### upsellItems[]

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| upsellItems[].index | integer | — | Upsell slot. Min `1`, max `20` |
| upsellItems[].enable | boolean | — | Enable upsell item |

### voucherCodes[]

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| voucherCodes[].index | integer | — | Voucher slot. Min `1`, max `8` |
| voucherCodes[].enable | boolean | — | Enable voucher code |

### bookingPage

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| bookingPage.direct | boolean | — | Direct booking page |
| bookingPage.agent | boolean | — | Agent booking page |

### channels — per channel

Each channel sub-object has an `enabled` boolean and (for most) a `rateCode`
string. The full channel list:

| Field | Type | Required | Description / Example |
|-------|------|----------|-----------------------|
| channels.agoda.enabled | boolean | — | Enable Agoda |
| channels.agoda.rateCode | string | — | Agoda rate code |
| channels.airbnb.enabled | boolean | — | Enable Airbnb |
| channels.airbnb.rateCode | string | — | Airbnb rate code |
| channels.atraveode.enabled | boolean | — | Enable Atraveo DE |
| channels.bedandbreakfasteu.enabled | boolean | — | Enable BedandBreakfast.eu |
| channels.bedandbreakfastnl.enabled | boolean | — | Enable BedandBreakfast.nl |
| channels.bookeasycomau.enabled | boolean | — | Enable Bookeasy.com.au |
| channels.booking.enabled | boolean | — | Enable Booking.com |
| channels.booking.rateCode | string | — | Booking.com rate code |
| channels.bookitconz.enabled | boolean | — | Enable Bookit.co.nz |
| channels.despegar.enabled | boolean | — | Enable Despegar |
| channels.despegar.rateCode | string | — | Despegar rate code |
| channels.edreamsodigeo.enabled | boolean | — | Enable eDreams ODIGEO |
| channels.edreamsodigeo.rateCode | string | — | eDreams ODIGEO rate code |
| channels.expedia.enabled | boolean | — | Enable Expedia |
| channels.expedia.rateCode | string | — | Expedia rate code |
| channels.feratel.enabled | boolean | — | Enable Feratel |
| channels.feratel.rateCode | string | — | Feratel rate code |
| channels.flipkey.enabled | boolean | — | Enable Flipkey |
| channels.goibibo.enabled | boolean | — | Enable Goibibo |
| channels.goibibo.rateCode | string | — | Goibibo rate code |
| channels.guestlinkcouk.enabled | boolean | — | Enable Guestlink.co.uk |
| channels.hometogo.enabled | boolean | — | Enable HomeToGo |
| channels.hostelinternational.enabled | boolean | — | Enable Hostel International |
| channels.hostelsclub.enabled | boolean | — | Enable Hostels Club |
| channels.hostelworld.enabled | boolean | — | Enable Hostelworld |
| channels.hostelworld.rateCode | string | — | Hostelworld rate code |
| channels.hotelbeds.enabled | boolean | — | Enable Hotelbeds |
| channels.hotelbeds.rateCode | string | — | Hotelbeds rate code |
| channels.hrs.enabled | boolean | — | Enable HRS |
| channels.hrs.rateCode | string | — | HRS rate code (see enum below) |
| channels.jomres.enabled | boolean | — | Enable Jomres |
| channels.jomres.rateCode | string | — | Jomres rate code |
| channels.lastminute.enabled | boolean | — | Enable Lastminute |
| channels.lastminute.rateCode | string | — | Lastminute rate code |
| channels.marriott.enabled | boolean | — | Enable Marriott |
| channels.ostrovokru.enabled | boolean | — | Enable Ostrovok RU |
| channels.ostrovokru.rateCode | string | — | Ostrovok RU rate code |
| channels.ota.enabled | boolean | — | Enable OTA |
| channels.ota.rateCode | string | — | OTA rate code |
| channels.reserva.enabled | boolean | — | Enable Reserva |
| channels.reserva.rateCode | string | — | Reserva rate code |
| channels.tablethotels.enabled | boolean | — | Enable Tablethotels |
| channels.tablethotels.rateCode | string | — | Tablethotels rate code |
| channels.tiket.enabled | boolean | — | Enable Tiket |
| channels.tiket.rateCode | string | — | Tiket rate code |
| channels.tomastravel.enabled | boolean | — | Enable Tomas Travel |
| channels.tomastravel.rateCode | string | — | Tomas Travel rate code |
| channels.traumferienwohnungen.enabled | boolean | — | Enable Traum Ferienwohnungen |
| channels.traveloka.enabled | boolean | — | Enable Traveloka |
| channels.traveloka.rateCode | string | — | Traveloka rate code |
| channels.travia.enabled | boolean | — | Enable Travia |
| channels.travia.rateCode | string | — | Travia rate code |
| channels.tripadvisorrentals.enabled | boolean | — | Enable TripAdvisor Rentals |
| channels.vacationstay.enabled | boolean | — | Enable VacationStay |
| channels.vrbo.enabled | boolean | — | Enable Vrbo |
| channels.webroomsconz.enabled | boolean | — | Enable Webrooms.co.nz |

#### channels.hrs.rateCode enum

`standardDoubleHRS1`, `standardDoubleTrade1`, `standardDoubleSpecial1`,
`standardDoubleWeekend1`, `standardDoubleHotdeal1`, `standardDoubleTrade2`,
`standardDoubleSpecial2`, `standardDoubleHotdeal2`, `standardDoubleTrade3`,
`standardDoubleSpecial3`, `standardDoubleHotdeal3`, `standardSingleHRS1`,
`standardSingleTrade1`, `standardSingleSpecial1`, `standardSingleWeekend1`,
`standardSingleHotdeal1`, `standardSingleTrade2`, `standardSingleSpecial2`,
`standardSingleHotdeal2`, `standardSingleTrade3`, `standardSingleSpecial3`,
`standardSingleHotdeal3`, `3BedRoom`, `4BedRoom`, `doubleApartment`,
`doubleBalcony`, `doubleBudget`, `doubleBusiness`, `doubleComfort`,
`doubleFamily`, `doubleJuniorSuite`, `doubleLakeView`, `doubleSeaView`,
`doubleMountainView`, `doublePoolView`, `doubleRiverView`, `doubleSuite`,
`doubleTerrace`, `singleApartment`, `singleBalcony`, `singleBudget`,
`singleBusiness`, `singleComfort`, `singleFamily`, `singleJuniorSuite`,
`singleLakeView`, `singleSeaView`, `singleMountainView`, `singlePoolView`,
`singleRiverView`, `singleSuite`, `singleTerrace`

**Endpoints:** `GET /inventory/fixedPrices` (response `fixedPrice[]`), `POST /inventory/fixedPrices` (request body `fixedPrice[]`).

---

## Quick reference — schema → endpoints

| Schema | Type | Request / Response | Endpoints |
|--------|------|--------------------|-----------|
| offer | object | response | `GET /organizations/users` (`offers[]`) |
| availability | object | response | `GET /inventory/rooms/availability` |
| unitBookings | object | response | `GET /inventory/rooms/unitBookings` |
| calendar | object | response + request | `GET /inventory/rooms/calendar`, `POST /inventory/rooms/calendar` |
| fixedPrice | object | response + request (array) | `GET /inventory/fixedPrices`, `POST /inventory/fixedPrices` |
