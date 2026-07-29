# Beds24 API V2 — Channel Schemas Reference (Part 1)

> Source: `docs/beds-facts/apiV2.yaml` (lines 6116–7425, `#/components/schemas/`).
> Generated: 2026-07-29. Exhaustive field-level extraction — every field, enum, and `$ref` target included.

---

## account

- **Base type:** `object`
- **Usage context:** Represents the master account settings and usage quotas. Returned by account-level endpoints (e.g. `GET /account`).
- **Endpoints:** Account settings read/write endpoints.

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `id` | integer | — | Account identifier |
| `balance` | number | — | Account balance |
| `charge` | number | — | Charge amount |
| `channelCollectInvoice` | string | — | — |
| `controlCss` | string | — | Custom CSS for control panel |
| `controlLanguage` | string | — | Control panel language |
| `controlMenu` | string | — | Control panel menu config |
| `controlText` | string | — | Control panel text |
| `dateFormat` | string | — | Date display format |
| `decimalPlaces` | string | — | Decimal places setting |
| `deduceLanguage` | string | — | Language deduction setting |
| `exportData` | string | — | Data export setting |
| `oneTimeVouchers` | string | — | One-time vouchers setting |
| `hidePages` | string | — | Pages hidden from sub-accounts |
| `hideSettings` | string | — | Settings hidden from sub-accounts |
| `readonlyPages` | string | — | Read-only pages for sub-accounts |
| `subControlCss` | string | — | Sub-account control CSS |
| `subControlText` | string | — | Sub-account control text |
| `subHidePages` | string | — | Sub-account hidden pages |
| `subHideSettings` | string | — | Sub-account hidden settings |
| `subReadonlyPages` | string | — | Sub-account read-only pages |
| `template1` – `template8` | string | — | Template slots (8 total) |
| `timezone` | string | — | Account timezone |
| `unitStatusValues` | array of string | — | Custom unit status labels |
| `windowStyle` | string | — | Window style setting |
| `usage` | object | — | Nested usage quota object (see below) |
| `usage.numProperties` | integer (int32) | — | Number of properties |
| `usage.numRooms` | integer (int32) | — | Number of rooms |
| `usage.numRoomTypes` | integer (int32) | — | Number of room types |
| `usage.numActivities` | integer (int32) | — | Number of activities |
| `usage.numLinks` | integer (int32) | — | Number of links |
| `usage.channelLinks` | object | — | Per-channel active link counts. Channels with no active links are not shown. Every channel value is `integer` with `minimum: 1`. |
| `usage.channelLinks.agoda` | integer | — | `minimum: 1` |
| `usage.channelLinks.airbnb` | integer | — | `minimum: 1` |
| `usage.channelLinks.airbnbical` | integer | — | `minimum: 1` |
| `usage.channelLinks.atraveode` | integer | — | `minimum: 1` |
| `usage.channelLinks.bedandbreakfasteu` | integer | — | `minimum: 1` |
| `usage.channelLinks.bedandbreakfastnl` | integer | — | `minimum: 1` |
| `usage.channelLinks.bookitconz` | integer | — | `minimum: 1` |
| `usage.channelLinks.bookeasycomau` | integer | — | `minimum: 1` |
| `usage.channelLinks.booking` | integer | — | `minimum: 1` |
| `usage.channelLinks.despegar` | integer | — | `minimum: 1` |
| `usage.channelLinks.edreamsodigeo` | integer | — | `minimum: 1` |
| `usage.channelLinks.expedia` | integer | — | `minimum: 1` |
| `usage.channelLinks.feratel` | integer | — | `minimum: 1` |
| `usage.channelLinks.flipkey` | integer | — | `minimum: 1` |
| `usage.channelLinks.goibibo` | integer | — | `minimum: 1` |
| `usage.channelLinks.googlecal` | integer | — | `minimum: 1` |
| `usage.channelLinks.googleads` | integer | — | `minimum: 1` |
| `usage.channelLinks.holidaylettingscouk` | integer | — | `minimum: 1` |
| `usage.channelLinks.hometogo` | integer | — | `minimum: 1` |
| `usage.channelLinks.hostelinternational` | integer | — | `minimum: 1` |
| `usage.channelLinks.hostelsclub` | integer | — | `minimum: 1` |
| `usage.channelLinks.hostelworld` | integer | — | `minimum: 1` |
| `usage.channelLinks.hotelbeds` | integer | — | `minimum: 1` |
| `usage.channelLinks.housetripcom` | integer | — | `minimum: 1` |
| `usage.channelLinks.hrs` | integer | — | `minimum: 1` |
| `usage.channelLinks.icalimport1` | integer | — | `minimum: 1` |
| `usage.channelLinks.icalimport2` | integer | — | `minimum: 1` |
| `usage.channelLinks.icalimport3` | integer | — | `minimum: 1` |
| `usage.channelLinks.jomres` | integer | — | `minimum: 1` |
| `usage.channelLinks.lastminute` | integer | — | `minimum: 1` |
| `usage.channelLinks.marriott` | integer | — | `minimum: 1` |
| `usage.channelLinks.nzaa` | integer | — | `minimum: 1` |
| `usage.channelLinks.ostrovokru` | integer | — | `minimum: 1` |
| `usage.channelLinks.ota` | integer | — | `minimum: 1` |
| `usage.channelLinks.reserva` | integer | — | `minimum: 1` |
| `usage.channelLinks.rezintelnet` | integer | — | `minimum: 1` |
| `usage.channelLinks.tablethotels` | integer | — | `minimum: 1` |
| `usage.channelLinks.tiket` | integer | — | `minimum: 1` |
| `usage.channelLinks.tomastravel` | integer | — | `minimum: 1` |
| `usage.channelLinks.traumferienwohnungen` | integer | — | `minimum: 1` |
| `usage.channelLinks.traveloka` | integer | — | `minimum: 1` |
| `usage.channelLinks.travia` | integer | — | `minimum: 1` |
| `usage.channelLinks.trip` | integer | — | `minimum: 1` |
| `usage.channelLinks.tripconnect` | integer | — | `minimum: 1` |
| `usage.channelLinks.tripadvisorrentals` | integer | — | `minimum: 1` |
| `usage.channelLinks.trivagocom` | integer | — | `minimum: 1` |
| `usage.channelLinks.vacationstay` | integer | — | `minimum: 1` |
| `usage.channelLinks.visitscotlandcom` | integer | — | `minimum: 1` |
| `usage.channelLinks.vrbo` | integer | — | `minimum: 1` |
| `usage.channelLinks.vrboical` | integer | — | `minimum: 1` |
| `usage.channelLinks.webroomsconz` | integer | — | `minimum: 1` |
| `usage.channelLinks.apiarrivals` | integer | — | `minimum: 1` |
| `usage.channelLinks.apipos` | integer | — | `minimum: 1` |
| `usage.channelLinks.beyond` | integer | — | `minimum: 1` |
| `usage.channelLinks.chekin` | integer | — | `minimum: 1` |
| `usage.channelLinks.feratelmeldeclient` | integer | — | `minimum: 1` |
| `usage.channelLinks.icalexport` | integer | — | `minimum: 1` |
| `usage.channelLinks.kashflow` | integer | — | `minimum: 1` |
| `usage.channelLinks.mailchimp` | integer | — | `minimum: 1` |
| `usage.channelLinks.make` | integer | — | `minimum: 1` |
| `usage.channelLinks.nuki` | integer | — | `minimum: 1` |
| `usage.channelLinks.poster` | integer | — | `minimum: 1` |
| `usage.channelLinks.prearrivaltool` | integer | — | `minimum: 1` |
| `usage.channelLinks.pricelabs` | integer | — | `minimum: 1` |
| `usage.channelLinks.pronto` | integer | — | `minimum: 1` |
| `usage.channelLinks.remotelock` | integer | — | `minimum: 1` |
| `usage.channelLinks.roompricegenie` | integer | — | `minimum: 1` |
| `usage.channelLinks.sevdesk` | integer | — | `minimum: 1` |
| `usage.channelLinks.ttlock` | integer | — | `minimum: 1` |
| `usage.channelLinks.webhookinventory` | integer | — | `minimum: 1` |
| `usage.channelLinks.xero` | integer | — | `minimum: 1` |
| `usage.channelLinks.zettle` | integer | — | `minimum: 1` |
| `subAccounts` | array of object | — | Sub-account list (items are empty objects in schema) |

