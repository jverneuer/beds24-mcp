# getInvoicees / setInvoicees

Covers the two Beds24 JSON API methods for managing **invoicees** (payables): `getInvoicees` (read) and `setInvoicees` (modify). Both are JSON POST endpoints. [extracted 2026-07-28] `[api → json/getInvoicees](https://www.beds24.com/api/json/getInvoicees)` `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)`

---

## getInvoicees

Retrieves information about invoicees in an account. [extracted 2026-07-28] `[api → json/getInvoicees](https://www.beds24.com/api/json/getInvoicees)`

### Overview

- **Purpose:** Get information about the invoicees in an account. [extracted 2026-07-28] `[api → json/getInvoicees](https://www.beds24.com/api/json/getInvoicees)`
- **HTTP Method:** POST (the page states "Post JSON data here to get information about the invoicees in an account"). [extracted 2026-07-28] `[api → json/getInvoicees](https://www.beds24.com/api/json/getInvoicees)`
- **Format:** JSON. [extracted 2026-07-28] `[api → json/getInvoicees](https://www.beds24.com/api/json/getInvoicees)`

### Authentication

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `authentication` | object | Required | Contains authentication credentials. [extracted 2026-07-28] `[api → json/getInvoicees](https://www.beds24.com/api/json/getInvoicees)` |
| `authentication.apiKey` | string | Required | API key configured in account settings. [extracted 2026-07-28] `[api → json/getInvoicees](https://www.beds24.com/api/json/getInvoicees)` |

- The `apiKey` is configured at **SETTINGS >> ACCOUNT >> ACCOUNT ACCESS** and must be between 16 and 64 characters long. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
- The key must be kept secure — holders can view or potentially make changes in the account. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`

### Request Parameters

| Parameter | Type | Required/Optional | Description |
|-----------|------|-------------------|-------------|
| `authentication` | object | Required | Contains authentication credentials. [extracted 2026-07-28] `[api → json/getInvoicees](https://www.beds24.com/api/json/getInvoicees)` |
| `invoiceeId` | string | Optional | Specifies a single invoicee to retrieve. [extracted 2026-07-28] `[api → json/getInvoicees](https://www.beds24.com/api/json/getInvoicees)` |

### Operations Supported

1. **Get all invoicees** — send a request with only the `authentication` object. [extracted 2026-07-28] `[api → json/getInvoicees](https://www.beds24.com/api/json/getInvoicees)`
2. **Get a specific invoicee** — include `invoiceeId` in the request payload. [extracted 2026-07-28] `[api → json/getInvoicees](https://www.beds24.com/api/json/getInvoicees)`

### Response Details

- The response fields and structure are **not** enumerated in the official documentation for this endpoint. [extracted 2026-07-28] `[api → json/getInvoicees](https://www.beds24.com/api/json/getInvoicees)`
- The `setInvoicees` documentation references `getInvoicees` for information about available data fields, indicating the invoicee object structure returned by `getInvoicees` is the same structure used when posting to `setInvoicees`. [extracted 2026-07-28] `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)`

---

## setInvoicees

Modifies an invoicee (payable) within an account. [extracted 2026-07-28] `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)`

### Overview

- **Purpose:** Modify an invoicee (payable) in an account. [extracted 2026-07-28] `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)`
- **HTTP Method:** POST (the page states "Post JSON data here"). [extracted 2026-07-28] `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)`
- **Request Body Format:** JSON. [extracted 2026-07-28] `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)`

### Top-Level Structure

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `authentication` | object | Yes | Contains authentication credentials. [extracted 2026-07-28] `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)` |
| `invoicees` | array | Yes | Array of invoicee objects to modify. [extracted 2026-07-28] `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)` |

### Authentication Object

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | string | Yes | The API key configured in account settings. [extracted 2026-07-28] `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)` |

### Invoicee Object Fields

- The page references `getInvoicees` for information about available data fields, indicating the invoicee object structure mirrors that endpoint's response. [extracted 2026-07-28] `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier of the invoicee to modify. [extracted 2026-07-28] `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)` |
| `enable` | string | No | Example value shown is `"1"`. [extracted 2026-07-28] `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)` |

### Constraints

- **Maximum per call:** 100 invoicees can be modified in a single request. [extracted 2026-07-28] `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)`
- **Partial updates supported:** Only the invoicee `id` plus any fields you wish to change are required; unchanged fields need not be included. [extracted 2026-07-28] `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)`
- The invoicee array structure matches the format returned by the `getInvoicees` endpoint. [extracted 2026-07-28] `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)`

### Example Request Body

```json
{
    "authentication": {
        "apiKey": "apiKeyAsSetInAccountSettings"
    },
    "invoicees": [
        {
            "id": "1234",
            "enable": "1"
        }
    ]
}
```
[extracted 2026-07-28] `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)`

### Response Details

- The page does not explicitly document the response structure for `setInvoicees`. [extracted 2026-07-28] `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)`

---

## General API Usage Rules

These rules apply to all JSON API methods including getInvoicees and setInvoicees: [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`

- **One API call at a time** — must wait for the first to complete before issuing a second.
- Calls should be used sparingly and kept to the minimum required for reasonable business usage.
- Each call should send and receive only the minimum required data.
- Multiple calls should be spaced with a few seconds delay between each call.
- Excessive usage will cause your account to be blocked without warning.
