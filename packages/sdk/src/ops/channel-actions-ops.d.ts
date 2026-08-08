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
export declare const AirbnbActionType: {
    readonly ImportAsNewProperty: "importAsNewProperty";
    readonly ImportToExistingProperty: "importToExistingProperty";
    readonly ConnectToExistingRoom: "connectToExistingRoom";
    readonly DisconnectRoom: "disconnectRoom";
};
export type AirbnbActionType = (typeof AirbnbActionType)[keyof typeof AirbnbActionType];
/**
 * How deeply an Airbnb listing is synced (channels-and-webhooks.md §3.4).
 *
 * Locked to the generated `connect` enum with `satisfies`.
 */
export declare const AirbnbConnect: {
    readonly None: "none";
    readonly Inventory: "inventory";
    readonly Limited: "limited";
    readonly Full: "full";
};
export type AirbnbConnect = (typeof AirbnbConnect)[keyof typeof AirbnbConnect];
/**
 * Booking.com `action` values (channels-and-webhooks.md §4.2).
 *
 * `reportInvalidCard` is only available before check-in, `reportNoShow` only from
 * check-in for 2 days, and `reportCancel` only cancels once all prerequisites are met.
 * Locked to the generated enum with `satisfies`.
 */
export declare const BookingActionType: {
    readonly ReportInvalidCard: "reportInvalidCard";
    readonly ReportNoShow: "reportNoShow";
    readonly ReportCancel: "reportCancel";
};
export type BookingActionType = (typeof BookingActionType)[keyof typeof BookingActionType];
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
export declare class ChannelActionsOps {
    private client;
    constructor(client: Beds24Client);
    /**
     * Perform actions at Airbnb (Alpha; channels-and-webhooks.md §3.4). Each element
     * is an `AirbnbAction` discriminated by its `action` enum — import a property,
     * connect a room, or disconnect one.
     */
    pushToAirbnb(drafts: AirbnbAction | AirbnbAction[]): Promise<Beds24Response<AirbnbActionResponse>>;
    /**
     * Perform actions at Booking.com (Alpha; channels-and-webhooks.md §4.2). Each
     * element is a `BookingAction` — report an invalid card, a no-show, or a
     * cancellation request.
     */
    pushToBookingCom(drafts: BookingAction | BookingAction[]): Promise<Beds24Response<BookingActionResponse>>;
}
export declare class ReviewsOps {
    private client;
    constructor(client: Beds24Client);
    /**
     * List every Airbnb user id linked to the account (Beta;
     * channels-and-webhooks.md §3.1). Takes no query parameters.
     */
    getAirbnbUsers(query?: AirbnbUsersQuery): Promise<Beds24Response<AirbnbUsersResponse>>;
    /**
     * Read guest reviews from Airbnb (Beta; channels-and-webhooks.md §3.3).
     * `roomId` is required. At most 100 reviews are returned at once.
     */
    getAirbnbReviews(query: AirbnbReviewsQuery): Promise<Beds24Response<AirbnbReviewsResponse>>;
    /**
     * Read reviews from Booking.com (Alpha; channels-and-webhooks.md §4.1).
     * `propertyId` and `from` are required. At most 100 reviews are returned.
     */
    getBookingComReviews(query: BookingReviewsQuery): Promise<Beds24Response<BookingReviewsResponse>>;
}
export declare class StripeOps {
    private client;
    constructor(client: Beds24Client);
    /**
     * Perform a Stripe action (Alpha; channels-and-webhooks.md §5.1) — create a
     * Checkout session, charge / refund / capture a payment, or attach / detach a
     * payment method. Each element is a `StripeAction` discriminated by its `action`.
     */
    setupStripe(drafts: StripeAction | StripeAction[]): Promise<Beds24Response<StripeActionResponse>>;
    /**
     * Read the Stripe payment methods attached to a booking (Alpha;
     * channels-and-webhooks.md §5). `bookingId` is required.
     */
    getStripePaymentMethods(query: StripePaymentMethodsQuery): Promise<Beds24Response<StripePaymentMethodsResponse>>;
    /**
     * Read the Stripe charges for a booking (Alpha; channels-and-webhooks.md §5).
     * `bookingId` is required.
     */
    getStripeCharges(query: StripeChargesQuery): Promise<Beds24Response<StripeChargesResponse>>;
}
//# sourceMappingURL=channel-actions-ops.d.ts.map