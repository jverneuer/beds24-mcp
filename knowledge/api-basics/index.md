# Beds24 API — Basics (Category Index)

General API fundamentals: how to authenticate, the strict rate-limit rules, and the documented error codes.

## Child files

- **[authentication.md](authentication.md)** — Token-based auth: how to enable API access, obtain a token via `getAuthenticationToken`, and the roles of `apiKey`, `propKey`, and `roomId`. Also covers the V1→V2 refresh-token migration.
- **[rate-limits.md](rate-limits.md)** — Usage rules: the one-call-at-a-time concurrency rule, the 5-minute volume window, the no-warning block/discretionary-disable policy, and the data-minimization guidance.
- **[error-codes.md](error-codes.md)** — Numeric error codes: 1009 (role), 1010 (write access), 1016/1020 (5-minute limit exceeded), 1021 (no credit), 1022 (not whitelisted).

## Overarching topics

- Authentication (token-based: `getAuthenticationToken`, `apiKey`, `propKey`, `roomId`, 12-hour token validity, V1↔V2 migration)
- Rate limits and usage rules (one call at a time, 5-minute window, no-warning blocking, discretionary disable, data minimization)
- Error codes (six documented codes, their meanings, and usage-limit behavior)
- General request/response format (JSON primary, XML deprecated, CSV and OTA variants)
- API versioning (V1 → V2; XML functions deprecated in favor of JSON for new designs)
