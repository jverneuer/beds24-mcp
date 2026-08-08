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
export class InventoryOps {
    client;
    constructor(client) {
        this.client = client;
    }
    /**
     * Get calculated offers for specific dates and guest counts. Each result
     * carries `propertyId`, `roomId`, and an `offers` array (offer 1 is the
     * default; offers 2-4 require activation — inventory-and-pricing.md §6).
     */
    async getOffers(query) {
        return this.client.request("GET /inventory/rooms/offers", query);
    }
    /**
     * (Beta) Get information about which dates units have bookings. The nested
     * `unitBookings` is keyed by date, then by unit ID starting at 1, with an
     * `unassigned` count for bookings not tied to a unit
     * (inventory-and-pricing.md §7).
     */
    async getUnitBookings(query = {}) {
        return this.client.request("GET /inventory/rooms/unitBookings", query);
    }
}
//# sourceMappingURL=inventory-ops.js.map