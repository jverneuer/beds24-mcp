/**
 * Unit tests for schema.ts — the OpenAPI spec loader + resolver.
 *
 * Per TEST-HARNESS.md: positive cases use the real apiV2.yaml (via the default
 * spec dir), negative/edge cases use a crafted temp YAML, and we reset the
 * schema index between tests. The SDK's own spec is resolved via defaultSpecDir.
 *
 * Coverage target: 100% statement / branch / function / line on schema.ts.
 */

import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	getSchema,
	listEndpoints,
	resolveSchema,
	flattenObject,
	__resetSchemaIndex,
	type Field,
} from "./schema.js";

/**
 * Mirror of the private JsonNode shape used inside schema.ts. We redeclare it
 * locally (rather than import it) because the module does not export it.
 */
type JsonNode = { [key: string]: unknown };

const ORIGINAL_BEDS24_SPEC_DIR = process.env.BEDS24_SPEC_DIR;

beforeEach(() => {
	__resetSchemaIndex();
	if (ORIGINAL_BEDS24_SPEC_DIR === undefined) {
		delete process.env.BEDS24_SPEC_DIR;
	} else {
		process.env.BEDS24_SPEC_DIR = ORIGINAL_BEDS24_SPEC_DIR;
	}
});

afterEach(() => {
	__resetSchemaIndex();
	if (ORIGINAL_BEDS24_SPEC_DIR === undefined) {
		delete process.env.BEDS24_SPEC_DIR;
	} else {
		process.env.BEDS24_SPEC_DIR = ORIGINAL_BEDS24_SPEC_DIR;
	}
});

/** A minimal crafted OpenAPI spec that exercises the resolver edge cases the
 * real spec does not: $ref resolution, oneOf preservation, a $ref to a missing
 * schema, a malformed request schema (triggers ajv compile failure in validate),
 * a scalar request schema, an array request schema kept whole, a non-object
 * operation (skipped by the loader), and an endpoint with no 200/201 response. */
const CRAFTED_SPEC = `openapi: 3.0.0
info:
  title: crafted
  version: 1.0.0
paths:
  /things:
    post:
      summary: create things
      requestBody:
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/thing'
      responses:
        '200':
          description: ok
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/thing'
  /choices:
    post:
      summary: choose
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/choice'
      responses:
        '200':
          description: ok
  /text-thing:
    post:
      summary: non-json request body
      requestBody:
        content:
          text/plain:
            schema:
              type: string
      responses:
        '200':
          description: ok
  /only-four-hundred:
    post:
      summary: no 200/201 response schema
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                a:
                  type: string
      responses:
        '400':
          description: bad
  /broken:
    post:
      summary: malformed request schema
      requestBody:
        content:
          application/json:
            schema:
              properties: 5
      responses:
        '200':
          description: ok
  /scalar:
    post:
      summary: scalar request schema
      requestBody:
        content:
          application/json:
            schema: "justastring"
      responses:
        '200':
          description: ok
  /lists:
    post:
      summary: array request schema kept whole
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/thingList'
      responses:
        '200':
          description: ok
  /bad-ref:
    post:
      summary: dangling ref
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/doesNotExist'
      responses:
        '200':
          description: ok
  /weird:
    get: "not-an-object"
components:
  schemas:
    thing:
      type: object
      additionalProperties: false
      required:
        - name
      properties:
        name:
          type: string
        amount:
          type: integer
        color:
          type: string
          enum:
            - red
            - blue
    choice:
      oneOf:
        - type: object
          properties:
            kind:
              type: string
            a:
              type: integer
        - type: object
          properties:
            kind:
              type: string
            b:
              type: string
    thingList:
      type: array
      items:
        type: object
        properties:
          deep:
            type: string
`;

/** Absolute path to the crafted spec written to a temp dir per run. */
const CRAFTED_SPEC_PATH = (() => {
	const dir = mkdtempSync(join(tmpdir(), "beds24-sdk-schema-"));
	const file = join(dir, "spec.yaml");
	writeFileSync(file, CRAFTED_SPEC);
	return file;
})();

