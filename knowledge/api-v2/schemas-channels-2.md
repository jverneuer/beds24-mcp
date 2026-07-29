# Beds24 API V2 - Channel & Payment Schemas (Part 2)

> Extracted from `apiV2.yaml`, lines 7426-8349.
> Covers Stripe payment operations, review schemas, organization users, and shared component definitions (page parameter, token/organization security schemes).

---

## `stripeCreateSession`

**Base type:** `object`
**Usage context:** Request body for creating a Stripe Checkout Session (hosted payment page). Used by the Stripe payment-session creation endpoint, typically when a guest pays via a Beds24-hosted Stripe checkout.

| Field | Type | Required | Description/Example |
|-------|------|----------|---------------------|
| `action` | string | No | Action discriminator for the request. |
| `bookingId` | integer | No | The booking ID associated with the session. |
| `line_items` | array | No | Array of line items to include in the checkout session. |
| `line_items[].price_data` | object | No | Price configuration for the line item. |
| `line_items[].price_data.currency` | string | No | Three-letter ISO currency code (e.g. `usd`, `eur`). |
| `line_items[].price_data.product_data` | object | No | Product metadata for the line item. |
| `line_items[].price_data.product_data.name` | string | No | Display name of the product. |
| `line_items[].price_data.unit_amount` | integer (int32) | No | Unit amount in the smallest currency unit (e.g. cents). |
| `line_items[].quantity` | integer (int32) | No | Number of units being purchased. |
| `success_url` | string | No | URL to redirect to after a successful payment. |
| `cancel_url` | string | No | URL to redirect to if the guest cancels payment. |
| `capture` | boolean | No | Whether to immediately capture the payment (vs. authorize-only). |

**Used by:** Stripe "create session" endpoint (`POST .../stripe/createSession`).

---

## `stripeChargePaymentMethod`

**Base type:** `object`
**Usage context:** Request body for charging an existing stored Stripe payment method. Used when a guest has a saved card and the host charges it directly.

| Field | Type | Required | Description/Example |
|-------|------|----------|---------------------|
| `action` | string | No | Action discriminator for the request. |
| `bookingId` | integer | No | The booking ID to charge against. |
| `stripePaymentMethodId` | string | No | The Stripe PaymentMethod ID (e.g. `pm_...`). |
| `capture` | boolean | No | Whether to immediately capture the charge. |
| `amount` | number | No | Amount to charge, in the major currency unit. |
| `currency` | string | No | Three-letter ISO currency code. |
| `description` | string | No | Human-readable description for the charge. |
| `moto` | boolean | No | Mail-order / telephone-order (card-not-present) flag. |
| `source` | string | No | Source identifier for the charge. |

**Used by:** Stripe "charge payment method" endpoint (`POST .../stripe/chargePaymentMethod`).

---

## `stripeRefundCharge`

**Base type:** `object`
**Usage context:** Request body for refunding a previously captured Stripe charge.

| Field | Type | Required | Description/Example |
|-------|------|----------|---------------------|
| `action` | string | No | Action discriminator for the request. |
| `bookingId` | integer | No | The booking ID associated with the charge. |
| `stripeChargeId` | string | No | The Stripe Charge ID to refund (e.g. `ch_...`). |
| `amount` | number | No | Amount to refund. Omit or set for a partial refund. |

**Used by:** Stripe "refund charge" endpoint (`POST .../stripe/refundCharge`).

---

## `stripeReleaseCharge`

**Base type:** `object`
**Usage context:** Request body for releasing (voiding) an authorized-but-not-yet-captured Stripe charge. Releases the hold on the guest's card.

| Field | Type | Required | Description/Example |
|-------|------|----------|---------------------|
| `action` | string | No | Action discriminator for the request. |
| `bookingId` | integer | No | The booking ID associated with the charge. |
| `stripeChargeId` | string | No | The Stripe Charge ID to release (e.g. `ch_...`). |

**Used by:** Stripe "release charge" endpoint (`POST .../stripe/releaseCharge`).

---

## `stripeCaptureCharge`

**Base type:** `object`
**Usage context:** Request body for capturing a previously authorized Stripe charge.

