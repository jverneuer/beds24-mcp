/**
 * Channel actions, channel reviews, and Stripe payments.
 *
 * Encodes the channel workflows documented in knowledge/api-v2/channels-and-webhooks.md:
 *  - Airbnb / Booking.com "perform actions" (POST /channels/airbnb, /channels/booking) —
 *    each sends an array of action objects discriminated by their `action` enum
 *  - channel review / user reads (GET /channels/airbnb/users, /channels/airbnb/reviews,
 *    /channels/booking/reviews) — paginated reads of Airbnb users, Airbnb reviews, and
 *    Booking.com reviews
 *  - Stripe checkout integration (POST /channels/stripe plus the charges /
 *    payment-methods reads) — create sessions, charge / refund / capture, and manage
 *    payment methods
 *
 * Every type here WRAPS the generated OpenAPI schemas (see api-types.ts) — none of them
 * redefine a wire field. The action enums are locked to the generated string unions
 * with `satisfies`, so they can never drift from the spec.
 */

import type { Beds24Client, Beds24Response } from "../client.js";
import type { OpOf, RequestBodyOf, ResponseBodyOf } from "../api-types.js";

// ── Airbnb + Booking.com actions ────────────────────────────────────────────

/** POST /channels/airbnb request body: an array of these action elements. */
export type AirbnbActionRequest = RequestBodyOf<OpOf<"POST /channels/airbnb">>;
/** A single Airbnb action element. */
export type AirbnbAction = AirbnbActionRequest[number];
/** Decoded POST /channels/airbnb response `data`. */
export type AirbnbActionResponse = ResponseBodyOf<OpOf<"POST /channels/airbnb">>;
/** POST /channels/booking request body: an array of these action elements. */
export type BookingActionRequest = RequestBodyOf<OpOf<"POST /channels/booking">>;
/** A single Booking.com action element. */
export type BookingAction = BookingActionRequest[number];
/** Decoded POST /channels/booking response `data`. */
export type BookingActionResponse = ResponseBodyOf<OpOf<"POST /channels/booking">>;

/**
 * Airbnb `action` values (channels-and-webhooks.md §3.4).
 *
 * Locked to the generated enum with `satisfies`, so it can never drift from the spec.
 */
export const AirbnbActionType = {
	ImportAsNewProperty: "importAsNewProperty",
	ImportToExistingProperty: "importToExistingProperty",
	ConnectToExistingRoom: "connectToExistingRoom",
	DisconnectRoom: "disconnectRoom",
} as const satisfies Record<string, NonNullable<AirbnbAction["action"]>>;
export type AirbnbActionType = (typeof AirbnbActionType)[keyof typeof AirbnbActionType];

/**
 * How deeply an Airbnb listing is synced (channels-and-webhooks.md §3.4).
 *
 * Locked to the generated `connect` enum with `satisfies`.
 */
export const AirbnbConnect = {
	None: "none",
	Inventory: "inventory",
	Limited: "limited",
	Full: "full",
} as const satisfies Record<string, NonNullable<AirbnbAction["connect"]>>;
export type AirbnbConnect = (typeof AirbnbConnect)[keyof typeof AirbnbConnect];

/**
 * Booking.com `action` values (channels-and-webhooks.md §4.2).
 *
 * `reportInvalidCard` is only available before check-in, `reportNoShow` only from
 * check-in for 2 days, and `reportCancel` only cancels once all prerequisites are met.
 * Locked to the generated enum with `satisfies`.
 */
export const BookingActionType = {
	ReportInvalidCard: "reportInvalidCard",
	ReportNoShow: "reportNoShow",
	ReportCancel: "reportCancel",
} as const satisfies Record<string, NonNullable<BookingAction["action"]>>;
export type BookingActionType = (typeof BookingActionType)[keyof typeof BookingActionType];

// ── Channel reviews / users ─────────────────────────────────────────────────

/**
 * GET /channels/airbnb/users query params.
 *
 * The endpoint takes no query parameters — the API returns every Airbnb user id
 * linked to the account (channels-and-webhooks.md §3.1). The param is typed as the
 * generated `RequestBodyOf` (which is `undefined` here) so it can never drift.
 */
export type AirbnbUsersQuery = RequestBodyOf<OpOf<"GET /channels/airbnb/users">>;
/** Decoded GET /channels/airbnb/users response `data`. */
export type AirbnbUsersResponse = ResponseBodyOf<OpOf<"GET /channels/airbnb/users">>;
/** GET /channels/airbnb/reviews query params. `roomId` is required. */
export type AirbnbReviewsQuery = RequestBodyOf<OpOf<"GET /channels/airbnb/reviews">>;
/** Decoded GET /channels/airbnb/reviews response `data`. */
export type AirbnbReviewsResponse = ResponseBodyOf<OpOf<"GET /channels/airbnb/reviews">>;
/** GET /channels/booking/reviews query params. `propertyId` and `from` are required. */
export type BookingReviewsQuery = RequestBodyOf<OpOf<"GET /channels/booking/reviews">>;
/** Decoded GET /channels/booking/reviews response `data`. */
export type BookingReviewsResponse = ResponseBodyOf<OpOf<"GET /channels/booking/reviews">>;

