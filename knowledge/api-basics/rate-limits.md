# Beds24 API — Rate Limits and Usage Rules

The API enforces strict concurrency and volume limits. Violations can block or disable your account without warning.

## Concurrency — one call at a time

- **Only one API call at a time is allowed.** You must wait for the first call to complete before starting the next API call. [extracted 2026-07-28] [api](https://www.beds24.com/api/)
- Multiple calls should be spaced with **a few seconds delay** between each call. [extracted 2026-07-28] [api](https://www.beds24.com/api/)

## Volume — the 5-minute window

- **Excessive usage within a 5-minute period will cause your account to be blocked without warning.** [extracted 2026-07-28] [api](https://www.beds24.com/api/)
- Excessive usage will cause your account to be blocked without warning (restated on the JSON API page). [extracted 2026-07-28] [api → json/](https://www.beds24.com/api/json/)

## Discretionary enforcement

- The provider **reserves the right to disable any access** it considers to be making excessive use of the API functions, **at its complete discretion and without warning**. [extracted 2026-07-28] [api](https://www.beds24.com/api/)

## Data-minimization rules

- API calls should be used **sparingly** and kept to the minimum required for reasonable business usage. [extracted 2026-07-28] [api](https://www.beds24.com/api/)
- Calls should be designed to send and receive **only the minimum required data**. [extracted 2026-07-28] [api](https://www.beds24.com/api/)

## Implications for clients

- Never issue parallel/overlapping calls; serialize them and wait for each response.
- Insert a few seconds of spacing between successive calls.
- Keep payloads minimal (request only needed fields/date ranges) to stay under the 5-minute threshold.
- Treat the blocking as **no-warning**: there is no documented "you are close" grace state — error `1016`/`1020` is the only documented signal that the limit was exceeded.
