# Beds24 API V2 — Auth, Bookings & Related Schemas

> Extracted from `docs/beds-facts/apiV2.yaml` (lines 3095-3887, `components.schemas`).
> Each schema is reproduced in full: base type, required fields, every property (nested
> objects expanded with dot notation), descriptions, and example values.

---

## SuccessfulApiResponse

- **Base type:** `object`
- **Used in:** Responses only
- **Required fields:** `success`

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| success | boolean | **Yes** | Indicates the request succeeded. |
| type | string | No |  |
| count | integer | No |  |

**Used by:** GET /bookings response, GET /bookings/messages response, GET /bookings/invoices response, and many other GET endpoints as the success wrapper.

---

## UnsuccessfulApiResponse

- **Base type:** `object`
- **Used in:** Responses only
- **Required fields:** `success`, `type`, `code`, `error`

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| success | boolean | **Yes** | Always `false` on failure. Example: `false` |
| type | string | **Yes** | Example: `"error"` |
| code | integer | **Yes** | HTTP-style error code. Example: `400` |
| error | string | **Yes** | Human-readable error message. |

**Used by:** Error response for /authentication/setup, /authentication/token, /authentication/details, /bookings, /bookings/messages, /bookings/invoices, and most other endpoints.

---

## pages

- **Base type:** `object`
- **Used in:** Responses only (pagination envelope)
- **Required fields:** `nextPageExists`

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| nextPageExists | boolean | **Yes** | Whether another page of results is available. |
| nextPageLink | string | No | URL to fetch the next page. Example: `example.com/api/example?page=2` |

**Used by:** Paginated GET /bookings response (and other paginated endpoints).

---

## token

- **Base type:** `object`
- **Used in:** Responses only
- **Required fields:** none

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| token | string | No | The authentication token. |
| expiresIn | integer | No | Token lifetime in seconds. Example: `3600` |

**Used by:** GET /authentication/token response.

---

## refreshToken

- **Base type:** `object`
- **Used in:** Responses only
- **Required fields:** none

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| token | string | No | The refresh token. |
| expiresIn | integer | No | Token lifetime in seconds. Example: `3600` |
| refreshToken | string | No | A refresh token used to obtain a new token. |

**Used by:** GET /authentication/setup response.

---

## tokenDetails

- **Base type:** `object`
- **Used in:** Responses only
- **Required fields:** none

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| validToken | boolean | No | Whether the token is currently valid. |
| token | object | No | Nested token metadata object (see `token.*` below). |
| token.ownerId | integer (int32) | No | ID of the token owner. |
| token.expiresIn | integer (int32) | No | Seconds until the token expires. |
| token.created | string (date-time) | No | When the token was created. |
| token.scopes | array of string | No | Scopes granted to the token. Example: `"read:bookings"` |
| token.deviceName | string | No | Name of the device the token was issued to. |
| token.linkedProperties | boolean | No | Whether the token is linked to specific properties. |
| token.onlyPropertyId | integer (nullable) | No | If null the token can access all properties. If an ID is specified the token can only access that property. |
| token.whiteListOnly | boolean | No | Whether access is restricted to a whitelist. |
| token.whiteList | array of string | No | Whitelisted IP addresses. Example: `"192.168.0.1"` |
| diagnostics | object | No | Nested diagnostics object (see `diagnostics.*` below). |
| diagnostics.requestIp | string | No | IP address the request originated from. Example: `"192.168.0.1"` |

**Used by:** GET /authentication/details response.

---

## multiplePostResponse

- **Base type:** `object`
- **Used in:** Responses only
- **Required fields:** none

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| success | boolean | No | Whether the bulk operation succeeded. |
| new | object | No | Nested object describing newly created items (see `new.*` below). |
| new.field | string | No |  |
| new.subField | array of object | No |  |
| new.subField[].field | string | No |  |
| modified | object | No | Nested object describing modified items (see `modified.*` below). |
| modified.field | string | No |  |
| modified.subField | array of object | No |  |
| modified.subField[].field | string | No |  |
| errors | array of object | No | Items that produced errors (see `errors[].*` below). |
| errors[].action | string | No |  |
| errors[].field | string | No |  |
| errors[].message | string | No |  |
| warnings | array of object | No | Items that produced warnings (see `warnings[].*` below). |
| warnings[].action | string | No |  |
| warnings[].field | string | No |  |
| warnings[].message | string | No |  |
| info | array of object | No | Informational items (see `info[].*` below). |
| info[].action | string | No |  |
| info[].field | string | No |  |
| info[].message | string | No |  |