> **Note:** The `searchCriteria` block is commented out in the source (lines 6423–6444) and is not part of the active schema.

---

## airbnbListing

- **Base type:** `object`
- **Usage context:** Describes an Airbnb listing linked to a room, including property details, address, and amenities.
- **Endpoints:** Airbnb listing mapping / sync endpoints.

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `roomId` | integer | — | Beds24 room identifier |
| `name` | string | — | Room name |
| `enabled` | boolean | — | Whether the listing is enabled |
| `airbnbListing` | object | — | Nested Airbnb listing details (see below) |
| `airbnbListing.id` | string | — | Airbnb listing ID |
| `airbnbListing.name` | string | — | Airbnb listing name |
| `airbnbListing.property_type_category` | string | — | Property type category |
| `airbnbListing.room_type_category` | string | — | Room type category |
| `airbnbListing.bedrooms` | integer (int32) | — | Number of bedrooms |
| `airbnbListing.bathrooms` | integer (int32) | — | Number of bathrooms |
| `airbnbListing.beds` | integer (int32) | — | Number of beds |
| `airbnbListing.check_in_option` | object | — | Check-in option (see below) |
| `airbnbListing.check_in_option.category` | string | — | Check-in option category |
| `airbnbListing.has_availability` | boolean | — | Whether listing has availability |
| `airbnbListing.street` | string | — | Street address |
| `airbnbListing.city` | string | — | City |
| `airbnbListing.state` | string | — | State |
| `airbnbListing.zipcode` | string | — | ZIP code |
| `airbnbListing.country_code` | string | — | Country code |
| `airbnbListing.lat` | number | — | Latitude |
| `airbnbListing.lng` | number | — | Longitude |
| `airbnbListing.directions` | string | — | Directions to property |
| `airbnbListing.person_capacity` | integer (int32) | — | Maximum guest capacity |
| `airbnbListing.synchronization_category` | string | — | Sync category |
| `airbnbListing.listing_nickname` | string | — | Listing nickname |
| `airbnbListing.tier` | string | — | Listing tier |
| `airbnbListing.display_exact_location_to_guest` | boolean | — | Whether exact location is shown |
| `airbnbListing.house_manual` | string | — | House manual text |
| `airbnbListing.amenities` | array of object | — | Each item is a keyed amenity object (see below) |
| `airbnbListing.amenities[].AMENITY_NAME` | object | — | Dynamic amenity key (see below) |
| `airbnbListing.amenities[].AMENITY_NAME.instruction` | string | — | Amenity instruction text |
| `airbnbListing.amenities[].AMENITY_NAME.is_present` | boolean | — | Whether amenity is present |
| `airbnbListing.rate_plan_enabled` | boolean | — | Whether rate plan is enabled |