// ── Stripe payments ─────────────────────────────────────────────────────────

/** POST /channels/stripe request body: an array of these action elements. */
export type StripeActionRequest = RequestBodyOf<OpOf<"POST /channels/stripe">>;
/** A single Stripe action element (one of the seven generated stripe* schemas). */
export type StripeAction = StripeActionRequest[number];
/** Decoded POST /channels/stripe response `data`. */
export type StripeActionResponse = ResponseBodyOf<OpOf<"POST /channels/stripe">>;
/** GET /channels/stripe/paymentMethods query params. `bookingId` is required. */
export type StripePaymentMethodsQuery = RequestBodyOf<OpOf<"GET /channels/stripe/paymentMethods">>;
/** Decoded GET /channels/stripe/paymentMethods response `data`. */
export type StripePaymentMethodsResponse = ResponseBodyOf<OpOf<"GET /channels/stripe/paymentMethods">>;
/** GET /channels/stripe/charges query params. `bookingId` is required. */
export type StripeChargesQuery = RequestBodyOf<OpOf<"GET /channels/stripe/charges">>;
/** Decoded GET /channels/stripe/charges response `data`. */
export type StripeChargesResponse = ResponseBodyOf<OpOf<"GET /channels/stripe/charges">>;

export class ChannelActionsOps {
	constructor(private client: Beds24Client) {}

	/**
	 * Perform actions at Airbnb (Alpha; channels-and-webhooks.md §3.4). Each element
	 * is an `AirbnbAction` discriminated by its `action` enum — import a property,
	 * connect a room, or disconnect one.
	 */
	async pushToAirbnb(
		drafts: AirbnbAction | AirbnbAction[],
	): Promise<Beds24Response<AirbnbActionResponse>> {
		const items = Array.isArray(drafts) ? drafts : [drafts];
		return this.client.request("POST /channels/airbnb", items);
	}

	/**
	 * Perform actions at Booking.com (Alpha; channels-and-webhooks.md §4.2). Each
	 * element is a `BookingAction` — report an invalid card, a no-show, or a
	 * cancellation request.
	 */
	async pushToBookingCom(
		drafts: BookingAction | BookingAction[],
	): Promise<Beds24Response<BookingActionResponse>> {
		const items = Array.isArray(drafts) ? drafts : [drafts];
		return this.client.request("POST /channels/booking", items);
	}
}

export class ReviewsOps {
	constructor(private client: Beds24Client) {}

	/**
	 * List every Airbnb user id linked to the account (Beta;
	 * channels-and-webhooks.md §3.1). Takes no query parameters.
	 */
	async getAirbnbUsers(query?: AirbnbUsersQuery): Promise<Beds24Response<AirbnbUsersResponse>> {
		return this.client.request("GET /channels/airbnb/users", query);
	}

	/**
	 * Read guest reviews from Airbnb (Beta; channels-and-webhooks.md §3.3).
	 * `roomId` is required. At most 100 reviews are returned at once.
	 */
	async getAirbnbReviews(query: AirbnbReviewsQuery): Promise<Beds24Response<AirbnbReviewsResponse>> {
		return this.client.request("GET /channels/airbnb/reviews", query);
	}

	/**
	 * Read reviews from Booking.com (Alpha; channels-and-webhooks.md §4.1).
	 * `propertyId` and `from` are required. At most 100 reviews are returned.
	 */
	async getBookingComReviews(query: BookingReviewsQuery): Promise<Beds24Response<BookingReviewsResponse>> {
		return this.client.request("GET /channels/booking/reviews", query);
	}
}

export class StripeOps {
	constructor(private client: Beds24Client) {}

	/**
	 * Perform a Stripe action (Alpha; channels-and-webhooks.md §5.1) — create a
	 * Checkout session, charge / refund / capture a payment, or attach / detach a
	 * payment method. Each element is a `StripeAction` discriminated by its `action`.
	 */
	async setupStripe(
		drafts: StripeAction | StripeAction[],
	): Promise<Beds24Response<StripeActionResponse>> {
		const items = Array.isArray(drafts) ? drafts : [drafts];
		return this.client.request("POST /channels/stripe", items);
	}

	/**
	 * Read the Stripe payment methods attached to a booking (Alpha;
	 * channels-and-webhooks.md §5). `bookingId` is required.
	 */
	async getStripePaymentMethods(
		query: StripePaymentMethodsQuery,
	): Promise<Beds24Response<StripePaymentMethodsResponse>> {
		return this.client.request("GET /channels/stripe/paymentMethods", query);
	}

	/**
	 * Read the Stripe charges for a booking (Alpha; channels-and-webhooks.md §5).
	 * `bookingId` is required.
	 */
	async getStripeCharges(query: StripeChargesQuery): Promise<Beds24Response<StripeChargesResponse>> {
		return this.client.request("GET /channels/stripe/charges", query);
	}
}
