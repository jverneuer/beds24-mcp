/**
 * Availability workflows.
 *
 * Encodes the availability model in knowledge/system-logic/availability-model.md:
 *  - `numAvail` = unit count (decrements per booking)
 *  - `override` = "none" | "blackout" | "exception" | "noCheckIn" | "noCheckOut"
 *    | "noCheckInOrCheckOut" (the wire enum — OverrideCode below wraps it)
 *  - `minStay` / `maxStay` = min / max stay (nights)
 *  - `multiplier` = price multiplier
 *  - `price1`-`price16` = per-occupancy price rows
 *
 * Availability WRITES compose the same endpoint as pricing
 * (POST /inventory/rooms/calendar), so `CalendarWrite` is imported from pricing.ts
 * rather than re-derived — one source of truth for the shared write shape.
 */

import type { Beds24Client, Beds24Response } from "../client.ts";
import type { components, OpOf, RequestBodyOf, ResponseBodyOf } from "../api-types.ts";
import type { CalendarWrite, CalendarWriteResponse } from "./pricing.ts";

/** GET /inventory/rooms/availability query params. */
export type AvailabilityQuery = RequestBodyOf<OpOf<"GET /inventory/rooms/availability">>;
/** Decoded GET /inventory/rooms/availability response `data`. */
export type AvailabilityData = ResponseBodyOf<OpOf<"GET /inventory/rooms/availability">>;

/** A single calendar day entry (the nested `calendar` element of the `calendar` schema). */
type CalendarDay = NonNullable<components["schemas"]["calendar"]["calendar"]>[number];

/**
 * Override codes for the `override` field (availability-model.md).
 *
 * Wraps the generated `calendar` → `calendar` → `override` string enum and is
 * locked to it with `satisfies`, so the named constants can never drift from the
 * spec. (The old numeric codes were a knowledge-base concept, not the wire format.)
 */
export const OverrideCode = {
	None: "none",
	Blackout: "blackout",
	Exception: "exception",
	NoCheckIn: "noCheckIn",
	NoCheckOut: "noCheckOut",
	NoCheckInOut: "noCheckInOrCheckOut",
} as const satisfies Record<string, NonNullable<CalendarDay["override"]>>;
export type OverrideCode = (typeof OverrideCode)[keyof typeof OverrideCode];

export class AvailabilityOps {
	constructor(private client: Beds24Client) {}

	/** Read availability booleans for a date range. */
	async get(query: AvailabilityQuery): Promise<Beds24Response<AvailabilityData>> {
		return this.client.request("GET /inventory/rooms/availability", query);
	}

	/**
	 * Sync (write) inventory + overrides for rooms/dates. A booking consumes one
	 * unit of `numAvail`; set `override` to "blackout" to block a date regardless
	 * of inventory. Writes POST /inventory/rooms/calendar (shared with pricing).
	 */
	async sync(rows: CalendarWrite | CalendarWrite[]): Promise<Beds24Response<CalendarWriteResponse>> {
		const items = Array.isArray(rows) ? rows : [rows];
		return this.client.request("POST /inventory/rooms/calendar", items);
	}

	/**
	 * Block a date range (blackout override). The nested `calendar` is an array and
	 * each day requires `multiplier` (defaults to 1).
	 */
	async blackout(
		roomId: number,
		from: string,
		to: string = from,
	): Promise<Beds24Response<CalendarWriteResponse>> {
		return this.sync({ roomId, calendar: [{ from, to, multiplier: 1, override: OverrideCode.Blackout }] });
	}
}
