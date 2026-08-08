/**
 * Channel-actions / reviews / Stripe ops tests — assert each op targets the right
 * METHOD/path and encodes its rule. We assert on the (endpoint, body) handed to
 * Beds24.request, not on network I/O.
 */

import { test, expect, describe } from "bun:test";
import type { Beds24Client } from "../client.js";
import {
	ChannelActionsOps,
	ReviewsOps,
	StripeOps,
	AirbnbActionType,
	AirbnbConnect,
	BookingActionType,
} from "./channel-actions-ops.js";

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

describe("ChannelActionsOps", () => {
	test("pushToAirbnb wraps a single action in an array and targets POST /channels/airbnb", async () => {
		const { client, calls } = recordingClient();
		const ops = new ChannelActionsOps(client);
		await ops.pushToAirbnb({
			airbnbUserId: "u1",
			airbnbListingId: "l1",
			action: AirbnbActionType.ImportAsNewProperty,
			connect: AirbnbConnect.Full,
		});
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("POST /channels/airbnb");
		expect(calls[0]!.body).toEqual([
			{
				airbnbUserId: "u1",
				airbnbListingId: "l1",
				action: "importAsNewProperty",
				connect: "full",
			},
		]);
	});

	test("pushToAirbnb passes an array through unchanged", async () => {
		const { client, calls } = recordingClient();
		const ops = new ChannelActionsOps(client);
		await ops.pushToAirbnb([
			{ action: AirbnbActionType.ConnectToExistingRoom },
			{ action: AirbnbActionType.DisconnectRoom },
		]);
		expect(calls[0]!.endpoint).toBe("POST /channels/airbnb");
		expect(calls[0]!.body).toEqual([
			{ action: "connectToExistingRoom" },
			{ action: "disconnectRoom" },
		]);
	});

	test("pushToBookingCom wraps a single action in an array and targets POST /channels/booking", async () => {
		const { client, calls } = recordingClient();
		const ops = new ChannelActionsOps(client);
		await ops.pushToBookingCom({ bookingId: 12345, action: BookingActionType.ReportNoShow });
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("POST /channels/booking");
		expect(calls[0]!.body).toEqual([{ bookingId: 12345, action: "reportNoShow" }]);
	});
});

describe("ReviewsOps", () => {
	test("getAirbnbUsers targets GET /channels/airbnb/users (no query)", async () => {
		const { client, calls } = recordingClient();
		const ops = new ReviewsOps(client);
		await ops.getAirbnbUsers();
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("GET /channels/airbnb/users");
		expect(calls[0]!.body).toBeUndefined();
	});

	test("getAirbnbReviews forwards the required roomId query", async () => {
		const { client, calls } = recordingClient();
		const ops = new ReviewsOps(client);
		await ops.getAirbnbReviews({ roomId: 9012345 });
		expect(calls[0]!.endpoint).toBe("GET /channels/airbnb/reviews");
		expect(calls[0]!.body).toEqual({ roomId: 9012345 });
	});

	test("getBookingComReviews forwards propertyId + from", async () => {
		const { client, calls } = recordingClient();
		const ops = new ReviewsOps(client);
		await ops.getBookingComReviews({ propertyId: 456789, from: "2026-01-01" });
		expect(calls[0]!.endpoint).toBe("GET /channels/booking/reviews");
		expect(calls[0]!.body).toEqual({ propertyId: 456789, from: "2026-01-01" });
	});
});

describe("StripeOps", () => {
	test("setupStripe wraps a single session-creation action in an array and targets POST /channels/stripe", async () => {
		const { client, calls } = recordingClient();
		const ops = new StripeOps(client);
		await ops.setupStripe({
			action: "createStripeSession",
			bookingId: 12345678,
			line_items: [
				{
					price_data: { currency: "usd", product_data: { name: "Booking #12345678" }, unit_amount: 15000 },
					quantity: 1,
				},
			],
			success_url: "https://yoursite.com/success",
			cancel_url: "https://yoursite.com/cancel",
			capture: true,
		});
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("POST /channels/stripe");
		expect(calls[0]!.body).toEqual([
			{
				action: "createStripeSession",
				bookingId: 12345678,
				line_items: [
					{
						price_data: {
							currency: "usd",
							product_data: { name: "Booking #12345678" },
							unit_amount: 15000,
						},
						quantity: 1,
					},
				],
				success_url: "https://yoursite.com/success",
				cancel_url: "https://yoursite.com/cancel",
				capture: true,
			},
		]);
	});

	test("setupStripe passes an array of mixed actions through unchanged", async () => {
		const { client, calls } = recordingClient();
		const ops = new StripeOps(client);
		await ops.setupStripe([
			{ action: "refundCharge", bookingId: 1, stripeChargeId: "ch_1", amount: 5000 },
			{ action: "detachPaymentMethod", bookingId: 1, stripePaymentMethodId: "pm_1" },
		]);
		expect(calls[0]!.endpoint).toBe("POST /channels/stripe");
		expect(calls[0]!.body).toEqual([
			{ action: "refundCharge", bookingId: 1, stripeChargeId: "ch_1", amount: 5000 },
			{ action: "detachPaymentMethod", bookingId: 1, stripePaymentMethodId: "pm_1" },
		]);
	});

	test("getStripePaymentMethods forwards the bookingId query", async () => {
		const { client, calls } = recordingClient();
		const ops = new StripeOps(client);
		await ops.getStripePaymentMethods({ bookingId: 12345678 });
		expect(calls[0]!.endpoint).toBe("GET /channels/stripe/paymentMethods");
		expect(calls[0]!.body).toEqual({ bookingId: 12345678 });
	});

	test("getStripeCharges forwards the bookingId query and supports filtering by charge id", async () => {
		const { client, calls } = recordingClient();
		const ops = new StripeOps(client);
		await ops.getStripeCharges({ bookingId: 12345678, stripeChargeId: "ch_1" });
		expect(calls[0]!.endpoint).toBe("GET /channels/stripe/charges");
		expect(calls[0]!.body).toEqual({ bookingId: 12345678, stripeChargeId: "ch_1" });
	});
});
