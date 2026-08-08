/**
 * Inventory workflows — read-only queries for offers and unit bookings.
 *
 * Encodes the inventory model in knowledge/api-v2/inventory-and-pricing.md:
 *  - `getOffers` returns calculated offer instances for specific dates/guest
 *    counts (GET /inventory/rooms/offers; arrival/departure/numAdults required)
 *  - `getUnitBookings` (Beta) reports which dates units have bookings
 *    (GET /inventory/rooms/unitBookings)
 *
 * Availability and pricing reads are deliberately NOT duplicated here: calendar
 * availability lives in AvailabilityOps, daily/fixed prices in PricingOps
 * (inventory-and-pricing.md §1 V1↔V2 mapping).
 */
import type { Beds24Client, Beds24Response } from "../client.js";
import type { OpOf, RequestBodyOf, ResponseBodyOf } from "../api-types.js";
/** GET /inventory/rooms/offers query params. `arrival`/`departure`/`numAdults` are required. */
export type OffersQuery = RequestBodyOf<OpOf<"GET /inventory/rooms/offers">>;
/** Decoded GET /inventory/rooms/offers response `data`. */
export type OffersResponse = ResponseBodyOf<OpOf<"GET /inventory/rooms/offers">>;
/** GET /inventory/rooms/unitBookings query params (all optional). */
export type UnitBookingsQuery = RequestBodyOf<OpOf<"GET /inventory/rooms/unitBookings">>;
/** Decoded GET /inventory/rooms/unitBookings response `data`. */
export type UnitBookingsResponse = ResponseBodyOf<OpOf<"GET /inventory/rooms/unitBookings">>;
export declare class InventoryOps {
    private client;
    constructor(client: Beds24Client);
    /**
     * Get calculated offers for specific dates and guest counts. Each result
     * carries `propertyId`, `roomId`, and an `offers` array (offer 1 is the
     * default; offers 2-4 require activation — inventory-and-pricing.md §6).
     */
    getOffers(query: OffersQuery): Promise<Beds24Response<OffersResponse>>;
    /**
     * (Beta) Get information about which dates units have bookings. The nested
     * `unitBookings` is keyed by date, then by unit ID starting at 1, with an
     * `unassigned` count for bookings not tied to a unit
     * (inventory-and-pricing.md §7).
     */
    getUnitBookings(query?: UnitBookingsQuery): Promise<Beds24Response<UnitBookingsResponse>>;
}
//# sourceMappingURL=inventory-ops.d.ts.map