---

## iCalExportSettingsGet

- **Base type:** `object` (allOf)
- **Usage context:** GET response for iCal export settings. Extends `iCalExportSettingsPost` and adds resolved iCal URIs per room type.
- **$ref:** `iCalExportSettingsPost` + inline properties.
- **Endpoints:** `GET .../settings/iCalExport`

| Field | Type | Required | Description / Example |
|---|---|---|---|
| *(all fields from `iCalExportSettingsPost`)* | — | — | Inherited via `$ref` |
| `properties` | array of object | — | Property-level export settings with resolved URIs (see below) |
| `properties[].roomTypes` | array of object | — | Room-type export URIs (see below) |
| `properties[].roomTypes[].iCalUri` | string | — | iCal feed URI for the room type |
| `properties[].roomTypes[].propertyDescriptionICalUri` | string | — | Property-description iCal URI |
| `properties[].roomTypes[].roomDescriptionICalUri` | string | — | Room-description iCal URI |
| `properties[].roomTypes[].propertyAndRoomDescriptionICalUri` | string | — | Combined property+room iCal URI |

> **Note:** Because this uses `allOf`, the GET response contains both the POST-editable fields (channel, properties[].id, seed, summaries, roomTypes[].id/iCalRoomDescription/export) AND the read-only URI fields above.

---

## iCalExportSettingsPost

- **Base type:** `object`
- **Usage context:** POST body for iCal export settings. Controls which properties/rooms are exported and how.
- **Endpoints:** `POST .../settings/iCalExport`

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `channel` | string | — | Fixed: `"iCalExport"` |
| `properties` | array of object | — | Per-property export config (see below) |
| `properties[].id` | integer | — | Property ID |
| `properties[].seed` | string | — | iCal feed seed token |
| `properties[].iCalSumamry` | string | — | iCal summary text (note: typo is in the API) |
| `properties[].iCalPropertyDescription` | string | — | iCal property description |
| `properties[].roomTypes` | array of object | — | Per-room-type export config (see below) |
| `properties[].roomTypes[].id` | integer | — | Room type ID |
| `properties[].roomTypes[].iCalRoomDescription` | string | — | iCal room description |
| `properties[].roomTypes[].export` | string | — | Export mode. Enum: `disable`, `bookings`, `unavailableDates`, `bookingsAndUnavailableDates` |

