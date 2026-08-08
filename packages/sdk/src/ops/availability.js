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
};
export class AvailabilityOps {
    client;
    constructor(client) {
        this.client = client;
    }
    /** Read availability booleans for a date range. */
    async get(query) {
        return this.client.request("GET /inventory/rooms/availability", query);
    }
    /**
     * Sync (write) inventory + overrides for rooms/dates. A booking consumes one
     * unit of `numAvail`; set `override` to "blackout" to block a date regardless
     * of inventory. Writes POST /inventory/rooms/calendar (shared with pricing).
     */
    async sync(rows) {
        const items = Array.isArray(rows) ? rows : [rows];
        return this.client.request("POST /inventory/rooms/calendar", items);
    }
    /**
     * Block a date range (blackout override). The nested `calendar` is an array and
     * each day requires `multiplier` (defaults to 1).
     */
    async blackout(roomId, from, to = from) {
        return this.sync({ roomId, calendar: [{ from, to, multiplier: 1, override: OverrideCode.Blackout }] });
    }
}
//# sourceMappingURL=availability.js.map