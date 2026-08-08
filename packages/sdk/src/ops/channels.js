/**
 * Channel-management workflows.
 *
 * Encodes the channel rules in knowledge/api-v2/channels-and-webhooks.md and
 * knowledge/system-logic/wiki-channel-manager.md:
 *  - API and iCal connections are mutually exclusive per room
 *  - iCal = availability-only (no prices / stay rules); API = bidirectional
 *
 * The write types WRAP the generated channel-settings schemas — `ChannelSettings`
 * is the union of the four channel-specific POST shapes, so it can never drift
 * from the spec (the old interface with an index signature redefined every field).
 */
export class ChannelsOps {
    client;
    constructor(client) {
        this.client = client;
    }
    /** Read channel settings. `propertyId` is required (the API enforces it). */
    async get(query) {
        return this.client.request("GET /channels/settings", query);
    }
    /**
     * Configure a channel. API and iCal are mutually exclusive per room —
     * setting one clears the other (wiki-channel-manager.md). Each element is a
     * channel-specific `ChannelSettings` shape.
     */
    async configure(settings) {
        const items = Array.isArray(settings) ? settings : [settings];
        return this.client.request("POST /channels/settings", items);
    }
    /** Read Airbnb listings for the account. `airbnbUserId` is required. */
    async airbnbListings(query) {
        return this.client.request("GET /channels/airbnb/listings", query);
    }
}
//# sourceMappingURL=channels.js.map