# Beds24 API — Authentication

Token-based authentication. Every API session starts by obtaining a token, then uses that token for all subsequent calls.

## Enabling API access

- API access must be enabled in the Beds24 control panel before any calls will succeed: **SETTINGS >> ACCOUNT >> ACCOUNT ACCESS**. [extracted 2026-07-28] [api](https://www.beds24.com/api/)

## Obtaining a token — `getAuthenticationToken`

- The API uses **token-based authentication**. To obtain a token, call the `getAuthenticationToken` method using your `apiKey` and `propKey`. [extracted 2026-07-28] [api → documentation/en/](https://www.beds24.com/api/documentation/en/)
- The returned token is **valid for 12 hours** and must be used for all subsequent API calls. [extracted 2026-07-28] [api → documentation/en/](https://www.beds24.com/api/documentation/en/)
- Example call: `https://api.beds24.com/getAuthenticationToken?apiKey=YOUR_API_KEY&propKey=YOUR_PROP_KEY&token=YOUR_TOKEN` [extracted 2026-07-28] [api → documentation/en/getauthenticationtoken.html](https://www.beds24.com/api/documentation/en/getauthenticationtoken.html)

## Inputs to `getAuthenticationToken`

| Parameter | Type | Description |
|-----------|------|-------------|
| `apiKey` | string | The API key obtained from the Beds24 partner interface. |
| `propKey` | string | The property key obtained from the Beds24 partner interface. |
| `token` | string | An existing token (used for token refresh scenarios). |

Sources: [extracted 2026-07-28] [api → documentation/en/getauthenticationtoken.html](https://www.beds24.com/api/documentation/en/getauthenticationtoken.html)

## Output of `getAuthenticationToken`

| Parameter | Description |
|-----------|-------------|
| `token` | An authentication token valid for 12 hours. |

Source: [extracted 2026-07-28] [api → documentation/en/getauthenticationtoken.html](https://www.beds24.com/api/documentation/en/getauthenticationtoken.html)

## apiKey

- Required for most JSON methods to access an account. [extracted 2026-07-28] [api → json/](https://www.beds24.com/api/json/)
- Configured at **SETTINGS >> ACCOUNT >> ACCOUNT ACCESS**. [extracted 2026-07-28] [api → json/](https://www.beds24.com/api/json/)
- Should be **between 16 and 64 characters long** and kept secure. [extracted 2026-07-28] [api → json/](https://www.beds24.com/api/json/)
- Anyone who has access to it can view or potentially make changes in the account. [extracted 2026-07-28] [api → json/](https://www.beds24.com/api/json/)

## propKey

- Required for property and room access. [extracted 2026-07-28] [api → json/](https://www.beds24.com/api/json/)
- Available at **SETTINGS >> PROPERTY >> LINK >> PROPKEY**. [extracted 2026-07-28] [api → json/](https://www.beds24.com/api/json/)
- Should be **between 16 and 64 characters long** and kept secure. [extracted 2026-07-28] [api → json/](https://www.beds24.com/api/json/)

## roomId

- Required for room-level changes. [extracted 2026-07-28] [api → json/](https://www.beds24.com/api/json/)
- A system-generated number unique to each room. [extracted 2026-07-28] [api → json/](https://www.beds24.com/api/json/)

## V1 ↔ V2 token migration

- `getV2RefreshToken` creates **an API V2 refresh token from API V1 credentials**, implying V2 is the newer API. [extracted 2026-07-28] [api](https://www.beds24.com/api/)

## What the sources do NOT specify

The public overview pages do not document the exact HTTP mechanism for passing the token on subsequent calls (e.g. query parameter name, header name, or POST field name beyond the `token` input shown in the `getAuthenticationToken` example). For the precise per-call token-passing format, consult the individual method documentation at `api.beds24.com` or the official docs site.
