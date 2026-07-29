# CSV Pricing

Beds24 CSV methods for exporting and bulk-importing rate and daily-price (room-daily) data. These are the CSV bulk-data alternatives to the JSON rate/price endpoints. [extracted 2026-07-28] [api → csv/getratescsv](https://www.beds24.com/api/csv/getratescsv)

## getRatesCSV

Returns a CSV document (suitable for spreadsheet programs) containing rates for a specified room. [extracted 2026-07-28] [api → csv/getratescsv](https://www.beds24.com/api/csv/getratescsv)

**Purpose:** Export rate data for a room; the output format is designed to be re-uploaded via the complementary `putRatesCSV` import method. [extracted 2026-07-28] [api → csv/getratescsv](https://www.beds24.com/api/csv/getratescsv)

### Parameters

| Parameter | Type | Required / Optional | Description |
|---|---|---|---|
| `username` | string | Required | Account username |
| `password` | string | Required | Account password |
| `roomid` | string | Required | Room identifier |

[extracted 2026-07-28] [api → csv/getratescsv](https://www.beds24.com/api/csv/getratescsv)

- Authentication is via account `username` and `password` fields. [extracted 2026-07-28] [api → csv/getratescsv](https://www.beds24.com/api/csv/getratescsv)
- The CSV file format produced by this method can also be uploaded using `putRatesCSV`. [extracted 2026-07-28] [api → csv/getratescsv](https://www.beds24.com/api/csv/getratescsv)

## putRatesCSV

Bulk-imports rates from a CSV file into the account. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)

**Purpose:** Import (create/modify) rates via CSV; the companion `getRatesCSV` method provides the correct file format. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)

### Parameters

| Parameter | Type | Required / Optional | Description |
|---|---|---|---|
| `username` | text | Required | Account username |
| `password` | text | Required | Account password |
| `CSV file` | file upload | Required | The CSV file containing rate data |
| `semicolon separators` | checkbox | Optional | Use semicolons instead of commas as field separators |
| `save rates` | action / submit | — | Submit the form |

[extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)

### CSV format requirements

- The first row must contain headers identifying each column's contents. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)
- Each subsequent row contains one rate. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)
- The minimum required field is a `roomid` number per rate. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)
- Fields are separated by commas or semicolons (toggleable via the checkbox). [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)
- The data separator character (comma or semicolon) must not appear inside a field unless the field is wrapped in double quotes. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)
- Set the rate ID to an existing rate to modify it, or leave it blank to create a new rate. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)
- Not all columns are importable; the preview shows which information can be imported. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)

### Workflow (preview then save)

1. Create the CSV in the correct format (use `getRatesCSV` to obtain the format). [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)
2. **Preview:** upload the file without the "Save Changes" checkbox — a report of the parsed data is shown; fix errors and re-preview as needed. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)
3. **Import:** only when data is confirmed correct, select the "Save Changes" checkbox and upload again. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)

### Operational notes

