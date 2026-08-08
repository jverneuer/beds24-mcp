/**
 * Parse knowledge/apiV2.yaml and resolve its schema graph into a queryable form.
 *
 * The OpenAPI spec wires request/response bodies through `$ref`, `allOf`, and
 * `oneOf`. We flatten those into plain field lists so callers (and the validate
 * tool) get one coherent schema per endpoint instead of a pointer graph.
 */
import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { defaultSpecDir } from "../paths.js";
const METHOD_ORDER = ["get", "post", "put", "delete", "patch"];
/**
 * Loads and caches the parsed OpenAPI document + derived endpoint map. Built
 * lazily on first use and keyed off the resolved yaml path.
 */
class SchemaIndex {
    doc = null;
    endpoints = new Map();
    yamlPath;
    constructor(yamlPath) {
        this.yamlPath = yamlPath;
    }
    /** Parse the yaml (once) and populate the endpoint map. */
    load() {
        if (this.doc !== null)
            return this.doc;
        const raw = readFileSync(this.yamlPath, "utf8");
        const doc = yaml.load(raw);
        this.doc = doc;
        const paths = (doc.paths ?? {});
        for (const path of Object.keys(paths)) {
            const node = paths[path];
            for (const method of METHOD_ORDER) {
                const op = node[method];
                if (!op || typeof op !== "object")
                    continue;
                const key = `${method.toUpperCase()} ${path}`;
                this.endpoints.set(key, this.extractEndpointSchemas(op));
            }
        }
        return doc;
    }
    /** Pull request + response body schemas out of an operation object. */
    extractEndpointSchemas(op) {
        const out = {};
        const rb = op.requestBody;
        if (rb) {
            const media = rb.content?.["application/json"];
            if (media?.schema) {
                // POST bodies are arrays of items; validate one item at a time.
                const schema = media.schema;
                out.request =
                    schema.type === "array"
                        ? schema.items ?? schema
                        : schema;
            }
        }
        const responses = (op.responses ?? {});
        for (const code of ["200", "201"]) {
            const resp = responses[code];
            if (!resp || typeof resp !== "object")
                continue;
            const media = resp.content?.["application/json"];
            if (media?.schema) {
                out.response = media.schema;
                break;
            }
        }
        return out;
    }
    /** Resolve a `$ref` pointer like `#/components/schemas/things` to its node. */
    resolveRef(ref) {
        const parts = ref.replace(/^#\//, "").split("/");
        let cur = this.load();
        for (const part of parts) {
            if (cur && typeof cur === "object") {
                cur = cur[part];
            }
            else {
                return undefined;
            }
        }
        return cur;
    }
    /**
     * Recursively inline `$ref`, and merge `allOf` / collect `oneOf` alternatives
     * into a single normalized object schema suitable for validation.
     */
    normalize(node) {
        if (!node || typeof node !== "object")
            return node;
        if (typeof node.$ref === "string") {
            return this.normalize(this.resolveRef(node.$ref));
        }
        const out = {};
        // allOf → merge every member (properties + required), in order.
        if (Array.isArray(node.allOf)) {
            const merged = { type: "object", properties: {}, required: [] };
            for (const member of node.allOf) {
                const norm = this.normalize(member);
                if (!norm || typeof norm !== "object")
                    continue;
                if (norm.properties && typeof norm.properties === "object") {
                    merged.properties = {
                        ...merged.properties,
                        ...norm.properties,
                    };
                }
                if (Array.isArray(norm.required)) {
                    merged.required.push(...norm.required);
                }
            }
            if (node.description)
                merged.description = node.description;
            return merged;
        }
        // oneOf → keep the list normalized; ajv handles the disjunction.
        if (Array.isArray(node.oneOf)) {
            return {
                ...node,
                oneOf: node.oneOf.map((n) => this.normalize(n)),
            };
        }
        // Plain object schema: copy scalar fields, recurse into properties.
        for (const [key, value] of Object.entries(node)) {
            if (key === "properties" && value && typeof value === "object") {
                const props = {};
                for (const [pname, pschema] of Object.entries(value)) {
                    props[pname] = this.normalize(pschema) ?? pschema;
                }
                out.properties = props;
            }
            else if (key === "items" && value && typeof value === "object") {
                out.items = this.normalize(value);
            }
            else {
                out[key] = value;
            }
        }
        return out;
    }
    /** Resolve a named schema (e.g. `newBooking`) into a normalized object. */
    resolveNamed(name) {
        const schemas = this.load().components?.schemas;
        if (!schemas)
            return undefined;
        return this.normalize(schemas[name]);
    }
    /** Get the normalized request or response schema for an endpoint. */
    getSchema(endpoint, direction) {
        this.load();
        const ep = this.endpoints.get(endpoint);
        if (!ep)
            return undefined;
        const raw = direction === "request" ? ep.request : ep.response;
        return this.normalize(raw);
    }
    /** All `METHOD /path` keys present in the spec, sorted. */
    listEndpoints() {
        this.load();
        return [...this.endpoints.keys()].sort();
    }
}
const indexCache = new Map();
/**
 * Resolve (and cache) the SchemaIndex for a given spec path. The cache is keyed
 * by specDir so callers can point at different specs without clobbering each
 * other. specDir defaults to the sdk package's own apiV2.yaml.
 */
function getIndex(specDir = defaultSpecDir()) {
    const existing = indexCache.get(specDir);
    if (existing)
        return existing;
    const index = new SchemaIndex(specDir);
    indexCache.set(specDir, index);
    return index;
}
/** Reset every cached index (used in tests or when swapping specs). */
export function __resetSchemaIndex() {
    indexCache.clear();
}
/** Resolve the request or response schema for an endpoint (normalized). */
export function getSchema(endpoint, direction, specDir = defaultSpecDir()) {
    return getIndex(specDir).getSchema(endpoint, direction);
}
/** Resolve a named component schema into a normalized object. */
export function resolveNamedSchema(name, specDir = defaultSpecDir()) {
    return getIndex(specDir).resolveNamed(name);
}
/** List every `METHOD /path` in the spec. */
export function listEndpoints(specDir = defaultSpecDir()) {
    return getIndex(specDir).listEndpoints();
}
/**
 * Flatten a normalized object schema into a field list for human/tool
 * consumption. Nested object/array types are summarized as their type name.
 */
export function resolveSchema(name, specDir = defaultSpecDir()) {
    const node = resolveNamedSchema(name, specDir);
    if (!node)
        return [];
    return flattenObject(node);
}
/** Flatten a normalized object schema node into fields. */
export function flattenObject(node) {
    if (!node || typeof node !== "object")
        return [];
    const properties = node.properties ?? {};
    const required = new Set(node.required ?? []);
    const fields = [];
    for (const [name, schema] of Object.entries(properties)) {
        const s = schema;
        fields.push({
            name,
            type: describeType(s),
            required: required.has(name),
            description: typeof s.description === "string" ? s.description : undefined,
            enum: Array.isArray(s.enum) ? s.enum : undefined,
        });
    }
    return fields;
}
/** Produce a readable type string for a schema node. */
function describeType(s) {
    if (!s)
        return "unknown";
    if (typeof s.$ref === "string") {
        return s.$ref.split("/").pop() ?? "object";
    }
    const t = s.type;
    if (t === "array") {
        const items = s.items;
        const itemType = items ? describeType(items) : "unknown";
        return `array<${itemType}>`;
    }
    if (typeof t === "string")
        return t;
    if (Array.isArray(s.oneOf)) {
        return s.oneOf.map((n) => describeType(n)).join(" | ");
    }
    return "object";
}
//# sourceMappingURL=schema.js.map