| Field | Type | Required | Description/Example |
|-------|------|----------|---------------------|
| `action` | string | No | Action discriminator for the request. |
| `bookingId` | integer | No | The booking ID associated with the charge. |
| `stripeChargeId` | string | No | The Stripe Charge ID to capture (e.g. `ch_...`). |
| `amount` | number | No | Amount to capture (allows partial capture if less than authorized). |

**Used by:** Stripe "capture charge" endpoint (`POST .../stripe/captureCharge`).

---

## `stripeAddPaymentMethod`

**Base type:** `object`
**Usage context:** Request body for attaching a new card payment method to a booking/customer in Stripe.

| Field | Type | Required | Description/Example |
|-------|------|----------|---------------------|
| `action` | string | No | Action discriminator for the request. |
| `bookingId` | integer | No | The booking ID to attach the card to. |
| `card` | object | No | Card details to tokenize and store. |
| `card.number` | string | No | Card number (PAN). |
| `card.expiryMonth` | string | No | Card expiry month (e.g. `12`). |
| `card.expiryYear` | string | No | Card expiry year (e.g. `2027`). |
| `card.name` | string | No | Cardholder name. |
| `card.cvc` | string | No | Card security code (CVC/CVV). |
| `card.type` | string | No | Card storage type. Enum: `"guest"`, `"virtual"`. |

**Used by:** Stripe "add payment method" endpoint (`POST .../stripe/addPaymentMethod`).

---

## `stripeDetachPaymentMethod`

**Base type:** `object`
**Usage context:** Request body for detaching (removing) a stored Stripe payment method from its customer.

| Field | Type | Required | Description/Example |
|-------|------|----------|---------------------|
| `action` | string | No | Action discriminator for the request. |
| `bookingId` | integer | No | The booking ID associated with the payment method. |
| `stripePaymentMethodId` | string | No | The Stripe PaymentMethod ID to detach (e.g. `pm_...`). |

**Used by:** Stripe "detach payment method" endpoint (`POST .../stripe/detachPaymentMethod`).

---

## `stripePaymentMethod`

**Base type:** `object`
**Usage context:** Response body representing a stored Stripe PaymentMethod. Returned when adding or retrieving a payment method. Note: the spec explicitly states this object contains additional fields not enumerated here — only the most relevant are documented.

| Field | Type | Required | Description/Example |
|-------|------|----------|---------------------|
| `stripePaymentMethod` | object | No | Wrapper object for the Stripe PaymentMethod. *"This object will contain other fields not specified here."* |
| `stripePaymentMethod.id` | string | No | Stripe PaymentMethod ID (e.g. `pm_...`). |
| `stripePaymentMethod.object` | string | No | Object type. Example: `"payment_method"`. |
| `stripePaymentMethod.billing_details` | object | No | Billing details associated with the payment method. |
| `stripePaymentMethod.billing_details.address` | object | No | Billing address. |
| `stripePaymentMethod.billing_details.address.city` | string | No | City. |
| `stripePaymentMethod.billing_details.address.country` | string | No | Country. |
| `stripePaymentMethod.billing_details.address.line1` | string | No | Address line 1. |
| `stripePaymentMethod.billing_details.address.line2` | string | No | Address line 2. |
| `stripePaymentMethod.billing_details.address.postal_code` | string | No | Postal / ZIP code. |
| `stripePaymentMethod.billing_details.address.state` | string | No | State / region. |
| `stripePaymentMethod.billing_details.email` | string | No | Billing email address. |
| `stripePaymentMethod.billing_details.name` | string | No | Billing name. |
| `stripePaymentMethod.billing_details.phone` | string | No | Billing phone number. |

**Used by:** Stripe "add payment method" response and related payment-method read endpoints.

---

## `stripeCharge`

**Base type:** `object`
**Usage context:** Response body representing a Stripe Charge. Returned when charging, capturing, or retrieving a charge. Note: the spec explicitly states this object contains additional fields not enumerated here.

