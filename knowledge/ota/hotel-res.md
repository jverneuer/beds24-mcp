# Hotel Booking Save (OTA_HotelRes)

This document covers the OTA-standard **OTA_HotelRes** API method used to commit (push in) new bookings or cancel existing ones.

---

## OTA_HotelRes

### Description

This method implements the **OpenTravel Alliance (OTA)** industry standard for committing hotel bookings. Not all elements in the standard are supported. It saves new bookings or cancels existing ones by posting an `OTA_HotelResRQ` message; confirmations come back as `OTA_HotelResRS`. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`

### HTTP Method & Endpoint

- **Method:** POST [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`
- **Endpoint URL:** `https://api.beds24.com/ota/OTA_HotelRes` [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`
- **Content-Type header:** `application/xml` [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`

### Authentication

Uses **HTTP Basic Authorization**: [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`

- **Username:** the property's **propid** [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`
- **Password:** the password configured in the **channel manager settings** for this channel [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`

### Schema / Validation

- Posted XML must validate against schema version **OTA2015A**. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`
- Namespace used: `http://www.opentravel.org/OTA/2003/05` [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`

### How Bookings Are Pushed In

- The **`HotelCode`** maps to the **propid**. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`
- The **`RoomTypeCode`** maps to the **roomid**. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`
- Multiple **`RoomStay`** elements inside `RoomStays` create a **booking group** (each `RoomStay` is one booking within the group). [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`
- Multiple **`HotelReservation`** elements create **multiple independent bookings or booking groups**. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`
- Reservations **can be cancelled but not modified**. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`

---

## Request Structure (OTA_HotelResRQ)

### Root Element: `OTA_HotelResRQ`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `xmlns` | string | Yes | `"http://www.opentravel.org/OTA/2003/05"` [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |
| `EchoToken` | string/integer | Yes | Unique echo token (example uses `time()`) [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |
| `ResStatus` | enum | Yes | `"Commit"` for new bookings; `"Cancel"` for cancellations [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |
| `Version` | decimal | Yes | `"1.0"` [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |

### Room Types (`RoomTypes > RoomType`)

| Attribute | Description |
|-----------|-------------|
| `RoomTypeCode` | The room ID [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |
| `NumberOfUnits` | Count of units [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |

### Room Rates (`RoomRates > RoomRate > Rates > Rate > Total`)

| Attribute | Description |
|-----------|-------------|
| `BookingCode` (on `RoomRate`) | Booking reference code [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |
| `AmountBeforeTax` | Pre-tax total [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |
| `AmountAfterTax` | Post-tax total [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |
| `CurrencyCode` | Currency (e.g., `"GBP"`) [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |

### Guest Counts (`GuestCounts > GuestCount`)

| Attribute | Description |
|-----------|-------------|
| `AgeQualifyingCode` | `"10"` = adult, `"8"` = child [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |
| `Count` | Number of guests in this category [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |

### Stay Duration (`TimeSpan`)

| Attribute | Description |
|-----------|-------------|
| `Start` | Check-in date (`YYYY-MM-DD`) [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |
| `End` | Check-out date (`YYYY-MM-DD`) [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |

### Guarantee / Payment (`Guarantee > GuaranteesAccepted > GuaranteeAccepted > PaymentCard`)

| Attribute | Description |
|-----------|-------------|
| `CardCode` | Card type (e.g., `"VI"`) [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |
| `ExpireDate` | Expiry in `MMYY` format [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |
| `CardHolderName` | Cardholder name [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |
| `CardNumber > PlainText` | Card number [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |
| `SeriesCode > PlainText` | CVV / security code [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |

### Deposit (`DepositPayments > GuaranteePayment > AmountPercent`)

| Attribute | Description |
|-----------|-------------|
| `Amount` | Deposit amount [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |
| `CurrencyCode` | Currency code [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |

### Guest Details (`ResGuests > ResGuest`)

| Attribute | Description |
|-----------|-------------|
| `ResGuestRPH` | Reference placeholder (links to `ResGuestRPHs`) [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |
| `ArrivalTime` | Estimated arrival time (`HH:MM:SS`) [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |

#### Person Name (`Customer > PersonName`)

- `GivenName` [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`
- `Surname` [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`

#### Contact

- **`Telephone`**: `PhoneNumber` [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`
- **`Email`**: email address [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`
- **`Address`**: `AddressLine` (repeatable), `CityName`, `PostalCode`, `CountryName` (with `Code` attribute) [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`

### Special Requests (`SpecialRequests > SpecialRequest > Text`)

- **`Language`** attribute on `Text` (e.g., `"en"`) [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`

### Global Info (`ResGlobalInfo`)

#### Reservation IDs (`HotelReservationIDs > HotelReservationID`)

| Attribute | Description |
|-----------|-------------|
| `ResID_Type` | `"5"` in the example [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |
| `ResID_Value` | The reservation ID (required for cancellation) [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |

#### Property Info (`BasicPropertyInfo`)

| Attribute | Description |
|-----------|-------------|
| `HotelCode` | The property ID (required for cancellation) [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes` |

---

## Cancellation

For cancellation, set **`ResStatus="Cancel"`** and supply both **`ResID_Value`** and **`HotelCode`**. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`

### Minimal Cancellation Example

```xml
<OTA_HotelResRQ xmlns="http://www.opentravel.org/OTA/2003/05" ResStatus="Cancel" Version="1.0">
  <HotelReservations>
    <HotelReservation>
      <ResGlobalInfo>
        <HotelReservationIDs>
          <HotelReservationID ResID_Type="5" ResID_Value="318379" />
        </HotelReservationIDs>
        <BasicPropertyInfo HotelCode="3103" />
      </ResGlobalInfo>
    </HotelReservation>
  </HotelReservations>
</OTA_HotelResRQ>
```
[extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`

---

## Response Format

The service replies with an **`OTA_HotelResRS`** XML message. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`

- **Response Content-Type:** `text/xml; charset=utf-8` [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`
- The documentation does not enumerate the response fields in detail. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`

## Error Handling

Error handling is not explicitly described in the documentation. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`

## Rate Limits

Rate limits are not mentioned in the documentation. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`

## Key Implementation Notes

- The PHP/cURL example sets `CURLOPT_RETURNTRANSFER` and echoes the raw XML response. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`
- The `ResGuestRPHs` value should match the `ResGuestRPH` on the corresponding `ResGuest` element. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelRes`
