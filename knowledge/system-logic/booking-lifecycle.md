# Booking Lifecycle

Booking statuses, how OTA bookings differ from manual bookings, how a booking consumes availability, cancellation rules, and check-in/check-out logic.

## Booking statuses

A booking's primary status is a numeric code:

- **0** = Cancelled [extracted 2026-07-28]
- **1** = Confirmed [extracted 2026-07-28]
- **2** = New — "same as confirmed but unread" [extracted 2026-07-28]
- **3** = Request [extracted 2026-07-28]
- **4** = Black [extracted 2026-07-28]
- **5** = Inquiry [extracted 2026-07-28]

## Booking substatuses

A secondary substatus provides finer state:

- **0** = {blank} [extracted 2026-07-28]
- **1** = Action required [extracted 2026-07-28]
- **2** = Allotment [extracted 2026-07-28]
- **3** = Cancelled by guest [extracted 2026-07-28]
- **4** = Cancelled by host [extracted 2026-07-28]
- **5** = No show [extracted 2026-07-28]
- **6** = Waitlist [extracted 2026-07-28]
- **7** = Walkin [extracted 2026-07-28]

## OTA vs. manual bookings

Bookings enter Beds24 through two distinct paths, with different rules.

- **Manual bookings** are created directly via `setBooking` (or in the dashboard). The caller controls status, unit assignment, and fields. [extracted 2026-07-28]
- **OTA bookings** arrive via the `OTA_HotelRes` endpoint as an OpenTravel Alliance message. The `ResStatus` attribute distinguishes the operation: **"Commit"** creates the booking, **"Cancel"** removes it. [extracted 2026-07-28]
- OTA bookings are authenticated per-channel: username = propid, password = the per-channel password set in channel manager settings. [extracted 2026-07-28]
- In an OTA reservation message, `HotelCode` = propid and `RoomTypeCode` = roomid. [extracted 2026-07-28]
- Multiple `RoomStay` elements in one message create a **booking group** (each RoomStay is one booking in the group). Multiple `HotelReservation` elements create multiple independent bookings/groups. [extracted 2026-07-28]

## Availability consumption

When a booking is committed, inventory is consumed as follows:

- If `unitId` is not set, "the booking will be auto assigned into an available unit of the specified roomId type." [extracted 2026-07-28]
- `checkAvailability` — "Do not save the booking if room has no availability." [extracted 2026-07-28]
- `assignBooking` — "Use room dependency settings to assign booking to a different room type or the first free unit within the room type." [extracted 2026-07-28]
- In OTA messages, `NumberOfUnits` on the `RoomType` element signals the unit count being reserved. [extracted 2026-07-28]
- Bookings can be mirrored to other room types via `assignBookingsRoomId2`–`4`, so one booking may decrement inventory across several configured room types. [extracted 2026-07-28]

## Modification vs. deletion vs. cancellation

These three operations are deliberately distinct in Beds24.

- **"Bookings can be cancelled but not deleted by this function."** Cancellation is the only supported terminal transition; there is no hard-delete. [extracted 2026-07-28]
- Reservations (OTA) "can be cancelled but not modified." [extracted 2026-07-28]
- When updating an existing booking, "it is not necessary to send unchanged fields when modifying a booking, it is better to only include the fields which have changed." [extracted 2026-07-28]

## Cancellation rules

Cancellation has channel-specific gates, especially for Booking.com.

- For Booking.com, `bookingcomReportCancel` reports a cancellation request, but "the booking will only be cancelled if all prerequisites have been fulfilled." [extracted 2026-07-28]
- OTA cancellation requires the original reservation reference: `ResID_Value` and `HotelCode` must be specified. The `HotelReservationID` element carries `ResID_Type="5"` and the `ResID_Value`. [extracted 2026-07-28]
- Substatus distinguishes who initiated: **3 = Cancelled by guest**, **4 = Cancelled by host**, **5 = No show**. [extracted 2026-07-28]

## Check-in / check-out timing

Check-in is a hard boundary for several Booking.com actions.

- `bookingcomInvalidCard` — "Report an invalid card to Booking.com. Only available **before check-in**." [extracted 2026-07-28]
- `bookingcomNoShow` — "Report a no show to Booking.com. Only available **from check-in for 2 days**." [extracted 2026-07-28]
- Per-date override flags (`o` field) independently enforce **no checkin (2)**, **no checkout (3)**, and **nocheckin/out (4)** restrictions. [extracted 2026-07-28]

## Group / linked bookings

- A group is formed by identifying the `bookId` of the master booking and setting the `masterId` field of all additional bookings in the group to this `bookId`. [extracted 2026-07-28]

## Default query window

- When no date parameters are supplied to `getBookings`, "arrivalFrom defaults to yesterday and arrivalTo defaults to plus one year from the current day." [extracted 2026-07-28]

## Data restrictions

- "Credit card information is not available" via the API. [extracted 2026-07-28]

## Sources

- https://www.beds24.com/api/json/getBookings — status/substatus codes, default date window, credit card disclaimer
- https://www.beds24.com/api/json/setBooking — cancel-not-delete, unit assignment, checkAvailability, assignBooking, Booking.com time-gated actions, group masterId
- https://www.beds24.com/api/ota/OTA_HotelRes — OTA commit/cancel, ResStatus, HotelCode/RoomTypeCode, booking group, cancellation reference
- https://www.beds24.com/api/json/getRoomDates — o-field check-in/out override flags
