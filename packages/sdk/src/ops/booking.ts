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

import type { Beds24Client, Beds24Response } from "../client.js";
import type { components, OpOf, RequestBodyOf, ResponseBodyOf } from "../api-types.js";

/** POST /bookings request body: an array of these elements. */
export type BookingWriteRequest = RequestBodyOf<OpOf<"POST /bookings">>;
/** GET /bookings query params. */
export type BookingQuery = RequestBodyOf<OpOf<"GET /bookings">>;
/** Decoded POST /bookings response `data`. */
export type BookingWriteResponse = ResponseBodyOf<OpOf<"POST /bookings">>;
/** Decoded GET /bookings response `data`. */
export type BookingListResponse = ResponseBodyOf<OpOf<"GET /bookings">>;

/**
 * A full booking to create. Wraps the generated `newBooking` + `bookingActions`
 * schemas, so `roomId`/`arrival`/`departure` are required exactly as the API
 * demands. No `id` — its absence tells the API this is a create (bookings.md §2.1).
 */
export type BookingCreate = components["schemas"]["newBooking"] & components["schemas"]["bookingActions"];

/**
 * A partial booking to update. Wraps the same schemas as `BookingCreate` but made
 * Partial — the API accepts `id` plus only the fields you're changing
 * (bookings.md §2.1). `id` stays required so the API knows which booking to patch.
 *
 * NOTE: the generated POST schema models the *create* shape (required fields), so a
 * partial is not assignable to it. `update`/`cancel` therefore cast at the
 * `request()` boundary — a single, documented escape hatch for the one place the
 * schema over-constrains the wire.
 */
export type BookingUpdate = Partial<components["schemas"]["newBooking"]> &
	Partial<components["schemas"]["bookingActions"]> & { id: number };

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
} as const satisfies Record<string, components["schemas"]["newBooking"]["status"]>;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export class BookingOps {
	constructor(private client: Beds24Client) {}

	/**
	 * Create bookings (array POST; bookings.md §2.1). Each element is a full
	 * `BookingCreate` — `roomId`/`arrival`/`departure` are required. Omit `id`.
	 */
	async create(drafts: BookingCreate | BookingCreate[]): Promise<Beds24Response<BookingWriteResponse>> {
		const items = Array.isArray(drafts) ? drafts : [drafts];
		return this.client.request("POST /bookings", items);
	}

	/**
	 * Update existing bookings (array POST; bookings.md §2.1). Each element is a
	 * `BookingUpdate` — `id` plus only the fields you're changing. Used for
	 * patches and cancels.
	 */
	async update(drafts: BookingUpdate | BookingUpdate[]): Promise<Beds24Response<BookingWriteResponse>> {
		const items = Array.isArray(drafts) ? drafts : [drafts];
		// Partial update: see BookingUpdate for why this cast is required.
		return this.client.request("POST /bookings", items as unknown as BookingWriteRequest);
	}

	/** Read bookings. Cancelled are excluded unless `status` includes "cancelled". */
	async get(filter: BookingQuery = {}): Promise<Beds24Response<BookingListResponse>> {
		return this.client.request("GET /bookings", filter);
	}

	/** Read bookings by id (wraps the `id` query param, which takes an array). */
	async getById(id: number): Promise<Beds24Response<BookingListResponse>> {
		return this.client.request("GET /bookings", { id: [id] });
	}

	/**
	 * Cancel a booking (set status "cancelled"; bookings can be cancelled but never
	 * deleted — bookings.md). Booking.com cancellations have channel-specific
	 * prerequisites that must be fulfilled first (booking-lifecycle.md).
	 */
	async cancel(id: number): Promise<Beds24Response<BookingWriteResponse>> {
		return this.update({ id, status: BookingStatus.Cancelled });
	}
}