- Imports **cannot be undone**. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)
- Once uploaded, rates can only be deleted manually. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)
- Uploading the file twice creates duplicate rates. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)
- Modified values are displayed in bold. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)
- Recommended maximum of ~50 rates at a time. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)
- Processing can take up to one minute — do not re-click submit while processing, or duplicate imports may result. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)
- Verify file format by importing it into a spreadsheet using only a comma or only a semicolon as the field separator. [extracted 2026-07-28] [api → csv/putratescsv](https://www.beds24.com/api/csv/putratescsv)

## getRoomDailyCSV

Returns a CSV document (suitable for spreadsheet programs) containing inventory and daily room prices for specified rooms. [extracted 2026-07-28] [api → csv/getroomdailycsv](https://www.beds24.com/api/csv/getroomdailycsv)

**Purpose:** Export per-day calendar data — inventory, daily prices, min/max stay, and multiplier — for a room or property over a date range; the output format is designed to be re-uploaded via `putRoomDailyCSV`. [extracted 2026-07-28] [api → csv/getroomdailycsv](https://www.beds24.com/api/csv/getroomdailycsv)

### Parameters

| Parameter | Type | Required / Optional | Description |
|---|---|---|---|
| `username` | string | Required | Account username |
| `password` | string | Required | Account password |
| `roomid` | string | Required if no `propid` | Room identifier |
| `propid` | string | Required if no `roomid` | Property identifier |
| `datefrom` | date (yyyy-mm-dd) | Optional | Earliest date to retrieve |
| `dateto` | date (yyyy-mm-dd) | Optional | Latest date to retrieve |

[extracted 2026-07-28] [api → csv/getroomdailycsv](https://www.beds24.com/api/csv/getroomdailycsv)

- Only one of `roomid` or `propid` is needed ("either the room id or prop id"). [extracted 2026-07-28] [api → csv/getroomdailycsv](https://www.beds24.com/api/csv/getroomdailycsv)

### Data included in the CSV output

- **Inventory** — defined as "the number of rooms available for sale". [extracted 2026-07-28] [api → csv/getroomdailycsv](https://www.beds24.com/api/csv/getroomdailycsv)
- **Daily prices** — prices set for a single day in the calendar. [extracted 2026-07-28] [api → csv/getroomdailycsv](https://www.beds24.com/api/csv/getroomdailycsv)
- **Min stay** — as set in the calendar. [extracted 2026-07-28] [api → csv/getroomdailycsv](https://www.beds24.com/api/csv/getroomdailycsv)
- **Max stay** — as set in the calendar. [extracted 2026-07-28] [api → csv/getroomdailycsv](https://www.beds24.com/api/csv/getroomdailycsv)
- **Multiplier** — as set in the calendar. [extracted 2026-07-28] [api → csv/getroomdailycsv](https://www.beds24.com/api/csv/getroomdailycsv)

### Data excluded

- "Prices set by rates are not returned by this method." [extracted 2026-07-28] [api → csv/getroomdailycsv](https://www.beds24.com/api/csv/getroomdailycsv)

## putRoomDailyCSV

Uploads a CSV file with inventory and daily prices for a room. [extracted 2026-07-28] [api → csv/putroomdailycsv](https://www.beds24.com/api/csv/putroomdailycsv)

**Purpose:** Import per-day calendar data (inventory, daily prices, min/max stay, multiplier) via CSV; the file must match the structure produced by `getRoomDailyCSV`. [extracted 2026-07-28] [api → csv/putroomdailycsv](https://www.beds24.com/api/csv/putroomdailycsv)

### Parameters

| Parameter | Type | Required / Optional | Description |
|---|---|---|---|
| `username` | text | Required | Account username |
| `password` | text | Required | Account password |
| `CSV file` | file upload | Required | Must match the structure `getRoomDailyCSV` generates |
| `semicolon separators` | checkbox / option | Optional | Enable semicolon as delimiter |

[extracted 2026-07-28] [api → csv/putroomdailycsv](https://www.beds24.com/api/csv/putroomdailycsv)

### Field-level behavior rules

| Field | Action | Value |
|---|---|---|
| Daily prices | Update | Set to a decimal value |
| Daily prices | Remove | Set to `0` |
| Daily prices | No change | Leave blank |
| Room inventory | Set | Enter value on any date |
| Room inventory | No change | Leave blank |
| Min stay | Remove | Set to `1` |
| Max stay | Remove | Set to `0` |
| Multiplier | Remove | Set to `0` |

[extracted 2026-07-28] [api → csv/putroomdailycsv](https://www.beds24.com/api/csv/putroomdailycsv)

- Columns and rows must follow the same structure that `getRoomDailyCSV` generates. [extracted 2026-07-28] [api → csv/putroomdailycsv](https://www.beds24.com/api/csv/putroomdailycsv)
- Authentication is via account `username` and `password`. [extracted 2026-07-28] [api → csv/putroomdailycsv](https://www.beds24.com/api/csv/putroomdailycsv)

## Key distinctions: rates vs. room-daily

- **Rates** (`getRatesCSV` / `putRatesCSV`) operate on the rate configuration for a single required `roomid`. [extracted 2026-07-28] [api → csv/getratescsv](https://www.beds24.com/api/csv/getratescsv)
- **Room-daily** (`getRoomDailyCSV` / `putRoomDailyCSV`) operate on per-day calendar values (inventory + daily prices + min/max stay + multiplier) for a room OR property over a date range, and explicitly **exclude** prices set by rates. [extracted 2026-07-28] [api → csv/getroomdailycsv](https://www.beds24.com/api/csv/getroomdailycsv)
- Both pairs use a bidirectional CSV: the export format is the import format. [extracted 2026-07-28] [api → csv/getratescsv](https://www.beds24.com/api/csv/getratescsv) [api → csv/getroomdailycsv](https://www.beds24.com/api/csv/getroomdailycsv)
