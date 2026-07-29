# Properties — Category Index

Beds24 JSON API methods for managing property records, room types, channel connections, and property content (descriptions, policies, room text, images). [extracted 2026-07-28]

## Child files

- **[properties.md](properties.md)** — getProperties, getProperty, setProperty, createProperties. [extracted 2026-07-28]
- **[property-content.md](property-content.md)** — getPropertyContent, setPropertyContent, getDescriptions. [extracted 2026-07-28]

## Overarching topics

- **Property lifecycle:** list all properties (`getProperties`), read one (`getProperty`), create (`createProperties`), update (`setProperty`). [extracted 2026-07-28]
- **Property identity:** `propId` (integer id) and `propKey` (mutable-only-at-creation key); `propKey` cannot be changed on an existing property via any API. [extracted 2026-07-28]
- **Authentication:** most methods require `apiKey` (+ `propKey` for property-scoped calls); `getDescriptions` is the exception (IP-whitelisted, no key). [extracted 2026-07-28]
- **Room types:** embedded objects with capacity, pricing, stay rules, unit allocation, and dependency logic; supported actions `new` / `modify` / `delete`. [extracted 2026-07-28]
- **Channel management:** per-property and per-room codes/multipliers for Airbnb, Booking.com, Expedia, Agoda, VRBO, Ctrip, Despegar, BookVisit, eDreams ODIGEO. [extracted 2026-07-28]
- **iCal sync:** per-room import (3 feeds) and export settings with enumerated enable-type codes. [extracted 2026-07-28]
- **Notifications & templates:** `notifyUrl` / `notifyHeader` / `notifyData`, and `template1`–`template8` values accessible by template variables. [extracted 2026-07-28]
- **Sub-account access:** `accountAccess` with `controlPanel` / `inventory` / `bookings` permission levels. [extracted 2026-07-28]
- **Property content:** locale-keyed text fields (`texts`), per-room content (`roomIds`), image references, and booking-app-facing descriptions. [extracted 2026-07-28]
