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

/** A single operation parameter, flattened for tool consumption. */
export interface Parameter {
	name: string;
	location: string; // "path" | "query" | "header" | "cookie"
	required: boolean;
	schemaType: string; // JSON-schema type, default "string"
	description: string;
}

/** Operation-level metadata (summary/description/tags/parameters/operationId). */
export interface EndpointMeta {
	method: string; // "GET"
	path: string; // "/authentication/setup"
	operationId: string;
	summary: string;
	description: string;
	tags: string[];
	parameters: Parameter[];
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

	/**
	 * Top-level property names of the normalized request/response schema for an
	 * endpoint. Cheap discovery helper — returns only names, not full fields.
	 * Sorted alphabetically; empty array when the endpoint has no such schema.
	 */
	getFieldNames(endpoint: string, direction: "request" | "response"): string[] {
		const node = this.getSchema(endpoint, direction);
		if (!node || typeof node !== "object") return [];
		const properties = (node.properties as JsonNode | undefined) ?? {};
		return Object.keys(properties).sort();
	}

	/**
	 * The schema-reference name the request/response body points to, if its
	 * raw (pre-normalization) root is a top-level `$ref`
	 * (e.g. `#/components/schemas/refreshToken` → "refreshToken"). Null
	 * otherwise. Used by discovery to say "returns X". We read the raw schema
	 * because `getSchema` normalizes `$ref` away.
	 */
	getSchemaRef(endpoint: string, direction: "request" | "response"): string | null {
		this.load();
		const ep = this.endpoints.get(endpoint);
		if (!ep) return null;
		const raw = (direction === "request" ? ep.request : ep.response) as JsonNode | undefined;
		if (!raw || typeof raw !== "object") return null;
		const ref = (raw as JsonNode).$ref;
		if (typeof ref !== "string") return null;
		return ref.split("/").pop() ?? null;
	}

	/**
	 * Operation-level metadata for an endpoint: method, path, operationId,
	 * summary, description, tags, and merged parameters (per-operation
	 * overriding path-item parameters, per OpenAPI semantics).
	 */
	getEndpointMeta(endpoint: string): EndpointMeta | undefined {
		this.load();

		const parts = endpoint.split(" ");
		if (parts.length < 2) return undefined;
		const method = parts[0]!.toLowerCase();
		const path = parts.slice(1).join(" ");

		const paths = (this.doc?.paths ?? {}) as Record<string, JsonNode>;
		const pathItem = paths[path];
		if (!pathItem || typeof pathItem !== "object") return undefined;

		const op = (pathItem as JsonNode)[method];
		if (!op || typeof op !== "object") return undefined;
		const opNode = op as JsonNode;

		const pathParams = Array.isArray((pathItem as JsonNode).parameters)
			? ((pathItem as JsonNode).parameters as JsonNode[])
			: [];
		const opParams = Array.isArray(opNode.parameters)
			? (opNode.parameters as JsonNode[])
			: [];

		return {
			method: method.toUpperCase(),
			path,
			operationId: typeof opNode.operationId === "string" ? opNode.operationId : "",
			summary: typeof opNode.summary === "string" ? opNode.summary : "",
			description: typeof opNode.description === "string" ? opNode.description : "",
			tags: Array.isArray(opNode.tags) ? (opNode.tags as string[]) : [],
			parameters: this.mergeParameters(pathParams, opParams),
		};
	}

	/**
	 * Merge path-item and operation parameters (OpenAPI: operation overrides
	 * path-item when both declare the same name+location), then flatten each
	 * into a Parameter. Parameter entries may themselves be `$ref`s
	 * (e.g. `- $ref: '#/components/parameters/page'`), so resolve those first.
	 */
	private mergeParameters(pathParams: JsonNode[], opParams: JsonNode[]): Parameter[] {
		const byKey = new Map<string, JsonNode>();
		for (const p of pathParams) {
			const resolved = this.resolveParameter(p);
			if (resolved) byKey.set(paramKey(resolved), resolved);
		}
		for (const p of opParams) {
			const resolved = this.resolveParameter(p);
			if (resolved) byKey.set(paramKey(resolved), resolved);
		}
		return [...byKey.values()].map((p) => flattenParameter(p));
	}

	/** Resolve a parameter entry if it's a `$ref`, returning a concrete object. */
	private resolveParameter(p: JsonNode): JsonNode | undefined {
		if (!p || typeof p !== "object") return undefined;
		if (typeof (p as JsonNode).$ref === "string") {
			return this.resolveRef((p as JsonNode).$ref as string);
		}
		return p;
	}

	/** All `METHOD /path` keys present in the spec, sorted. */
	listEndpoints(): string[] {
		this.load();
		return [...this.endpoints.keys()].sort();
	}
}

/** Key a parameter by name+location so operation params override path params. */
function paramKey(p: JsonNode): string {
	return `${String(p.name ?? "")}/${String(p.in ?? "")}`;
}

/** Flatten one OpenAPI parameter object into a Parameter. */
function flattenParameter(p: JsonNode): Parameter {
	const schema = (p.schema as JsonNode) ?? {};
	return {
		name: typeof p.name === "string" ? p.name : "",
		location: typeof p.in === "string" ? p.in : "",
		required: p.required === true,
		schemaType: typeof schema.type === "string" ? schema.type : "string",
		description: typeof p.description === "string" ? p.description : "",
	};
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

/** Get operation-level metadata (summary/description/tags/parameters) for an endpoint. */
export function getEndpointMeta(factsDir: string, endpoint: string): EndpointMeta | undefined {
	return getIndex(factsDir).getEndpointMeta(endpoint);
}

/** Top-level field names of the normalized request/response schema (sorted). */
export function getFieldNames(
	factsDir: string,
	endpoint: string,
	direction: "request" | "response",
): string[] {
	return getIndex(factsDir).getFieldNames(endpoint, direction);
}

/** Named `$ref` the raw request/response body resolves to, or null. */
export function getSchemaRef(
	factsDir: string,
	endpoint: string,
	direction: "request" | "response",
): string | null {
	return getIndex(factsDir).getSchemaRef(endpoint, direction);
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
