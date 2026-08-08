/**
 * Webhook workflows.
 *
 * Encodes the webhook model in knowledge/system-logic/wiki-webhooks.md:
 *  - four types: V1 GET booking, V2 POST booking, Auto Action, Inventory
 *  - delivery is asynchronous (~1 min delay)
 *  - booking webhook URL is configured at Settings > Properties > Access
 *
 * IMPORTANT — what this endpoint actually is: the spec's
 * `POST Webhooks - bookings` documents the payload Beds24 POSTs *to your* webhook
 * URL (its description is "The webhook payload sent to your URL"). It is NOT a
 * registration endpoint — webhook URLs are configured in the Beds24 UI, not via
 * this call. `WebhookPayload` is therefore the shape your receiver handles.
 */
export class WebhooksOps {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Post a webhook payload (the shape your webhook URL receives). The spec
     * documents no response for this endpoint, so the decoded `data` is `unknown`.
     */
    async register(payload) {
        return this.client.request("POST Webhooks - bookings", payload);
    }
    /** Build + post a V2 booking-webhook payload (the recommended type). */
    async registerBooking(booking) {
        return this.register({ timeStamp: new Date().toISOString(), booking });
    }
}
//# sourceMappingURL=webhooks.js.map