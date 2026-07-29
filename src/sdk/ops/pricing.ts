/**
 * Pricing workflows.
 *
 * Encodes the pricing model in knowledge/system-logic/pricing-model.md and
 * knowledge/system-logic/wiki-channel-pricing.md:
 *  - up to 16 daily-price rows per room per date
 *  - per-occupancy tiers: roomPrice / 1-person / 2-person / extra-person / extra-child
 *  - three price-transmission models per channel (occupancy / occupancy+LOS / per-day)
 */

import type { Beds24 } from "../beds24.ts";
import type { Beds24Response } from "../client.ts";

/** Per-occupancy price tiers for a daily price row (pricing-model.md). */
export interface OccupancyPrice {
	roomPrice?: string;
	"1"?: string;
	"2"?: string;
	"3"?: string;
	"4"?: string;
	"extraPerson"?: string;
	"extraChild"?: string;
}

/**
 * A single daily price row for a room+date. `dailyPriceNumber` (1-16) selects
 * the row and cannot be changed with a modify action.
 */
export interface DailyPriceRow {
	roomId: string;
	date: string;
	dailyPriceNumber?: number;
	price?: OccupancyPrice;
	[key: string]: unknown;
}

/** How a channel receives prices (wiki-channel-pricing.md). */
export type PriceTransmissionModel = "occupancy" | "occupancyLos" | "perDay";

/** Channels known to use each transmission model (wiki-channel-pricing.md). */
export const CHANNEL_PRICE_MODEL: Record<string, PriceTransmissionModel> = {
	Agoda: "occupancy",
	Expedia: "occupancy",
	Airbnb: "occupancyLos",
	VRBO: "occupancyLos",
	BookingCom: "perDay",
};

export class PricingOps {
	constructor(private beds24: Beds24) {}

	/**
	 * Set daily prices for rooms/dates. Max 16 price rows per room (the API
	 * enforces this; `dailyPriceNumber` selects the row).
	 */
	async setDailyPrices(rows: DailyPriceRow | DailyPriceRow[]): Promise<Beds24Response<unknown>> {
		const items = Array.isArray(rows) ? rows : [rows];
		return this.beds24.request("POST /inventory/rooms/calendar", items);
	}

	/** Read the per-date calendar (daily prices + availability). */
	async getCalendar(query: {
		propId?: string;
		roomId?: string;
		startDate: string;
		endDate: string;
	}): Promise<Beds24Response<unknown>> {
		return this.beds24.request("GET /inventory/rooms/calendar", query);
	}

	/** Set fixed (date-range) prices. Max 100 fixed prices per room. */
	async setFixedPrices(
		rows: Array<{ roomId: string; startDate: string; endDate: string; price?: unknown; [key: string]: unknown }>,
	): Promise<Beds24Response<unknown>> {
		return this.beds24.request("POST /inventory/fixedPrices", rows);
	}

	/**
	 * Push prices to a channel using the channel's transmission model.
	 * Reads the rule set from CHANNEL_PRICE_MODEL; falls back to per-day for
	 * channels not listed.
	 */
	async pushToChannel(
		channel: string,
		rows: DailyPriceRow | DailyPriceRow[],
	): Promise<{ response: Beds24Response<unknown>; model: PriceTransmissionModel }> {
		const model = CHANNEL_PRICE_MODEL[channel] ?? "perDay";
		const response = await this.setDailyPrices(rows);
		return { response, model };
	}
}