---

## iCalImportSettingsGet

- **Base type:** `object`
- **Usage context:** GET response for iCal import settings. Lists configured iCal URIs and import behavior per property/room.
- **Endpoints:** `GET .../settings/iCalImport`

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `channel` | string | — | Fixed: `"iCalImport"` |
| `properties` | array of object | — | Per-property import config (see below) |
| `properties[].id` | integer | — | Property ID |
| `properties[].modificationNotification` | string | — | Modification notification policy. Enum: `modificationAllowedBookingNotificationOnly`, `modificationAllowedBookingCancelNotification`, `modificationAllowedNoEmailNotification`, `modificationProhibitedBookingNotificationOnly`, `modificationProhibitedNoEmailNotification` |
| `properties[].roomTypes` | array of object | — | Per-room-type import config (see below) |
| `properties[].roomTypes[].id` | integer | — | Room type ID |
| `properties[].roomTypes[].iCalUri1` | string | — | iCal feed URI slot 1 |
| `properties[].roomTypes[].iCalUri2` | string | — | iCal feed URI slot 2 |
| `properties[].roomTypes[].iCalUri3` | string | — | iCal feed URI slot 3 |
| `properties[].roomTypes[].ignoreContaining1` | string | — | Ignore bookings containing text (slot 1) |
| `properties[].roomTypes[].ignoreContaining2` | string | — | Ignore bookings containing text (slot 2) |
| `properties[].roomTypes[].ignoreContaining3` | string | — | Ignore bookings containing text (slot 3) |
| `properties[].roomTypes[].import1` | string | — | Import behavior (slot 1). Enum: `disable`, `endDateCheckout`, `endDateCheckoutIgnoreDuplicate`, `endDateCheckoutIgnoreIfUnavailable`, `endDateLastNight`, `endDateLastNightIgnoreDuplicate`, `endDateLastNightIgnoreIfUnavailable`, `endDateDayAfterCheckOut`, `endDateDayAfterCheckOutIgnoreDuplicate`, `endDateDayAfterCheckoutIgnoreIfUnavailable` |
| `properties[].roomTypes[].import2` | string | — | Same enum as `import1` (slot 2) |
| `properties[].roomTypes[].import3` | string | — | Same enum as `import1` (slot 3) |

---

## iCalImportSettingsPost

- **Base type:** `object` (allOf)
- **Usage context:** POST body for iCal import settings. Extends `iCalImportSettingsGet` with writable property/room fields.
- **$ref:** `iCalImportSettingsGet` + inline properties.
- **Endpoints:** `POST .../settings/iCalImport`

| Field | Type | Required | Description / Example |
|---|---|---|---|
| *(all fields from `iCalImportSettingsGet`)* | — | — | Inherited via `$ref` |
| `properties` | array of object | — | Writable per-property import config (see below) |
| `properties[].id` | integer | — | Property ID |
| `properties[].modificationNotification` | string | — | Modification notification policy. Enum: `modificationAllowedBookingNotificationOnly`, `modificationAllowedBookingCancelNotification`, `modificationAllowedNoEmailNotification`, `modificationProhibitedBookingNotificationOnly`, `modificationProhibitedNoEmailNotification` |

> **Note:** The POST variant re-declares `properties[].id` and `properties[].modificationNotification` (the URI/import fields are read-only in the GET and not writable via this schema).

---

## iCalImportTools

- **Base type:** `object`
- **Usage context:** Toggles the iCal import "delete booking" tools for each of the three import slots.
- **Endpoints:** iCal import tools settings endpoints.

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `deleteBookingTool1` | boolean | — | Enable delete-booking tool for import slot 1 |
| `deleteBookingTool2` | boolean | — | Enable delete-booking tool for import slot 2 |
| `deleteBookingTool3` | boolean | — | Enable delete-booking tool for import slot 3 |

---

## nukiSettingsGet

