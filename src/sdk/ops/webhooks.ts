/**
 * Webhook workflows.
 *
 * Encodes the webhook model in knowledge/system-logic/wiki-webhooks.md:
 *  - four types: V1 GET booking, V2 POST booking, Auto Action, Inventory
 *  - delivery is asynchronous (~1 min delay)
 *  - booking webhook URL is configured at Settings > Properties > Access
 */

import type { Beds24 } from "../beds24.ts";
import type { Beds24Response } from "../client.ts";

/** The four webhook types (wiki-webhooks.md). */
export type WebhookType = "bookingV1" | "bookingV2" | "autoAction" | "inventory";

/** A webhook registration payload (`POST Webhooks - bookings`). */
export interface WebhookRegistration {
	type: WebhookType;
	url: string;
	enabled?: boolean;
	[key: string]: unknown;
}

export class WebhooksOps {
	constructor(private beds24: Beds24) {}

	/**
	 * Register (or update) a webhook. Delivery is asynchronous — expect a
	 * ~1 minute delay before the first fire (wiki-webhooks.md).
	 */
	async register(reg: WebhookRegistration): Promise<Beds24Response<unknown>> {
		return this.beds24.request("POST Webhooks - bookings", reg);
	}

	/** Register the V2 booking webhook (the recommended type). */
	async registerBooking(url: string): Promise<Beds24Response<unknown>> {
		return this.register({ type: "bookingV2", url, enabled: true });
	}
}
