# Properties API Methods

Documentation of the Beds24 JSON API methods for listing, reading, creating, and updating property records. [extracted 2026-07-28]

---

## getProperties

Retrieve information about all properties associated with an account. [extracted 2026-07-28]

- **Endpoint:** `https://api.beds24.com/json/getProperties` [extracted 2026-07-28] `[api → json/getProperties](https://www.beds24.com/api/json/getProperties)`
- **HTTP method:** POST (JSON body) [extracted 2026-07-28] `[api → json/getProperties](https://www.beds24.com/api/json/getProperties)`

### Authentication

An `authentication` object is required in the request body. [extracted 2026-07-28] `[api → json/getProperties](https://www.beds24.com/api/json/getProperties)`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | string | Yes | API key configured in account settings [extracted 2026-07-28] `[api → json/getProperties](https://www.beds24.com/api/json/getProperties)` |

### Notes

- Returns data structured per the `getProperty` response fields (see below). [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)`
- The endpoint is the account-wide list counterpart to the single-property `getProperty`. [extracted 2026-07-28] `[api → json/getProperties](https://www.beds24.com/api/json/getProperties)`

---

## getProperty

Retrieve detailed information for a single property. [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)`

- **Endpoint:** `https://api.beds24.com/json/getProperty` [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)`
- **HTTP method:** POST (JSON body sent via raw POST fields, e.g. `CURLOPT_POSTFIELDS`) [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)`

### Authentication

An `authentication` object is required. [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `apiKey` | string | Yes | API key configured in account settings [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `propKey` | string | Yes | Property key assigned to the specific property [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `authentication` | object | Yes | Auth credentials [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `includeRooms` | boolean | No | Include room data in the response [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `includeRoomUnits` | boolean | No | Include room unit data in the response [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `includeAccountAccess` | boolean | No | Include account access data in the response [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |

### Response Fields — Property

Returned at the top level of the response. [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)`

| Field | Type | Description |
|-------|------|-------------|
| `name` | text | Property name [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `propId` | integer | Property Id [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `propTypeId` | integer | Property Type Id [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `currency` | text | 3-character currency code [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `address` | text | Address [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `city` | text | City [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `state` | text | State [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `country` | text | 2-character country code [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `postcode` | text | Postcode [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `latitude` | decimal | Latitude [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `longitude` | decimal | Longitude [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `phone` | text | Telephone [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `mobile` | text | Mobile [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `fax` | text | Fax [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `email` | text | Email [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `web` | text | Web [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `contactFirstName` | text | Contact person first name [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `contactLastName` | text | Contact person last name [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `cutOffHour` | integer | Same-day booking cut-off hour; `0` to `24`, where `24` = no cutoff [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `vatRate` | decimal | VAT rate [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `controlPriority` | integer | Control panel priority [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `template1`–`template8` | text | Property template values, accessible by template variables [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `notifyUrl` | text | URL called whenever a booking is made or modified [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `notifyData` | number | Data type for the notify URL [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `notifyHeader` | text | Custom header to include with `notifyUrl` [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `agodaComPropertyCode` | text | Agoda.com Hotel Id [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `airbnbHost` | text | Airbnb host ID [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `airbnbPropertyCode` | text | Airbnb multiplier [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `airbnbCurrency` | text | Airbnb currency [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `airbnbInvoicee` | text | Airbnb invoiceeId [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `airbnbMultiplier` | text | Airbnb price multiplier [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `bookingComPropertyCode` | text | Booking.com Hotel Id [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `bookingComPriceImport` | text | Booking.com price import setting [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `bookingComRateType` | text | Booking.com rate type [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `bookingComInvoiceeId` | text | Booking.com invoicee ID [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `bookingComMultiplier` | text | Booking.com price multiplier [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `bookvisitPropertyCode` | text | BookVisit Hotel Id [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `bookvisitInvoiceeId` | text | BookVisit invoicee ID [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `bookvisitMultiplier` | text | BookVisit price multiplier [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `cTripPropertyCode` | text | Ctrip property code [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `cTripCurrency` | text | Ctrip currency [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `despegarComUsername` | text | Despegar.com username [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `despegarComPassword` | text | Despegar.com password [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `despegarComPropertyCode` | text | Despegar.com property code [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `despegarComCurrency` | text | Despegar.com currency [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `expediaComPropertyCode` | text | Expedia.com Hotel Id [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `expediaComCurrency` | text | 3-character Expedia currency code [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `icalExportTokenSalt` | text | iCal Export Token Salt value [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `icalExportDescription` | text | iCal export description; can include template variables [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `icalImportOption` | integer | `0` = Cancellation and modification allowed; `1` = Cancellation and modification allowed and email notice sent; `2` = Cancellation and modification not allowed [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `odigeoPropertyCode` | text | eDreams ODIGEO Hotel Id [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `vrboInvoicee` | text | VRBO invoiceeId [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `vrboMultiplier` | text | VRBO price multiplier [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |

### Response Fields — Room (returned when `includeRooms=true`) [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)`

| Field | Type | Description |
|-------|------|-------------|
| `name` | text | Room name [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `qty` | integer | Quantity of this room type [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `roomId` | integer | Room Id [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `roomSize` | integer | Room size [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `maxPeople` | integer | Maximum people for this room type [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `maxAdult` | integer | Maximum adults; `0` = use `maxPeople` value [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `maxChildren` | integer | Maximum children for this room type [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `minStay` | integer | Minimum nights which must be stayed [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `maxStay` | integer | Maximum nights which can be stayed [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `minPrice` | decimal | Minimum price for this room type [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `rackRate` | decimal | Rack rate [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `cleaningFee` | decimal | Cleaning fee [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `securityDeposit` | decimal | Security deposit [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `taxPercent` | decimal | Tax percentage [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `taxPerson` | decimal | Tax amount per person and night [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `unitAllocationPerGuest` | integer | `0` = one unit per booking; `1` = one unit per guest [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `unitNames` | text | Unit names, each after a newline `\n` [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `unallocatedUnitName` | text | Unallocated Unit Name [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `highlightColor` | text | HTML 6-character color code for control panel highlight [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `excludeReports` | integer | `0` = no; `1` = yes [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `overbookingProtection` | integer | `0` = room; `1` = property [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `blockAfterCheckout` | integer | Block dates after check-out; `0` to `7` days [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `controlPriority` | integer | Control panel priority [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `dependentRoomId1`–`dependentRoomId12` | integer | Room Id of dependent room; `0` = none [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `dependentRoomLogic` | integer | `0` = All rooms; `1` = Any room; `2` = Sum of all bookings [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `includeBookingsRoomId1`–`includeBookingsRoomId12` | integer | Room Id; `0` = none [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `assignBookingsRoomId1` | integer | Room Id; `0` = this room [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `assignBookingsRoomId2`–`assignBookingsRoomId4` | integer | Room Id; `0` = none — assign a copy booking to Room [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |

### Channel-Specific Room Fields [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)`

**Agoda** [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)`

| Field | Type | Description |
|-------|------|-------------|
| `agodaComEnableInventory` | integer | `0` = not used; `1` = enabled [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `agodaComEnablePrice` | integer | `0` = not used; `1` = enabled [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `agodaComEnableBooking` | integer | `0` = not used; `1` = enabled [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `agodaComRoomCode` | text | Agoda.com Room Id [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |

**Airbnb** [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)`

| Field | Type | Description |
|-------|------|-------------|
| `airbnbComEnableInventory` | integer | `0` = not used; `1` = enabled [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `airbnbComEnableBooking` | integer | `0` = not used; `1` = enabled [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `airbnbComRoomCode` | text | The URL supplied by Airbnb to export their calendar [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `airbnbRoomCode` | text | Airbnb.com Listing ID [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |

**Booking.com** [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)`

| Field | Type | Description |
|-------|------|-------------|
| `bookingComEnableInventory` | integer | `0` = not used; `1` = enabled [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `bookingComEnableBooking` | integer | `0` = not used; `1` = enabled [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `bookingComRoomCode` | text | Booking.com Room Id [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `bookingComRateCode` | text | Booking.com Rate Id [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |

**Expedia** [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)`

| Field | Type | Description |
|-------|------|-------------|
| `expediaComEnableInventory` | integer | `0` = not used; `1` = enabled [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `expediaComEnablePrice` | integer | `0` = not used; `1` = enabled [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `expediaComEnableBooking` | integer | `0` = not used; `1` = enabled [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `expediaComRoomCode` | text | Expedia.com Room Id [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `expediaComRateCode` | text | Expedia.com Rate Id [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |

**iCal (per room)** [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)`

| Field | Type | Description |
|-------|------|-------------|
| `icalExportEnableType` | integer | `0` = Disable; `1` = Export Unavailable Dates; `4` = Export Bookings; `5` = Export Bookings + Unavailable Dates [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `icalExportUrl` | text | iCal available at this URL [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `icalImport1EnableType` | integer | `0` = Disable; `1` = End date is last night (ignore duplicates); `2` = End date is checkout (ignore duplicates); `3` = End date is last night; `4` = End date is checkout; `5` = End date is day after checkout [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `icalImport1Url` | text | URL to import iCal from [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `icalImport2EnableType` | integer | Same enum as `icalImport1EnableType` [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `icalImport2Url` | text | URL to import iCal from [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `icalImport3EnableType` | integer | Same enum as `icalImport1EnableType` [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `icalImport3Url` | text | URL to import iCal from [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |

**eDreams ODIGEO (per room)** [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)`

| Field | Type | Description |
|-------|------|-------------|
| `odigeoEnableInventory` | integer | `0` = not used; `1` = enabled [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `odigeoEnablePrice` | integer | `0` = not used; `1` = enabled [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `odigeoEnableBooking` | integer | `0` = not used; `1` = enabled [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `odigeoRoomCode` | text | eDreams ODIGEO Rate Id [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `odigeoRateCode` | text | eDreams ODIGEO Rate Id [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |

### Response Fields — Room Unit (returned when `includeRoomUnits=true`) [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)`

| Field | Type | Description |
|-------|------|-------------|
| `note` | text | Room Unit Note [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `unitId` | integer | Room Unit Id [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `unitName` | text | Room Unit Name [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `unitStatusIndex` | integer | Room Unit Status Index [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |
| `unitStatusText` | text | Room Unit Status Text [extracted 2026-07-28] `[api → json/getProperty](https://www.beds24.com/api/json/getProperty)` |

---

## setProperty

Modify a property in an account. [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

- **Endpoint:** `https://api.beds24.com/json/setProperty` [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`
- **HTTP method:** POST (JSON body) [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

### Authentication

An `authentication` object is required. [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | string | Yes | API key configured in account settings [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `propKey` | string | Yes | Property key set for the specific property [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |

### General Rules

- The property object must include an `action` element set to `"modify"` to permit changes. [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`
- Each room supports an `action` of `"new"`, `"modify"`, or `"delete"`; absent or invalid values result in no change to that room. [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`
- Only fields being changed need to be included in the request (partial updates allowed). [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`
- The request data structure mirrors that returned by `getProperty`. [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

### Request Structure

The request body contains a `setProperty` array; each item is an object with the fields below. [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

### Property-Level Fields [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

| Field | Type | Description |
|-------|------|-------------|
| `action` | string | Required; must be `"modify"` to enable changes [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `notifyUrl` | string | URL for notifications [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `currency` | string | Property currency code (e.g. `"USD"`, `"EUR"`) [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `agodaComPropertyCode` | string | Agoda property identifier [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `bookingComPropertyCode` | string | Booking.com property identifier [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `expediaComPropertyCode` | string | Expedia property identifier [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `expediaComCurrency` | string | Expedia-specific currency code [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `roomTypes` | array | Collection of room type objects [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `accountAccess` | array | Sub-account permission settings [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |

### Room Type Fields (objects within `roomTypes`) [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

| Field | Type | Description |
|-------|------|-------------|
| `action` | string | `"new"` / `"modify"` / `"delete"` — room operation to perform [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `roomId` | string | Unique room identifier (required for `modify`/`delete`) [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `name` | string | Room name (for `new`/`modify`) [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `qty` | string | Quantity available (for `new`/`modify`) [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `minPrice` | string | Minimum price (for `new`/`modify`) [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `maxPeople` | string | Maximum occupancy (for `modify`) [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `p1Sync`–`p4Sync` | string | Person 1–4 sync settings (for `modify`) [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `dependentRoomId1`–`dependentRoomId8` | string | Dependent room references (for `modify`) [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `dependentRoomLogic` | string | Logic for dependent room rules (for `modify`) [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |

### Room-Level Channel Settings [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

**Agoda** [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

- `agodaComEnableInventory` — Enable inventory sync [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`
- `agodaComEnablePrice` — Enable price sync [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`
- `agodaComEnableBooking` — Enable booking sync [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`
- `agodaComRoomCode` — Agoda room identifier [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

**Airbnb** [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

- `airbnbComEnableInventory` — Enable inventory sync [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`
- `airbnbComEnableBooking` — Enable booking sync [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`
- `airbnbComRoomCode` — Airbnb calendar URL [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

**Booking.com** [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

- `bookingComEnableInventory` — Enable inventory sync [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`
- `bookingComEnableBooking` — Enable booking sync [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`
- `bookingComRoomCode` — Booking.com room code [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`
- `bookingComRateCode` — Booking.com rate code [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

**Expedia** [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

- `expediaComEnableInventory` — Enable inventory sync [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`
- `expediaComEnablePrice` — Enable price sync [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`
- `expediaComEnableBooking` — Enable booking sync [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`
- `expediaComRoomCode` — Expedia room code [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`
- `expediaComRateCode` — Expedia rate code [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

### Room Units [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

- `units` object keyed by unit identifier; each entry supports `note` (string) — text note for the specified unit. [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

### Account Access Fields (objects within `accountAccess`) [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)`

| Field | Type | Description |
|-------|------|-------------|
| `ownerId` | string | Sub-account owner identifier [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `associationCode` | string | Optional code for access grants (only needed when granting access to sub-accounts with an existing code) [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `controlPanel` | string | Control Panel access level: `0` = none, `2` = granted [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `inventory` | string | Inventory access level: `0` = none, `2` = granted [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |
| `bookings` | string | Bookings access level: `0` = none, `2` = granted [extracted 2026-07-28] `[api → json/setProperty](https://www.beds24.com/api/json/setProperty)` |

---

## createProperties

Create new properties in an account. [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)`

- **Endpoint:** `https://api.beds24.com/json/createProperties` [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)`
- **HTTP method:** POST (JSON body) [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)`

### Authentication

An `authentication` object is required. [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | string | Yes | API key configured in account settings [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)` |

### Request Structure

The request body contains a `createProperties` array; each item is a property object. [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)`

### Property-Level Fields [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)`

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Name of the property [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)` |
| `propKey` | string | Key assigned to the property [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)` |
| `notifyUrl` | string | URL for booking notifications [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)` |
| `roomTypes` | array | Array of room type objects [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)` |

### Room Type Fields (objects within `roomTypes`) [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)`

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Name of the room type [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)` |
| `qty` | string | Quantity available [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)` |
| `minPrice` | string | Minimum price (e.g. `"0.00"`) [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)` |

### Key Constraints

- A `propKey` can be assigned to a property using this function when creating a property. [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)`
- A `propKey` **cannot** be added or changed on an existing property via any API function. [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)`
- Field definitions mirror those documented on `getProperty`. [extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)`

### Example Request Body

```json
{
    "authentication": {
        "apiKey": "apiKeyAsSetInAccountSettings"
    },
    "createProperties": [
        {
            "name": "New Hotel 1",
            "propKey": "YourKeyToUseForTheNewHotel1",
            "notifyUrl": "http://www.newhotel1.com/api/newbookings",
            "roomTypes": [
                {
                    "name": "Room 1",
                    "qty": "1",
                    "minPrice": "0.00"
                },
                {
                    "name": "Room 2",
                    "qty": "3",
                    "minPrice": "0.00"
                }
            ]
        }
    ]
}
```
[extracted 2026-07-28] `[api → json/createProperties](https://www.beds24.com/api/json/createProperties)`
