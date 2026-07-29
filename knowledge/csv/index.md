# CSV API

Beds24 CSV bulk-data methods — export (get) and import (put) endpoints for rates, daily pricing, bookings, guests, invoices, and invoicees. Each pair shares a bidirectional CSV format: the export output is the import template.

## Child files

- [csv-pricing.md](csv-pricing.md) — Exports/imports rates (getRatesCSV/putRatesCSV) for a room and per-day calendar inventory plus daily prices (getRoomDailyCSV/putRoomDailyCSV) for a room or property over a date range; room-daily explicitly excludes rate-based prices. [api → csv/getratescsv](https://www.beds24.com/api/csv/getratescsv)
- [csv-bookings.md](csv-bookings.md) — Exports bookings filtered by end date (getBookingsCSV), bulk-imports bookings with create/modify/group-link semantics (putBookingsCSV), and exports the account guest list (getGuestsCSV). [api → csv/getbookingscsv](https://www.beds24.com/api/csv/getbookingscsv)
- [csv-invoicing.md](csv-invoicing.md) — Exports/imports invoice items with date-range and invoice-number filters (getInvoicesCSV/putInvoicesCSV, including payment and delete semantics) and exports/imports invoicees (getInvoiceesCSV/putInvoiceesCSV). [api → csv/getinvoicescsv](https://www.beds24.com/api/csv/getinvoicescsv)

## Overarching topics

- Bidirectional CSV format (export output = import template) for each get/put pair
- Authentication via account username and password (form fields, not tokens)
- Preview-then-save workflow (checkbox toggles preview vs. permanent import)
- Import safeguards: cannot undo, max batch sizes (50 bookings/rates, 1,000 invoices), one-click submit to avoid duplicates
- CSV structural rules: header row, UTF-8 encoding, comma/tab/semicolon delimiters, double-quote wrapping of delimiters inside fields
- Date formats and filters (yyyy-mm-dd; booking end-date filtering; invoice date vs. created-date filtering)
- Rate vs. room-daily pricing distinction (rate-based prices excluded from room-daily)
- Booking import semantics (new/modify, GROUP linked-booking groups, status values, balance invoice item)
- Invoice operations (create item, create payment via negative price, modify, delete)
- Invoicee linking across accounts
- Excel-for-Mac UTF-8 limitation (use Open Office / Libre Office)
