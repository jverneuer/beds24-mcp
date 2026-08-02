/**
 * Ops tests — verify each op composes the correct endpoint + method and encodes
 * its system-logic rule. We assert on the (endpoint, body) handed to
 * Beds24.request, not on network I/O.
 *
 * Fixtures are wire-correct against the generated schemas (newBooking requires
 * roomId/arrival/departure; the calendar write is { roomId, calendar: [{ from, to,
 * multiplier }] }; roomId is a number; booking status is a string-enum array).
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
	test("create wraps a full draft in an array and targets POST /bookings", async () => {
		const { client, calls } = recordingClient();
		const { BookingOps } = await import("../src/ops/booking.ts");
		const ops = new BookingOps(client);
		await ops.create({ roomId: 1001, arrival: "2026-08-01", departure: "2026-08-05", firstName: "Ada" });
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("POST /bookings");
		expect(calls[0]!.body).toEqual([
			{ roomId: 1001, arrival: "2026-08-01", departure: "2026-08-05", firstName: "Ada" },
		]);
	});

	test("cancel sets status Cancelled (never deletes)", async () => {
		const { client, calls } = recordingClient();
		const { BookingOps } = await import("../src/ops/booking.ts");
		const ops = new BookingOps(client);
		await ops.cancel(12345);
		expect(calls[0]!.endpoint).toBe("POST /bookings");
		expect(calls[0]!.body).toEqual([{ id: 12345, status: BookingStatus.Cancelled }]);
	});

	test("get forwards a status-array filter (cancelled excluded unless requested)", async () => {
		const { client, calls } = recordingClient();
		const { BookingOps } = await import("../src/ops/booking.ts");
		const ops = new BookingOps(client);
		await ops.get({ status: ["cancelled", "confirmed"] });
		expect(calls[0]!.endpoint).toBe("GET /bookings");
		expect(calls[0]!.body).toEqual({ status: ["cancelled", "confirmed"] });
	});
});

describe("PricingOps", () => {
	test("setDailyPrices targets POST /inventory/rooms/calendar", async () => {
		const { client, calls } = recordingClient();
		const { PricingOps } = await import("../src/ops/pricing.ts");
		const ops = new PricingOps(client);
		await ops.setDailyPrices({ roomId: 1001, calendar: [{ from: "2026-08-01", to: "2026-08-05", multiplier: 1 }] });
		expect(calls[0]!.endpoint).toBe("POST /inventory/rooms/calendar");
	});

	test("pushToChannel reports the channel's transmission model", async () => {
		const { client, calls } = recordingClient();
		const { PricingOps } = await import("../src/ops/pricing.ts");
		const ops = new PricingOps(client);
		const { model } = await ops.pushToChannel("Airbnb", {
			roomId: 1001,
			calendar: [{ from: "2026-08-01", to: "2026-08-05", multiplier: 1 }],
		});
		expect(model).toBe(CHANNEL_PRICE_MODEL.Airbnb);
		expect(calls[0]!.endpoint).toBe("POST /inventory/rooms/calendar");
	});
});

describe("AvailabilityOps", () => {
	test("blackout sets the Blackout override (nested calendar is an array, multiplier required)", async () => {
		const { client, calls } = recordingClient();
		const { AvailabilityOps } = await import("../src/ops/availability.ts");
		const ops = new AvailabilityOps(client);
		await ops.blackout(1001, "2026-08-01");
		expect(calls[0]!.endpoint).toBe("POST /inventory/rooms/calendar");
		expect(calls[0]!.body).toEqual([
			{ roomId: 1001, calendar: [{ from: "2026-08-01", to: "2026-08-01", multiplier: 1, override: OverrideCode.Blackout }] },
		]);
	});
});
