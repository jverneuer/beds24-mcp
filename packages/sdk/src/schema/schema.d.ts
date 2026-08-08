/**
 * Parse knowledge/apiV2.yaml and resolve its schema graph into a queryable form.
 *
 * The OpenAPI spec wires request/response bodies through `$ref`, `allOf`, and
 * `oneOf`. We flatten those into plain field lists so callers (and the validate
 * tool) get one coherent schema per endpoint instead of a pointer graph.
 */
/** A single flattened field of a resolved schema. */
export interface Field {
    name: string;
    type: string;
    required: boolean;
    description?: string;
    enum?: string[];
}
/** A resolved endpoint schema, request and/or response. */
export interface EndpointSchema {
    request?: unknown;
    response?: unknown;
}
/** A loose JSON-schema-like node in the OpenAPI document. */
type JsonNode = {
    [key: string]: unknown;
};
/** Reset every cached index (used in tests or when swapping specs). */
export declare function __resetSchemaIndex(): void;
/** Resolve the request or response schema for an endpoint (normalized). */
export declare function getSchema(endpoint: string, direction: "request" | "response", specDir?: string): JsonNode | undefined;
/** Resolve a named component schema into a normalized object. */
export declare function resolveNamedSchema(name: string, specDir?: string): JsonNode | undefined;
/** List every `METHOD /path` in the spec. */
export declare function listEndpoints(specDir?: string): string[];
/**
 * Flatten a normalized object schema into a field list for human/tool
 * consumption. Nested object/array types are summarized as their type name.
 */
export declare function resolveSchema(name: string, specDir?: string): Field[];
/** Flatten a normalized object schema node into fields. */
export declare function flattenObject(node: JsonNode | undefined): Field[];
export {};
//# sourceMappingURL=schema.d.ts.map