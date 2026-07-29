/**
 * Booking workflows.
 *
 * Encodes the booking conventions documented in knowledge/api-v2/bookings.md and
 * knowledge/system-logic/booking-lifecycle.md:
 *  - create vs update is decided by bookId presence (array POST)
 *  - cancelled bookings are excluded by default in reads
 *  - status codes: 0=Cancelled 1=Confirmed 2=New 3=Request 4=Black 5=Inquiry
 *  - a booking can be cancelled but never deleted
 */

import type { Beds24 } from "../beds24.ts";
import type { Beds24Response } from "../client.ts";

/** Booking status codes (booking-lifecycle.md). */
export const BookingStatus = {
	Cancelled: 0,
	Confirmed: 1,
	New: 2,
	Request: 3,
	Black: 4,
	Inquiry: 5,
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

/** A booking payload for create/update (`POST /bookings`, bookings.md). */
export interface BookingDraft {
	/** Present = update, absent = create (the array-POST convention). */
	bookId?: string;
	propId?: string;
	roomId?: string;
	checkIn?: string;
	checkOut?: string;
	guestFirstName?: string;
	guestName?: string;
	guestEmail?: string;
	status?: BookingStatus;
	[key: string]: unknown;
}

/** Filter for `GET /bookings` (bookings.md). */
export interface BookingFilter {
	/** Bookings modified since this ISO timestamp. */
	modifiedFrom?: string;
	/** Bookings modified before this ISO timestamp. */
	modifiedTo?: string;
	/** Include cancelled bookings (excluded by default). */
	includeCancelled?: boolean;
	status?: BookingStatus;
	propId?: string;
	roomId?: string;
	/** Free-text search. */
	searchText?: string;
	/** Page number (1-based). */
	page?: number;
	/** Page size. */
	limit?: number;
}

/** A normalized booking returned by the API. */
export interface Booking {
	bookId: string;
	propId: string;
	roomId: string;
	checkIn: string;
	checkOut: string;
	status: BookingStatus;
	[key: string]: unknown;
}

export class BookingOps {
	constructor(private beds24: Beds24) {}

	/**
	 * Create or update a bookings. Pass one or more drafts as an array
	 * (V2 POST convention); bookId presence on each decides create vs update.
	 */
	async create(drafts: BookingDraft | BookingDraft[]): Promise<Beds24Response<unknown>> {
		const items = Array.isArray(drafts) ? drafts : [drafts];
		return this.beds24.request("POST /bookings", items);
	}

	/** Read bookings. Cancelled are excluded unless `includeCancelled` is set. */
	async get(filter: BookingFilter = {}): Promise<Beds24Response<unknown>> {
		const params = toQuery(filter);
		return this.beds24.request("GET /bookings", params);
	}

	/** Read a single booking by id. */
	async getById(bookId: string): Promise<Beds24Response<unknown>> {
		return this.beds24.request("GET /bookings", { bookId });
	}

	/**
	 * Cancel a booking. Note: bookings can be cancelled but never deleted
	 * (bookings.md). Booking.com cancellations have channel-specific
	 * prerequisites that must be fulfilled first (booking-lifecycle.md).
	 */
	async cancel(bookId: string): Promise<Beds24Response<unknown>> {
		return this.beds24.request("POST /bookings", [{ bookId, status: BookingStatus.Cancelled }]);
	}
}

/** Build a query object, dropping undefined entries. */
function toQuery(filter: BookingFilter): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	if (filter.modifiedFrom) out.modifiedFrom = filter.modifiedFrom;
	if (filter.modifiedTo) out.modifiedTo = filter.modifiedTo;
	if (filter.includeCancelled) out.includeCancelled = true;
	if (filter.status !== undefined) out.status = filter.status;
	if (filter.propId) out.propId = filter.propId;
	if (filter.roomId) out.roomId = filter.roomId;
	if (filter.searchText) out.searchText = filter.searchText;
	if (filter.page) out.page = filter.page;
	if (filter.limit) out.limit = filter.limit;
	return out;
}
