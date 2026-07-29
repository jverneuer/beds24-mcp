# Bookings — Category Index

Beds24 API methods for retrieving and managing property bookings.

## Child Files

- **[getBookings.md](getBookings.md)** — Retrieves bookings with filters by date, room, status, channel, and bookingId; supports pagination (max 1000) and include flags for invoices, info items, and Stripe charges.
- **[setBooking.md](setBooking.md)** — Creates or modifies bookings; supports up to 100 bookings per call via array/groupArray, Stripe charges, invoice/info-item CRUD, Booking.com actions (invalid card, no-show, cancel), and auto-assignment.

## Overarching Topics

- Authentication (`apiKey` + `propKey`)
- Booking retrieval and filtering (date ranges, status, room, search text)
- Pagination and result limits
- Booking status and substatus value enumerations
- Inclusion of related data (invoice items, info items, Stripe charges)
- Booking creation vs. update semantics (`bookId` presence)
- Bulk / grouped bookings (`array` and `groupArray`)
- Invoice item CRUD and sign conventions
- Booking info item CRUD
- Stripe integration (`stripeToken`, `chargeToStripe`)
- Booking.com channel actions (invalid card, no-show, cancellation)
- Guest data, custom fields, and card-on-file parameters
- Cancellation (bookings can be cancelled but not deleted)
