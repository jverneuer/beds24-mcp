/**
 * Accounts / properties / organization ops tests — verify each op composes the
 * correct endpoint + method and encodes its rule. We assert on the (endpoint,
 * body) handed to Beds24.request, not on network I/O.
 */

import { test, expect, describe } from "bun:test";
import type { Beds24Client } from "../client.js";
import {
	AccountOps,
	PropertyOps,
	OrganizationOps,
} from "../ops/accounts-ops.js";

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

describe("AccountOps", () => {
	test("list forwards a query object and targets GET /accounts", async () => {
		const { client, calls } = recordingClient();
		const ops = new AccountOps(client);
		await ops.list({ includeSubAccounts: true, includeUsage: false });
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("GET /accounts");
		expect(calls[0]!.body).toEqual({ includeSubAccounts: true, includeUsage: false });
	});

	test("create wraps a single draft in an array and targets POST /accounts", async () => {
		const { client, calls } = recordingClient();
		const ops = new AccountOps(client);
		await ops.create({ timezone: "UTC", deduceLanguage: "browser" });
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("POST /accounts");
		expect(calls[0]!.body).toEqual([{ timezone: "UTC", deduceLanguage: "browser" }]);
	});

	test("create passes an array draft through unchanged", async () => {
		const { client, calls } = recordingClient();
		const ops = new AccountOps(client);
		await ops.create([{ timezone: "UTC" }, { timezone: "America/New_York" }]);
		expect(calls[0]!.endpoint).toBe("POST /accounts");
		expect(calls[0]!.body).toEqual([{ timezone: "UTC" }, { timezone: "America/New_York" }]);
	});
});

describe("PropertyOps", () => {
	test("list forwards a query object and targets GET /properties", async () => {
		const { client, calls } = recordingClient();
		const ops = new PropertyOps(client);
		await ops.list({ id: [12345678], includeAllRooms: true });
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("GET /properties");
		expect(calls[0]!.body).toEqual({ id: [12345678], includeAllRooms: true });
	});

	test("create wraps a single draft in an array and targets POST /properties", async () => {
		const { client, calls } = recordingClient();
		const ops = new PropertyOps(client);
		await ops.create({ name: "New Property", propertyType: "apartment", currency: "USD" });
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("POST /properties");
		expect(calls[0]!.body).toEqual([
			{ name: "New Property", propertyType: "apartment", currency: "USD" },
		]);
	});

	test("remove encodes ids into the query and targets DELETE /properties", async () => {
		const { client, calls } = recordingClient();
		const ops = new PropertyOps(client);
		await ops.remove([111, 222]);
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("DELETE /properties");
		expect(calls[0]!.body).toEqual({ id: [111, 222] });
	});

	test("listRooms forwards a query object and targets GET /properties/rooms", async () => {
		const { client, calls } = recordingClient();
		const ops = new PropertyOps(client);
		await ops.listRooms({ propertyId: [12345678], includePictures: true });
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("GET /properties/rooms");
		expect(calls[0]!.body).toEqual({ propertyId: [12345678], includePictures: true });
	});

	test("removeRoom encodes ids into the query and targets DELETE /properties/rooms", async () => {
		const { client, calls } = recordingClient();
		const ops = new PropertyOps(client);
		await ops.removeRoom([90123456]);
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("DELETE /properties/rooms");
		expect(calls[0]!.body).toEqual({ id: [90123456] });
	});
});

describe("OrganizationOps", () => {
	test("listUsers targets GET /organizations/users with no query params", async () => {
		const { client, calls } = recordingClient();
		const ops = new OrganizationOps(client);
		await ops.listUsers();
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("GET /organizations/users");
		expect(calls[0]!.body).toBeUndefined();
	});
});