- **Base type:** `object`
- **Usage context:** GET response for Nuki smart-lock integration settings.
- **Endpoints:** `GET .../settings/nuki`

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `channel` | string | — | Fixed: `"nuki"` |
| `properties` | object | — | Nested property-level Nuki config (see below) |
| `properties.id` | integer | — | Property ID |
| `properties.commonLock` | integer | — | Common lock identifier |
| `properties.startTime` | string (hh:mm) | — | Access start time. Example: `"08:30"` |
| `properties.endTime` | string (hh:mm) | — | Access end time. Example: `"17:45"` |
| `properties.daysInAdvance` | integer | — | Days in advance to generate code. `minimum: 1`, `maximum: 30` |
| `properties.autoCheckIn` | boolean | — | Auto check-in enabled |
| `properties.roomTypes` | array of object | — | Per-room-type Nuki config (see below) |
| `properties.roomTypes[].id` | integer | — | Room type ID |
| `properties.roomTypes[].allowRemoteAppAccess` | string | — | Remote app access policy. Enum: `infoCode`, `yes`, `no` |
| `properties.roomTypes[].syncApp` | boolean | — | Sync to Nuki app |
| `properties.roomTypes[].syncCode` | boolean | — | Sync access code |
| `properties.roomTypes[].lockSerialNumbers` | array of object | — | Lock serial number list (see below) |
| `properties.roomTypes[].lockSerialNumbers[].number` | integer | — | Lock number |
| `properties.roomTypes[].lockSerialNumbers[].serial` | integer | — | Lock serial number |

---

## nukiSettingsPost

- **Base type:** `$ref` to `nukiSettingsGet`
- **Usage context:** POST body for Nuki settings — identical shape to the GET schema.
- **$ref:** `#/components/schemas/nukiSettingsGet`
- **Endpoints:** `POST .../settings/nuki`

> **Note:** This schema is an exact alias of `nukiSettingsGet` (all fields, types, and enums are identical).

---

## vrboSettingsPost

- **Base type:** `object`
- **Usage context:** POST body for Vrbo (VRBO/HomeAway) channel settings — pricing, policies, discounts, and room-type sync.
- **Endpoints:** `POST .../settings/vrbo`

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `channel` | string | — | Fixed: `"vrbo"` |
| `currency` | string | — | Property currency. Enum: `USD`, `AUD`, `BRL`, `CAD`, `EUR`, `GBP`, `JPY` |
| `properties` | object | — | Nested property-level Vrbo config (see below) |
| `properties.id` | integer | — | Property ID |
| `properties.multiplier` | number | — | Price multiplier |
| `properties.invoiceeId` | string (nullable) | — | Invoicee ID |
| `properties.defaultLanguage` | string | — | Default listing language. Enum: `de`, `en`, `es`, `fi`, `fr`, `it`, `ja`, `nl`, `no`, `pt`, `sov` |
| `properties.showExactLanguage` | boolean | — | Show exact language |
| `properties.ownerListingStory` | string | — | Owner listing story |
| `properties.uniqueBenefits` | string | — | Unique benefits text |
| `properties.whyPurchased` | string | — | Why purchased text |
| `properties.yearPurchased` | string | — | Year purchased |
| `properties.acceptedPaymentType` | string | — | Accepted payment type. Enum: `all`, `invoiceOnly`, `cardOnly` |
| `properties.paymentInvoiceDescription` | string | — | Payment invoice description |
| `properties.paymentSchedule` | string | — | Payment schedule. Enum: `atCheckin`, `atBooking` |
| `properties.merchantName` | string | — | Merchant name |
| `properties.roomTypes` | array of object | — | Per-room-type Vrbo config (see below) |
| `properties.roomTypes[].id` | integer | — | Room type ID |
| `properties.roomTypes[].syncronise` | boolean | — | Sync room type to Vrbo (note: typo is in the API) |
| `properties.roomTypes[].name` | string | — | Room type name override |
| `properties.roomTypes[].priceStrategy` | string | — | Pricing strategy. Enum: `perDay`, `perOccupancy` |
| `properties.roomTypes[].guestsIncluded` | integer (nullable) | — | Guests included in base price. `minimum: 1`, `maximum: 50` |
| `properties.roomTypes[].extraPersonPrice` | number | — | Extra person price |
| `properties.roomTypes[].2DayDiscountPercent` | integer | — | 2-day stay discount %. `minimum: 0`, `maximum: 90` |
| `properties.roomTypes[].3DayDiscountPercent` | integer | — | 3-day stay discount %. `minimum: 0`, `maximum: 90` |
| `properties.roomTypes[].4DayDiscountPercent` | integer | — | 4-day stay discount %. `minimum: 0`, `maximum: 90` |
| `properties.roomTypes[].5DayDiscountPercent` | integer | — | 5-day stay discount %. `minimum: 0`, `maximum: 90` |
| `properties.roomTypes[].6DayDiscountPercent` | integer | — | 6-day stay discount %. `minimum: 0`, `maximum: 90` |
| `properties.roomTypes[].7DayDiscountPercent` | integer | — | 7-day stay discount %. `minimum: 0`, `maximum: 90` |
| `properties.roomTypes[].14DayDiscountPercent` | integer | — | 14-day stay discount %. `minimum: 0`, `maximum: 90` |
| `properties.roomTypes[].21DayDiscountPercent` | integer | — | 21-day stay discount %. `minimum: 0`, `maximum: 90` |
| `properties.roomTypes[].28DayDiscountPercent` | integer | — | 28-day stay discount %. `minimum: 0`, `maximum: 90` |
| `properties.roomTypes[].cancellationPolicy` | string | — | Cancellation policy. Enum: `relaxed`, `moderate`, `firm`, `strict`, `noRefund`, `custom` |
| `properties.roomTypes[].custom` | array of string | — | Custom cancellation policy lines. Each item = one line in the custom textarea |

