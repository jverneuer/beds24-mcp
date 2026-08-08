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
};
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
};
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
};
export class ChannelActionsOps {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Perform actions at Airbnb (Alpha; channels-and-webhooks.md §3.4). Each element
     * is an `AirbnbAction` discriminated by its `action` enum — import a property,
     * connect a room, or disconnect one.
     */
    async pushToAirbnb(drafts) {
        const items = Array.isArray(drafts) ? drafts : [drafts];
        return this.client.request("POST /channels/airbnb", items);
    }
    /**
     * Perform actions at Booking.com (Alpha; channels-and-webhooks.md §4.2). Each
     * element is a `BookingAction` — report an invalid card, a no-show, or a
     * cancellation request.
     */
    async pushToBookingCom(drafts) {
        const items = Array.isArray(drafts) ? drafts : [drafts];
        return this.client.request("POST /channels/booking", items);
    }
}
export class ReviewsOps {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * List every Airbnb user id linked to the account (Beta;
     * channels-and-webhooks.md §3.1). Takes no query parameters.
     */
    async getAirbnbUsers(query) {
        return this.client.request("GET /channels/airbnb/users", query);
    }
    /**
     * Read guest reviews from Airbnb (Beta; channels-and-webhooks.md §3.3).
     * `roomId` is required. At most 100 reviews are returned at once.
     */
    async getAirbnbReviews(query) {
        return this.client.request("GET /channels/airbnb/reviews", query);
    }
    /**
     * Read reviews from Booking.com (Alpha; channels-and-webhooks.md §4.1).
     * `propertyId` and `from` are required. At most 100 reviews are returned.
     */
    async getBookingComReviews(query) {
        return this.client.request("GET /channels/booking/reviews", query);
    }
}
export class StripeOps {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Perform a Stripe action (Alpha; channels-and-webhooks.md §5.1) — create a
     * Checkout session, charge / refund / capture a payment, or attach / detach a
     * payment method. Each element is a `StripeAction` discriminated by its `action`.
     */
    async setupStripe(drafts) {
        const items = Array.isArray(drafts) ? drafts : [drafts];
        return this.client.request("POST /channels/stripe", items);
    }
    /**
     * Read the Stripe payment methods attached to a booking (Alpha;
     * channels-and-webhooks.md §5). `bookingId` is required.
     */
    async getStripePaymentMethods(query) {
        return this.client.request("GET /channels/stripe/paymentMethods", query);
    }
    /**
     * Read the Stripe charges for a booking (Alpha; channels-and-webhooks.md §5).
     * `bookingId` is required.
     */
    async getStripeCharges(query) {
        return this.client.request("GET /channels/stripe/charges", query);
    }
}
//# sourceMappingURL=channel-actions-ops.js.map