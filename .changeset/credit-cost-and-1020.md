---
"@jverneuer/beds24-sdk-client": minor
---

Expose per-request credit cost, treat 1020 like 1016, carry full credit state on errors:

- `Credits.requestCost` — parsed from the `x-request-cost` response header (the dynamic per-request cost documented in Beds24 §3; previously only the two `x-five-min-*` window headers were exposed)
- error code **1020** (`UsageLimitExceededAlt`) is now `retryable`, identical to 1016 — both mean "usage limit exceeded in the last 5 minutes" and both end the current window
- `Beds24Error.credits` — the full `Credits` object off the failing response (incl. `resetsIn`, which rate-limit/freeze handling needs), alongside the existing `creditsRemaining`
