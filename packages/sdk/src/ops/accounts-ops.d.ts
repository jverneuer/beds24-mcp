/**
 * Account, property, and organization workflows.
 *
 * Encodes the setup/admin conventions documented in knowledge/api-v2/auth-and-setup.md
 * and knowledge/api-v2/properties-and-rooms.md:
 *  - accounts are the top-level billing/admin container (auth-and-setup.md §4 scopes)
 *  - properties use a nested property → roomTypes → units model; room-level edits
 *    must carry the parent property `id` (properties-and-rooms.md §4.1)
 *  - create vs modify is decided by `id` presence on POST
 *    (properties-and-rooms.md §4, auth-and-setup.md §6)
 *
 * Maturity (per apiV2.yaml): `/accounts` is Alpha; `/properties` reads/writes are
 * Beta with its DELETE "Coming soon"; `/properties/rooms` and `/organizations/users`
 * are "Coming soon". All eight methods below are defined in the spec (none are
 * `?: never`), so every one is wired here — callers should treat the "Coming soon"
 * surfaces as not yet live on the server.
 *
 * Every type here WRAPS the generated OpenAPI schemas (see api-types.ts) — none of
 * them redefine a wire field. `AccountDraft` / `PropertyDraft` are the generated
 * `account` / `property` schemas; the write request bodies are arrays of them.
 */
import type { Beds24Client, Beds24Response } from "../client.js";
import type { OpOf, RequestBodyOf, ResponseBodyOf } from "../api-types.js";
/** GET /accounts query params. */
export type AccountQuery = RequestBodyOf<OpOf<"GET /accounts">>;
/** POST /accounts request body: an array of these elements. */
export type AccountWriteRequest = RequestBodyOf<OpOf<"POST /accounts">>;
/** A single account draft (wraps the generated `account` schema). */
export type AccountDraft = AccountWriteRequest[number];
/** Decoded GET /accounts response `data`. */
export type AccountListResponse = ResponseBodyOf<OpOf<"GET /accounts">>;
/** Decoded POST /accounts response `data`. */
export type AccountWriteResponse = ResponseBodyOf<OpOf<"POST /accounts">>;
/** GET /properties query params. */
export type PropertyQuery = RequestBodyOf<OpOf<"GET /properties">>;
/** POST /properties request body: an array of these elements. */
export type PropertyWriteRequest = RequestBodyOf<OpOf<"POST /properties">>;
/** A single property draft (wraps the generated `property` schema). */
export type PropertyDraft = PropertyWriteRequest[number];
/** DELETE /properties query params (properties-and-rooms.md §7). */
export type PropertyDeleteQuery = RequestBodyOf<OpOf<"DELETE /properties">>;
/** Decoded GET /properties response `data`. */
export type PropertyListResponse = ResponseBodyOf<OpOf<"GET /properties">>;
/** Decoded POST /properties response `data`. */
export type PropertyWriteResponse = ResponseBodyOf<OpOf<"POST /properties">>;
/** Decoded DELETE /properties response `data`. */
export type PropertyDeleteResponse = ResponseBodyOf<OpOf<"DELETE /properties">>;
/** GET /properties/rooms query params. */
export type RoomQuery = RequestBodyOf<OpOf<"GET /properties/rooms">>;
/** DELETE /properties/rooms query params (properties-and-rooms.md §7). */
export type RoomDeleteQuery = RequestBodyOf<OpOf<"DELETE /properties/rooms">>;
/** Decoded GET /properties/rooms response `data`. */
export type RoomListResponse = ResponseBodyOf<OpOf<"GET /properties/rooms">>;
/** Decoded DELETE /properties/rooms response `data`. */
export type RoomDeleteResponse = ResponseBodyOf<OpOf<"DELETE /properties/rooms">>;
/** GET /organizations/users query params (none — the spec declares `query?: never`). */
export type OrganizationUserQuery = RequestBodyOf<OpOf<"GET /organizations/users">>;
/** Decoded GET /organizations/users response `data`. */
export type OrganizationUserListResponse = ResponseBodyOf<OpOf<"GET /organizations/users">>;
export declare class AccountOps {
    private client;
    constructor(client: Beds24Client);
    /** Read accounts (Alpha). Forwards the query as GET params. */
    list(query: AccountQuery): Promise<Beds24Response<AccountListResponse>>;
    /**
     * Create accounts (Alpha). Array POST; each element is an `account` draft. Omit
     * `id` on the drafts you want created (auth-and-setup.md §6).
     */
    create(drafts: AccountDraft | AccountDraft[]): Promise<Beds24Response<AccountWriteResponse>>;
}
export declare class PropertyOps {
    private client;
    constructor(client: Beds24Client);
    /** Read properties (Beta). Forwards the query as GET params. */
    list(query: PropertyQuery): Promise<Beds24Response<PropertyListResponse>>;
    /**
     * Create or modify properties (Beta). Array POST; each element is a `property`
     * draft. Omit `id` to create, include it to modify; room-level edits must also
     * carry the parent property `id` (properties-and-rooms.md §4, §4.1).
     */
    create(drafts: PropertyDraft | PropertyDraft[]): Promise<Beds24Response<PropertyWriteResponse>>;
    /** Delete properties by id (Coming soon; properties-and-rooms.md §7). */
    remove(ids: number[]): Promise<Beds24Response<PropertyDeleteResponse>>;
    /** Read rooms (Coming soon; properties-and-rooms.md §7). Forwards the query as GET params. */
    listRooms(query: RoomQuery): Promise<Beds24Response<RoomListResponse>>;
    /** Delete rooms by id (Coming soon; properties-and-rooms.md §7). */
    removeRoom(ids: number[]): Promise<Beds24Response<RoomDeleteResponse>>;
}
export declare class OrganizationOps {
    private client;
    constructor(client: Beds24Client);
    /** Read organization users (Coming soon). The spec declares no query params. */
    listUsers(query?: OrganizationUserQuery): Promise<Beds24Response<OrganizationUserListResponse>>;
}
//# sourceMappingURL=accounts-ops.d.ts.map