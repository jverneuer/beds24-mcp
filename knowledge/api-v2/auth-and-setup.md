# Beds24 API V2 — Authentication, Tokens & Setup

> A practical cookbook for getting authenticated and making your first V2 calls. This covers **only** what you need to stand up auth: the manual setup step, the token lifecycle, scopes, credits/rate limits, and general request conventions. [extracted 2026-07-28]

---

## 1. V2 vs V1 — what changed

V1 is deprecated; new projects should use V2. [extracted 2026-07-28] The auth model is fundamentally different:

| Concept | V1 | V2 |
|---|---|---|
| Per-call credentials | `apiKey` + `propKey` passed on every request | Single `token` header; property context is baked into the token [extracted 2026-07-28] |
| Auth granularity | Per-property keys | Scopes (resource + method qualifiers) set once at invite-code creation [extracted 2026-07-28] |
| Cost model | Not credit-based | Credit-based rate limiting, shared per account [extracted 2026-07-28] |
| Token lifetime | Long-lived keys | Short-lived 24h tokens + refresh tokens / long-life tokens [extracted 2026-07-28] |

**V1 ↔ V2 mapping:** the V1 `apiKey`/`propKey` pair is replaced by the V2 `token` header. Property access is no longer a per-request parameter — it is bound to the token when you create the invite code (and optionally via the "Allow linked properties" flag). [extracted 2026-07-28]

V2 does **not** yet support sending pictures directly (planned). [extracted 2026-07-28]

---

## 2. Step-by-step auth setup

There is exactly **one** manual step; everything after it can be automated. [extracted 2026-07-28]

### Step 1 — Generate an invite code (manual)

Log in and open **SETTINGS > MARKETPLACE > API**, or go directly to:

```
https://beds24.com/control3.php?pagetype=apiv2
```

[extracted 2026-07-28]

On that page you choose:

- **Scopes** (resource + method) — immutable after creation; to change them you must generate a new code. [extracted 2026-07-28]
- **"Allow linked properties"** — tick this if the token must see linked properties. It is off by default. [extracted 2026-07-28]

You end up with one of two artifacts:

1. An **invite code** — exchange it in Step 2. Expires after **24 hours**. [extracted 2026-07-28]
2. A **long-life token** — skip straight to using it as the `token` header (read-only; see §3). [extracted 2026-07-28]

### Step 2 — Exchange invite code for tokens

```
GET /authentication/setup
```

Pass the invite code. Returns a `token` and a `refreshToken`. [extracted 2026-07-28]

### Step 3 — Authenticate API calls

Pass the current token on every request as a header:

```
token: {token}
```

[extracted 2026-07-28]

### Step 4 — Refresh an expired token

Tokens from refresh tokens expire after 24 hours. Mint a new one with: [extracted 2026-07-28]

```
GET /authentication/token
```

Pass the refresh token. Example:

```bash
curl -X 'GET' \
  'https://beds24.com/api/v2/authentication/token' \
  -H 'accept: application/json' \
  -H 'refreshToken: Ea6DftE50aYYRe/qAd9SkQaSmTF6kaLQxH6gtRxO1h10yVC64d4qIj4BGiQOU+y5'
```

Response:

```json
{
  "token": "wEoJHQIwRrLwHqTqAsn0/XjzaZkVk4E8sSDwbRN2HKDlulkt6n7aHQCcvdqfX+y5",
  "expiresIn": 3600
}
```

[extracted 2026-07-28]

### Supporting auth endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/authentication/setup` | Exchange invite code → token + refreshToken [extracted 2026-07-28] |
| `GET` | `/authentication/token` | Refresh token → new 24h token [extracted 2026-07-28] |
| `DELETE` | `/authentication/token` | Delete (revoke) a refresh token [extracted 2026-07-28] |
| `GET` | `/authentication/details` | Token info + diagnostics [extracted 2026-07-28] |

---

## 3. Token lifecycle

Tokens are **152–172 characters** long. [extracted 2026-07-28]

| Token type | Lifetime | Header | Use case |
|---|---|---|---|
| Invite code | 24 hours, one-time exchange | — (passed to `/setup`) | Bootstrap only [extracted 2026-07-28] |
| Token (from refresh) | **24 hours** | `token: {token}` | Read + write API calls [extracted 2026-07-28] |
| Refresh token | Indefinite, **if used at least once every 30 days** | `refreshToken: {...}` (to `/token`) | Mint new 24h tokens [extracted 2026-07-28] |
| Long-life token | Indefinite, **if used at least once every 90 days** | `token: {token}` | Read-only access without a refresh loop [extracted 2026-07-28] |

**Reuse tokens.** A 24h token can serve many requests; fetching a new one costs credits. [extracted 2026-07-28]

---

## 4. Scopes

Scopes are chosen when the invite code is created and **cannot be changed afterward** — to alter scope you must generate a new invite code. [extracted 2026-07-28]

### Method qualifiers

Each resource scope pairs with a method qualifier: [extracted 2026-07-28]

| Qualifier | Meaning |
|---|---|
| `read:` | Retrieve [extracted 2026-07-28] |
| `write:` | Create / modify [extracted 2026-07-28] |
| `delete:` | Remove (parent items) [extracted 2026-07-28] |
| `all:` | Shortcut = read + write + update + delete [extracted 2026-07-28] |

Note on deletes: deleting a **subitem** requires `write:`; deleting the **parent** item requires `delete:`. [extracted 2026-07-28]

### Resource scopes

