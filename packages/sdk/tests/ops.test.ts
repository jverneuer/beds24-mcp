/**
 * BookingOps tests — verify each op composes the correct endpoint + method and
 * encodes its system-logic rule. We assert on the (endpoint, body) handed to
 * Beds24.request, not on network I/O.
 */

import { test, expect, describe } from "bun:test";
import type { Beds24Client } from "../src/client.ts";
import { BookingStatus } from "../src/ops/booking.ts";
import { OverrideCode } from "../src/ops/availability.ts";
import { CHANNEL_PRICE_MODEL } from "../src/ops/pricing.ts";

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

describe("BookingOps", () => {
	test("create wraps drafts in an array and targets POST /bookings", async () => {
		const { client, calls } = recordingClient();
		const { BookingOps } = await import("../src/ops/booking.ts");
		const ops = new BookingOps(client);
		await ops.create({ propId: "p1", guestName: "Ada" });
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("POST /bookings");
		expect(calls[0]!.body).toEqual([{ propId: "p1", guestName: "Ada" }]);
	});

	test("cancel sets status Cancelled (never deletes)", async () => {
		const { client, calls } = recordingClient();
		const { BookingOps } = await import("../src/ops/booking.ts");
		const ops = new BookingOps(client);
		await ops.cancel("bk-1");
		expect(calls[0]!.endpoint).toBe("POST /bookings");
		expect(calls[0]!.body).toEqual([{ bookId: "bk-1", status: BookingStatus.Cancelled }]);
	});

	test("get forwards a filter and includes includeCancelled flag", async () => {
		const { client, calls } = recordingClient();
		const { BookingOps } = await import("../src/ops/booking.ts");
		const ops = new BookingOps(client);
		await ops.get({ includeCancelled: true, status: BookingStatus.Confirmed });
		expect(calls[0]!.endpoint).toBe("GET /bookings");
		expect(calls[0]!.body).toEqual({ includeCancelled: true, status: 1 });
	});
});

describe("PricingOps", () => {
	test("setDailyPrices targets POST /inventory/rooms/calendar", async () => {
		const { client, calls } = recordingClient();
		const { PricingOps } = await import("../src/ops/pricing.ts");
		const ops = new PricingOps(client);
		await ops.setDailyPrices({ roomId: "r1", date: "2026-08-01" });
		expect(calls[0]!.endpoint).toBe("POST /inventory/rooms/calendar");
	});

	test("pushToChannel reports the channel's transmission model", async () => {
		const { client, calls } = recordingClient();
		const { PricingOps } = await import("../src/ops/pricing.ts");
		const ops = new PricingOps(client);
		const { model } = await ops.pushToChannel("Airbnb", { roomId: "r1", date: "2026-08-01" });
		expect(model).toBe(CHANNEL_PRICE_MODEL.Airbnb);
		expect(calls[0]!.endpoint).toBe("POST /inventory/rooms/calendar");
	});
});

describe("AvailabilityOps", () => {
	test("blackout sets the Blackout override code", async () => {
		const { client, calls } = recordingClient();
		const { AvailabilityOps } = await import("../src/ops/availability.ts");
		const ops = new AvailabilityOps(client);
		await ops.blackout("r1", "2026-08-01");
		expect(calls[0]!.endpoint).toBe("POST /inventory/rooms/calendar");
		expect(calls[0]!.body).toEqual([{ roomId: "r1", date: "2026-08-01", o: OverrideCode.Blackout }]);
	});
});
