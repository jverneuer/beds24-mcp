# CSV Invoicing

Beds24 CSV methods for exporting and bulk-importing invoices and invoicees. These are the CSV bulk-data alternatives to the JSON invoice endpoints. [extracted 2026-07-28] [api → csv/getinvoicescsv](https://www.beds24.com/api/csv/getinvoicescsv)

## getInvoicesCSV

Returns a CSV document containing invoice items. [extracted 2026-07-28] [api → csv/getinvoicescsv](https://www.beds24.com/api/csv/getinvoicescsv)

**Purpose:** Export invoice items as CSV within a date range, optionally restricted to a property/room and/or invoice-number status; intended as a template for `putInvoicesCSV`. [extracted 2026-07-28] [api → csv/getinvoicescsv](https://www.beds24.com/api/csv/getinvoicescsv)

### Parameters

| Parameter | Type | Required / Optional | Description |
|---|---|---|---|
| `username` | string | Required | Account username |
| `password` | string | Required | Account password |
| `datefrom` | date (yyyy-mm-dd) | Required | Earliest date of the range |
| `dateto` | date (yyyy-mm-dd) | Required | Latest date of the range |
| `propid` | id | Optional | Restrict results to a specific property |
| `roomid` | id | Optional | Restrict results to a specific room |
| `only with invoice number assigned` | checkbox | Optional | Filter to only invoice items with an invoice number assigned |

[extracted 2026-07-28] [api → csv/getinvoicescsv](https://www.beds24.com/api/csv/getinvoicescsv)

- When "only with invoice number assigned" is checked, only invoice items with an assigned invoice number are shown, **and** the date range filters by **invoice date**. [extracted 2026-07-28] [api → csv/getinvoicescsv](https://www.beds24.com/api/csv/getinvoicescsv)
- When not checked, the date range instead filters by **when the invoice item was created**. [extracted 2026-07-28] [api → csv/getinvoicescsv](https://www.beds24.com/api/csv/getinvoicescsv)
- Authentication is via account `username` and `password`. [extracted 2026-07-28] [api → csv/getinvoicescsv](https://www.beds24.com/api/csv/getinvoicescsv)

## putInvoicesCSV

Imports invoices from a CSV file into the system. [extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)

**Purpose:** Bulk create/modify/delete invoice items (and create payments) via CSV upload; the companion `getInvoicesCSV` method downloads existing invoices to establish the correct format. [extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)

### Parameters

| Parameter | Type | Required / Optional | Description |
|---|---|---|---|
| `username` | text | Required | Account username |
| `password` | text | Required | Account password |
| `CSV file` | file upload | Required | The CSV file containing invoice data |
| `save invoices` | checkbox | Optional | When ticked, saves changes; when unticked, shows preview only |

[extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)

### CSV format requirements

- The first row must contain headers identifying each column's contents. [extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)
- Each subsequent row represents one invoice item. [extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)
- The data separator character (comma, tab, or semicolon) cannot appear inside a field unless the entire field is wrapped in double quotes. [extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)
- Data must appear in the exact required format and position. [extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)

### Column definitions

| Column | Description |
|---|---|
| `Bookid` | Required for all invoice items; must be specified |
| `Itemid` | Leave blank for new items; populate with existing Itemid to modify or delete |
| `price` | Use a negative value to create a payment |

[extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)

### Operations (based on row content)

| Action | How to perform |
|---|---|
| Create new invoice | Include `Bookid`; leave `Itemid` blank |
| Create payment | New invoice row with a negative `price` |
| Modify existing | Include `Bookid` and the existing `Itemid` |
| Delete existing | Set `Bookid` and `Itemid`; set all other values to empty strings |

[extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)

### Preview vs. save behavior

- **Preview mode:** upload the file without ticking the "Save Changes" checkbox — displays a report of parsed data and any errors. [extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)
- **Save mode:** re-upload with the checkbox ticked — permanently imports the data. [extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)

### Operational notes

- Imports **cannot be undone**. [extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)
- Maximum recommended batch size: 1,000 invoice items per upload. [extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)
- Processing may take up to one minute. [extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)
- Re-clicking submit during processing may cause duplicate imports. [extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)
- Not all columns are importable — the preview indicates which fields will be accepted. [extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)
- Excel for Mac lacks UTF-8 support and may corrupt characters; Open Office or Libre Office are recommended alternatives. [extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)
- Testing with a small number of invoices first is advised. [extracted 2026-07-28] [api → csv/putinvoicescsv](https://www.beds24.com/api/csv/putinvoicescsv)

## getInvoiceesCSV

Returns a CSV document containing invoicees in the account. [extracted 2026-07-28] [api → csv/getinvoiceescsv](https://www.beds24.com/api/csv/getinvoiceescsv)

**Purpose:** Export the invoicee list for an account, optionally including invoicees linked from other accounts; used as a template for `putInvoiceesCSV`. [extracted 2026-07-28] [api → csv/getinvoiceescsv](https://www.beds24.com/api/csv/getinvoiceescsv)

### Parameters

| Parameter | Type | Required / Optional | Description |
|---|---|---|---|
| `username` | string | Required | Account username |
| `password` | string | Required | Account password |
| `include linked from other accounts` | flag | Optional | Include invoicees linked from other accounts |

[extracted 2026-07-28] [api → csv/getinvoiceescsv](https://www.beds24.com/api/csv/getinvoiceescsv)

- Authentication is via account `username` and `password`. [extracted 2026-07-28] [api → csv/getinvoiceescsv](https://www.beds24.com/api/csv/getinvoiceescsv)

## putInvoiceesCSV

Imports invoicees from a CSV file into the system. [extracted 2026-07-28] [api → csv/putinvoiceescsv](https://www.beds24.com/api/csv/putinvoiceescsv)

**Purpose:** Bulk create/modify invoicees via CSV upload; the companion `getInvoiceesCSV` method downloads existing invoicees to discover the full format. [extracted 2026-07-28] [api → csv/putinvoiceescsv](https://www.beds24.com/api/csv/putinvoiceescsv)

### Parameters

| Parameter | Type | Required / Optional | Description |
|---|---|---|---|
| `username` | field | Required | Account username |
| `password` | field | Required | Account password |
| `CSV file` | file upload | Required | The CSV file containing invoicee data |
| `save invoicees` | checkbox | Required | Unchecked = preview; checked = save/import |

[extracted 2026-07-28] [api → csv/putinvoiceescsv](https://www.beds24.com/api/csv/putinvoiceescsv)

### CSV format requirements

- The first row must contain headers identifying each column's contents. [extracted 2026-07-28] [api → csv/putinvoiceescsv](https://www.beds24.com/api/csv/putinvoiceescsv)
- Each subsequent row contains one entry. [extracted 2026-07-28] [api → csv/putinvoiceescsv](https://www.beds24.com/api/csv/putinvoiceescsv)
- Data fields must not contain the separator character (comma, tab, or semicolon) within the data unless the entire field is enclosed in double quotes. [extracted 2026-07-28] [api → csv/putinvoiceescsv](https://www.beds24.com/api/csv/putinvoiceescsv)
- Data must be entered exactly in the required format and position. [extracted 2026-07-28] [api → csv/putinvoiceescsv](https://www.beds24.com/api/csv/putinvoiceescsv)

### Column definitions

| Column | Required / Optional | Description |
|---|---|---|
| `InvoiceeId` | Conditional | Must be blank (or column omitted) for new entries; must contain existing Invoicee number to modify |
| `Name` | Conditional | Required when adding a new invoicee |

[extracted 2026-07-28] [api → csv/putinvoiceescsv](https://www.beds24.com/api/csv/putinvoiceescsv)

### Workflow: preview vs. import

1. **Preview:** upload the file WITHOUT ticking the "Save Changes" checkbox — a report displays the parsed data. [extracted 2026-07-28] [api → csv/putinvoiceescsv](https://www.beds24.com/api/csv/putinvoiceescsv)
2. **Import:** select the file again and tick the "Save Changes" checkbox, then upload. [extracted 2026-07-28] [api → csv/putinvoiceescsv](https://www.beds24.com/api/csv/putinvoiceescsv)

### Operational notes

- Imports **cannot be undone**. [extracted 2026-07-28] [api → csv/putinvoiceescsv](https://www.beds24.com/api/csv/putinvoiceescsv)
- Click submit once only, or you may import duplicates. [extracted 2026-07-28] [api → csv/putinvoiceescsv](https://www.beds24.com/api/csv/putinvoiceescsv)
- Excel for Mac does not support UTF-8 and may corrupt characters; Open Office or Libre Office are recommended. [extracted 2026-07-28] [api → csv/putinvoiceescsv](https://www.beds24.com/api/csv/putinvoiceescsv)
- Verify file format by importing into a spreadsheet using only comma, tab, or semicolon as the field separator. [extracted 2026-07-28] [api → csv/putinvoiceescsv](https://www.beds24.com/api/csv/putinvoiceescsv)
- Only use this function if comfortable working with CSV files. [extracted 2026-07-28] [api → csv/putinvoiceescsv](https://www.beds24.com/api/csv/putinvoiceescsv)