| Scope | Unlocks | Qualifier example |
|---|---|---|
| `bookings` | `GET /bookings`, `POST /bookings` (basic info) [extracted 2026-07-28] | `read:bookings`, `write:bookings` |
| `bookings-personal` | Personal/guest data on the above **plus** `GET/POST/PATCH /bookings/messages` [extracted 2026-07-28] | `read:bookings-personal` |
| `bookings-financial` | Financial/invoice data on `GET/POST /bookings` [extracted 2026-07-28] | `read:bookings-financial` |
| `inventory` | `GET /inventory/rooms/offers`, `GET /inventory/rooms/availability`, `GET/POST /inventory/rooms/calendar` [extracted 2026-07-28] | `read:inventory`, `write:inventory` |
| `properties` | `GET/POST /properties` [extracted 2026-07-28] | `read:properties`, `write:properties` |
| `accounts` | `GET/POST /accounts` [extracted 2026-07-28] | `read:accounts`, `write:accounts` |

`bookings-personal` and `bookings-financial` are **additive** — they layer on top of `bookings`. [extracted 2026-07-28]

---

## 5. Credits & rate limits

V2 uses a credit-based rate limit. [extracted 2026-07-28]

| Setting | Value |
|---|---|
| Default limit | **100 credits per 5-minute window** [extracted 2026-07-28] |
| Scope | **Per account**, shared across all tokens of that account [extracted 2026-07-28] |
| Sub-accounts | Separate limits [extracted 2026-07-28] |
| Cost per request | **Dynamic**, based on complexity [extracted 2026-07-28] |
| Exhaustion | Hard block until the window resets [extracted 2026-07-28] |
| Upgrade | **200 credits / 5 min for €10/month** (open a support ticket; further increases available) [extracted 2026-07-28] |

### Reading credit state from response headers

Every response carries these headers: [extracted 2026-07-28]

| Header | Meaning |
|---|---|
| `x-five-min-limit-remaining` | Credits left in the current window [extracted 2026-07-28] |
| `x-five-min-limit-resets-in` | Seconds until the window resets [extracted 2026-07-28] |
| `x-request-cost` | Credits consumed by that request [extracted 2026-07-28] |

**Best practice:** reuse your 24h token across requests instead of minting a new one each time — getting a new token costs credits. [extracted 2026-07-28]

---

## 6. General request conventions

### Headers

- Auth: `token: {token}` (required on all calls except the refresh step, which uses `refreshToken:`). [extracted 2026-07-28]
- Accept: `application/json`. [extracted 2026-07-28]

### POST array behavior

POST endpoints accept a **JSON array** of items. The response array **mirrors the request order**; each item carries a `success` boolean plus optional buckets: [extracted 2026-07-28]

| Response field | Meaning |
|---|---|
| `success` | Per-item boolean [extracted 2026-07-28] |
| `New` | Newly created items/subitems [extracted 2026-07-28] |
| `Modified` | Changed items/subitems [extracted 2026-07-28] |
| `Errors` | Fatal issues [extracted 2026-07-28] |
| `Warnings` | Non-fatal issues [extracted 2026-07-28] |
| `Info` | General notes [extracted 2026-07-28] |

Item identity rules inside a POST array: [extracted 2026-07-28]

- **New item** → omit `id`.
- **Modify item** → include `id`.
- **Delete subitem** → send only `id` (requires `write:` on the parent scope).

### Payload limits

- **~1 MB** per POST payload. [extracted 2026-07-28]
- Up to **10,000** top-level JSON array items per request. [extracted 2026-07-28]

### Bulk & polling guidance

- **Prefer webhooks over polling** for new messages/bookings. [extracted 2026-07-28]
- **Group high-frequency writes** into bulk POSTs (e.g. one every ~30s) instead of one request per item. [extracted 2026-07-28]
- Retrieve/update multiple items in one call by passing multiple IDs. [extracted 2026-07-28]

---

## 7. Quick code example (JavaScript)

```javascript
const BASE = 'https://beds24.com/api/v2';

// --- 1. Mint a 24h token from the refresh token (do this on a schedule < 24h) ---
async function getToken(refreshToken) {
  const res = await fetch(`${BASE}/authentication/token`, {
    method: 'GET',
    headers: { accept: 'application/json', refreshToken },
  });
  if (!res.ok) throw new Error(`token refresh failed: ${res.status}`);
  const { token } = await res.json();
  return token;
}

// --- 2. Call an endpoint, mirroring the POST-array response shape ---
async function getBookings(token, filters) {
  const res = await fetch(`${BASE}/bookings?${new URLSearchParams(filters)}`, {
    method: 'GET',
    headers: { accept: 'application/json', token },
  });

  // Inspect credit state (see §5)
  console.log('remaining:',  res.headers.get('x-five-min-limit-remaining'));
  console.log('resets in:', res.headers.get('x-five-min-limit-resets-in'));
  console.log('cost:',      res.headers.get('x-request-cost'));

  if (!res.ok) throw new Error(`bookings failed: ${res.status}`);
  return res.json(); // array of items, each: { success, New, Modified, Errors, Warnings, Info }
}

// --- 3. Wire it together ---
const token = await getToken(process.env.BEDS24_REFRESH_TOKEN);
const bookings = await getBookings(token, { propertyId: 12345 });
```

[extracted 2026-07-28]

---

## Source notes

- All factual statements cite the Beds24 API V2 wiki: `https://wiki.beds24.com/index.php/API_V2.0` and the V2 endpoint listing `https://beds24.com/api/v2/`. [extracted 2026-07-28]
- The OpenAPI spec lives at `https://beds24.com/api/v2/apiV2.yaml`. [extracted 2026-07-28]
- Endpoint maturity varies: core Authentication/Bookings/Inventory are stable; Properties, Accounts, Channels, and Webhooks are Alpha/Beta/coming-soon. [extracted 2026-07-28]