> **Note:** The following blocks are commented out in the source and NOT active: `vrboICal` (importBookingRequests), `paymentSchedules` (name + payment1–5 referencing `vrboPaymentSchedule`), `vrboICal` (exportCalendar/syncInventory/syncBookings), `priceRules` (id 1–16 + enabled).

---

## vrboPaymentSchedule

- **Base type:** `object`
- **Usage context:** A single Vrbo payment schedule line (amount/percentage due at a time relative to booking/check-in). Referenced (commented-out) by `vrboSettingsPost`.
- **$ref target:** `#/components/schemas/vrboPaymentSchedule`
- **Endpoints:** Vrbo payment schedule config (currently commented out in the schema).

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `daysAfterBooking` | integer (nullable) | — | Days after booking the payment is due. `minimum: 0`, `maximum: 999` |
| `daysBeforeBooking` | integer (nullable) | — | Days before check-in the payment is due. `minimum: 0`, `maximum: 999` |
| `fixedAmount` | number | — | Fixed payment amount |
| `percentageAmount` | integer (nullable) | — | Percentage payment amount. `minimum: 0`, `maximum: 999` |

---

## vrboSettingsGet

- **Base type:** `object` (allOf)
- **Usage context:** GET response for Vrbo settings. Currently inherits `vrboSettingsPost` entirely (the additional room-type block is commented out).
- **$ref:** `vrboSettingsPost` + (commented-out) inline properties.
- **Endpoints:** `GET .../settings/vrbo`

| Field | Type | Required | Description / Example |
|---|---|---|---|
| *(all fields from `vrboSettingsPost`)* | — | — | Inherited via `$ref` |

> **Note:** The commented-out extension would add `properties.roomTypes[].vrboICal.importCalendar` (string). Currently the GET shape equals the POST shape.

---

## airbnbSettingsPost

- **Base type:** `object`
- **Usage context:** POST body for Airbnb channel settings — the largest channel schema. Covers property-level sync options, per-room-type listing configuration, pricing, discounts, policies, instant-book rules, and multi-language text fields.
- **Endpoints:** `POST .../settings/airbnb`

### Top-level / property-level fields

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `channel` | string | — | Fixed: `"airbnb"` |
| `properties` | array of object | — | Per-property Airbnb config (see below) |
| `properties[].id` | integer | — | Property ID |
| `properties[].multiplier` | string (nullable) | — | Price multiplier |
| `properties[].currency` | string | — | Property currency. Enum: `AED`, `ALL`, `AMD`, `ARS`, `AUD`, `AZN`, `BDT`, `BGN`, `BHD`, `BND`, `BRL`, `CAD`, `CHF`, `CLP`, `CNY`, `COP`, `CRC`, `CZK`, `DKK`, `DOP`, `EGP`, `EUR`, `FJD`, `GBP`, `GEL`, `HKD`, `HRK`, `HUF`, `INR`, `IDR`, `IRR`, `ILS`, `ISK`, `JOD`, `JPY`, `KES`, `KRW`, `LBP`, `LKR`, `MAD`, `MMK`, `MXN`, `MYR`, `MZN`, `NOK`, `NZD`, `OMR`, `PHP`, `PLN`, `RON`, `RSD`, `RUB`, `SAR`, `SEK`, `SGD`, `TWD`, `THB`, `TND`, `TRY`, `TZS`, `UAH`, `USD`, `VND`, `XOF`, `XPF`, `YER`, `ZAR` |
| `properties[].inquiryAndRequests` | string | — | Inquiry/request import behavior. Enum: `ignore`, `importAll`, `importOnlyContainingBookingNumber` |
| `properties[].invoiceeId` | string (nullable) | — | Invoicee ID |
| `properties[].roomTypes` | array of object | — | Per-room-type Airbnb config (see below) |

