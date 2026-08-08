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
export class AccountOps {
    client;
    constructor(client) {
        this.client = client;
    }
    /** Read accounts (Alpha). Forwards the query as GET params. */
    async list(query) {
        return this.client.request("GET /accounts", query);
    }
    /**
     * Create accounts (Alpha). Array POST; each element is an `account` draft. Omit
     * `id` on the drafts you want created (auth-and-setup.md §6).
     */
    async create(drafts) {
        const items = Array.isArray(drafts) ? drafts : [drafts];
        return this.client.request("POST /accounts", items);
    }
}
export class PropertyOps {
    client;
    constructor(client) {
        this.client = client;
    }
    /** Read properties (Beta). Forwards the query as GET params. */
    async list(query) {
        return this.client.request("GET /properties", query);
    }
    /**
     * Create or modify properties (Beta). Array POST; each element is a `property`
     * draft. Omit `id` to create, include it to modify; room-level edits must also
     * carry the parent property `id` (properties-and-rooms.md §4, §4.1).
     */
    async create(drafts) {
        const items = Array.isArray(drafts) ? drafts : [drafts];
        return this.client.request("POST /properties", items);
    }
    /** Delete properties by id (Coming soon; properties-and-rooms.md §7). */
    async remove(ids) {
        return this.client.request("DELETE /properties", { id: ids });
    }
    /** Read rooms (Coming soon; properties-and-rooms.md §7). Forwards the query as GET params. */
    async listRooms(query) {
        return this.client.request("GET /properties/rooms", query);
    }
    /** Delete rooms by id (Coming soon; properties-and-rooms.md §7). */
    async removeRoom(ids) {
        return this.client.request("DELETE /properties/rooms", { id: ids });
    }
}
export class OrganizationOps {
    client;
    constructor(client) {
        this.client = client;
    }
    /** Read organization users (Coming soon). The spec declares no query params. */
    async listUsers(query) {
        return this.client.request("GET /organizations/users", query);
    }
}
//# sourceMappingURL=accounts-ops.js.map