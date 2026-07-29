# Account

Account-related JSON methods: `getAccount` (read account data), `setAccount` (modify a sub-account), and `createAccount` (create a new sub-account). All three use JSON POST with an `authentication` object. [extracted 2026-07-28] `[api → json/getAccount](https://www.beds24.com/api/json/getAccount)` [extracted 2026-07-28] `[api → json/setAccount](https://www.beds24.com/api/json/setAccount)` [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`

## Authentication (All Methods)

An `authentication` object is required in every request. [extracted 2026-07-28] `[api → json/getAccount](https://www.beds24.com/api/json/getAccount)` [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`

- `apiKey` — the API key as set in Account Settings (menu SETTINGS >> ACCOUNT >> ACCOUNT ACCESS). Length must be between 16 and 64 characters. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
- Anyone who has access to the `apiKey` can view or potentially make changes in the account. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`

---

## getAccount

Post JSON to `getAccount` to retrieve information about an account, including usage and charging information. [extracted 2026-07-28] `[api → json/getAccount](https://www.beds24.com/api/json/getAccount)`

### Returns

- Account information [extracted 2026-07-28] `[api → json/getAccount](https://www.beds24.com/api/json/getAccount)`
- Usage data [extracted 2026-07-28] `[api → json/getAccount](https://www.beds24.com/api/json/getAccount)`
- Charging information [extracted 2026-07-28] `[api → json/getAccount](https://www.beds24.com/api/json/getAccount)`

### Constraints & Notes

- The source does not document the full response schema, specific field names, roles, features, or status codes beyond the three return categories above. [extracted 2026-07-28] `[api → json/getAccount](https://www.beds24.com/api/json/getAccount)`
- The `setAccount` documentation references `getAccount` as the authority for understanding account data fields. [extracted 2026-07-28] `[api → json/setAccount](https://www.beds24.com/api/json/setAccount)`

---

## setAccount

Post JSON to `setAccount` to modify an account. Only include the fields you are changing; full payloads are not required. [extracted 2026-07-28] `[api → json/setAccount](https://www.beds24.com/api/json/setAccount)`

### Top-Level Wrapper

Account changes live under a `"setAccount"` object. [extracted 2026-07-28] `[api → json/setAccount](https://www.beds24.com/api/json/setAccount)`

### Top-Level Parameters

- `action` — operation type; example value is `"modify"` [extracted 2026-07-28] `[api → json/setAccount](https://www.beds24.com/api/json/setAccount)`
- `subaccounts` — object keyed by sub-account identifiers (e.g., `"1234"`) [extracted 2026-07-28] `[api → json/setAccount](https://www.beds24.com/api/json/setAccount)`

### Parameters per Sub-Account Entry

Each entry in `subaccounts` supports:

- `action` — operation on this sub-account; example value is `"modify"` [extracted 2026-07-28] `[api → json/setAccount](https://www.beds24.com/api/json/setAccount)`
- `enabled` — toggle state; example value is `1` [extracted 2026-07-28] `[api → json/setAccount](https://www.beds24.com/api/json/setAccount)`
- `role` — permission level; example value is `0` [extracted 2026-07-28] `[api → json/setAccount](https://www.beds24.com/api/json/setAccount)`
- `notes` — internal/private note [extracted 2026-07-28] `[api → json/setAccount](https://www.beds24.com/api/json/setAccount)`
- `message` — text shown to the sub-account [extracted 2026-07-28] `[api → json/setAccount](https://www.beds24.com/api/json/setAccount)`

### Constraints & Notes

- Not every field is modifiable. [extracted 2026-07-28] `[api → json/setAccount](https://www.beds24.com/api/json/setAccount)`
- The JSON structure mirrors what the `getAccount` endpoint returns. [extracted 2026-07-28] `[api → json/setAccount](https://www.beds24.com/api/json/setAccount)`
- The source does not document the full set of modifiable fields beyond the example; consult `getAccount` output for the authoritative field list. [extracted 2026-07-28] `[api → json/setAccount](https://www.beds24.com/api/json/setAccount)`

---

## createAccount

Post JSON to `createAccount` to create a new sub-account within an existing account. The `createAccount` parameter accepts an array, so multiple sub-accounts can be created in a single request. [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`

### Parameters per New Account

Each object in the `createAccount` array supports:

- `username` — the username for the new account [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`
- `password` — the password for the new account [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`
- `apiKey` — a key specifically designated for the new account [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`
- `email` — email address for the new account [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`
- `role` — numeric value mapped to an account role (see Role Values table) [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`
- `systemEmails` — controls which address receives system notifications (see System Emails table) [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`
- `bookingEmails` — controls which address receives booking notifications (see Booking Emails table) [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`
- `bookingReplyto` — sets the reply-to address used on booking emails (see Booking Reply-To table) [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`

### Role Values

| Value | Role |
|-------|------|
| 0 | Admin |
| 1 | Read Only |
| 2 | Cleaner |
| 3 | Front Desk |
| 4 | Back Office |
| 5 | Sub Master |
| 6 | Channel Manager |
| 7 | No Cards |
| 8 | Cleaner Manager |

[extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`

### System Emails Values

Controls which email address receives system notifications. [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`

| Value | Description |
|-------|-------------|
| 0 | Administrator Email |
| 1 | Administrator Email and Cc: Property |
| 2 | Property Email |
| 3 | Master Account Email |
| 4 | Administrator Email and Cc: Master |

[extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`

### Booking Emails Values

Controls which email address receives booking notifications. [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`

| Value | Description |
|-------|-------------|
| 0 | Administrator Email |
| 1 | Administrator Email and Cc: Property |
| 2 | Property Email |
| 3 | Master Account Email |
| 4 | Administrator Email and Cc: Master |

[extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`

### Booking Reply-To Values

Sets the reply-to address used on booking emails. [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`

| Value | Description |
|-------|-------------|
| 0 | Guest Email |
| 1 | Property Email |
| 2 | Administrator Email *(source spells this "Adminitrator Email")* |
| 3 | Master Account Email |

[extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`

### Constraints & Notes

- The `createAccount` parameter is an array, so multiple sub-accounts can be created in one request. [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`
- The source uses numeric strings (e.g., `"0"`) for enumerated fields in its example payload. [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`
- The source does not document which fields are required vs. optional. [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`
- The source does not document the response structure, error handling, or status codes for this method. [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`
- The source contains a typo for `bookingReplyto` value 2: "Adminitrator Email". [extracted 2026-07-28] `[api → json/createAccount](https://www.beds24.com/api/json/createAccount)`
