/**
 * Channel-management workflows.
 *
 * Encodes the channel rules in knowledge/api-v2/channels-and-webhooks.md and
 * knowledge/system-logic/wiki-channel-manager.md:
 *  - API and iCal connections are mutually exclusive per room
 *  - iCal = availability-only (no prices / stay rules); API = bidirectional
 */

import type { Beds24 } from "../beds24.ts";
import type { Beds24Response } from "../client.ts";

/** Connection type for a room (wiki-channel-manager.md). */
export type ConnectionType = "api" | "ical";

/** A channel-settings write payload (`POST /channels/settings`). */
export interface ChannelSettings {
	propId: string;
	roomId?: string;
	channel: string;
	connectionType?: ConnectionType;
	[key: string]: unknown;
}

export class ChannelsOps {
	constructor(private beds24: Beds24) {}

	/** Read channel settings. */
	async get(query: { propId?: string; roomId?: string } = {}): Promise<Beds24Response<unknown>> {
		return this.beds24.request("GET /channels/settings", query);
	}

	/**
	 * Configure a channel. API and iCal are mutually exclusive per room —
	 * setting one clears the other (wiki-channel-manager.md).
	 */
	async configure(settings: ChannelSettings | ChannelSettings[]): Promise<Beds24Response<unknown>> {
		const items = Array.isArray(settings) ? settings : [settings];
		return this.beds24.request("POST /channels/settings", items);
	}

	/** Read Airbnb listings for the account. */
	async airbnbListings(): Promise<Beds24Response<unknown>> {
		return this.beds24.request("GET /channels/airbnb/listings");
	}
}
