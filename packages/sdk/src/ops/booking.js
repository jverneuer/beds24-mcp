/**
 * Booking workflows.
 *
 * Encodes the booking conventions documented in knowledge/api-v2/bookings.md and
 * knowledge/system-logic/booking-lifecycle.md:
 *  - create vs update is decided by `id` presence (array POST, bookings.md §2.1)
 *  - cancelled bookings are excluded by default in reads
 *  - a booking can be cancelled but never deleted
 *
 * Every type here WRAPS the generated OpenAPI schemas (see api-types.ts) — none of
 * them redefine a wire field. `BookingCreate` is the full create shape (required
 * roomId/arrival/departure enforced at compile time); `BookingUpdate` is its
 * Partial, used for cancels and patches where you send only `id` + changed fields.
 */
/**
 * Booking status values — the wire enum from the generated `newBooking.status`.
 * Locked to the generated enum with `satisfies`, so it can never drift from the
 * spec (the old numeric codes were a knowledge-base concept, not the wire format).
 */
export const BookingStatus = {
    Confirmed: "confirmed",
    Request: "request",
    New: "new",
    Cancelled: "cancelled",
    Black: "black",
    Inquiry: "inquiry",
};
export class BookingOps {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Create bookings (array POST; bookings.md §2.1). Each element is a full
     * `BookingCreate` — `roomId`/`arrival`/`departure` are required. Omit `id`.
     */
    async create(drafts) {
        const items = Array.isArray(drafts) ? drafts : [drafts];
        return this.client.request("POST /bookings", items);
    }
    /**
     * Update existing bookings (array POST; bookings.md §2.1). Each element is a
     * `BookingUpdate` — `id` plus only the fields you're changing. Used for
     * patches and cancels.
     */
    async update(drafts) {
        const items = Array.isArray(drafts) ? drafts : [drafts];
        // Partial update: see BookingUpdate for why this cast is required.
        return this.client.request("POST /bookings", items);
    }
    /** Read bookings. Cancelled are excluded unless `status` includes "cancelled". */
    async get(filter = {}) {
        return this.client.request("GET /bookings", filter);
    }
    /** Read bookings by id (wraps the `id` query param, which takes an array). */
    async getById(id) {
        return this.client.request("GET /bookings", { id: [id] });
    }
    /**
     * Cancel a booking (set status "cancelled"; bookings can be cancelled but never
     * deleted — bookings.md). Booking.com cancellations have channel-specific
     * prerequisites that must be fulfilled first (booking-lifecycle.md).
     */
    async cancel(id) {
        return this.update({ id, status: BookingStatus.Cancelled });
    }
}
//# sourceMappingURL=booking.js.map