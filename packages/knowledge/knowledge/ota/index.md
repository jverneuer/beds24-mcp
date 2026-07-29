# Beds24 OTA API — Category Index

This index covers the Beds24 OTA (channel / OTA-standard) API methods for availability lookup and booking management.

## Child Documents

- **[hotel-avail.md](./hotel-avail.md)** — Availability and pricing lookup via two endpoints: the proprietary JSON `JSON_HotelAvail` and the OTA-standard XML `OTA_HotelAvail`. Covers authentication, request parameters, response fields (inventory, rates, prices, min/max stay, restrictions, closed/arrival flags), and the single-room-per-request constraint.
- **[hotel-res.md](./hotel-res.md)** — Booking save and cancellation via the OTA-standard XML `OTA_HotelRes` endpoint. Covers how bookings are pushed in (HotelCode/propid and RoomTypeCode/roomid mapping, booking groups, commit-vs-cancel), the full request structure (room types, rates, guest counts, payment card, deposit, guest details, special requests, global info), and the cancellation flow.

## Overarching Topics

- **Availability & pricing lookup** — querying room inventory and rates by date range and room ID
- **Booking ingestion (push model)** — how an OTA pushes new bookings into Beds24
- **Booking cancellation** — the commit/cancel reservation lifecycle
- **Authentication models** — JSON V1 apiKey/propKey vs. HTTP Basic Auth (propid + channel-manager password)
- **OTA OpenTravel standards** — OTA2015A schema validation, `OTA_HotelAvailRQ/RS`, `OTA_HotelResRQ/RS`, namespace `http://www.opentravel.org/OTA/2003/05`
- **Request constraints** — single room per availability request, date range required
- **Booking grouping** — multiple `RoomStay` elements form a group; multiple `HotelReservation` elements form independent bookings
- **Guest & payment data model** — guest counts by age-qualifying code, payment card guarantee, deposit, person name, contact, address, special requests