describe("listEndpoints", () => {
	test("returns every METHOD /path from the real spec, sorted", () => {
		const eps = listEndpoints();
		expect(Array.isArray(eps)).toBe(true);
		expect(eps.length).toBeGreaterThan(0);
		// Every entry is "METHOD /path".
		for (const ep of eps) {
			expect(ep).toMatch(/^(GET|POST|PUT|DELETE|PATCH) /);
		}
		// Known bookings endpoints are present.
		expect(eps).toContain("GET /bookings");
		expect(eps).toContain("POST /bookings");
		// Sorted ascending.
		expect(eps).toEqual([...eps].sort());
	});

	test("loads only the endpoints present in a crafted spec", () => {
		const eps = listEndpoints(CRAFTED_SPEC_PATH);
		expect(eps).toContain("POST /things");
		expect(eps).toContain("POST /choices");
		// Real-spec endpoints do not leak in.
		expect(eps).not.toContain("GET /bookings");
	});

	test("skips methods whose operation is not an object", () => {
		// /weird has get: "not-an-object" — the loader must skip it without
		// throwing and it must not appear in the listing.
		const eps = listEndpoints(CRAFTED_SPEC_PATH);
		expect(eps).not.toContain("GET /weird");
	});
});

describe("getSchema (real spec)", () => {
	test("POST /bookings request resolves the array items' allOf into one object", () => {
		const schema = getSchema("POST /bookings", "request");
		expect(schema).toBeDefined();
		expect(typeof schema).toBe("object");
		const node = schema as JsonNode;
		expect(node.type).toBe("object");
		const properties = node.properties as JsonNode | undefined;
		expect(properties).toBeDefined();
		// Merged from the allOf: id (member 1), newBooking fields, actions.
		expect(properties).toHaveProperty("roomId");
		expect(properties).toHaveProperty("arrival");
		expect(properties).toHaveProperty("departure");
		expect(properties).toHaveProperty("status");
		expect(properties).toHaveProperty("actions");
		expect(properties).toHaveProperty("id");
		// Required bubbled up from newBooking.
		expect(node.required).toEqual(["roomId", "arrival", "departure"]);
	});

	test("GET /bookings request is undefined (no requestBody, only query params)", () => {
		expect(getSchema("GET /bookings", "request")).toBeUndefined();
	});

	test("GET /bookings response resolves (allOf of SuccessfulApiResponse)", () => {
		const schema = getSchema("GET /bookings", "response");
		expect(schema).toBeDefined();
		const node = schema as JsonNode;
		expect(node.properties).toBeDefined();
		const props = node.properties as JsonNode;
		expect(props).toHaveProperty("data");
	});

	test("an unknown endpoint returns undefined", () => {
		expect(getSchema("GET /nope", "request")).toBeUndefined();
		expect(getSchema("BOGUS /bookings", "response")).toBeUndefined();
	});

	test("request and response differ for the same endpoint", () => {
		const req = getSchema("GET /bookings", "request");
		const res = getSchema("GET /bookings", "response");
		// One is undefined (request), the other an object (response).
		expect(req).toBeUndefined();
		expect(typeof res).toBe("object");
	});
});

