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
import type { Beds24Client, Beds24Response } from "../client.js";
import type { OpOf, RequestBodyOf } from "../api-types.js";
/**
 * The four webhook types (wiki-webhooks.md).
 *
 * This is a knowledge-base classification — the spec's webhook payload does not
 * carry a type discriminator, so there is no generated enum to wrap. It is kept
 * as a domain constant for receivers that route by type.
 */
export type WebhookType = "bookingV1" | "bookingV2" | "autoAction" | "inventory";
/**
 * The webhook payload POSTed to your URL. Wraps the inline generated body of
 * `POST Webhooks - bookings` verbatim (`timeStamp` + `booking` + `infoItems` +
 * `invoiceItems` + `messages` + `retries`), so it can never drift from the spec.
 */
export type WebhookPayload = RequestBodyOf<OpOf<"POST Webhooks - bookings">>;
export declare class WebhooksOps {
    private client;
    constructor(client: Beds24Client);
    /**
     * Post a webhook payload (the shape your webhook URL receives). The spec
     * documents no response for this endpoint, so the decoded `data` is `unknown`.
     */
    register(payload: WebhookPayload): Promise<Beds24Response<unknown>>;
    /** Build + post a V2 booking-webhook payload (the recommended type). */
    registerBooking(booking: NonNullable<WebhookPayload["booking"]>): Promise<Beds24Response<unknown>>;
}
//# sourceMappingURL=webhooks.d.ts.map