**Used by:** Bulk POST endpoints (e.g. multi-booking operations returning per-item status).

---

## booking

- **Base type:** `object` (composed via `allOf`)
- **Required fields:** Inherits `roomId`, `arrival`, `departure` from `newBooking` (see below).
- **Used in:** Responses and requests (full booking record)
- **Composition:** Three `allOf` fragments — (1) core identity fields, (2) `$ref: newBooking`, (3) status/management fields.

### Fragment 1 — Core identity

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| id | integer | No | Booking ID. |
| propertyId | integer | No | ID of the property. |
| apiSourceId | integer | No | ID of the API source. |
| apiSource | string | No | Name of the source platform. Example: `"Airbnb.com"` |
| channel | string (enum) | No | Booking origin channel. One of: `agoda`, `airbnb`, `airbnbical`, `atraveode`, `bedandbreakfasteu`, `bedandbreakfastnl`, `bookeasycomau`, `booking`, `bookitconz`, `despegar`, `edreamsodigeo`, `expedia`, `feratel`, `flipkey`, `goibibo`, `googlecal`, `googleads`, `guestlinkcouk`, `holidaylettingscouk`, `hometogo`, `hostelinternational`, `hostelsclub`, `hostelworld`, `hotelbeds`, `housetripcom`, `hrs`, `icalimport1`, `icalimport2`, `icalimport3`, `jomres`, `lastminute`, `marriott`, `nzaa`, `ostrovokru`, `ota`, `reserva`, `rezintelnet`, `tablethotels`, `tiket`, `tomastravel`, `traumferienwohnungen`, `traveloka`, `travia`, `trip`, `tripadvisorrentals`, `trivagocom`, `vacationstay`, `visitscotlandcom`, `vrbo`, `vrboical`, `webroomsconz` |
| bookingGroup | object (nullable) | No | Booking group linkage (see `bookingGroup.*` below). |
| bookingGroup.master | integer | No | Master booking ID for the group. |
| bookingGroup.ids | array of integer | No | IDs of bookings in the group. |

### Fragment 2 — `newBooking` (inlined — see [newBooking](#newbooking) for full field list)

All `newBooking` fields are merged into `booking`: `masterId`, `roomId` **(req)**, `unitId`, `roomQty`, `status`, `arrival` **(req)**, `departure` **(req)**, `numAdult`, `numChild`, `title`, `firstName`, `lastName`, `email`, `phone`, `mobile`, `fax`, `company`, `address`, `city`, `state`, `postcode`, `country`, `country2`, `arrivalTime`, `voucher`, `comments`, `notes`, `message`, `groupNote`, `custom1`–`custom10`, `flagColor`, `flagText`, `lang`, `price`, `deposit`, `tax`, `commission`, `refererEditable`, `rateDescription`, `invoiceeId`, `stripeToken`, `pcibookingToken`, `apiMessage`, `invoiceItems` (invoiceItemPost), `infoItems`.

### Fragment 3 — Status & management fields

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| subStatus | string (enum) | No | Booking sub-status. One of: `actionRequired`, `allotment`, `cancelledByGuest`, `cancelledByHost`, `noShow`, `waitlist`, `walkin`, `none`, `nonPayment` |
| statusCode | integer | No | Numeric status code. |
| offerId | integer | No | Associated offer ID. |
| referer | string | No |  |
| reference | string | No | Max length: 100. |
| apiReference | string | No | Max length: 100. |
| allowChannelUpdate | string (enum) | No | One of: `none`, `all`, `allExceptRoomChange` |
| allowAutoAction | string (enum) | No | One of: `disable`, `enable` |
| allowReview | string (enum) | No | One of: `default`, `disable`, `enable` |
| allowCancellation | object | No | Cancellation policy (see `allowCancellation.*` below). |
| allowCancellation.type | string (enum) | No | One of: `"propertyDefault"`, `"never"`, `"always"`, `"daysBeforeArrival"` |
| allowCancellation.daysBeforeArrivalValue | integer (nullable) | No | Used to specify the number of days if type is set to `daysBeforeArrival`. |
| bookingTime | string (date-time) | No | When the booking was made. |
| modifiedTime | string (date-time) | No | When the booking was last modified. |
| cancelTime | string (date-time, nullable) | No | When the booking was cancelled, if applicable. |
| invoiceItems | array of object | No | Invoice line items (see `invoiceItems[].*` below). |
| invoiceItems[].invoiceId | integer (nullable) | No |  |
| invoiceItems[].subType | integer | No | Legacy subtype. Known values: 0 generic, 1 room price, 2 obligatory, 3 obligatory % tax, 4 optional upsell, 5 voucher, 6 added manually, 7 added by api, 8 channel manager gross, 9 channel manager net, 10 channel manager tax, 11 channel manager extra, 12 obligatory %, 14 refundable, 15 obligatory clean, 16 obligatory tax, 17 refundprotect fee, 18 poster, 20 auto action, 101 channel manager total price (charge), 200 payment, 201 paypal, 202 channel collect payment, 203 stripe, 204 added by api, 205 asia pay, 206 virtual card, 208 manual prepayment, 210 auto action, 212 poster payment, 213 refund. Note: the value may be an unknown integer not listed here. |
| infoItems | array of object | No | Information items (see `infoItems[].*` below). |
| infoItems[].id | integer | No |  |
| infoItems[].createTime | string (date-time) | No |  |

