/**
 * Parse knowledge/apiV2.yaml and resolve its schema graph into a queryable form.
 *
 * The OpenAPI spec wires request/response bodies through `$ref`, `allOf`, and
 * `oneOf`. We flatten those into plain field lists so callers (and the validate
 * tool) get one coherent schema per endpoint instead of a pointer graph.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";

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
type JsonNode = { [key: string]: unknown };

const METHOD_ORDER = ["get", "post", "put", "delete", "patch"] as const;

/**
 * Loads and caches the parsed OpenAPI document + derived endpoint map. Built
 * lazily on first use and keyed off the resolved yaml path.
 */
class SchemaIndex {
	private doc: JsonNode | null = null;
	private endpoints = new Map<string, EndpointSchema>();
	private yamlPath: string;

	constructor(yamlPath: string) {
		this.yamlPath = yamlPath;
	}

	/** Parse the yaml (once) and populate the endpoint map. */
	private load(): JsonNode {
		if (this.doc !== null) return this.doc;

		const raw = readFileSync(this.yamlPath, "utf8");
		const doc = yaml.load(raw) as JsonNode;
		this.doc = doc;

		const paths = (doc.paths ?? {}) as Record<string, JsonNode>;
		for (const path of Object.keys(paths)) {
			const node = paths[path]!;
			for (const method of METHOD_ORDER) {
				const op = node[method];
				if (!op || typeof op !== "object") continue;
				const key = `${method.toUpperCase()} ${path}`;
				this.endpoints.set(key, this.extractEndpointSchemas(op as JsonNode));
			}
		}
		return doc;
	}

	/** Pull request + response body schemas out of an operation object. */
	private extractEndpointSchemas(op: JsonNode): EndpointSchema {
		const out: EndpointSchema = {};

		const rb = op.requestBody as JsonNode | undefined;
		if (rb) {
			const media = (rb.content as JsonNode | undefined)?.["application/json"] as
				| JsonNode
				| undefined;
			if (media?.schema) {
				// POST bodies are arrays of items; validate one item at a time.
				const schema = media.schema as JsonNode;
				out.request =
					schema.type === "array"
						? (schema.items as JsonNode | undefined) ?? schema
						: schema;
			}
		}

		const responses = (op.responses ?? {}) as Record<string, JsonNode>;
		for (const code of ["200", "201"]) {
			const resp = responses[code];
			if (!resp || typeof resp !== "object") continue;
			const media = ((resp as JsonNode).content as JsonNode | undefined)?.[
				"application/json"
			] as JsonNode | undefined;
			if (media?.schema) {
				out.response = media.schema as JsonNode;
				break;
			}
		}

		return out;
	}

