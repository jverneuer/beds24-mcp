# XML Deprecated — Category Index

> **Deprecation warning:** The Beds24 XML API functions are officially deprecated. The API index states: "Use the JSON functions for new designs. These XML functions are depreciated." [extracted 2026-07-28], source: https://www.beds24.com/api/

## Child files

- **[xml-methods.md](xml-methods.md)** — Complete reference for all eight deprecated Beds24 XML API methods (getAccount, putAccount, getProperties, putProperties, getInventories, putInventories, getBookings, putBookings), each with purpose, HTTP method, request parameters, XML structure, authentication, and its recommended JSON replacement.

## Overarching topics

- Official XML API deprecation notice and JSON-first guidance
- XML → JSON method mapping and replacement reference
- Account management (getAccount / putAccount → getAccount / setAccount JSON)
- Property management (getProperties / putProperties → getProperties / setProperty / createProperties JSON)
- Inventory, availability, and pricing (getInventories / putInventories → getAvailabilities / setRoomDates JSON)
- Booking management (getBookings / putBookings → getBookings / setBooking JSON)
- Authentication: username/password and APIKEY (XML) vs. apiKey/propKey (JSON)
- Request/response formats: XML documents vs. JSON payloads
