# Invoicing — Category Index

Beds24 JSON API methods for managing booking invoices and invoicees (payables). All endpoints are JSON POST calls requiring an `authentication` object with an account-level `apiKey` (and, for invoices, a property-level `propKey`). [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`

## Child Documents

- **[invoices.md](./invoices.md)** — `getInvoices`: retrieves booking invoice items, filterable by booking, invoice group, invoice number, invoicee, and date range, with an `incBook` flag to include booking metadata. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)`
- **[invoicees.md](./invoicees.md)** — `getInvoicees` / `setInvoicees`: read and modify invoicees (payables); `getInvoicees` returns all or one invoicee by id, while `setInvoicees` supports partial updates of up to 100 invoicees per call. [extracted 2026-07-28] `[api → json/getInvoicees](https://www.beds24.com/api/json/getInvoicees)` `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)`

## Overarching Topics

- **Authentication & keys** — account `apiKey` vs property `propKey`, length constraints (16–64 chars), where they are configured in the Beds24 UI, and security warnings. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
- **Invoice item retrieval** — filtering by `bookId`, `masterId`, `invoiceId`, `invoiceeId`, and date range (`dateFrom`/`dateTo`); the `incBook` metadata flag. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)`
- **Invoicee (payable) management** — reading all/specific invoicees; modifying invoicees with partial updates and the 100-per-call limit. [extracted 2026-07-28] `[api → json/getInvoicees](https://www.beds24.com/api/json/getInvoicees)` `[api → json/setInvoicees](https://www.beds24.com/api/json/setInvoicees)`
- **Unassigned vs assigned items** — `invoiceeId=""` returns unassigned items, `invoiceeId=false` returns both assigned and unassigned. [extracted 2026-07-28] `[api → json/getInvoices](https://www.beds24.com/api/json/getInvoices)`
- **General API etiquette** — one call at a time, minimum necessary data, space calls a few seconds apart, and the excessive-usage blocking warning. [extracted 2026-07-28] `[api → json/index.php](https://www.beds24.com/api/json/index.php)`
