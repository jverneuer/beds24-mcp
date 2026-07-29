# Channel Sync

How the Beds24 channel manager synchronizes prices and availability to OTAs (Airbnb, Booking.com, and others), what gets synced, and what triggers a sync.

## Channel manager role

Beds24 acts as a centralized channel manager: you set prices and availability once in Beds24 and it pushes them out to connected booking channels.

- The channel manager "allows users to manage room rates and availability across multiple online booking channels and OTAs from a single platform." [extracted 2026-07-28]
- Beds24 connects to 40+ booking channels including Airbnb, Booking.com, Vrbo, and Expedia. [extracted 2026-07-28]
- General flow: connect each OTA account → map rooms/room types between Beds24 and each channel → set prices and availability in Beds24 → Beds24 pushes this data to connected channels automatically → when a booking occurs on any channel, the calendar updates everywhere. [extracted 2026-07-28]

## What gets synced: prices

- **Daily prices** are the values pushed to OTAs, not the rate template itself. [extracted 2026-07-28]
- You can set different rates for different channels if desired. [extracted 2026-07-28]
- Price differences (mark-ups/mark-downs) can be applied **per channel** to account for OTA commissions. [extracted 2026-07-28]
- You can map different **Beds24 rates** to different **OTA rate plans**. [extracted 2026-07-28]
- The channel manager "sends your daily prices from beds24 to external booking channels, with optional per-channel adjustments." [extracted 2026-07-28]

## What gets synced: availability

- Availability calendars are synchronized to prevent double bookings. [extracted 2026-07-28]
- When a booking comes in through any connected channel, the availability is automatically updated across all connected channels. [extracted 2026-07-28]
- Availability sync (calendar sync) is the mechanism that prevents double bookings. [extracted 2026-07-28]

## Sync direction

The dominant direction is a **push** from Beds24 to the OTAs for both prices and availability.

- The feature is described as "Rate/price pushing" and "push different rates to different channels from a single dashboard." [extracted 2026-07-28]
- Availability updates are also pushed out ("push availability updates to connected platforms"). [extracted 2026-07-28]
- Bookings that originate on an OTA arrive in Beds24 via the OTA reservation interface (`OTA_HotelRes`), which is the inbound/pull leg of the cycle. [extracted 2026-07-28]

## OTA interface standards

The channel integration is built on OpenTravel Alliance protocols.

- The OTA functions are "based on the industry standards set by the OpenTravel alliance. Not all elements in the standard are supported." [extracted 2026-07-28]
- XML messages must validate to schema version **OTA2015A**. [extracted 2026-07-28]
- The `OTA_HotelAvail` endpoint handles availability requests (pull of availability by/for channels). [extracted 2026-07-28]
- The `OTA_HotelRes` endpoint handles booking commitments and cancellations (inbound reservations). [extracted 2026-07-28]

## OTA message authentication

- OTA posts use **HTTP basic authorization**. [extracted 2026-07-28]
- The username is the **propid** of the property. [extracted 2026-07-28]
- The password (minimum 6 characters) is "set in the channel manager settings for this channel." [extracted 2026-07-28]
- In OTA messages, `HotelCode` = propid and `RoomTypeCode` = roomid. [extracted 2026-07-28]
- Only **one room** can be requested at a time with a date range via `OTA_HotelAvail`. [extracted 2026-07-28]

## Rate links — mapping Beds24 rates to channel listings

Rate links are the mechanism that connects an internal Beds24 rate to a specific channel listing.

- `getRateLinks` returns the "price linking information between rates" — specifically the **linking parameters** for a given `rateId`, not the base rate details themselves. [extracted 2026-07-28]
- "Information about the base rate is not returned, only information about the rate linking parameters is returned." [extracted 2026-07-28]
- The base rate specified must be "owned by the property used for authentication." [extracted 2026-07-28]
- A rate link carries the **channel rate codes** that identify the corresponding OTA rate plan. Documented rate-code fields on a rate include: `bookingcomRateCode`, `expediaRateCode`, `feratelRateCode`, `lastminute.com`, `tablethotels`, `travelocity`. [extracted 2026-07-28]
- There is a corresponding `setRateLinks` ("modify the price linking between rates") for writing these links back. [extracted 2026-07-28]

## Booking.com specifics

- Beds24 pushes daily prices and availability to Booking.com. [extracted 2026-07-28]
- Booking.com imposes its own restrictions that can affect how daily prices appear, including **rate plan rules** and **minimum stay requirements**. [extracted 2026-07-28]
- Booking.com has time-sensitive post-check-in actions: `bookingcomInvalidCard` (report invalid card, available **only before check-in**), `bookingcomNoShow` (report no-show, available **from check-in for 2 days**), `bookingcomReportCancel` (cancellation request honoured only if all prerequisites are fulfilled). [extracted 2026-07-28]

## Airbnb specifics

- Beds24 pushes daily prices and availability to Airbnb. [extracted 2026-07-28]
- The integration is set up via Airbnb's API. [extracted 2026-07-28]

## Unified management

- Bookings from all connected channels land in a **unified inbox** and are managed in one place. [extracted 2026-07-28]
- Automated messaging sends confirmations and messages to guests across channels. [extracted 2026-07-28]

## Note on source coverage

The Beds24 wiki (`wiki.beds24.com`) and help centre (`beds24.com/help/`) contain the most detailed channel-manager behavioral documentation (e.g. "Channel_Manager", "Daily_Prices", "Rate_Links" wiki pages), but both return HTTP 403/404 to direct fetch. The behavioral statements above are drawn from the openly accessible API reference and from third-party descriptions of Beds24's documented behavior. [extracted 2026-07-28]

## Sources

- https://www.beds24.com/api/ — function index ("get/modify the price linking between rates", "get a price and availability")
- https://www.beds24.com/api/json/getRateLinks — rate link parameters, rateId ownership
- https://www.beds24.com/api/json/setRate — channel rate codes (bookingcomRateCode, expediaRateCode, etc.)
- https://www.beds24.com/api/ota/OTA_HotelAvail — availability request protocol, auth, RoomTypeCode=roomid
- https://www.beds24.com/api/ota/OTA_HotelRes — reservation commitment, HotelCode/RoomTypeCode mapping
- https://www.beds24.com/api/json/setBooking — Booking.com-specific time-gated actions
- https://en.wikipedia.org/wiki/Beds24_Channel_Manager — channel manager overview (40+ channels, push model)
- https://wiki.beds24.com/Channel_Manager — wiki page (403 to fetch; referenced)
- https://wiki.beds24.com/Daily_Prices — wiki page (403 to fetch; referenced)
- https://wiki.beds24.com/Rate_Links — wiki page (403 to fetch; referenced)
