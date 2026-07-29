# Beds24 API — Error Codes

Documented numeric error codes returned by the API. Codes `1016` and `1020` both map to the 5-minute usage-limit rule (see [rate-limits.md](rate-limits.md)).

| Code | Meaning |
|------|---------|
| 1009 | Not allowed for this role |
| 1010 | No write access |
| 1016 | Usage limit exceeded in last 5 minutes |
| 1020 | Usage limit exceeded in last 5 minutes |
| 1021 | Account has no credit |
| 1022 | Not whitelisted |

Source: [extracted 2026-07-28] [api](https://www.beds24.com/api/)

## Code-by-code notes

- **1009 — Not allowed for this role**: Role-based restriction. The authenticated principal's role does not permit the requested operation. [extracted 2026-07-28] [api](https://www.beds24.com/api/)
- **1010 — No write access**: The principal lacks write permission for the target resource. [extracted 2026-07-28] [api](https://www.beds24.com/api/)
- **1016 — Usage limit exceeded in last 5 minutes**: The account exceeded the allowed call volume within a rolling 5-minute window. Stop calling and back off. [extracted 2026-07-28] [api](https://www.beds24.com/api/)
- **1020 — Usage limit exceeded in last 5 minutes**: Same meaning as 1016 — 5-minute usage limit exceeded. [extracted 2026-07-28] [api](https://www.beds24.com/api/)
- **1021 — Account has no credit**: The account is out of credit; API usage is blocked until credit is restored. [extracted 2026-07-28] [api](https://www.beds24.com/api/)
- **1022 — Not whitelisted**: The requesting principal/IP/account is not on an allowlist required for the operation. [extracted 2026-07-28] [api](https://www.beds24.com/api/)

## Usage-limit behavior (codes 1016 / 1020)

- Excessive usage within a 5-minute period causes the account to be **blocked without warning**. [extracted 2026-07-28] [api](https://www.beds24.com/api/)
- The provider reserves the right to disable any access it deems excessive, at its **complete discretion and without warning**. [extracted 2026-07-28] [api](https://www.beds24.com/api/)

## What the sources do NOT specify

The public overview page lists only the six codes above. It does not document whether additional codes exist, the exact JSON/XML field name that carries the error code in a response, or a retry/backoff schedule. Treat codes `1016`/`1020` as hard stop signals: cease calls and wait well beyond 5 minutes before resuming.