| Field | Type | Required | Description/Example |
|-------|------|----------|---------------------|
| `stripeCharge` | object | No | Wrapper object for the Stripe Charge. *"This object will contain other fields not specified here."* |
| `stripeCharge.id` | string | No | Stripe Charge ID (e.g. `ch_...`). |
| `stripeCharge.object` | string | No | Object type. Example: `"charge"`. |
| `stripeCharge.amount` | integer | No | Amount charged, in the smallest currency unit (e.g. cents). |
| `stripeCharge.amount_captured` | integer | No | Amount actually captured, in the smallest currency unit. |
| `stripeCharge.amount_refunded` | integer | No | Amount refunded so far, in the smallest currency unit. |
| `stripeCharge.billing_details` | object | No | Billing details associated with the charge. |
| `stripeCharge.billing_details.address` | object | No | Billing address. |
| `stripeCharge.billing_details.address.city` | string | No | City. |
| `stripeCharge.billing_details.address.country` | string | No | Country. |
| `stripeCharge.billing_details.address.line1` | string | No | Address line 1. |
| `stripeCharge.billing_details.address.line2` | string | No | Address line 2. |
| `stripeCharge.billing_details.address.postal_code` | string | No | Postal / ZIP code. |
| `stripeCharge.billing_details.address.state` | string | No | State / region. |
| `stripeCharge.billing_details.email` | string | No | Billing email address. |
| `stripeCharge.billing_details.name` | string | No | Billing name. |
| `stripeCharge.billing_details.phone` | string | No | Billing phone number. |
| `stripeCharge.currency` | string | No | Three-letter ISO currency code. |
| `stripeCharge.paid` | boolean | No | Whether the charge was paid (successful). |
| `stripeCharge.payment_intent` | string | No | Associated Stripe PaymentIntent ID (e.g. `pi_...`). |
| `stripeCharge.payment_method` | string | string | No | Payment method ID used for this charge (e.g. `pm_...`). |

**Used by:** Stripe "charge payment method", "capture charge", and charge read responses.

---

## `bookingReview`

**Base type:** `object`
**Usage context:** Response body representing a booking.com review. Returned by the booking-review listing/read endpoints. Mirrors the Booking.com review content model.

| Field | Type | Required | Description/Example |
|-------|------|----------|---------------------|
| `review_id` | string | No | Unique review identifier. |
| `created_timestamp` | string | No | Timestamp the review was created. Example: `2018-05-13 12:16:33`. |
| `last_change_timestamp` | string | No | Timestamp of the last modification. Example: `2018-05-13 12:16:33`. |
| `content` | object | No | Textual content of the review. |
| `content.language_code` | string | No | Language of the review. Example: `en`. |
| `content.headline` | string | No | Review headline. Example: `A room on the canal...`. |
| `content.positive` | string | No | Positive comments. Example: `It was great that ...`. |
| `content.negative` | string | No | Negative comments. Example: `What I really didn't like was that ...`. |
| `reservation_id` | integer | No | Reservation ID the review relates to. Example: `12345678`. |
| `scoring` | object | No | Numeric score breakdown. |
| `scoring.review_score` | number | No | Overall review score. Example: `9.5`. |
| `scoring.clean` | number | No | Cleanliness score. Example: `10`. |
| `scoring.facilities` | number | No | Facilities score. Example: `10`. |
| `scoring.location` | number | No | Location score. Example: `10`. |
| `scoring.services` | number | No | Services score. Example: `10`. |
| `scoring.staff` | number | No | Staff score. Example: `7.5`. |
| `scoring.value` | number | No | Value-for-money score. Example: `null`. |
| `reviewer` | object | No | Information about the reviewer. |
| `reviewer.country_code` | string | No | Reviewer's country code. Example: `fr`. |
| `reviewer.name` | string | No | Reviewer's name. Example: `John`. |
| `reviewer.is_genius` | boolean | No | Whether the reviewer is a Booking.com Genius member. |
| `reply` | object | No | Host's reply to the review. |
| `reply.text` | string | No | Reply text. Example: `Thank you for your review!`. |
| `reply.last_change_timestamp` | string | No | Timestamp of last change to the reply. Example: `2018-05-15 10:23:57`. |

**Used by:** Booking.com review listing/read endpoints.

---

## `airbnbReview`

**Base type:** `object`
**Usage context:** Response body representing an Airbnb listing review. Returned by the Airbnb review endpoints. Mirrors Airbnb's `listing_reviews` API — see Airbnb's own documentation for full semantics.

