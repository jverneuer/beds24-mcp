/**
 * InventoryOps tests — verify each read-only query op targets the correct
 * METHOD/path and forwards its query object straight through to
 * Beds24.request, with no network I/O.
 *
 * Uses the recordingClient() pattern from tests/ops.test.ts: a fake
 * Beds24Client whose request() records { endpoint, body }.
 */

import { test, expect, describe } from "bun:test";
import type { Beds24Client } from "../client.js";

/** A Beds24Client whose request() records calls instead of hitting the network. */
function recordingClient() {
	const calls: { endpoint: string; body: unknown }[] = [];
	const client = {
		request<T = unknown>(endpoint: string, body?: unknown) {
			calls.push({ endpoint, body });
			return Promise.resolve({ data: {} as T, credits: { remaining: null, resetsIn: null } });
		},
	} as unknown as Beds24Client;
	return { client, calls };
}

describe("InventoryOps", () => {
	test("getOffers targets GET /inventory/rooms/offers and forwards the query", async () => {
		const { client, calls } = recordingClient();
		const { InventoryOps } = await import("./inventory-ops.js");
		const ops = new InventoryOps(client);
		const query = { arrival: "2026-08-01", departure: "2026-08-05", numAdults: 2, propertyId: [1001] };
		await ops.getOffers(query);
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("GET /inventory/rooms/offers");
		expect(calls[0]!.body).toEqual(query);
	});

	test("getUnitBookings targets GET /inventory/rooms/unitBookings and forwards the query", async () => {
		const { client, calls } = recordingClient();
		const { InventoryOps } = await import("./inventory-ops.js");
		const ops = new InventoryOps(client);
		const query = { propertyId: [1001], startDate: "2026-08-01", endDate: "2026-08-05" };
		await ops.getUnitBookings(query);
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("GET /inventory/rooms/unitBookings");
		expect(calls[0]!.body).toEqual(query);
	});

	test("getUnitBookings defaults to an empty query when none is supplied", async () => {
		const { client, calls } = recordingClient();
		const { InventoryOps } = await import("./inventory-ops.js");
		const ops = new InventoryOps(client);
		await ops.getUnitBookings();
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("GET /inventory/rooms/unitBookings");
		expect(calls[0]!.body).toEqual({});
	});
});
