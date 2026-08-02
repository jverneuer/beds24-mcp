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

import type { Beds24Client, Beds24Response } from "../client.ts";
import type { OpOf, RequestBodyOf, ResponseBodyOf } from "../api-types.ts";

/** POST /inventory/rooms/calendar request body: an array of these elements. */
export type CalendarWriteRequest = RequestBodyOf<OpOf<"POST /inventory/rooms/calendar">>;
/** A single calendar write element (wraps the generated `calendar` schema). */
export type CalendarWrite = CalendarWriteRequest[number];
/** GET /inventory/rooms/calendar query params. */
export type CalendarQuery = RequestBodyOf<OpOf<"GET /inventory/rooms/calendar">>;
/** POST /inventory/fixedPrices request body: an array of these elements. */
export type FixedPriceWriteRequest = RequestBodyOf<OpOf<"POST /inventory/fixedPrices">>;
/** A single fixed-price write element (wraps the generated `fixedPrice` schema). */
export type FixedPriceWrite = FixedPriceWriteRequest[number];
/** GET /inventory/fixedPrices query params. */
export type FixedPriceQuery = RequestBodyOf<OpOf<"GET /inventory/fixedPrices">>;
/** Decoded POST /inventory/rooms/calendar response `data`. */
export type CalendarWriteResponse = ResponseBodyOf<OpOf<"POST /inventory/rooms/calendar">>;
/** Decoded GET /inventory/rooms/calendar response `data`. */
export type CalendarReadResponse = ResponseBodyOf<OpOf<"GET /inventory/rooms/calendar">>;
/** Decoded POST /inventory/fixedPrices response `data`. */
export type FixedPriceWriteResponse = ResponseBodyOf<OpOf<"POST /inventory/fixedPrices">>;

/** How a channel receives prices (wiki-channel-pricing.md). */
export type PriceTransmissionModel = "occupancy" | "occupancyLos" | "perDay";

/**
 * Channels known to use each transmission model (wiki-channel-pricing.md).
 *
 * Known channels carry a literal value type (so direct access is non-optional
 * under noUncheckedIndexedAccess); the string index signature lets
 * `pushToChannel` look up an arbitrary channel and fall back to "perDay".
 */
export const CHANNEL_PRICE_MODEL: {
	readonly Agoda: "occupancy";
	readonly Expedia: "occupancy";
	readonly Airbnb: "occupancyLos";
	readonly VRBO: "occupancyLos";
	readonly BookingCom: "perDay";
	[key: string]: PriceTransmissionModel;
} = {
	Agoda: "occupancy",
	Expedia: "occupancy",
	Airbnb: "occupancyLos",
	VRBO: "occupancyLos",
	BookingCom: "perDay",
};

export class PricingOps {
	constructor(private client: Beds24Client) {}

	/**
	 * Set daily prices for rooms/dates. Max 16 price tiers per room (the API
	 * enforces this; `price1`-`price16` select the row).
	 */
	async setDailyPrices(
		rows: CalendarWrite | CalendarWrite[],
	): Promise<Beds24Response<CalendarWriteResponse>> {
		const items = Array.isArray(rows) ? rows : [rows];
		return this.client.request("POST /inventory/rooms/calendar", items);
	}

	/** Read the per-date calendar (daily prices + availability). */
	async getCalendar(query: CalendarQuery): Promise<Beds24Response<CalendarReadResponse>> {
		return this.client.request("GET /inventory/rooms/calendar", query);
	}

	/** Set fixed (date-range) prices. Max 100 fixed prices per room. */
	async setFixedPrices(
		rows: FixedPriceWrite | FixedPriceWrite[],
	): Promise<Beds24Response<FixedPriceWriteResponse>> {
		const items = Array.isArray(rows) ? rows : [rows];
		return this.client.request("POST /inventory/fixedPrices", items);
	}

	/** Read fixed prices. */
	async getFixedPrices(query: FixedPriceQuery = {}): Promise<Beds24Response<ResponseBodyOf<OpOf<"GET /inventory/fixedPrices">>>> {
		return this.client.request("GET /inventory/fixedPrices", query);
	}

	/**
	 * Push prices to a channel using the channel's transmission model.
	 * Reads the rule set from CHANNEL_PRICE_MODEL; falls back to per-day for
	 * channels not listed.
	 */
	async pushToChannel(
		channel: string,
		rows: CalendarWrite | CalendarWrite[],
	): Promise<{ response: Beds24Response<CalendarWriteResponse>; model: PriceTransmissionModel }> {
		const model = CHANNEL_PRICE_MODEL[channel] ?? "perDay";
		const response = await this.setDailyPrices(rows);
		return { response, model };
	}
}