describe("getSchema (crafted spec)", () => {
	test("resolves a $ref request schema to its concrete object", () => {
		const schema = getSchema("POST /things", "request", CRAFTED_SPEC_PATH);
		expect(schema).toBeDefined();
		const node = schema as JsonNode;
		// Array was unwrapped → request is the items' schema (thing).
		expect(node.type).toBe("object");
		expect(node.additionalProperties).toBe(false);
		expect(node.required).toEqual(["name"]);
		const props = node.properties as JsonNode;
		expect(props).toHaveProperty("name");
		expect(props).toHaveProperty("amount");
		expect(props).toHaveProperty("color");
	});

	test("preserves oneOf on the resolved request schema", () => {
		const schema = getSchema("POST /choices", "request", CRAFTED_SPEC_PATH);
		expect(schema).toBeDefined();
		const node = schema as JsonNode;
		expect(Array.isArray(node.oneOf)).toBe(true);
		expect((node.oneOf as unknown[]).length).toBe(2);
	});

	test("returns undefined when the request body has no JSON content", () => {
		// /text-thing only declares text/plain.
		expect(getSchema("POST /text-thing", "request", CRAFTED_SPEC_PATH)).toBeUndefined();
	});

	test("returns undefined when there is no 200/201 response schema", () => {
		// /only-four-hundred has only a 400 response.
		expect(getSchema("POST /only-four-hundred", "response", CRAFTED_SPEC_PATH)).toBeUndefined();
	});

	test("returns undefined for a dangling $ref", () => {
		// /bad-ref points at #/components/schemas/doesNotExist.
		expect(getSchema("POST /bad-ref", "request", CRAFTED_SPEC_PATH)).toBeUndefined();
	});

	test("keeps an array request schema whole (not unwrapped) when it is a $ref", () => {
		// /lists references an array schema directly; the top-level type stays array.
		const schema = getSchema("POST /lists", "request", CRAFTED_SPEC_PATH);
		expect(schema).toBeDefined();
		const node = schema as JsonNode;
		expect(node.type).toBe("array");
		expect(node.items).toBeDefined();
	});

	test("resolves a response $ref schema", () => {
		const schema = getSchema("POST /things", "response", CRAFTED_SPEC_PATH);
		expect(schema).toBeDefined();
		const node = schema as JsonNode;
		expect(node.type).toBe("object");
		expect(node.required).toEqual(["name"]);
	});
});

describe("resolveSchema (named component → Field[])", () => {
	test("flattens newBooking into fields with the right shape", () => {
		const fields = resolveSchema("newBooking");
		expect(fields.length).toBeGreaterThan(0);
		const roomId = fields.find((f) => f.name === "roomId");
		expect(roomId).toBeDefined();
		expect(roomId!.required).toBe(true);
		expect(roomId!.type).toBe("integer");
		const status = fields.find((f) => f.name === "status");
		expect(status).toBeDefined();
		expect(status!.enum).toEqual([
			"confirmed",
			"request",
			"new",
			"cancelled",
			"black",
			"inquiry",
		]);
	});

	test("returns [] for a name that does not exist", () => {
		expect(resolveSchema("doesNotExist")).toEqual([]);
	});

	test("resolves a named schema from a crafted spec", () => {
		const fields = resolveSchema("thing", CRAFTED_SPEC_PATH);
		expect(fields.map((f) => f.name)).toEqual(["name", "amount", "color"]);
		const name = fields.find((f) => f.name === "name");
		expect(name!.required).toBe(true);
	});
});

describe("flattenObject", () => {
	test("returns [] for undefined / non-object input", () => {
		expect(flattenObject(undefined)).toEqual([]);
		expect(flattenObject("not-a-schema" as unknown as JsonNode)).toEqual([]);
		expect(flattenObject(123 as unknown as JsonNode)).toEqual([]);
	});

	test("maps properties to the Field shape (name, type, required, description, enum)", () => {
		const node = {
			type: "object",
			required: ["id"],
			properties: {
				id: { type: "integer", description: "primary key" },
				status: { type: "string", enum: ["on", "off"] },
				label: { type: "string" },
			},
		} as unknown as JsonNode;

		const fields = flattenObject(node);
		expect(fields).toHaveLength(3);

		const byName = (n: string): Field => {
			const f = fields.find((x) => x.name === n);
			expect(f).toBeDefined();
			return f!;
		};

		expect(byName("id")).toMatchObject({
			name: "id",
			type: "integer",
			required: true,
			description: "primary key",
		});
		expect(byName("id").enum).toBeUndefined();

		expect(byName("status")).toMatchObject({
			name: "status",
			type: "string",
			required: false,
			enum: ["on", "off"],
		});

		expect(byName("label")).toMatchObject({
			name: "label",
			type: "string",
			required: false,
		});
		expect(byName("label").description).toBeUndefined();
	});

	test("summarizes nested types via describeType (ref / array / oneOf / object)", () => {
		// NOTE: describeType's "unknown" branch (hit when a property schema is
		// falsy) is unreachable through flattenObject with the current source:
		// flattenObject accesses `s.description` unconditionally (schema.ts:261),
		// which throws on a falsy `s` before the result is returned. Real specs
		// never produce undefined property schemas, so this is a latent edge
		// case; it is documented here rather than exercised.
		const node = {
			properties: {
				refField: { $ref: "#/components/schemas/Thing" },
				arrField: { type: "array", items: { type: "integer" } },
				strField: { type: "string" },
				oneOfField: { oneOf: [{ type: "string" }, { type: "integer" }] },
				objField: { properties: { nested: { type: "string" } } },
				emptyField: {},
			},
		} as unknown as JsonNode;

		const fields = flattenObject(node);
		const byName = (n: string): Field => {
			const f = fields.find((x) => x.name === n);
			expect(f).toBeDefined();
			return f!;
		};

		expect(byName("refField").type).toBe("Thing");
		expect(byName("arrField").type).toBe("array<integer>");
		expect(byName("strField").type).toBe("string");
		expect(byName("oneOfField").type).toBe("string | integer");
		expect(byName("objField").type).toBe("object");
		expect(byName("emptyField").type).toBe("object");
	});
});