**Used by:** GET /bookings response (each booking), POST /bookings request/response.

---

## newBooking

- **Base type:** `object`
- **Used in:** Requests and responses (booking creation payload; also composed into `booking`)
- **Required fields:** `roomId`, `arrival`, `departure`

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| masterId | integer | No | The ID of the booking group's master booking. If set to null then the booking is not in a group. Can be changed to add/remove the booking to a group. Example: `1234567` |
| roomId | integer | **Yes** | ID of the room. |
| unitId | integer | No | ID of the unit. |
| roomQty | integer | No | Number of rooms. |
| status | string (enum) | No | One of: `confirmed`, `request`, `new`, `cancelled`, `black`, `inquiry` |
| arrival | string (date) | **Yes** | Check-in date. Example: `"2021-01-01"` |
| departure | string (date) | **Yes** | Check-out date. Example: `"2021-01-05"` |
| numAdult | integer | No | Number of adults. Min: 0, Max: 99. |
| numChild | integer | No | Number of children. Min: 0, Max: 99. |
| title | string | No | Guest title. Max length: 100. |
| firstName | string | No | Guest first name. Max length: 100. |
| lastName | string | No | Guest last name. Max length: 100. |
| email | string (email) | No | Guest email. Max length: 100. |
| phone | string | No | Guest phone. Max length: 100. |
| mobile | string | No | Guest mobile. Max length: 100. |
| fax | string | No | Guest fax. Max length: 100. |
| company | string | No | Company name. Max length: 100. |
| address | string | No | Street address. Max length: 250. |
| city | string | No | City. Max length: 100. |
| state | string | No | State/region. Max length: 100. |
| postcode | string | No | Postal code. Max length: 100. |
| country | string | No | Free text country field. Max length: 100. Example: `"Germany"` |
| country2 | string (nullable) | No | 2 letter country selector. Max length: 300. Example: `"DE"` |
| arrivalTime | string | No | Estimated arrival time. Max length: 100. |
| voucher | string | No | Voucher code. Max length: 100. |
| comments | string | No | Guest comments. Max length: 1000. |
| notes | string | No | Internal notes. Max length: 2000. |
| message | string | No | Message. Max length: 1000. |
| groupNote | string (nullable) | No | Note for the booking group. Max length: 5000. |
| custom1 | string | No | Custom field 1. Max length: 1000. |
| custom2 | string | No | Custom field 2. Max length: 1000. |
| custom3 | string | No | Custom field 3. Max length: 1000. |
| custom4 | string | No | Custom field 4. Max length: 1000. |
| custom5 | string | No | Custom field 5. Max length: 1000. |
| custom6 | string | No | Custom field 6. Max length: 1000. |
| custom7 | string | No | Custom field 7. Max length: 1000. |
| custom8 | string | No | Custom field 8. Max length: 1000. |
| custom9 | string | No | Custom field 9. Max length: 1000. |
| custom10 | string | No | Custom field 10. Max length: 1000. |
| flagColor | string | No | Must be a 6 character hexadecimal color or an empty string. Min length: 0, Max length: 6. |
| flagText | string | No | Flag label text. Max length: 32. |
| lang | string | No | 2-letter language code. Min length: 2, Max length: 2. Example: `"en"` |
| price | number | No | Total price. Min: 0, Max: 99999999.99. |
| deposit | number | No | Deposit amount. Min: 0, Max: 99999999.99. |
| tax | number | No | Tax amount. Min: 0, Max: 99999999.99. |
| commission | number | No | Commission amount. Min: 0, Max: 99999999.99. |
| refererEditable | string | No |  |
| rateDescription | string | No | Description of the rate. Max length: 1000. |
| invoiceeId | integer (nullable) | No | ID of the invoicee. Example: `1234567` |
| stripeToken | string (nullable) | No | Stripe payment token. |
| pcibookingToken | string (nullable) | No | PCI-compliant booking token. |
| apiMessage | string | No | Message to send via the API. |
| invoiceItems | array of invoiceItemPost ($ref) | No | Invoice line items to create. References [invoiceItemPost](#invoiceitempost). |
| infoItems | array of object | No | Information items (see `infoItems[].*` below). |
| infoItems[].code | string | No |  |
| infoItems[].text | string | No |  |
| infoItems[].bookingId | integer | No |  |

**Used by:** POST /bookings request body; composed into [booking](#booking) via `allOf`.

---

## bookingGuests

- **Base type:** `object`
- **Used in:** Requests only (guest details for a new booking)
- **Required fields:** `roomId`, `arrival`, `departure`

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| roomId | integer | **Yes** | ID of the room. |
| arrival | string (date) | **Yes** | Check-in date. |
| departure | string (date) | **Yes** | Check-out date. |
| guests | array of object | No | Coming soon - Requires the `bookings-personal` scope. (see `guests[].*` below). |
| guests[].id | integer | No |  |
| guests[].title | string | No |  |
| guests[].firstName | string | No |  |
| guests[].lastName | string | No |  |
| guests[].email | string | No |  |
| guests[].phone | string | No |  |
| guests[].mobile | string | No |  |
| guests[].company | string | No |  |
| guests[].address | string | No |  |
| guests[].city | string | No |  |
| guests[].state | string | No |  |
| guests[].postcode | string | No |  |
| guests[].country | string | No |  |
| guests[].country2 | string | No |  |
| guests[].flagText | string | No |  |
| guests[].flagColor | string | No |  |
| guests[].note | string | No |  |
| guests[].custom1 | string | No |  |
| guests[].custom2 | string | No |  |
| guests[].custom3 | string | No |  |
| guests[].custom4 | string | No |  |
| guests[].custom5 | string | No |  |
| guests[].custom6 | string | No |  |
| guests[].custom7 | string | No |  |
| guests[].custom8 | string | No |  |
| guests[].custom9 | string | No |  |
| guests[].custom10 | string | No |  |

**Used by:** POST /bookings request (guest personal-details block, alongside `bookingActions`).

---

## bookingActions

- **Base type:** `object`
- **Used in:** Requests only (side-effects applied when creating/updating a booking)
- **Required fields:** none

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| actions | object | No | Container for action flags (see `actions.*` below). |
| actions.notifyGuest | boolean | No | Any bookings - Send guest an email booking confirmation. |
| actions.notifyHost | boolean | No | New bookings only - Send host an email booking confirmation. |
| actions.assignBooking | boolean | No | New bookings only - Use room dependency settings to assign booking to a different room type or the first free unit within the room type. |
| actions.checkAvailability | boolean | No | New bookings only - Do not save the booking if room has no availability. |
| actions.makeGroup | (unspecified) | No | New bookings only - Puts all bookings with this action set to true into a group booking. |
| actions.assignInvoiceNumber | boolean | No | Existing bookings only - Assign invoice number to the booking without specifying an invoicee. |
| actions.assignInvoiceNumberInvoicee | integer | No | Existing bookings only - Assign invoice number to the booking with a specific invoicee. |
| actions.autoInvoiceItemCharge | boolean | No | New bookings only - If a price is provided, but no invoice charges, this option will create a charge using the price value and the default description. |
| actions.deleteInvoice | boolean | No | Existing bookings only - Delete all existing invoice items. (locked invoices cannot be deleted) |
| actions.allowWebhooks | boolean | No | Any bookings - Allow the booking to trigger webhooks if a change to the booking is made which affects availability. Changes to the status, arrival, departure, roomId, unitId or roomQty will trigger a webhook if this action is set, but a change to e.g. the lastname field will not trigger a webhook. |

**Used by:** POST /bookings request (new bookings), and existing-bookings update endpoints.

---

## offerResponse

- **Base type:** `object`
- **Used in:** Responses only
- **Required fields:** none

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| offerId | integer | No | ID of the offer. |
| offerName | string | No | Name of the offer. |
| price | number | No | Price of the offer. |
| unitsAvailable | integer | No | Number of units available. |

**Used by:** GET /bookings/offers response (offer lookup based on criteria).

---

## invoiceItemPost

- **Base type:** `object`
- **Used in:** Requests and responses (invoice item creation payload; also composed into `invoiceItem`)
- **Required fields:** none

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| id | integer | No | Invoice item ID. |
| type | string (enum) | No | One of: `charge`, `payment` |
| bookingId | integer | No | ID of the booking this item belongs to. |
| invoiceeId | integer (nullable) | No | ID of the invoicee. Example: `1234567` |
| description | string | No | Line item description. Max length: 250. |
| status | string | No | Item status. Max length: 50. |
| qty | integer | No | Quantity. Can be negative. |
| amount | number | No | Item amount. |
| vatRate | number | No | VAT rate. Min: 0, Max: 99.9. |
| createdBy | integer | No | ID of the creator. |

**Used by:** POST /bookings request (`newBooking.invoiceItems`); composed into [invoiceItem](#invoiceitem).

---

## invoiceItem

- **Base type:** `object` (composed via `allOf`)
- **Used in:** Responses only (full invoice line item)
- **Required fields:** Inherits none explicitly.
- **Composition:** `allOf` — (1) `$ref: invoiceItemPost`, (2) additional read-only fields.

### Fragment 1 — `invoiceItemPost` (inlined — see [invoiceItemPost](#invoiceitempost) for full field list)

All `invoiceItemPost` fields are merged into `invoiceItem`: `id`, `type` (enum: `charge`, `payment`), `bookingId`, `invoiceeId`, `description`, `status`, `qty`, `amount`, `vatRate`, `createdBy`.

### Fragment 2 — Additional fields

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| lineTotal | number | No | Computed total for the line. |
| createTime | string (date-time) | No | When the item was created. |

**Used by:** GET /bookings/invoices response (`invoice.invoiceItems[]`).

---

## invoice

- **Base type:** `object`
- **Used in:** Responses only
- **Required fields:** none

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| invoiceId | integer | No | ID of the invoice. |
| invoiceDate | string (date, nullable) | No | Date of the invoice. |
| invoiceItems | array of invoiceItem ($ref) | No | Line items on the invoice. References [invoiceItem](#invoiceitem). |

**Used by:** GET /bookings/invoices response.

---

## message

- **Base type:** `object` (composed via `allOf`)
- **Description:** There are 4 kinds of messages: Messages from the guest to the host `source: guest`, messages from the host to the guest `source: host`, messages from a us, the API or a third party OTA to the host `source: system`, and internal notes from the host `source: internalNotes`.
- **Used in:** Responses only
- **Required fields:** none
- **Composition:** `allOf` — (1) `$ref: hostMessage`, (2) additional context fields.

### Fragment 1 — `hostMessage` (inlined — see [hostMessage](#hostmessage) for full field list)

All `hostMessage` fields are merged into `message`: `id`, `bookingId`, `read`, `message`, `attachment`, `attachmentName`, `attachmentMimeType`, `source`.

### Fragment 2 — Additional context fields

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| roomId | integer | No | The ID of the room that the message's booking is currently in. |
| propertyId | integer | No | The ID of the property that the message's booking is currently in. |
| time | string (date-time) | No | Timestamp of the message. |
| authorOwnerId | integer | No | The ID of the owner who sent a host message or internalNote. |

**Used by:** GET /bookings/messages response, POST /bookings/messages response.

---

## hostMessage

- **Base type:** `object`
- **Used in:** Requests and responses (message payload; also composed into `message`)
- **Required fields:** none

| Field | Type | Required | Description / Example |
|-------|------|----------|------------------------|
| id | integer | No | Message ID. |
| bookingId | integer | No | ID of the booking the message belongs to. |
| read | boolean (nullable) | No | Whether the message has been read. |
| message | string | No | Message body text. |
| attachment | string (byte, nullable) | No | Base64-encoded attachment content. |
| attachmentName | string (nullable) | No | Attachment file name. |
| attachmentMimeType | string (nullable, enum) | No | Attachment MIME type. Supported by channel: Airbnb - jpeg, png and gif; Booking.com - jpeg, png; VRBO - jpeg, png, gif, pdf. One of: `"image/jpeg"`, `"image/png"`, `"image/gif"`, `"application/pdf"` |
| source | string (enum) | No | Message origin. One of: `host`, `guest`, `internalNote`, `system` |

**Used by:** POST /bookings/messages request (send/mark-read); composed into [message](#message).
