# Utility API Methods

Utility endpoints for payment processing (Stripe) and V2 API token management.

---

## createStripeSession

Creates a Stripe Checkout session for receiving payments into the property's Stripe account. The session can generate a Stripe checkout page. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28]

### Purpose
- Creates a Stripe Checkout session that can generate a hosted Stripe checkout page. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28]
- Payments are received directly into the property's own Stripe account. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28]

### Endpoint
- POST `https://www.beds24.com/api/json/createStripeSession` [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28]
- Request format: JSON. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28]

### Top-Level Parameters

| Parameter | Type | Required/Optional | Description |
|-----------|------|-------------------|-------------|
| `authentication` | Object | Required | Contains authentication credentials. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28] |
| `line_items` | Array | Required | Items for checkout, format per Stripe documentation. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28] |
| `success_url` | String | Required | URL redirected to after successful payment; can include `{CHECKOUT_SESSION_ID}` placeholder. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28] |
| `cancel_url` | String | Required | URL redirected to if payment is cancelled. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28] |
| `bookId` | String | Optional | Existing booking ID; payments will be added to the booking's invoice. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28] |
| `capture` | Boolean | Optional | When set to `false`, authorizes the amount without collecting funds (default is `true`). [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28] |

### authentication Object

| Parameter | Type | Description |
|-----------|------|-------------|
| `apiKey` | String | API key as set in account settings. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28] |
| `propKey` | String | Property key set for the specific property. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28] |

### line_items Array Element

| Parameter | Type | Description |
|-----------|------|-------------|
| `price_data` | Object | Pricing information. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28] |
| `quantity` | Integer | Number of units. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28] |

### price_data Object

| Parameter | Type | Description |
|-----------|------|-------------|
| `currency` | String | Currency code (e.g., `"eur"`). [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28] |
| `product_data` | Object | Product details. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28] |
| `unit_amount` | Integer | Amount in the currency's smallest unit (e.g., `20000` = €200.00 for EUR/USD cents). [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28] |

### product_data Object

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | String | Product name displayed to the customer. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28] |

### Response
- Returns the Stripe session object as JSON. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28]
- Response includes a session id that can be used to create the Stripe checkout in your app. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28]
- Response includes a `stripe_account` value prefixed with `acct_`. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28]

### Client-Side Stripe Initialization
After receiving the response, initialize Stripe.js using the publishable key and the `stripe_account` from the response: [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28]

```javascript
var stripe = Stripe('pk_live_zWSW2ykzZoq4mYcKg9c8jmHS', {
  stripeAccount: 'acct_stripe_account-value-from-response'
});
```

### Example Request Body
```json
{
    "authentication": {
        "apiKey": "apiKeyAsSetInAccountSettings",
        "propKey": "propKeyAsSetForTheProperty"
    },
    "line_items": [
        {
            "price_data": {
                "currency": "eur",
                "product_data": {
                    "name": "Accomodation"
                },
                "unit_amount": 20000
            },
            "quantity": 1
        }
    ],
    "success_url": "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
    "cancel_url": "https://example.com/cancel",
    "bookId": "12345678",
    "capture": true
}
```
[https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28]

### Notes
- The `line_items` structure follows Stripe's documented format for checkout session objects. [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28]
- `unit_amount` is denominated in the currency's smallest unit (e.g., cents for EUR/USD). [https://www.beds24.com/api/json/createStripeSession] [extracted 2026-07-28]

---

## getV2RefreshToken

Obtains a V2 refresh token for authenticating with the Beds24 V2 API. [https://www.beds24.com/api/json/getV2RefreshToken] [extracted 2026-07-28]

### Purpose
- Posts JSON data to obtain a V2 refresh token used for V2 API authentication. [https://www.beds24.com/api/json/getV2RefreshToken] [extracted 2026-07-28]

### Endpoint
- POST `https://www.beds24.com/api/json/getV2RefreshToken` [https://www.beds24.com/api/json/getV2RefreshToken] [extracted 2026-07-28]
- Request format: JSON. [https://www.beds24.com/api/json/getV2RefreshToken] [extracted 2026-07-28]

### Parameters

| Parameter | Type | Required/Optional | Description |
|-----------|------|-------------------|-------------|
| `authentication` | Object | Required | Contains authentication credentials. [https://www.beds24.com/api/json/getV2RefreshToken] [extracted 2026-07-28] |

### authentication Object

| Parameter | Type | Required/Optional | Description |
|-----------|------|-------------------|-------------|
| `apiKey` | String | Required | API key as set in account settings. [https://www.beds24.com/api/json/getV2RefreshToken] [extracted 2026-07-28] |
| `propKey` | String | Required | Property key set for the specific property. [https://www.beds24.com/api/json/getV2RefreshToken] [extracted 2026-07-28] |

### Example Request Body
```json
{
    "authentication": {
        "apiKey": "apiKeyAsSetInAccountSettings",
        "propKey": "propKeyAsSetForTheProperty"
    }
}
```
[https://www.beds24.com/api/json/getV2RefreshToken] [extracted 2026-07-28]

### Notes
- Requires valid `apiKey` and `propKey` values submitted within the request body's `authentication` object. [https://www.beds24.com/api/json/getV2RefreshToken] [extracted 2026-07-28]
- Response structure, status codes, error format, and rate limits are not documented on the source page. [https://www.beds24.com/api/json/getV2RefreshToken] [extracted 2026-07-28]