| Field | Type | Required | Description/Example |
|-------|------|----------|---------------------|
| `id` | string | No | Review ID. |
| `category_ratings` | array | No | Per-category ratings. |
| `category_ratings[].category` | string | No | Category name (e.g. `cleanliness`, `communication`, `accuracy`). |
| `category_ratings[].comment` | string | No | Comment specific to this category. |
| `category_ratings[].rating` | integer | No | Numeric rating for this category. |
| `category_ratings[].review_category_tags` | array of string | No | Tags associated with this category rating. |
| `expires_at` | integer (date-time) | No | Expiration time of the review window. |
| `first_completed_at` | string (date-time) | No | When the review was first completed. |
| `hidden` | boolean | No | Whether the review is hidden. |
| `overall_rating` | integer (int32) | No | Overall numeric rating. |
| `private_feedback` | string | No | Private feedback from reviewer to host. |
| `public_review` | string | No | Public review text shown on the listing. |
| `responded_at` | string | No | When the reviewee responded. |
| `reviewee_id` | string | No | ID of the person/listing being reviewed. |
| `reviewee_response` | string | No | Response from the reviewee (host). |
| `reviewee_role` | string | No | Role of the reviewee (e.g. `host`). |
| `reviewer_id` | string | No | ID of the reviewer (guest). |
| `reviewer_role` | string | No | Role of the reviewer (e.g. `guest`). |
| `submitted` | boolean | No | Whether the review has been submitted. |
| `submitted_at` | string | No | When the review was submitted. |

**Used by:** Airbnb review listing/read endpoints.

---

## `organizationUser`

**Base type:** `object`
**Usage context:** Response body representing an organization user with their accessible properties and room types. Returned by user/organization lookup endpoints.

| Field | Type | Required | Description/Example |
|-------|------|----------|---------------------|
| `ownerId` | integer | No | Owner (account) ID. |
| `masterId` | string (nullable) | No | Master account ID, nullable. |
| `email` | string | No | User's email address. |
| `properties` | array | No | Properties this user can access. |
| `properties[].id` | integer | No | Property ID. |
| `properties[].name` | string | No | Property name. |
| `properties[].country` | string | No | Property country. |
| `properties[].currency` | string | No | Property default currency. |
| `properties[].roomTypes` | array | No | Room types belonging to the property. |
| `properties[].roomTypes[].id` | integer (int32) | No | Room type ID. |
| `properties[].roomTypes[].name` | string | No | Room type name. |
| `properties[].roomTypes[].qty` | integer (int32) | No | Quantity of rooms of this type. |

**Used by:** Organization user info / current-user endpoints.

---

## `page`

**Base type:** query parameter (`integer`)
**Usage context:** A reusable query parameter defined in `components/parameters` for paginating list endpoints. Not a schema per se — a parameter object whose `schema.type` is `integer`.

| Property | Value |
|----------|-------|
| `name` | `page` |
| `in` | `query` |
| `description` | Get a page of items beyond the first |
| `schema.type` | integer |

**Used by:** All paginated list endpoints across the API (referenced via `$ref: '#/components/parameters/page'`).

---

## `token`

**Base type:** security scheme (`apiKey`)
**Usage context:** Reusable security scheme in `components/securitySchemes`. Primary authentication mechanism — a long-life token or a token generated from a refresh token, passed in a header.

| Property | Value |
|----------|-------|
| `type` | apiKey |
| `name` | `token` |
| `in` | header |
| `description` | Include your token here (either a long life token or one generated using a refresh token) |

**Used by:** Secured endpoints that accept token-based auth (referenced via `$ref: '#/components/securitySchemes/token'`).

---

## `organization`

**Base type:** security scheme (`apiKey`)
**Usage context:** Reusable security scheme in `components/securitySchemes`. Required only for integration partners, passed as a header on every request.

| Property | Value |
|----------|-------|
| `type` | apiKey |
| `name` | `organization` |
| `in` | header |
| `description` | If you are an integration partner you must include your organization name in this header with each request. If you are not an integration partner do not include this header. |

**Used by:** Endpoints requiring partner-organization context (referenced via `$ref: '#/components/securitySchemes/organization'`).
