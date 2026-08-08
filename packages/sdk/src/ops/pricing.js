/**
 * Pricing workflows.
 *
 * Encodes the pricing model in knowledge/system-logic/pricing-model.md and
 * knowledge/system-logic/wiki-channel-pricing.md:
 *  - up to 16 daily-price tiers per room per date (price1-price16)
 *  - per-occupancy tiers: roomPrice / 1-person / 2-person / extra-person / extra-child
 *  - three price-transmission models per channel (occupancy / occupancy+LOS / per-day)
 *
 * The wire write types WRAP the generated `calendar` and `fixedPrice` schemas —
 * `CalendarWrite` is a semantic alias for the POST /inventory/rooms/calendar body
 * element, so it can never drift from the spec.
 */
/**
 * Channels known to use each transmission model (wiki-channel-pricing.md).
 *
 * Known channels carry a literal value type (so direct access is non-optional
 * under noUncheckedIndexedAccess); the string index signature lets
 * `pushToChannel` look up an arbitrary channel and fall back to "perDay".
 */
export const CHANNEL_PRICE_MODEL = {
    Agoda: "occupancy",
    Expedia: "occupancy",
    Airbnb: "occupancyLos",
    VRBO: "occupancyLos",
    BookingCom: "perDay",
};
export class PricingOps {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Set daily prices for rooms/dates. Max 16 price tiers per room (the API
     * enforces this; `price1`-`price16` select the row).
     */
    async setDailyPrices(rows) {
        const items = Array.isArray(rows) ? rows : [rows];
        return this.client.request("POST /inventory/rooms/calendar", items);
    }
    /** Read the per-date calendar (daily prices + availability). */
    async getCalendar(query) {
        return this.client.request("GET /inventory/rooms/calendar", query);
    }
    /** Set fixed (date-range) prices. Max 100 fixed prices per room. */
    async setFixedPrices(rows) {
        const items = Array.isArray(rows) ? rows : [rows];
        return this.client.request("POST /inventory/fixedPrices", items);
    }
    /** Read fixed prices. */
    async getFixedPrices(query = {}) {
        return this.client.request("GET /inventory/fixedPrices", query);
    }
    /**
     * Push prices to a channel using the channel's transmission model.
     * Reads the rule set from CHANNEL_PRICE_MODEL; falls back to per-day for
     * channels not listed.
     */
    async pushToChannel(channel, rows) {
        const model = CHANNEL_PRICE_MODEL[channel] ?? "perDay";
        const response = await this.setDailyPrices(rows);
        return { response, model };
    }
}
//# sourceMappingURL=pricing.js.map