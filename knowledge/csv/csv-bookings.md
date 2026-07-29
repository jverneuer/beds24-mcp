# CSV Bookings

Beds24 CSV methods for exporting and bulk-importing bookings, plus exporting guest data. These are the CSV bulk-data alternatives to the JSON booking/guest endpoints. [extracted 2026-07-28] [api → csv/getbookingscsv](https://www.beds24.com/api/csv/getbookingscsv)

## getBookingsCSV

Returns a CSV document containing bookings. [extracted 2026-07-28] [api → csv/getbookingscsv](https://www.beds24.com/api/csv/getbookingscsv)

**Purpose:** Export booking data as CSV; the output is intended to be used as a template for import via `putBookingsCSV`. [extracted 2026-07-28] [api → csv/getbookingscsv](https://www.beds24.com/api/csv/getbookingscsv)

### Parameters

| Parameter | Type | Required / Optional | Description |
|---|---|---|---|
| `username` | string | Required | Account username |
| `password` | string | Required | Account password |
| `datefrom` | date (yyyy-mm-dd) | Optional | Earliest date |
| `dateto` | date (yyyy-mm-dd) | Optional | Latest date |

[extracted 2026-07-28] [api → csv/getbookingscsv](https://www.beds24.com/api/csv/getbookingscsv)

- The `datefrom` / `dateto` parameters specify the **end date** of the booking; they act as filters based on the booking's end date. [extracted 2026-07-28] [api → csv/getbookingscsv](https://www.beds24.com/api/csv/getbookingscsv)
- Authentication is via account `username` and `password` fields. [extracted 2026-07-28] [api → csv/getbookingscsv](https://www.beds24.com/api/csv/getbookingscsv)

## putBookingsCSV

Imports bookings from a CSV file into the system. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)

**Purpose:** Bulk create/modify bookings via CSV upload; the companion `getBookingsCSV` method downloads existing bookings as a CSV template. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)

### Parameters

| Parameter | Type | Required / Optional | Description |
|---|---|---|---|
| `username` | text | Required | Account username |
| `password` | text | Required | Account password |
| `CSV file` | file upload | Required | The CSV file to upload |
| `date format` | select | Required | Options: `auto`, `YYYY-MM-DD`, `D/M/YYYY`, `MM/DD/YYYY` |
| `save bookings` | checkbox / submit | Required | Unchecked = preview only; checked = perform import |

[extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)

### CSV file requirements

- Encoding: UTF-8. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)
- Delimiter: commas, tabs, or semicolons. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)
- Row 1: headers identifying each column. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)
- Subsequent rows: one booking per row. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)
- Data fields must not contain the delimiter character unless the entire field is wrapped in double quotes. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)

### Column definitions

| Column | Description |
|---|---|
| `REF number` | Leave blank for new bookings; enter an existing booking id to modify; use the word `GROUP` to add as a linked booking to the previous row, creating a booking group |
| `Roomid` | Room id from your account — required for import to succeed |
| `FirstNight` | Check-in date (no space in column name) — recommended for reliable date import |
| `LastNight` | Last night of stay (no space in column name) — can be deleted or left blank if unused |
| `CheckOut` | Check-out date — can be deleted or left blank if unused |
| `status` | Valid values: `New`, `Confirmed`, `Cancelled`, `Request`, `Inquiry`, `Black` |
| `sub status` | Must match a text available in the control panel selector for this setting |
| `Balance` | When used, adds a single invoice item to create the specified balance amount |

[extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)

### Minimum required information

A `roomid` number, a check-in date, and either a last-night or check-out date. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)

### Date format rules

- Recommended format: `YYYY-MM-DD` (example: `2015-01-30`). [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)
- Dates must be in English. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)
- If not `YYYY-MM-DD`, use the date format selector to indicate month/date order. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)
- The `FirstNight` column plus one of `LastNight` or `CheckOut` are the reliable way to import dates. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)

### Import vs. preview behavior

- **Preview** (checkbox unchecked): shows a report of the information read from the file — no data is saved; fix errors and re-upload. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)
- **Import** (checkbox checked): performs the actual import; cannot be undone. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)

### Operational notes

- Upload a maximum of 50 bookings at a time. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)
- Processing may take up to one minute. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)
- Click submit once only, or you may import duplicates. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)
- Once bookings are uploaded they can only be deleted manually. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)
- Uploading the file twice creates duplicate bookings. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)
- Not all columns can be imported; the preview reveals which data will be imported. [extracted 2026-07-28] [api → csv/putbookingscsv](https://www.beds24.com/api/csv/putbookingscsv)

## getGuestsCSV

Returns a CSV document containing all guests for an account. [extracted 2026-07-28] [api → csv/getguestscsv](https://www.beds24.com/api/csv/getguestscsv)

**Purpose:** Export the full guest list, optionally filtered to a single property. [extracted 2026-07-28] [api → csv/getguestscsv](https://www.beds24.com/api/csv/getguestscsv)

### Parameters

| Parameter | Type | Required / Optional | Description |
|---|---|---|---|
| `username` | string | Required | Account username |
| `password` | string | Required | Account password |
| `property Id` | string | Optional | Filters guests to a specific property |

[extracted 2026-07-28] [api → csv/getguestscsv](https://www.beds24.com/api/csv/getguestscsv)

- Authentication is via account `username` and `password`. [extracted 2026-07-28] [api → csv/getguestscsv](https://www.beds24.com/api/csv/getguestscsv)
- Specifying a `property id` limits results to guests associated with that property. [extracted 2026-07-28] [api → csv/getguestscsv](https://www.beds24.com/api/csv/getguestscsv)
