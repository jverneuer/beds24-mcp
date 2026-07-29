/**
 * Availability workflows.
 *
 * Encodes the availability model in knowledge/system-logic/availability-model.md:
 *  - `i` = unit count (decrements per booking)
 *  - `o` = override code: 0=none 1=blackout 2=no-checkin 3=no-checkout
 *    4=no-checkin/out 5=exceptional-period
 *  - `m` / `mx` = min / max stay (nights)
 *  - `x` = multiplier
 *  - `p1`-`p16` = per-occupancy price rows
 */

import type { Beds24 } from "../beds24.ts";
import type { Beds24Response } from "../client.ts";

/** Override codes for the `o` field (availability-model.md). */
export const OverrideCode = {
	None: 0,
	Blackout: 1,
	NoCheckIn: 2,
	NoCheckOut: 3,
	NoCheckInOut: 4,
	ExceptionalPeriod: 5,
} as const;
export type OverrideCode = (typeof OverrideCode)[keyof typeof OverrideCode];

/** Per-date availability + inventory for a room (availability-model.md). */
export interface AvailabilityRow {
	roomId: string;
	date: string;
	/** Unit count. */
	i?: number;
	/** Override code. */
	o?: OverrideCode;
	/** Min stay (nights). */
	m?: number;
	/** Max stay (nights). */
	mx?: number;
	/** Multiplier. */
	x?: number;
}

/** Query for `GET /inventory/rooms/availability`. */
export interface AvailabilityQuery {
	propId?: string;
	roomId?: string;
	startDate: string;
	endDate: string;
}

export class AvailabilityOps {
	constructor(private beds24: Beds24) {}

	/** Read availability booleans for a date range. */
	async get(query: AvailabilityQuery): Promise<Beds24Response<unknown>> {
		return this.beds24.request("GET /inventory/rooms/availability", query);
	}

	/**
	 * Sync (write) availability for rooms/dates. A booking consumes one unit of
	 * `i`; set `o` to blackout to block a date regardless of inventory.
	 */
	async sync(rows: AvailabilityRow | AvailabilityRow[]): Promise<Beds24Response<unknown>> {
		const items = Array.isArray(rows) ? rows : [rows];
		return this.beds24.request("POST /inventory/rooms/calendar", items);
	}

	/** Block a single date (blackout override). */
	async blackout(roomId: string, date: string): Promise<Beds24Response<unknown>> {
		return this.sync({ roomId, date, o: OverrideCode.Blackout });
	}
}
