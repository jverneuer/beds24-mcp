# setMessage

Sends a message to a guest via a JSON POST API using OTA (Online Travel Agency) messaging rather than direct email delivery. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`

## Endpoint

Send a JSON POST to `https://www.beds24.com/api/json/setMessage`. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`

## Supported OTAs

Messages can only be sent for bookings originating from these channels: [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`

- **Airbnb** [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`
- **Booking.com** [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `authentication` | object | Yes | Container for `apiKey` and `propKey`. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)` |
| `apiKey` | string | Yes | API key from account settings. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)` |
| `propKey` | string | Yes | Property key from property settings. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)` |
| `bookId` | string | Yes | Booking identifier; must be specified for each message; the booking must originate from a supported OTA. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)` |
| `message` | string | Yes | Text content to send to the guest. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)` |

## Sending a New Message

- Provide the three required fields: `authentication`, `bookId`, and `message`. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`
- **One message can be sent per request.** [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`

## Replying to an Existing Message

- The source page does not document a separate reply workflow for `setMessage`. It references `getMessages` as the comparable JSON structure, implying message data format is symmetric between the two methods. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`

## Message Content Format

- The data format mirrors what is returned by `getMessages`. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`
- Line breaks: JSON does not support the line-break code directly. To produce a line break in the delivered message, supply the four-character sequence `\r\n` inside the message string. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`

## Recipient Targeting

- The recipient is determined by `bookId`; the booking identifier decides which guest receives the message. No separate recipient field is documented. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`

## Example Request Payload

```json
{
    "authentication": {
        "apiKey": "apiKeyAsSetInAccountSettings",
        "propKey": "propKeyAsSetForTheProperty"
    },
    "bookId": "12345678",
    "message": "Welcome, you will find the key under the doormat"
}
```

[extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`

## Response

- The source page does **not** document the response structure or error responses for `setMessage`. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`

## General API Rules (apply to this method)

- Only one API call at a time is allowed; wait for the first call to complete before starting a second. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
- Multiple calls should be spaced with a few seconds delay between each call. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
- Excessive usage will cause the account to be blocked without warning. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
- Calls should be designed to send and receive only the minimum required data. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
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

> **Note:** The public documentation page does NOT document response fields or a distinct reply/quote mechanism. Any such capabilities, if they exist, are not described at the cited URL. [extracted 2026-07-28] `[api → json/setMessage](https://www.beds24.com/api/json/setMessage)`