### Room-type-level fields (`properties[].roomTypes[]`)

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `id` | integer | — | Room type ID |
| `publish` | boolean | — | Publish room type to Airbnb |
| `propertyTypeGroup` | string (nullable) | — | Property type group. Enum: `apartments`, `bnb`, `boutiqueHotelsAndMore`, `houses`, `secondayUnits`, `uniqueHomes` |
| `listingType` | string | — | Listing type. Enum: `entireHome`, `privateRoom`, `sharedRoom` |
| `updateAddress` | boolean | — | Update address on Airbnb |
| `bathroomShared` | string (nullable) | — | Bathroom sharing. Enum: `private`, `host`, `roommates`, `guests`, `host-roommates`, `host-guests`, `roommates-guests`, `host-roommates-guests` |
| `commonSpacesShared` | string (nullable) | — | Common spaces sharing. Enum: same as `bathroomShared` |
| `checkinType` | string | — | Check-in type. Enum: `host`, `doorman`, `keypad`, `lockbox`, `smartlock`, `other` |
| `checkinInstructions` | string | — | Check-in instructions text |
| `houseManual` | string | — | House manual text |
| `instantBook` | string | — | Instant Book eligibility. Enum: `everyone`, `experienced`, `governmentId`, `experiencedGovernmentId` |
| `preBookingMessage` | string | — | Pre-booking message |
| `cancellationPolicy` | string | — | Cancellation policy. Enum: `flexible`, `moderate`, `firm`, `strict`, `superStrict30`, `superStrict60` |
| `priceStrategy` | string | — | Pricing strategy. Enum: `perDayPricing`, `perOccupancyPricing`, `ratePlans` |
| `guestsIncluded` | integer (nullable) | — | Guests included in base price. `minimum: 1`, `maximum: 50` |
| `extraPersonPrice` | integer (nullable) | — | Extra person price. `minimum: 1` |
| `datesWithNoPrice` | string | — | Behavior for dates with no price. Enum: `makeUnavailable`, `useBasePrice` |
| `2DayDiscountPercent` | integer | — | 2-day stay discount %. `minimum: 0`, `maximum: 90` |
| `3DayDiscountPercent` | integer | — | 3-day stay discount %. `minimum: 0`, `maximum: 90` |
| `4DayDiscountPercent` | integer | — | 4-day stay discount %. `minimum: 0`, `maximum: 90` |
| `5DayDiscountPercent` | integer | — | 5-day stay discount %. `minimum: 0`, `maximum: 90` |
| `6DayDiscountPercent` | integer | — | 6-day stay discount %. `minimum: 0`, `maximum: 90` |
| `7DayDiscountPercent` | integer | — | 7-day stay discount %. `minimum: 0`, `maximum: 90` |
| `14DayDiscountPercent` | integer | — | 14-day stay discount %. `minimum: 0`, `maximum: 90` |
| `21DayDiscountPercent` | integer | — | 21-day stay discount %. `minimum: 0`, `maximum: 90` |
| `28DayDiscountPercent` | integer | — | 28-day stay discount %. `minimum: 0`, `maximum: 90` |
| `maxDaysInAdvance` | integer (nullable) | — | Max days in advance bookable (`null` = no limit). Enum: `0`, `30`, `60`, `90`, `120`, `150`, `180`, `210`, `240`, `270`, `300`, `330`, `365` |
| `advanceNoticeHours` | integer | — | Required advance notice (hours). Enum: `0`–`24`, `48`, `72`, `128` |
| `allowAdvanceNoticeRequests` | boolean | — | Allow requests within advance notice window |
| `earlyBirdDaysToCheckin` | integer | — | Early-bird discount: days before check-in threshold. Enum: `360`, `336`, `330`, `308`, `300`, `280`, `270`, `252`, `240`, `224`, `210`, `196`, `180`, `168`, `150`, `140`, `120`, `112`, `90`, `84`, `60`, `56`, `30`, `28` |
| `earlyBirdDiscountPercent` | integer | — | Early-bird discount %. `minimum: 0`, `maximum: 50` |
| `lastMinuteDaysToCheckin` | integer | — | Last-minute discount: days before check-in window. `minimum: 0`, `maximum: 28` |
| `lastMinuteDiscountPercent` | integer | — | Last-minute discount %. `minimum: 0`, `maximum: 50` |
| `nonRefundableDiscountPercent` | integer | — | Non-refundable discount %. `minimum: 0`, `maximum: 50` |
| `custom` | array of string | — | Custom policy lines. Each item = one line in the custom textarea |
| `allowMultiLanguage` | boolean | — | Enable multi-language listing texts |
| `texts` | array of object | — | Per-language listing texts (see below) |
| `texts[].language` | string | — | Language code. Example: `"en"` |
| `texts[].name` | string | — | Listing name (lang-specific) |
| `texts[].description` | string | — | Listing description (lang-specific) |
| `texts[].space` | string | — | Space description (lang-specific) |
| `texts[].guestAccess` | string | — | Guest access text (lang-specific) |
| `texts[].guestInteraction` | string | — | Guest interaction text (lang-specific) |
| `texts[].neighborhoodOverview` | string | — | Neighborhood overview (lang-specific) |
| `texts[].gettingAround` | string | — | Getting around text (lang-specific) |
| `texts[].otherThingsToNote` | string | — | Other things to note (lang-specific) |

