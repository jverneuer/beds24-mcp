# setBooking

Creates or modifies a booking in a property via JSON POST. The JSON structure mirrors what is returned by the `getBookings` endpoint. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`

## Endpoint

`https://api.beds24.com/json/setBooking` (inferred from API convention; documented at the source URL) [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`

## Authentication (Required)

An `authentication` object is required containing both `apiKey` and `propKey`, each sourced from account/property settings. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`

## Create vs. Update Logic

- **Update**: Include a `bookId` that already exists in the system. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- **Create**: Omit `bookId` entirely; the booking is treated as new. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- **Auto-assignment**: For new bookings where `unitId` is omitted, the system assigns the booking to an available unit within the specified `roomId` type. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- **Partial updates**: When modifying, only fields that have changed need to be sent. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`

## Cancellation vs. Deletion

Bookings can be cancelled via this function but **cannot be deleted**. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`

## Multiple Bookings

- Up to 100 new bookings can be submitted at once using either `array` or `groupArray`; these two parameters are **mutually exclusive**. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- `groupArray` generates a set of linked bookings as a group. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- To form a group from existing bookings, designate one `bookId` as the master and assign that value to the `masterId` field of each additional booking in the group. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`

## Country Handling

When `guestCountry` contains a country name and `guestCountry2` is absent, the country code for `guestCountry2` is derived automatically. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`

## Stripe Integration

- A Stripe CustomerId (prefixed with `cus_`, e.g. `cus_01234567890`) can be submitted using the `stripeToken` field, provided the Stripe account is connected to the property. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- Charging the customer is then done via the `chargeToStripe` action. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`

## Invoice Items

- **Add**: Omit `invoiceId` when sending the item. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- **Delete**: Set `description`, `status`, `qty`, and `price` all to an empty string in a single operation. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- **Sign conventions**: Charges use a positive `qty`; payments use `-1`. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- **Integer requirement**: `qty` must be an integer. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- **Decimal workaround**: For new items, `qtyDecimal` can replace `qty`; the system converts it to an integer and adjusts `price` so the total remains unchanged. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- **Defaults**: Setting `description` or `status` to a logical true (unquoted `true`) applies the property's default values. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- **Other fields**: `vatRate`, `invoiceeId`. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`

## Booking Info Items

- **Add**: Supply `code` and `text`. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- **Modify**: Include `infoItemId` along with updated `code`/`text`. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- **Delete**: Send `infoItemId` with both `code` and `text` set to empty strings. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`

## Actions for New Bookings

- `notifyGuest` — triggers a guest email confirmation. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- `notifyHost` — triggers a host email confirmation. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- `assignBooking` — uses room dependency settings to place the booking in a different room type or the first available unit of that type. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- `checkAvailability` — prevents saving if the room has no availability. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- `notifyUrl` — optional; used to disable the notify URL action. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`

## Actions for Existing Bookings (require `bookId`)

- `bookingcomInvalidCard` — reports an invalid card to Booking.com; only usable before check-in. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- `bookingcomNoShow` — reports a no-show to Booking.com; available from check-in for two days. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- `bookingcomReportCancel` — reports a cancellation request to Booking.com; cancellation proceeds only if all prerequisites are met. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- `chargeToStripe` — charges the card on file at Stripe. Sub-fields: `amount`, `description`, `capture`. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- `assignInvoiceNumber` — assigns an invoice number; use unquoted `true` for the default invoicee or supply an `invoiceeId`. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
- `deleteInvoice` — removes all existing invoice items; locked invoices are exempt. [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`

## Booking Parameters

The following booking-level parameters are supported (from documented example data): [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`

- `roomId`, `unitId`, `roomQty`, `status`
- `firstNight`, `lastNight`
- `numAdult`, `numChild`
- `guestTitle`, `guestFirstName`, `guestName`
- `guestEmail`, `guestPhone`, `guestMobile`, `guestFax`
- `guestAddress`, `guestCity`, `guestPostcode`, `guestCountry`
- `guestArrivalTime`, `guestVoucher`, `guestComments`
- `guestCardType`, `guestCardNumber`, `guestCardName`, `guestCardExpiry`, `guestCardCVV`, `guestCardNote`
- `message`, `notes`
- `custom1` through `custom10`
- `flagColor`, `flagText`
- `price`, `deposit`, `tax`, `commission`
- `refererEditable`

## Invoice Item Parameters

- `invoiceId`, `description`, `status`, `qty`, `price`, `vatRate`, `invoiceeId` [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`

## Info Item Parameters

- `infoItemId`, `code`, `text` [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`

## Multiple-Booking Entry Parameters (array / groupArray)

- `roomId`, `masterId` (array only), `firstNight`, `lastNight`, `numAdult`
- `guestTitle`, `guestFirstName`, `guestName`, `guestEmail` [extracted 2026-07-28] `[api → json/setBooking](https://www.beds24.com/api/json/setBooking)`
