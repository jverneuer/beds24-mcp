# getBookings

Retrieves bookings from a property via JSON POST. All filter parameters are optional; returned bookings match every specified filter. [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`

## Endpoint

`https://api.beds24.com/json/getBookings` [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`

## Authentication (Required)

An `authentication` object is required in every request. [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`

- `apiKey` — the API key as set in account settings [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
- `propKey` — the property key set for the property [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`

## Filter Parameters (All Optional)

Returned bookings match **every** specified optional parameter (AND semantics). [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`

- `roomId` — limits results to a specific room [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
- `bookId` — limits results to a specific booking [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
- `masterId` — limits results by master booking ID [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
- `arrivalFrom` — arrival date lower bound; defaults to yesterday when omitted [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
- `arrivalTo` — arrival date upper bound; defaults to one year from the current day when omitted [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
- `departureFrom` — departure date lower bound [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
- `departureTo` — departure date upper bound [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
- `modifiedSince` — filters by last modification date/time [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
- `searchText` — matches text found in any booking field, e.g. email or guest name [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
- `status` — filters by booking status value (see Status Values table) [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`

## Default Date Window

When no date range is specified, the window spans from yesterday to one year ahead. [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`

## Pagination

- `limit` — caps the number of returned bookings. The maximum number of bookings that can be returned is 1000. [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
- `offset` — skips a number of results for paging [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`

## Include Flags (Boolean)

Each include flag is **only available if the number of bookings returned is less than 100**. [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`

- `includeInvoice` — attaches the booking's invoice items [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
- `includeInfoItems` — attaches info items per booking [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
- `includeInfoItemsConverted` — shows the converted value of any template variables in the info item text [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
- `includeStripeCharges` — includes an object containing all charges stored in Stripe connected to this booking's Stripe customer. This option is restricted to a single booking requested via `bookId`. [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`

## Booking Status Values

| Value | Meaning |
|-------|---------|
| 0 | Cancelled |
| 1 | Confirmed |
| 2 | New (confirmed but unread) |
| 3 | Request |
| 4 | Black |
| 5 | Inquiry |

[extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`

## Booking Substatus Values

| Value | Meaning |
|-------|---------|
| 0 | (blank) |
| 1 | Action required |
| 2 | Allotment |
| 3 | Cancelled by guest |
| 4 | Cancelled by host |
| 5 | No show |
| 6 | Waitlist |
| 7 | Walkin |

[extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`

## Constraints & Notes

- All filter fields are optional except the `authentication` object. [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
- Credit card data is explicitly **not** exposed by this endpoint. [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
- The `includeStripeCharges` option requires using `bookId` to target a single booking. [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`

## Request Structure

A JSON POST body containing `authentication` plus any combination of the filters, pagination, and include flags described above. [extracted 2026-07-28] `[api → json/getBookings](https://www.beds24.com/api/json/getBookings)`
