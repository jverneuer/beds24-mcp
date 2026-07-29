# Messages — Beds24 API

Category index for the Beds24 OTA messaging API methods. These methods handle retrieving and sending guest messages for bookings originating from supported OTAs (Airbnb, Booking.com) via JSON POST calls.

## Child Documents

- **[getMessages.md](getMessages.md)** — Retrieves OTA messages; supports filtering by booking id (`bookId`), including internal booking notes (`incNotes`), and paginating in pages of 100 most-recent messages (`page`). [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)`
- **[setMessage.md](setMessage.md)** — Sends a message to a guest for a supported-OTA booking; requires `authentication`, `bookId`, and `message`, sends one message per request, and uses `\r\n` for line breaks. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`

## Overarching Topics

- **Authentication** — every request carries an `authentication` object with `apiKey` (SETTINGS >> ACCOUNT >> ACCOUNT ACCESS) and `propKey` (SETTINGS >> PROPERTY >> LINK >> PROPKEY); keys must be 16–64 characters and kept secure. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
- **Message retrieval & filtering** — `getMessages` returns the 100 most recent OTA messages, filterable by `bookId` and expandable with internal notes via `incNotes`. [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)`
- **Message sending** — `setMessage` sends a single guest message per request for Airbnb or Booking.com bookings only. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`
- **Pagination** — messages are paginated in batches of 100 via the `page` parameter. [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)`
- **OTA channel restrictions** — only Airbnb and Booking.com bookings are supported for messaging. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`
- **Message content format** — message data format is symmetric between `getMessages` and `setMessage`; line breaks use the `\r\n` sequence. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`
- **Rate limiting & concurrency** — only one API call at a time; space calls a few seconds apart; excessive use (especially within a 5-minute window) blocks the account without warning. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)` `[](https://api.beds24.com/)`
- **Error codes** — general JSON API error codes: 1009 (not allowed for role), 1010 (no write access), 1016/1020 (usage limit exceeded in last 5 minutes), 1021 (no credit), 1022 (not whitelisted). [extracted 2026-07-28] `[](https://api.beds24.com/)`