---

## airbnbSettingsGet

- **Base type:** `object` (allOf, 3 parts)
- **Usage context:** GET response for Airbnb settings. Combines: (1) account-level `airbnbUserId`, (2) the full `airbnbSettingsPost` schema, and (3) per-room-type connection status (`enabled`, `airbnbListingId`, `connect`).
- **$ref:** `airbnbSettingsPost` + inline properties.
- **Endpoints:** `GET .../settings/airbnb`

| Field | Type | Required | Description / Example |
|---|---|---|---|
| *(all fields from `airbnbSettingsPost`)* | — | — | Inherited via `$ref` (channel, properties[].id, multiplier, currency, inquiryAndRequests, invoiceeId, roomTypes[].*) |
| `channel` | string | — | Fixed: `"airbnb"` |
| `properties` | array of object | — | Per-property GET-only fields (see below) |
| `properties[].airbnbUserId` | string (nullable) | — | Linked Airbnb user ID |
| `properties[].id` | integer | — | Property ID |
| `properties[].roomTypes` | array of object | — | Per-room-type connection status (see below) |
| `properties[].roomTypes[].enabled` | boolean | — | Whether the room type is enabled |
| `properties[].roomTypes[].airbnbListingId` | number | — | Linked Airbnb listing ID |
| `properties[].roomTypes[].connect` | string | — | Connection level. Enum: `inventory`, `limited`, `full` |

---

## textLanguages

- **Base type:** `object`
- **Usage context:** Enumerates the set of languages supported for multi-language listing texts.
- **Endpoints:** Text/language settings endpoints.

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `language` | string | — | Supported language code. Enum: `en`, `ar`, `bg`, `ca`, `cs`, `da`, `de`, `el`, `es`, `et`, `fi`, `fr`, `hr`, `he`, `hu`, `id`, `is`, `it`, `ja`, `ko`, `lt`, `mn`, `my`, `nl`, `no`, `pl`, `pt`, `ro`, `ru`, `sk`, `sl`, `sr`, `sv`, `th`, `tr`, `vi`, `zh`, `zt` |

---

## channelSettingsTemplate

- **Base type:** `object`
- **Usage context:** Generic channel settings template — a minimal structure (channel + property id + room-type ids) used as a base pattern by channel settings.
- **Endpoints:** Channel settings template / generic channel endpoints.

| Field | Type | Required | Description / Example |
|---|---|---|---|
| `channel` | string | — | Channel name. Example: `"nuki"` |
| `properties` | object | — | Nested property (see below) |
| `properties.id` | integer | — | Property ID |
| `properties.roomTypes` | array of object | — | Room-type list (see below) |
| `properties.roomTypes[].id` | integer | — | Room type ID |

---

## Cross-schema $ref map

| Schema | References |
|---|---|
| `iCalExportSettingsGet` | `iCalExportSettingsPost` |
| `iCalImportSettingsPost` | `iCalImportSettingsGet` |
| `nukiSettingsPost` | `nukiSettingsGet` |
| `vrboSettingsGet` | `vrboSettingsPost` |
| `vrboSettingsPost` (commented) | `vrboPaymentSchedule` |
| `airbnbSettingsGet` | `airbnbSettingsPost` |
