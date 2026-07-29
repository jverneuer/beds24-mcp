# Hotel Availability & Pricing Lookup

This document covers the two Beds24 API methods used to look up room availability and pricing: the proprietary **JSON_HotelAvail** endpoint and the OTA-standard **OTA_HotelRes** endpoint.

---

## JSON_HotelAvail

### Description

Post JSON data to this endpoint to retrieve room price and availability for the OTA channel. [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail`

### HTTP Method & Endpoint

- **Method:** POST [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail`
- **Endpoint URL:** `https://api.beds24.com/ota/JSON_HotelAvail` [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail`

### Authentication

This function uses **API JSON V1** `apiKey` and `propKey` for authentication (the same as other JSON functions), **not** the OTA channel password. [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail`

### Request Format

JSON payload posted to the endpoint. [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail`

### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `authentication` | object | required | Contains authentication credentials [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail` |
| `authentication.apiKey` | string | required | apiKey for account [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail` |
| `authentication.propKey` | string | required | propKey for property [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail` |
| `roomId` | integer | required | room id for room [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail` |
| `from` | date (yyyymmdd) | optional | from date; default = today [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail` |
| `to` | date (yyyymmdd) | optional | to date; default = +30 days [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail` |

### Example Request

```json
{
    "authentication": {
        "apiKey": "apiKeyAsSetInAccountSettings",
        "propKey": "propKeyAsSetForTheProperty"
    },
    "roomId": 12345,
    "from": "20260729",
    "to": "20260827"
}
```
[extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail`

### Response Format

The response is an **array of date objects** for the OTA channel. [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail`

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `i` | int | **inventory** — number of units available for booking [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail` |
| `r` | object | **rates** — grouped into objects by their ratecodes [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail` |
| `p1` - `pN` | number | **prices for the specified occupancy** (e.g., `p2` = price for up to 2 people) [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail` |
| `m` | int | **minimum stay** [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail` |
| `mx` | int | **maximum stay** [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail` |
| `r` | int | **restriction type**: 0 = stay through, 1 = first night, 2 = gap filler [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail` |
| `c` | int | **closed**: 0 = rate open, 1 = rate closed [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail` |
| `ci` | int | **checkin allowed**: 0 = no, 1 = yes [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail` |
| `co` | int | **checkout allowed**: 0 = no, 1 = yes [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail` |

> Note: the response reuses the key `r` for both "rates" (object) and "restriction type" (int); the payload distinguishes them by context/type. [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail`

### References

- JSON API usage reference: `index.php` [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail`
- Documentation page: `index.html` [extracted 2026-07-28] `https://www.beds24.com/api/ota/JSON_HotelAvail`

---

## OTA_HotelAvail

### Description

This function implements the **OpenTravel Alliance (OTA)** industry standards for availability and pricing. Not all elements in the standard are supported. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`

### Schema Validation

The request validates against schema version **OTA2015A**. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`

### HTTP Method & Endpoint

- **Method:** POST [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`
- **Endpoint URL:** `https://api.beds24.com/ota/OTA_HotelAvail` [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`
- **Content-Type header:** `application/xml` [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`

### Authentication

Uses **HTTP Basic Auth**: [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`

- **Username:** property ID (`propid`) [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`
- **Password:** minimum 6 characters, configured in the **channel manager settings** for this channel [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`

### Request Format

The posted XML body must conform to the **`OTA_HotelAvailRQ`** structure. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`

### Request Parameters

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| `EchoToken` | XML attribute (root) | string | Yes | Unique token for the request (example uses `time()`) [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail` |
| `Version` | XML attribute (root) | string | Yes | Set to `"1.0"` [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail` |
| `Start` | `StayDateRange` attribute | date (YYYY-MM-DD) | Yes | Beginning of date range [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail` |
| `End` | `StayDateRange` attribute | date (YYYY-MM-DD) | Yes | End of date range [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail` |
| `RoomTypeCode` | `RoomStayCandidate` attribute | integer | Yes | The room identifier [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail` |

### Constraints

- Only a **single room** may be queried per request. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`
- The request must include a **date range**. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`

### Example Request

```xml
<OTA_HotelAvailRQ xmlns="http://www.opentravel.org/OTA/2003/05" EchoToken="" Version="1.0">
  <AvailRequestSegments>
    <AvailRequestSegment>
      <StayDateRange Start="" End="" />
      <RoomStayCandidates>
        <RoomStayCandidate RoomTypeCode="" />
      </RoomStayCandidates>
    </AvailRequestSegment>
  </AvailRequestSegments>
</OTA_HotelAvailRQ>
```
[extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`

### Response Format

The service replies with an **`OTA_HotelAvailRS`** XML message. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`

- **Response Content-Type:** `text/xml; charset=utf-8` [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`

### Reference Implementation

A working PHP/cURL reference implementation is provided, using: [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`

- `CURLOPT_USERPWD` for Basic Auth [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`
- `CURLOPT_POSTFIELDS` to transmit the XML body [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`

### Error Handling & Rate Limits

The documentation does not specify explicit error codes, error response schemas, or rate-limiting policies. [extracted 2026-07-28] `https://www.beds24.com/api/ota/OTA_HotelAvail`
