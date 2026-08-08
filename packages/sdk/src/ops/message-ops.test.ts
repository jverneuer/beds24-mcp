/**
 * MessageOps / InvoicingOps tests — verify each op composes the correct
 * endpoint + method and encodes its system-logic rule (array POST for sends,
 * read-flag PATCH, selection-axis GETs). We assert on the (endpoint, body)
 * handed to Beds24.request, not on network I/O.
 *
 * Fixtures are wire-correct against the generated schemas: `hostMessage` fields
 * are all optional, so a minimal send is { bookingId, message, source }; the
 * PATCH body is { read }; the GET queries use the repeated-key id arrays.
 */

import { test, expect, describe } from "bun:test";
import type { Beds24Client } from "../client.js";
import { MessageOps, InvoicingOps, MessageSource, MessageAttachmentMime } from "./message-ops.js";

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

describe("MessageOps", () => {
	test("list targets GET /bookings/messages and forwards the selection query", async () => {
		const { client, calls } = recordingClient();
		const ops = new MessageOps(client);
		await ops.list({ bookingId: [12345], source: MessageSource.Host, filter: "unread" });
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("GET /bookings/messages");
		expect(calls[0]!.body).toEqual({ bookingId: [12345], source: "host", filter: "unread" });
	});

	test("list defaults to an empty query when called with none", async () => {
		const { client, calls } = recordingClient();
		const ops = new MessageOps(client);
		await ops.list();
		expect(calls[0]!.endpoint).toBe("GET /bookings/messages");
		expect(calls[0]!.body).toEqual({});
	});

	test("create wraps a single draft in an array and targets POST /bookings/messages", async () => {
		const { client, calls } = recordingClient();
		const ops = new MessageOps(client);
		await ops.create({ bookingId: 12345, message: "Thanks for booking!", source: MessageSource.Host });
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("POST /bookings/messages");
		expect(calls[0]!.body).toEqual([
			{ bookingId: 12345, message: "Thanks for booking!", source: "host" },
		]);
	});

	test("create passes an array of drafts through unchanged", async () => {
		const { client, calls } = recordingClient();
		const ops = new MessageOps(client);
		await ops.create([
			{ bookingId: 12345, message: "Thanks!", source: MessageSource.Host },
			{ bookingId: 67890, message: "See you soon", source: MessageSource.InternalNote },
		]);
		expect(calls[0]!.endpoint).toBe("POST /bookings/messages");
		expect(calls[0]!.body).toEqual([
			{ bookingId: 12345, message: "Thanks!", source: "host" },
			{ bookingId: 67890, message: "See you soon", source: "internalNote" },
		]);
	});

	test("update targets PATCH /bookings/messages with the read flag", async () => {
		const { client, calls } = recordingClient();
		const ops = new MessageOps(client);
		await ops.update({ read: true });
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("PATCH /bookings/messages");
		expect(calls[0]!.body).toEqual({ read: true });
	});
});

describe("InvoicingOps", () => {
	test("list targets GET /bookings/invoices and forwards the bookingId query", async () => {
		const { client, calls } = recordingClient();
		const ops = new InvoicingOps(client);
		await ops.list({ bookingId: [98765] });
		expect(calls).toHaveLength(1);
		expect(calls[0]!.endpoint).toBe("GET /bookings/invoices");
		expect(calls[0]!.body).toEqual({ bookingId: [98765] });
	});

	test("list defaults to an empty query when called with none", async () => {
		const { client, calls } = recordingClient();
		const ops = new InvoicingOps(client);
		await ops.list();
		expect(calls[0]!.endpoint).toBe("GET /bookings/invoices");
		expect(calls[0]!.body).toEqual({});
	});
});

describe("wire-format enums", () => {
	test("MessageSource covers the four hostMessage.source values", () => {
		expect(MessageSource.Host).toBe("host");
		expect(MessageSource.Guest).toBe("guest");
		expect(MessageSource.InternalNote).toBe("internalNote");
		expect(MessageSource.System).toBe("system");
	});

	test("MessageAttachmentMime covers the four allowed MIME types", () => {
		expect(MessageAttachmentMime.Jpeg).toBe("image/jpeg");
		expect(MessageAttachmentMime.Png).toBe("image/png");
		expect(MessageAttachmentMime.Gif).toBe("image/gif");
		expect(MessageAttachmentMime.Pdf).toBe("application/pdf");
	});
});
