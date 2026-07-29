# getInvoices

Retrieves information about booking invoices in a Beds24 account. Implemented as a JSON POST endpoint. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)`

## Overview

- **Purpose:** Get information about booking invoices in an account. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)`
- **HTTP Method:** POST (the page instructs to "Post JSON data here"). [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)`
- **Format:** JSON. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)`

## Authentication

Authentication is provided via an `authentication` object within the JSON body. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)`

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `apiKey` | Yes | string | Account apiKey. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)` |
| `propKey` | Yes | string | Property apiKey. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)` |

- The `apiKey` is configured at **SETTINGS >> ACCOUNT >> ACCOUNT ACCESS** and must be between 16 and 64 characters long. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
- The `propKey` is configured at **SETTINGS >> PROPERTY >> LINK >> PROPKEY** and must be between 16 and 64 characters long. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
- Both keys must be kept secure — holders can view or potentially make changes in the account. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`

## Request Parameters

Parameters are passed at the top level of the JSON body alongside the `authentication` object. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)`

| Parameter | Required | Type | Description | Allowed Values |
|-----------|----------|------|-------------|----------------|
| `bookId` | No | integer | When specified, only invoice items for this booking number are returned. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)` | integer |
| `masterId` | No | integer | When specified, only invoice items for this booking group are returned. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)` | integer |
| `invoiceId` | No | integer | When specified, only invoice items for this invoice number are returned. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)` | integer |
| `invoiceeId` | No | integer / empty string `""` / false | When specified, only invoice items for this invoicee are returned. Invoicee Ids are integers (see JSON getInvoicees). An empty string returns unassigned invoice items; false returns both assigned and unassigned items. If `dateFrom` is not specified, this option returns invoice items created in the previous 24 hours. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)` | integer, `""`, or false |
| `dateFrom` | No | date/time string | Only invoice items created after this date are returned. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)` | Format: `"2016-12-31 14:37:15"` |
| `dateTo` | No | date/time string | Only invoice items created before this date are returned. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)` | Format: `"2016-12-31 14:37:15"` |
| `incBook` | No | boolean | When true, currency, invoiceId, roomId, propId, and ownerId of the invoice item are included in the response. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)` | true / false |

## Key Usage Rules

- **At least one of `bookId`, `masterId`, `invoiceId`, or `invoiceeId` must be specified.** [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)`
- `invoiceeId=false` returns invoices not assigned to an invoicee. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)`
- Valid `invoiceeId` integer values can be obtained from the `getInvoicees` endpoint. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)`

## Example Request Body

```json
{
    "authentication": {
        "apiKey": "apiKeyAsSetInAccountSettings",
        "propKey": "propKeyAsSetForTheProperty"
    },
    "bookId": false,
    "masterId": false,
    "invoiceId": false,
    "invoiceeId": false,
    "dateFrom": false,
    "dateTo": false,
    "incBook": false
}
```
[extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)`

## Response Details

- The base response schema is **not** enumerated in the official documentation. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)`
- When `incBook=true`, the following additional fields are included in the response: `currency`, `invoiceId`, `roomId`, `propId`, `ownerId`. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)`

## General API Usage Rules

These rules apply to all JSON API methods including getInvoices: [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`

- **One API call at a time** — must wait for the first to complete before issuing a second.
- Calls should be used sparingly and kept to the minimum required for reasonable business usage.
- Each call should send and receive only the minimum required data.
- Multiple calls should be spaced with a few seconds delay between each call.
- Excessive usage will cause your account to be blocked without warning.
