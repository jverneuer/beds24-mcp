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

import type { Beds24Client, Beds24Response } from "../client.ts";
import type { OpOf, RequestBodyOf, ResponseBodyOf } from "../api-types.ts";

/** Connection type for a room (wiki-channel-manager.md). */
export type ConnectionType = "api" | "ical";

/** GET /channels/settings query params. `propertyId` is required. */
export type ChannelQuery = RequestBodyOf<OpOf<"GET /channels/settings">>;
/** POST /channels/settings request body: an array of these elements. */
export type ChannelSettingsRequest = RequestBodyOf<OpOf<"POST /channels/settings">>;
/**
 * A single channel-settings write element — the union of the four generated
 * channel-specific POST shapes (vrbo / airbnb / iCal export / iCal import).
 */
export type ChannelSettings = ChannelSettingsRequest[number];
/** GET /channels/airbnb/listings query params. `airbnbUserId` is required. */
export type AirbnbListingsQuery = RequestBodyOf<OpOf<"GET /channels/airbnb/listings">>;
/** Decoded GET /channels/settings response `data`. */
export type ChannelSettingsResponse = ResponseBodyOf<OpOf<"GET /channels/settings">>;
/** Decoded POST /channels/settings response `data`. */
export type ChannelSettingsWriteResponse = ResponseBodyOf<OpOf<"POST /channels/settings">>;
/** Decoded GET /channels/airbnb/listings response `data`. */
export type AirbnbListingsResponse = ResponseBodyOf<OpOf<"GET /channels/airbnb/listings">>;

export class ChannelsOps {
	constructor(private client: Beds24Client) {}

	/** Read channel settings. `propertyId` is required (the API enforces it). */
	async get(query: ChannelQuery): Promise<Beds24Response<ChannelSettingsResponse>> {
		return this.client.request("GET /channels/settings", query);
	}

	/**
	 * Configure a channel. API and iCal are mutually exclusive per room —
	 * setting one clears the other (wiki-channel-manager.md). Each element is a
	 * channel-specific `ChannelSettings` shape.
	 */
	async configure(
		settings: ChannelSettings | ChannelSettings[],
	): Promise<Beds24Response<ChannelSettingsWriteResponse>> {
		const items = Array.isArray(settings) ? settings : [settings];
		return this.client.request("POST /channels/settings", items);
	}

	/** Read Airbnb listings for the account. `airbnbUserId` is required. */
	async airbnbListings(query: AirbnbListingsQuery): Promise<Beds24Response<AirbnbListingsResponse>> {
		return this.client.request("GET /channels/airbnb/listings", query);
	}
}
