# Beds24 System Logic — Category Index

System-behavior facts about how Beds24 actually works internally (not just API parameter lists). Every statement is cited to its source URL and dated.

## Child files

- **[property-structure.md](property-structure.md)** — How properties, room types, and room units relate; propId/propKey, unit allocation, room dependency logic (AND/OR/Sum), booking assignment across rooms, and overbooking-protection scope. Overarching topics: property hierarchy, room type vs. room unit, unit allocation per guest, dependent rooms, overbooking protection.
- **[availability-model.md](availability-model.md)** — How availability works: inventory (`i`), closed/override codes (`o`: blackout, no checkin/out, exceptional period), min/max stay (`m`/`mx`), the percentage multiplier (`x`), per-date price rows (`p1`–`p16`), and how bookings consume inventory. Overarching topics: inventory tracking, stay restrictions, per-date overrides, availability consumption, channel booking limits.
- **[pricing-model.md](pricing-model.md)** — The pricing system: the rate-vs-daily-price distinction, daily price rows, per-occupancy pricing tiers, linked/slave daily prices, per-date overrides and multipliers, and how the final nightly price is composed. Overarching topics: rates vs. daily prices, occupancy pricing, linked prices, price composition, rate rules.
- **[channel-sync.md](channel-sync.md)** — How the channel manager pushes prices and availability to Airbnb/Booking.com/OTAs, sync direction (push vs. pull), OTA OpenTravel Alliance interface, rate links and channel rate codes, and Booking.com/Airbnb-specific sync behaviors. Overarching topics: price push, availability sync, OTA protocol, rate links, per-channel markups.
- **[booking-lifecycle.md](booking-lifecycle.md)** — Booking statuses and substatuses, OTA vs. manual booking paths, how availability is consumed, cancellation rules (incl. Booking.com prerequisites), check-in/out time gates, and group bookings. Overarching topics: status model, OTA reservation flow, cancellation logic, check-in boundaries, booking groups.

## Overarching topics across documents

- Property / room / unit hierarchy and how bookings assign into units
- Availability: inventory counts, closed dates, stay restrictions, multipliers, per-date overrides
- Pricing: the rate plan vs. nightly amount split, occupancy tiers, linked prices, composition rules
- Channel management: push sync of daily prices and availability, rate-link mapping, per-channel adjustments
- Booking lifecycle: status model, OTA (OTA_HotelRes/OTA_HotelRes) vs. manual flow, cancellation gates, group bookings