	/** Resolve a `$ref` pointer like `#/components/schemas/things` to its node. */
	private resolveRef(ref: string): JsonNode | undefined {
		const parts = ref.replace(/^#\//, "").split("/");
		let cur: unknown = this.load();
		for (const part of parts) {
			if (cur && typeof cur === "object") {
				cur = (cur as Record<string, unknown>)[part];
			} else {
				return undefined;
			}
		}
		return cur as JsonNode | undefined;
	}

	/**
	 * Recursively inline `$ref`, and merge `allOf` / collect `oneOf` alternatives
	 * into a single normalized object schema suitable for validation.
	 */
	private normalize(node: JsonNode | undefined): JsonNode | undefined {
		if (!node || typeof node !== "object") return node;

		if (typeof node.$ref === "string") {
			return this.normalize(this.resolveRef(node.$ref));
		}

		const out: JsonNode = {};

		// allOf → merge every member (properties + required), in order.
		if (Array.isArray(node.allOf)) {
			const merged: JsonNode = { type: "object", properties: {}, required: [] };
			for (const member of node.allOf) {
				const norm = this.normalize(member as JsonNode);
				if (!norm || typeof norm !== "object") continue;
				if (norm.properties && typeof norm.properties === "object") {
					merged.properties = {
						...(merged.properties as JsonNode),
						...(norm.properties as JsonNode),
					};
				}
				if (Array.isArray(norm.required)) {
					(merged.required as unknown[]).push(...(norm.required as unknown[]));
				}
			}
			if (node.description) merged.description = node.description;
			return merged;
		}

		// oneOf → keep the list normalized; ajv handles the disjunction.
		if (Array.isArray(node.oneOf)) {
			return {
				...node,
				oneOf: (node.oneOf as JsonNode[]).map((n) => this.normalize(n)),
			};
		}

		// Plain object schema: copy scalar fields, recurse into properties.
		for (const [key, value] of Object.entries(node)) {
			if (key === "properties" && value && typeof value === "object") {
				const props: JsonNode = {};
				for (const [pname, pschema] of Object.entries(value as JsonNode)) {
					props[pname] = this.normalize(pschema as JsonNode) ?? pschema;
				}
				out.properties = props;
			} else if (key === "items" && value && typeof value === "object") {
				out.items = this.normalize(value as JsonNode);
			} else {
				out[key] = value;
			}
		}
		return out;
	}

	/** Resolve a named schema (e.g. `newBooking`) into a normalized object. */
	resolveNamed(name: string): JsonNode | undefined {
		const schemas = (this.load().components as JsonNode | undefined)?.schemas as
			| JsonNode
			| undefined;
		if (!schemas) return undefined;
		return this.normalize(schemas[name] as JsonNode | undefined);
	}

	/** Get the normalized request or response schema for an endpoint. */
	getSchema(endpoint: string, direction: "request" | "response"): JsonNode | undefined {
		this.load();
		const ep = this.endpoints.get(endpoint);
		if (!ep) return undefined;
		const raw = direction === "request" ? ep.request : ep.response;
		return this.normalize(raw as JsonNode | undefined);
	}

	/** All `METHOD /path` keys present in the spec, sorted. */
	listEndpoints(): string[] {
		this.load();
		return [...this.endpoints.keys()].sort();
	}
}

let singleton: SchemaIndex | null = null;

function getIndex(factsDir: string): SchemaIndex {
	if (singleton === null) {
		singleton = new SchemaIndex(join(factsDir, "apiV2.yaml"));
	}
	return singleton;
}

/** Reset the cached index (used when pointing at a different factsDir). */
export function __resetSchemaIndex(): void {
	singleton = null;
}

/** Resolve the request or response schema for an endpoint (normalized). */
export function getSchema(
	factsDir: string,
	endpoint: string,
	direction: "request" | "response",
): JsonNode | undefined {
	return getIndex(factsDir).getSchema(endpoint, direction);
}

/** Resolve a named component schema into a normalized object. */
export function resolveNamedSchema(factsDir: string, name: string): JsonNode | undefined {
	return getIndex(factsDir).resolveNamed(name);
}

/** List every `METHOD /path` in the spec. */
export function listEndpoints(factsDir: string): string[] {
	return getIndex(factsDir).listEndpoints();
}

/**
 * Flatten a normalized object schema into a field list for human/tool
 * consumption. Nested object/array types are summarized as their type name.
 */
export function resolveSchema(factsDir: string, name: string): Field[] {
	const node = resolveNamedSchema(factsDir, name);
	if (!node) return [];
	return flattenObject(node);
}

/** Flatten a normalized object schema node into fields. */
export function flattenObject(node: JsonNode | undefined): Field[] {
	if (!node || typeof node !== "object") return [];
	const properties = (node.properties as JsonNode | undefined) ?? {};
	const required = new Set((node.required as string[] | undefined) ?? []);

	const fields: Field[] = [];
	for (const [name, schema] of Object.entries(properties)) {
		const s = schema as JsonNode;
		fields.push({
			name,
			type: describeType(s),
			required: required.has(name),
			description: typeof s.description === "string" ? s.description : undefined,
			enum: Array.isArray(s.enum) ? (s.enum as string[]) : undefined,
		});
	}
	return fields;
}

/** Produce a readable type string for a schema node. */
function describeType(s: JsonNode): string {
	if (!s) return "unknown";
	if (typeof s.$ref === "string") {
		return s.$ref.split("/").pop() ?? "object";
	}
	const t = s.type;
	if (t === "array") {
		const items = s.items as JsonNode | undefined;
		const itemType = items ? describeType(items) : "unknown";
		return `array<${itemType}>`;
	}
	if (typeof t === "string") return t;
	if (Array.isArray(s.oneOf)) {
		return s.oneOf.map((n) => describeType(n as JsonNode)).join(" | ");
	}
	return "object";
}
