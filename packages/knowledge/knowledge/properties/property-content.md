# Property Content API Methods

Documentation of the Beds24 JSON API methods for reading and writing property content (descriptions, policies, room text, and images references). [extracted 2026-07-28]

---

## getPropertyContent

Retrieve property content information (descriptions, policies, room text, image references). [extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)`

- **Endpoint:** `https://api.beds24.com/json/getPropertyContent` [extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)`
- **HTTP method:** POST (JSON body) [extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)`
- The parameters `texts`, `roomIds`, and `images` specify the type of data to return. [extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)`

### Authentication

An `authentication` object is required. [extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `apiKey` | string | Yes | API key configured in account settings [extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)` |
| `propKey` | string | Yes | Property key assigned to the specific property [extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)` |

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `authentication` | object | Yes | Contains `apiKey` and `propKey` [extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)` |
| `texts` | array of strings | No | Language codes for text content (e.g. `"EN"`, `"DE"`, `"FR"`) [extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)` |
| `roomIds` | array of numbers | No | Numeric room identifiers (e.g. `123456`) [extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)` |
| `images` | boolean | No | Flag to include image data [extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)` |
| `bookingData` | boolean | No | Flag to include booking data [extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)` |
| `includeAirbnb` | boolean | No | Flag to include Airbnb-related data [extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)` |
| `includeVrbo` | boolean | No | Flag to include Vrbo-related data [extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)` |

### Example Requests

**Single language texts:**
```json
{
    "authentication": {
        "apiKey": "apiKeyAsSetInAccountSettings",
        "propKey": "propKeyAsSetForTheProperty"
    },
    "texts": ["EN"]
}
```
[extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)`

**Multiple languages:**
```json
{
    "authentication": {
        "apiKey": "apiKeyAsSetInAccountSettings",
        "propKey": "propKeyAsSetForTheProperty"
    },
    "texts": ["EN", "DE", "FR"]
}
```
[extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)`

**Single room ID:**
```json
{
    "authentication": {
        "apiKey": "apiKeyAsSetInAccountSettings",
        "propKey": "propKeyAsSetForTheProperty"
    },
    "roomIds": [123456]
}
```
[extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)`

**Multiple room IDs:**
```json
{
    "authentication": {
        "apiKey": "apiKeyAsSetInAccountSettings",
        "propKey": "propKeyAsSetForTheProperty"
    },
    "roomIds": [123456, 123457, 123458]
}
```
[extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)`

**Images only:**
```json
{
    "authentication": {
        "apiKey": "apiKeyAsSetInAccountSettings",
        "propKey": "propKeyAsSetForTheProperty"
    },
    "images": true
}
```
[extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)`

**All data:**
```json
{
    "authentication": {
        "apiKey": "apiKeyAsSetInAccountSettings",
        "propKey": "propKeyAsSetForTheProperty"
    },
    "bookingData": true,
    "images": true,
    "roomIds": true,
    "texts": true,
    "includeAirbnb": true,
    "includeVrbo": true
}
```
[extracted 2026-07-28] `[api → json/getPropertyContent](https://www.beds24.com/api/json/getPropertyContent)`

---

## setPropertyContent

Modify property content (descriptions, policies, room text). [extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)`

- **Endpoint:** `https://api.beds24.com/json/setPropertyContent` [extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)`
- **HTTP method:** POST (JSON body) [extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)`
- The data field structure mirrors what is returned by `getPropertyContent`. [extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)`

### Authentication

An `authentication` object is required. [extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `apiKey` | string | Yes | API key configured in account settings [extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)` |
| `propKey` | string | Yes | Property key set for the property [extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)` |

### Request Structure

The request body contains a `setPropertyContent` array; each item is a modification object. [extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)`

### setPropertyContent Array Item Fields [extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | Yes | Must be `"modify"` to allow any changes [extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)` |
| `texts` | object | No | Contains locale-keyed text fields (e.g. `propertyDescription1`) at the property level [extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)` |
| `roomIds` | object | No | Keyed by room ID, each containing room-specific modifications [extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)` |

### Editable Content Fields

- **Property-level text fields** use a naming convention such as `propertyDescription1`, with locale keys (e.g. `"EN"`) mapping to new string values. [extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)`
- **Room-level text fields** (under `roomIds`) can contain a `texts` field with editable properties such as `displayName`, again using locale keys (e.g. `"EN"`) for translated values. [extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)`

### Key Rules

- **Partial updates allowed:** It is not necessary to include all data fields. Only include the fields that are being changed. [extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)`
- **Action required:** Changes only take effect when `action` is set to `"modify"`. [extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)`

### Example Requests

**Modify property content:**
```json
{
    "authentication": {
        "apiKey": "apiKeyAsSetInAccountSettings",
        "propKey": "propKeyAsSetForTheProperty"
    },
    "setPropertyContent": [
        {
            "action": "modify",
            "texts": {
                "propertyDescription1": {
                    "EN": "the new property description"
                }
            }
        }
    ]
}
```
[extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)`

**Modify room content:**
```json
{
    "authentication": {
        "apiKey": "apiKeyAsSetInAccountSettings",
        "propKey": "propKeyAsSetForTheProperty"
    },
    "setPropertyContent": [
        {
            "action": "modify",
            "roomIds": {
                "123456": {
                    "texts": {
                        "displayName": {
                            "EN": "the new room name"
                        }
                    }
                }
            }
        }
    ]
}
```
[extracted 2026-07-28] `[api → json/setPropertyContent](https://www.beds24.com/api/json/setPropertyContent)`

---

## getDescriptions

Return descriptive information for a room or property; this information can be used to construct a booking application. [extracted 2026-07-28] `[api → json/getDescriptions](https://www.beds24.com/api/json/getDescriptions)`

- **Endpoint:** `https://api.beds24.com/json/getDescriptions` [extracted 2026-07-28] `[api → json/getDescriptions](https://www.beds24.com/api/json/getDescriptions)`
- **HTTP method:** POST (JSON body) [extracted 2026-07-28] `[api → json/getDescriptions](https://www.beds24.com/api/json/getDescriptions)`
- **Status:** BETA function, subject to change. [extracted 2026-07-28] `[api → json/getDescriptions](https://www.beds24.com/api/json/getDescriptions)`

### Access Requirements

- **IP whitelisting required:** Contact support to have your IP address whitelisted before using this function. [extracted 2026-07-28] `[api → json/getDescriptions](https://www.beds24.com/api/json/getDescriptions)`
- **No API key required:** `apiKey` and `propKey` are explicitly NOT required to authenticate access to this function. [extracted 2026-07-28] `[api → json/getDescriptions](https://www.beds24.com/api/json/getDescriptions)`

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `propId` | string | Conditional | Identifier for the property. At least one of `propId` or `roomId` must be provided. [extracted 2026-07-28] `[api → json/getDescriptions](https://www.beds24.com/api/json/getDescriptions)` |
| `roomId` | string or boolean | Conditional | Identifier for a room; set to `true` to return all rooms. At least one of `propId` or `roomId` must be provided. [extracted 2026-07-28] `[api → json/getDescriptions](https://www.beds24.com/api/json/getDescriptions)` |
| `lang` | string | No | Language for returned descriptions. If omitted, the default booking language is assumed. [extracted 2026-07-28] `[api → json/getDescriptions](https://www.beds24.com/api/json/getDescriptions)` |

### Parameter Combination Behavior [extracted 2026-07-28] `[api → json/getDescriptions](https://www.beds24.com/api/json/getDescriptions)`

| Combination | Result |
|-------------|--------|
| `propId` only | Property information only will be returned |
| `roomId` only | Room information only will be returned |
| Both `propId` and `roomId` | Property and room information only will be returned |
| `propId` + `roomId: true` | Property and information for all rooms will be returned |

### Example Requests

**Return descriptions for the specified propId:**
```json
{
    "propId": "3103"
}
```
[extracted 2026-07-28] `[api → json/getDescriptions](https://www.beds24.com/api/json/getDescriptions)`

**Return descriptions for the specified propId and all its rooms in German:**
```json
{
    "propId": "3103",
    "roomId": true,
    "lang": "de"
}
```
[extracted 2026-07-28] `[api → json/getDescriptions](https://www.beds24.com/api/json/getDescriptions)`

**Return descriptions for the specified roomId in English:**
```json
{
    "roomId": "6027",
    "lang": "en"
}
```
[extracted 2026-07-28] `[api → json/getDescriptions](https://www.beds24.com/api/json/getDescriptions)`
