# Beds24 Deprecated XML API Methods

> **Deprecation status:** The Beds24 XML API functions are officially **deprecated**. The API index states: "Use the JSON functions for new designs. These XML functions are depreciated." [extracted 2026-07-28], source: https://www.beds24.com/api/

All eight XML methods are read/write pairs covering accounts, properties, inventories, and bookings. For each XML method below, the recommended JSON replacement is noted. **Use the JSON functions for all new development.** [extracted 2026-07-28], source: https://www.beds24.com/api/

---

## 1. getAccount (XML)

- **Purpose:** Returns an XML document containing information about the account. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getAccount
- **HTTP method:** POST (parameters can be sent as POST fields or posted as XML). [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getAccount
- **Request parameters:**
  - `username` — required. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getAccount
  - `password` — required; the account APIKEY can be used as the password. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getAccount
- **Request XML structure:**
  ```xml
  <request>
    <auth>
      <username>username</username>
      <password>password</password>
    </auth>
  </request>
  ```
  [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getAccount
- **Response format:** XML document. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getAccount
- **Authentication:** Username and password; the account APIKEY is accepted as a substitute for the password. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getAccount
- **JSON replacement:** **`getAccount` (JSON)** — "Post JSON data here to get information about an account including usage and charging information." Uses an `authentication` object containing `apiKey`. [extracted 2026-07-28], source: https://www.beds24.com/api/json/getAccount

---

## 2. putAccount (XML)

- **Purpose:** Accepts an XML document containing account information to save modifications. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putAccount
- **HTTP method:** POST (parameters can be sent as POST fields or as an XML document). [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putAccount
- **Request parameters:**
  - `username` — required. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putAccount
  - `password` — required; the account APIKEY is accepted as a substitute for the password. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putAccount
  - `account XML` — the XML document. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putAccount
- **Request XML structure:**
  ```xml
  <request>
    <auth>
      <username>username</username>
      <password>password</password>
    </auth>
    <account>XML content in the format returned by XML getAccount</account>
  </request>
  ```
  [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putAccount
- **Critical rule:** The `account` element must carry the action value `"modify"` for changes to be saved. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putAccount
- **Authentication:** Username and password; the account APIKEY is accepted as a substitute for the password. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putAccount
- **Related method:** The XML format expected is the one returned by `getAccount`. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putAccount
- **JSON replacement:** **`setAccount` (JSON)** — "Post JSON data here to modify an account." Uses an `authentication` object with `apiKey` and a `setAccount` object with `action` set to `"modify"`, containing `subaccounts` keyed by subaccount ID (each with `action`, `enabled`, `role`, `notes`, `message`). Only changed fields need be included; the structure mirrors what `getAccount` returns. [extracted 2026-07-28], source: https://www.beds24.com/api/json/setAccount

---

## 3. getProperties (XML)

- **Purpose:** Returns an XML document containing information about the properties available in the account. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getProperties
- **HTTP method:** POST (parameters can be sent as POST fields or posted as XML). [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getProperties
- **Request parameters:**
  - `username` — required. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getProperties
  - `password` — required; the account APIKEY can be used as the password. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getProperties
  - `propid` — optional; when supplied, returns data for only one property. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getProperties
- **Request XML structure:**
  ```xml
  <request>
    <auth>
      <username>username</username>
      <password>password</password>
    </auth>
    <propid></propid>
  </request>
  ```
  [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getProperties
- **Response format:** XML document. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getProperties
- **Authentication:** Username and password; the account APIKEY is accepted as a substitute for the password. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getProperties
- **JSON replacement:** **`getProperties` (JSON)** — "Post JSON data here to get information about the properties in an account." Uses an `authentication` object containing `apiKey`. [extracted 2026-07-28], source: https://www.beds24.com/api/json/getProperties

---

## 4. putProperties (XML)

- **Purpose:** Accepts an XML document with details about properties in the account. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putProperties
- **HTTP method:** POST (implied; parameters sent as POST fields or as an XML document). [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putProperties
- **Request parameters:**
  - `username` — required. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putProperties
  - `password` — required; the account APIKEY can be used as the password. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putProperties
  - `properties XML` — the XML document. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putProperties
- **Request XML structure:**
  ```xml
  <request>
    <auth>
      <username>username</username>
      <password>password</password>
    </auth>
    <properties>
      XML content for 1 or more property in the format returned by XML getProperties
    </properties>
  </request>
  ```
  [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putProperties
- **Key rules:**
  - Each room and property element must include an `action` attribute set to one of `"new"`, `"delete"`, or `"modify"`; otherwise the entry is ignored. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putProperties
  - The XML should follow the same format returned by `getProperties`. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putProperties
  - When modifying, only changed fields need to be included. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putProperties
- **Authentication:** Username and password; the account APIKEY is accepted as a substitute for the password. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putProperties
- **Related method:** The output format of `getProperties` serves as the template for the XML submitted to `putProperties`. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putProperties
- **JSON replacements:**
  - **`setProperty` (JSON)** — endpoint `https://api.beds24.com/json/setProperty`, POST. "Post JSON data here to modify a property in an account." Uses `authentication` (`apiKey`, `propKey`) and a `setProperty` array. Property-level `action` must be `"modify"`; each room can have `action` `"new"`, `"modify"`, or `"delete"`. Supports `roomTypes`, `units`, `accountAccess`, and channel-specific fields (Agoda, Airbnb, Booking.com, Expedia). Only changed fields need be included. [extracted 2026-07-28], source: https://www.beds24.com/api/json/setProperty
  - **`createProperties` (JSON)** — for creating new properties. [extracted 2026-07-28], source: https://www.beds24.com/api/

---

## 5. getInventories (XML)

- **Purpose:** Returns an XML document containing information about the properties' available inventory. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
- **HTTP method:** POST (parameters can be sent as POST fields or posted as XML). [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
- **Request parameters:**
  - `username` — required. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
  - `password` — required; the account APIKEY can be used as the password. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
  - `datefrom` — optional; earliest date in `yyyy-mm-dd` format. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
  - `dateto` — optional; latest date in `yyyy-mm-dd` format. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
  - `propid` — optional; property identifier filter. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
  - `roomid` — optional; room identifier filter. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
  - `maxstay` — optional; set to non-zero to include maximum-stay data. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
  - `multiplier` — optional; set to non-zero to include price-multiplier data. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
- **Request XML structure:**
  ```xml
  <request>
    <auth>
      <username>username</username>
      <password>password</password>
    </auth>
    <propid></propid>
    <roomid></roomid>
    <datefrom></datefrom>
    <dateto></dateto>
    <maxstay>0</maxstay>
    <multiplier>0</multiplier>
  </request>
  ```
  [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
- **Response data elements:**
  - **Inventories** — number of rooms available for each date range. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
  - **Prices** — daily prices set for each date range (rates are explicitly not returned). [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
  - **MinStays** — minimum stay per date range; will not be less than the room minimum stay value. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
  - **MaxStays** — maximum stay per date range; included only when `maxstay` is non-zero; will not be higher than the room maximum stay value. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
  - **Multipliers** — daily price multiplier values (set manually or by yield management); included only when `multiplier` is non-zero; the integer represents a percentage (100 = 100%). [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
- **Authentication:** Username and password; the account APIKEY is accepted as a substitute for the password. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getInventories
- **JSON replacement:** **`getAvailabilities` (JSON)** — endpoint `https://api.beds24.com/json/getAvailabilities`, POST. "Get availability and price information for a room, property or account." Required params: `checkIn` and either `lastNight` or `checkOut` (lastNight takes precedence), plus one of `roomId`, `propId`, or `ownerId`. Optional: `numAdult`/`numChild` (needed to return a price), `offerId` (1–16), `voucherCode`, `referer`, `agent`, `apisource`, `ignoreAvail`, `ignoreHidden`, `propIds`, `roomIds`. `apiKey`/`propKey` not needed. [extracted 2026-07-28], source: https://www.beds24.com/api/json/getAvailabilities

---

## 6. putInventories (XML)

- **Purpose:** Submits price and availability data via an XML document. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putInventories
- **HTTP method:** POST (parameters can be sent as POST fields or as an XML payload). [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putInventories
- **Request parameters:**
  - `username` — required. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putInventories
  - `password` — required; the account APIKEY can be used in place of the password. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putInventories
  - `properties XML` — an XML document containing price and availability info for one or more properties, matching the format returned by `getInventories`. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putInventories
- **Request XML structure:**
  ```xml
  <request>
    <auth>
      <username>username</username>
      <password>password</password>
    </auth>
    <properties>XML content for 1 or more property in the format returned by XML getInventories</properties>
  </request>
  ```
  [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putInventories
- **Business rules:**
  - Setting `minStay` or `maxStay` to `0` will remove it. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putInventories
  - Multipliers acceptable range is between `25` and `250`; the value functions as a percentage where `100` equals `100%`. Setting a multiplier to `0` removes it. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putInventories
- **Authentication:** Username and password; the account APIKEY is accepted as a substitute for the password. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putInventories
- **JSON replacement:** **`setRoomDates` (JSON)** — "Post JSON data here to set room price and availability." Uses `authentication` (`apiKey`, `propKey`), `roomId`, and a `dates` object keyed by date in `YYYYMMDD` format, each value containing `p1`–`p4` (pricing), `i`/`o` (availability/status flags), `m` (min stay), `mx` (max stay). Setting `m`/`mx` to `0` removes the constraint; setting the multiplier to `0` deletes it and reverts to auto. Data format is similar to that returned by `getRoomDates`. [extracted 2026-07-28], source: https://www.beds24.com/api/json/setRoomDates

---

## 7. getBookings (XML)

- **Purpose:** Returns an XML document containing bookings and invoiced items. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getBookings
- **HTTP method:** POST (parameters can be sent as POST fields or posted as XML). [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getBookings
- **Request parameters:**
  - `username` — required. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getBookings
  - `password` — required; the account APIKEY can be used as the password. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getBookings
  - `modified` — optional; modified since time in `yyyy-mm-dd hh:mm:ss` format (GMT). [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getBookings
  - `datefrom` — optional; earliest date in `yyyy-mm-dd` format. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getBookings
  - `dateto` — optional; latest date in `yyyy-mm-dd` format. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getBookings
  - `propid` — optional; limits results to a specific property. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getBookings
  - `roomid` — optional; limits results to a specific room. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getBookings
  - `masterid` — optional; limits results to a booking group. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getBookings
  - `bookid` — optional; limits results to one booking. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getBookings
- **Request XML structure:**
  ```xml
  <request>
    <auth>
      <username>username</username>
      <password>password</password>
    </auth>
    <propid></propid>
    <roomid></roomid>
    <masterid></masterid>
    <bookid></bookid>
    <modified></modified>
    <datefrom></datefrom>
    <dateto></dateto>
  </request>
  ```
  [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getBookings
- **Date range behavior:** The date range applies to the last night of the booking. If `datefrom` is not set, it defaults to today. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getBookings
- **Response format:** XML document. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getBookings
- **Authentication:** Username and password; the account APIKEY is accepted as a substitute for the password. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/getBookings
- **JSON replacement:** **`getBookings` (JSON)** — endpoint `https://api.beds24.com/json/getBookings`, POST. Params include `roomId`, `bookId`, `masterId`, `arrivalFrom`, `arrivalTo`, `departureFrom`, `departureTo`, `modifiedSince`, `searchText`, `status`, `limit`, `offset`. Optional flags: `includeInvoice`, `includeInfoItems`, `includeInfoItemsConverted`, `includeStripeCharges`. Response capped at 1000 bookings; `arrivalFrom` defaults to yesterday and `arrivalTo` to one year out. `includeInvoice` and similar flags available only if fewer than 100 bookings returned; `includeStripeCharges` only on one booking at a time (via `bookId`). [extracted 2026-07-28], source: https://www.beds24.com/api/json/getBookings

---

## 8. putBookings (XML)

- **Purpose:** Posts an XML document containing bookings and invoiced items. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putBookings
- **HTTP method:** POST (parameters must be included in the POST). [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putBookings
- **Request parameters:**
  - `username` — required. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putBookings
  - `password` — required; the account APIKEY can be used as the password. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putBookings
  - `bookings xml` — the XML document containing booking data. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putBookings
- **XML structure:** A `bookings` element containing `booking` elements, formatted identically to the response from `getBookings`. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putBookings
- **Action attribute:** Each booking's action parameter accepts one of three values: `"new"`, `"delete"`, or `"modify"`. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putBookings
- **Modification behavior:** When modifying, only changed fields need to be included; fields omitted from the posted XML remain untouched (will not be modified). [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putBookings
- **Authentication:** Username and password; the account APIKEY is accepted as a substitute for the password. [extracted 2026-07-28], source: https://www.beds24.com/api/xml/putBookings
- **JSON replacement:** **`setBooking` (JSON)** — endpoint `https://api.beds24.com/json/setBooking`, POST. "If bookId is specified and exists the booking will be modified. If bookId is not set the booking will be added as a new booking." Uses `authentication` (`apiKey`, `propKey`), core fields (`bookId`, `roomId`, `unitId`, `roomQty`, `status`, `firstNight`/`lastNight`, `numAdult`/`numChild`), guest info (name, email, phone, address, card details), financial fields (`price`, `deposit`, `tax`, `commission`), custom fields (`message`, `custom1`–`custom10`, `notes`, `flagColor`, `flagText`), boolean action flags (`notifyGuest`, `notifyHost`, `assignBooking`, `checkAvailability`, Booking.com flags, `assignInvoiceNumber`, `deleteInvoice`), `chargeToStripe`, invoice items array, info items array, and bulk operations (`array` up to 100 new bookings, `groupArray`, `masterId`). [extracted 2026-07-28], source: https://www.beds24.com/api/json/setBooking

---

## XML → JSON replacement summary

| XML method        | Recommended JSON replacement | Notes |
|-------------------|------------------------------|-------|
| getAccount        | getAccount (JSON)            | Account usage + charging info; apiKey auth |
| putAccount        | setAccount (JSON)            | action = "modify"; subaccounts object |
| getProperties     | getProperties (JSON)         | Property list; apiKey auth |
| putProperties     | setProperty (JSON)           | createProperties for new properties |
| getInventories    | getAvailabilities (JSON)     | Availability + price by room/prop/account |
| putInventories    | setRoomDates (JSON)          | Per-date price/availability/min/max stay |
| getBookings       | getBookings (JSON)           | Bookings + invoices; 1000-booking cap |
| putBookings       | setBooking (JSON)            | Create/modify booking; bulk array support |

The JSON API index is at https://www.beds24.com/api/ and lists all JSON functions including `getBookings`, `setBooking`, `getAvailabilities`, `getDescriptions`, `createAccount`, `getAccount`, `setAccount`, `createProperties`, `getProperties`, `getProperty`, `setProperty`, `getPropertyContent`, `setPropertyContent`, `getRoomDates`, `setRoomDates`, `getDailyPriceSetup`, `setDailyPriceSetup`, `getRates`, `setRate`, `setRates`, `getRateLinks`, `setRateLinks`, `getInvoicees`, `setInvoicees`, `getInvoices`, `getMessages`, `setMessage`, `createStripeSession`, and `getV2RefreshToken`. [extracted 2026-07-28], source: https://www.beds24.com/api/
