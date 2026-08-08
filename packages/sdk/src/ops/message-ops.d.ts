/**
 * Booking sub-resource workflows — messages and invoices.
 *
 * Encodes the conventions documented in knowledge/api-v2/bookings.md:
 *  - §5 messages: GET /bookings/messages reads, POST /bookings/messages sends
 *    (OTA bookings only — direct-booking messages are not delivered), and
 *    PATCH /bookings/messages sets the `read` state in bulk.
 *  - §6 invoices: GET /bookings/invoices (Alpha) reads invoice objects, each
 *    with a nullable `invoiceId`.
 *
 * Message sources (`hostMessage.source`) and the allowed attachment MIME types
 * are the wire enums from the generated `hostMessage` schema; the GET `filter`
 * axis is `read` | `unread`.
 *
 * Every type here WRAPS the generated OpenAPI schemas (see api-types.ts) — none of
 * them redefine a wire field. `MessageWrite` is the `hostMessage` element the POST
 * arrays; `MessagePatchBody` is the `{ read }` PATCH body. The PATCH query-based
 * selection (messageId/propertyId/roomId/bookingId/masterId) is not expressible
 * through the current `client.request()` (it serializes a PATCH body as JSON with
 * no query string), so `update` exposes only the read-state body.
 */
import type { Beds24Client, Beds24Response } from "../client.js";
import type { OpOf, RequestBodyOf, ResponseBodyOf } from "../api-types.js";
/** GET /bookings/messages query params — the selection axes (bookings.md §5.1). */
export type MessageQuery = RequestBodyOf<OpOf<"GET /bookings/messages">>;
/** Decoded GET /bookings/messages response `data`. */
export type MessageListResponse = ResponseBodyOf<OpOf<"GET /bookings/messages">>;
/** POST /bookings/messages request body: an array of `hostMessage` elements. */
export type MessageWriteRequest = RequestBodyOf<OpOf<"POST /bookings/messages">>;
/** A single message to send (wraps the generated `hostMessage` schema). */
export type MessageWrite = MessageWriteRequest[number];
/** Decoded POST /bookings/messages response `data` (201). */
export type MessageWriteResponse = ResponseBodyOf<OpOf<"POST /bookings/messages">>;
/** PATCH /bookings/messages JSON body — currently only the `read` flag. */
export type MessagePatchBody = RequestBodyOf<OpOf<"PATCH /bookings/messages">>;
/** Decoded PATCH /bookings/messages response `data` (200 carries no body). */
export type MessagePatchResponse = ResponseBodyOf<OpOf<"PATCH /bookings/messages">>;
/** GET /bookings/invoices query params (bookings.md §6). */
export type InvoiceQuery = RequestBodyOf<OpOf<"GET /bookings/invoices">>;
/** Decoded GET /bookings/invoices response `data`. */
export type InvoiceListResponse = ResponseBodyOf<OpOf<"GET /bookings/invoices">>;
/**
 * Message sources (bookings.md §5 `hostMessage.source`). Locked to the generated
 * enum with `satisfies`, so it can never drift from the spec. `internalNote` is
 * the value used for host-only notes; `system` covers API/OTA-originated messages.
 */
export declare const MessageSource: {
    readonly Host: "host";
    readonly Guest: "guest";
    readonly InternalNote: "internalNote";
    readonly System: "system";
};
export type MessageSource = (typeof MessageSource)[keyof typeof MessageSource];
/**
 * Allowed attachment MIME types per channel (bookings.md §5.2 / hostMessage schema).
 * Airbnb allows jpeg/png/gif; Booking.com allows jpeg/png; VRBO allows jpeg/png/gif/pdf.
 */
export declare const MessageAttachmentMime: {
    readonly Jpeg: "image/jpeg";
    readonly Png: "image/png";
    readonly Gif: "image/gif";
    readonly Pdf: "application/pdf";
};
export type MessageAttachmentMime = (typeof MessageAttachmentMime)[keyof typeof MessageAttachmentMime];
export declare class MessageOps {
    private client;
    constructor(client: Beds24Client);
    /**
     * List messages (bookings.md §5.1). Filter by booking/property/room/master id,
     * `filter` (`read`/`unread`), `maxAge` (days), and `source`. Pagination via `page`.
     */
    list(query?: MessageQuery): Promise<Beds24Response<MessageListResponse>>;
    /**
     * Send messages (array POST; bookings.md §5.2). Each element is a `hostMessage`
     * — at minimum `bookingId` + `message`. OTA bookings only: a message posted
     * against a direct booking is not delivered. A single draft is wrapped in an
     * array; an array is passed through.
     */
    create(drafts: MessageWrite | MessageWrite[]): Promise<Beds24Response<MessageWriteResponse>>;
    /**
     * Set the `read` state on messages (bookings.md §5.3). The wire PATCH body is
     * just `{ read }`; message selection is normally done via query params. The
     * current `client.request()` does not surface query params for PATCH, so this
     * sends the read-state body only.
     */
    update(patch: MessagePatchBody): Promise<Beds24Response<MessagePatchResponse>>;
}
export declare class InvoicingOps {
    private client;
    constructor(client: Beds24Client);
    /**
     * List invoices (Alpha; bookings.md §6). Filter by `bookingId`. Each result
     * carries a nullable `invoiceId`.
     */
    list(query?: InvoiceQuery): Promise<Beds24Response<InvoiceListResponse>>;
}
//# sourceMappingURL=message-ops.d.ts.map