describe("caching + __resetSchemaIndex", () => {
	test("repeated getSchema calls are consistent (equal content)", () => {
		// normalize() builds a fresh object on every call, so results are
		// structurally equal but not the same reference.
		const a = getSchema("POST /bookings", "request");
		const b = getSchema("POST /bookings", "request");
		expect(a).toEqual(b);
	});

	test("a separate spec dir is cached independently", () => {
		const real = getSchema("POST /bookings", "request");
		const crafted = getSchema("POST /things", "request", CRAFTED_SPEC_PATH);
		expect(typeof real).toBe("object");
		expect(typeof crafted).toBe("object");
		// They are distinct documents.
		expect(real).not.toBe(crafted);
	});

	test("__resetSchemaIndex clears the cache so the next call reloads", () => {
		const before = getSchema("POST /bookings", "request");
		expect(before).toBeDefined();
		__resetSchemaIndex();
		const after = getSchema("POST /bookings", "request");
		expect(after).toBeDefined();
		// Same content, but a fresh load (not the identical cached reference).
		expect(after).not.toBe(before);
		expect(after).toEqual(before);
	});

	test("reset also isolates the crafted spec", () => {
		const before = getSchema("POST /things", "request", CRAFTED_SPEC_PATH);
		expect(before).toBeDefined();
		__resetSchemaIndex();
		const after = getSchema("POST /things", "request", CRAFTED_SPEC_PATH);
		expect(after).toBeDefined();
		expect(after).not.toBe(before);
	});
});

describe("$ref / allOf / oneOf resolution against real + crafted specs", () => {
	test("$ref inside allOf is fully inlined (newBooking required present)", () => {
		const schema = getSchema("POST /bookings", "request");
		const node = schema as JsonNode;
		// newBooking is pulled in via $ref inside the items' allOf.
		expect(node.required).toContain("roomId");
		expect(node.required).toContain("arrival");
		const props = node.properties as JsonNode;
		expect(props).toHaveProperty("firstName");
	});

	test("response allOf merges multiple members into one object", () => {
		const schema = getSchema("GET /bookings", "response");
		const node = schema as JsonNode;
		const props = node.properties as JsonNode;
		// SuccessfulApiResponse contributes nothing named; the second member
		// contributes type, pages, data.
		expect(props).toHaveProperty("type");
		expect(props).toHaveProperty("data");
	});

	test("oneOf alternatives are normalized but kept as a disjunction", () => {
		const schema = getSchema("POST /choices", "request", CRAFTED_SPEC_PATH);
		const node = schema as JsonNode;
		const alts = node.oneOf as JsonNode[];
		expect(alts).toHaveLength(2);
		// Each alternative is itself normalized (refs inlined, properties kept).
		for (const alt of alts) {
			expect(typeof alt).toBe("object");
			expect(alt.properties).toBeDefined();
		}
	});
});
