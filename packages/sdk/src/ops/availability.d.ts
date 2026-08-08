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
import type { Beds24Client, Beds24Response } from "../client.js";
import type { OpOf, RequestBodyOf, ResponseBodyOf } from "../api-types.js";
import type { CalendarWrite, CalendarWriteResponse } from "./pricing.js";
/** GET /inventory/rooms/availability query params. */
export type AvailabilityQuery = RequestBodyOf<OpOf<"GET /inventory/rooms/availability">>;
/** Decoded GET /inventory/rooms/availability response `data`. */
export type AvailabilityData = ResponseBodyOf<OpOf<"GET /inventory/rooms/availability">>;
/**
 * Override codes for the `override` field (availability-model.md).
 *
 * Wraps the generated `calendar` → `calendar` → `override` string enum and is
 * locked to it with `satisfies`, so the named constants can never drift from the
 * spec. (The old numeric codes were a knowledge-base concept, not the wire format.)
 */
export declare const OverrideCode: {
    readonly None: "none";
    readonly Blackout: "blackout";
    readonly Exception: "exception";
    readonly NoCheckIn: "noCheckIn";
    readonly NoCheckOut: "noCheckOut";
    readonly NoCheckInOut: "noCheckInOrCheckOut";
};
export type OverrideCode = (typeof OverrideCode)[keyof typeof OverrideCode];
export declare class AvailabilityOps {
    private client;
    constructor(client: Beds24Client);
    /** Read availability booleans for a date range. */
    get(query: AvailabilityQuery): Promise<Beds24Response<AvailabilityData>>;
    /**
     * Sync (write) inventory + overrides for rooms/dates. A booking consumes one
     * unit of `numAvail`; set `override` to "blackout" to block a date regardless
     * of inventory. Writes POST /inventory/rooms/calendar (shared with pricing).
     */
    sync(rows: CalendarWrite | CalendarWrite[]): Promise<Beds24Response<CalendarWriteResponse>>;
    /**
     * Block a date range (blackout override). The nested `calendar` is an array and
     * each day requires `multiplier` (defaults to 1).
     */
    blackout(roomId: number, from: string, to?: string): Promise<Beds24Response<CalendarWriteResponse>>;
}
//# sourceMappingURL=availability.d.ts.map