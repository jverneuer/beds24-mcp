# getMessages

Retrieves OTA (Online Travel Agency) messages from the Beds24 system via a JSON POST API. [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)`

## Endpoint

Send a JSON POST to `https://www.beds24.com/api/json/getMessages`. [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)`

## Authentication

The request body must contain an `authentication` object with two credential fields: [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)`

- `apiKey` — the API key as configured in account settings (`apiKeyAsSetInAccountSettings`). [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)`
- `propKey` — the property key as configured for the property (`propKeyAsSetForTheProperty`). [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)`

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `authentication` | object | Yes | Container holding `apiKey` and `propKey`. [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)` |
| `bookId` | string | No | Limits the returned messages to the specified booking. [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)` |
| `incNotes` | boolean | No | When set to `true`, includes internal notes added to the booking in the result. [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)` |
| `page` | string | No | Paginates the result set. Example value `"2"` retrieves the second page. [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)`

## Pagination / Result Limits

- By default the API returns the **100 most recent messages**. [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)`
- To retrieve the next set of messages, include the `page` parameter (e.g. `"2"` for the second most-recent 100). [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)`

## Example Request Payloads

1. **Most recent 100 messages** — authentication only. [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)`
2. **Second page** — authentication plus `"page": "2"`. [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)`
3. **Specific booking, including internal notes** — authentication plus `"bookId": "12345678"` and `"incNotes": true`. [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)`

## Response

The page describes the request parameters in detail; the exact response field structure is **not enumerated** in the source page. The companion `setMessage` documentation notes that message data format mirrors what `getMessages` returns. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`

## General API Rules (apply to this method)

- Only one API call at a time is allowed; wait for the first call to complete before starting a second. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
- Multiple calls should be spaced with a few seconds delay between each call. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
- Excessive usage will cause the account to be blocked without warning. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
- Calls should be designed to send and receive only the minimum required data. [extracted 2026-07-28] `[index.php](https://www.beds24.com/json/index.php)`
- Data is posted and returned in JSON format. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
- The API key is found under SETTINGS >> ACCOUNT >> ACCOUNT ACCESS and must be between 16 and 64 characters long and kept secure. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
- The prop key is found under SETTINGS >> PROPERTY >> LINK >> PROPKEY and has the same length requirements. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
- Excessive usage within a 5-minute period will cause the account to be blocked without warning. [extracted 2026-07-28] `[](https://api.beds24.com/)`

## Error Codes (general JSON API)

| Code | Meaning |
|------|---------|
| 1009 | Not allowed for this role. [extracted 2026-07-28] `[](https://api.beds24.com/)` |
| 1010 | No write access. [extracted 2026-07-28] `[](https://api.beds24.com/)` |
| 1016 | Usage limit exceeded in last 5 minutes. [extracted 2026-07-28] `[](https://api.beds24.com/)` |
| 1020 | Usage limit exceeded in last 5 minutes. [extracted 2026-07-28] `[](https://api.beds24.com/)` |
| 1021 | Account has no credit. [extracted 2026-07-28] `[](https://api.beds24.com/)` |
| 1022 | Not whitelisted. [extracted 2026-07-28] `[](https://api.beds24.com/)` |

> **Note:** The public documentation page does NOT document response fields, room-level filters, read-status filters, or date-range filters. Any such capabilities, if they exist, are not described at the cited URL. [extracted 2026-07-28] `[api → json/getMessages](https://www.beds24.com/api/json/getMessages)`
