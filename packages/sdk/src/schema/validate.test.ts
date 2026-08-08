/**
 * Unit tests for validate.ts — the ajv-based request validator.
 *
 * Per TEST-HARNESS.md: positive cases use the real apiV2.yaml; edge cases
 * (additionalProperties "did you mean?", compile failure, empty known-fields)
 * use a crafted temp YAML. We reset the schema index between tests.
 *
 * The real POST /bookings request body is an ARRAY of items (the items merge
 * newBooking + bookingActions via allOf). validate() checks payload[0].
 *
 * Coverage target: 100% statement / branch / function / line on validate.ts.
 */

import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Beds24Validator, validateRequest } from "./validate.js";
import { __resetSchemaIndex } from "./schema.js";

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

/** A validator bound to the real apiV2.yaml. */
function realValidator(): Beds24Validator {
	return Beds24Validator.create();
}

describe("Beds24Validator.validate — real spec (POST /bookings)", () => {
	test("valid array payload → { valid: true, errors: [] }", () => {
		const res = realValidator().validate("POST /bookings", "request", [
			{ roomId: 1001, arrival: "2026-08-01", departure: "2026-08-05" },
		]);
		expect(res.valid).toBe(true);
		expect(res.errors).toEqual([]);
	});

	test("valid payload accepts optional fields (firstName, status enum)", () => {
		const res = realValidator().validate("POST /bookings", "request", [
			{
				roomId: 1001,
				arrival: "2026-08-01",
				departure: "2026-08-05",
				firstName: "Ada",
				status: "confirmed",
			},
		]);
		expect(res.valid).toBe(true);
		expect(res.errors).toEqual([]);
	});

	test("missing required field → structured error with JSON path (root)", () => {
		const res = realValidator().validate("POST /bookings", "request", [
			{ arrival: "2026-08-01", departure: "2026-08-05" },
		]);
		expect(res.valid).toBe(false);
		expect(res.errors.length).toBeGreaterThan(0);
		const err = res.errors.find((e) => e.message.includes("roomId"));
		expect(err).toBeDefined();
		expect(err!.path).toBe("(root)");
		expect(err!.expected).toBe("present");
		expect(err!.actual).toBe("missing");
	});

	test("wrong type (roomId as string) → type error with JSON path", () => {
		const res = realValidator().validate("POST /bookings", "request", [
			{ roomId: "not-a-number", arrival: "2026-08-01", departure: "2026-08-05" },
		]);
		expect(res.valid).toBe(false);
		const err = res.errors.find((e) => e.path === "/roomId");
		expect(err).toBeDefined();
		expect(err!.message).toContain("should be integer");
		expect(err!.expected).toBe("integer");
	});

	test("invalid enum value → enum error listing allowed values", () => {
		const res = realValidator().validate("POST /bookings", "request", [
			{ roomId: 1, arrival: "2026-08-01", departure: "2026-08-05", status: "bogus" },
		]);
		expect(res.valid).toBe(false);
		const err = res.errors.find((e) => e.path === "/status");
		expect(err).toBeDefined();
		expect(err!.message).toContain("expected one of");
		// Allowed values are surfaced.
		expect(err!.expected).toContain("confirmed");
	});

	test("constraint violation (minimum) → fallback error shape", () => {
		const res = realValidator().validate("POST /bookings", "request", [
			{ roomId: 1, arrival: "2026-08-01", departure: "2026-08-05", numAdult: -1 },
		]);
		expect(res.valid).toBe(false);
		const err = res.errors.find((e) => e.path === "/numAdult");
		expect(err).toBeDefined();
		expect(err!.message.length).toBeGreaterThan(0);
	});

	test("validates the array's first item, not the array wrapper", () => {
		// Second item is invalid but only payload[0] is checked → still valid.
		const res = realValidator().validate("POST /bookings", "request", [
			{ roomId: 1, arrival: "2026-08-01", departure: "2026-08-05" },
			{ arrival: "2026-08-01" }, // missing roomId + departure
		]);
		expect(res.valid).toBe(true);
	});
});

describe("GET endpoint with no request schema", () => {
	test("GET /bookings request → valid:false with a no-schema error", () => {
		const res = realValidator().validate("GET /bookings", "request", {
			arrival: "2026-08-01",
		});
		expect(res.valid).toBe(false);
		expect(res.errors).toHaveLength(1);
		expect(res.errors[0]!.message).toContain("no request schema found for");
		expect(res.errors[0]!.message).toContain("GET /bookings");
	});

	test("unknown endpoint → no-schema error", () => {
		const res = realValidator().validate("GET /nope", "request", {});
		expect(res.valid).toBe(false);
		expect(res.errors[0]!.message).toContain("no request schema found for");
	});
});

describe("additionalProperties / did you mean? (crafted spec)", () => {
	/**
	 * Crafted spec: /things validates an array of `thing`, which has
	 * additionalProperties: false and known fields name/amount/color. This is
	 * what lets an unknown field trigger the "did you mean?" suggestion — the
	 * real newBooking schema does NOT forbid additional properties.
	 */
	const CRAFTED = `openapi: 3.0.0
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
  /empty:
    post:
      summary: no known fields
      requestBody:
        content:
          application/json:
            schema:
              type: array
              items:
                additionalProperties: false
      responses:
        '200':
          description: ok
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
`;

	const SPEC_PATH = (() => {
		const dir = mkdtempSync(join(tmpdir(), "beds24-sdk-validate-"));
		const file = join(dir, "spec.yaml");
		writeFileSync(file, CRAFTED);
		return file;
	})();

	function crafted(): Beds24Validator {
		return Beds24Validator.create({ specDir: SPEC_PATH });
	}

	test("misspelled field → suggestion points at the nearest real field", () => {
		const res = crafted().validate("POST /things", "request", [
			{ name: "x", ammount: 5 },
		]);
		expect(res.valid).toBe(false);
		const err = res.errors.find((e) => e.message.includes("ammount"));
		expect(err).toBeDefined();
		expect(err!.suggestion).toBe("amount");
		expect(err!.message).toContain("(did you mean amount?)");
		expect(err!.expected).toBe("known field");
	});

	test("valid payload for the crafted schema", () => {
		const res = crafted().validate("POST /things", "request", [
			{ name: "x", amount: 5, color: "red" },
		]);
		expect(res.valid).toBe(true);
		expect(res.errors).toEqual([]);
	});

	test("missing required field in crafted schema", () => {
		const res = crafted().validate("POST /things", "request", [{ amount: 5 }]);
		expect(res.valid).toBe(false);
		const err = res.errors.find((e) => e.message.includes("name"));
		expect(err).toBeDefined();
		expect(err!.path).toBe("(root)");
	});

	test("far misspelling → no suggestion when nothing is close enough", () => {
		const res = crafted().validate("POST /things", "request", [
			{ name: "x", zzzzzzz: 1 },
		]);
		expect(res.valid).toBe(false);
		const err = res.errors.find((e) => e.message.includes("zzzzzzz"));
		expect(err).toBeDefined();
		expect(err!.suggestion).toBeUndefined();
		expect(err!.message).not.toContain("did you mean");
	});

	test("unknown field but NO known fields → no suggestion (empty dictionary)", () => {
		// /empty forbids additional properties but defines no fields, so the
		// suggestion dictionary is empty and no "did you mean?" is offered.
		const res = crafted().validate("POST /empty", "request", [{ x: 1 }]);
		expect(res.valid).toBe(false);
		const err = res.errors.find((e) => e.message.includes("x"));
		expect(err).toBeDefined();
		expect(err!.suggestion).toBeUndefined();
	});
});

describe("ajv compile failure (crafted spec)", () => {
	// A malformed schema (properties: 5) makes ajv.compile throw — the
	// validator must catch it and return a structured error rather than bubble.
	const CRAFTED = `openapi: 3.0.0
info:
  title: broken
  version: 1.0.0
paths:
  /broken:
    post:
      summary: broken
      requestBody:
        content:
          application/json:
            schema:
              properties: 5
      responses:
        '200':
          description: ok
`;

	const SPEC_PATH = (() => {
		const dir = mkdtempSync(join(tmpdir(), "beds24-sdk-broken-"));
		const file = join(dir, "spec.yaml");
		writeFileSync(file, CRAFTED);
		return file;
	})();

	test("returns a structured compile-failure error", () => {
		const v = Beds24Validator.create({ specDir: SPEC_PATH });
		const res = v.validate("POST /broken", "request", { anything: 1 });
		expect(res.valid).toBe(false);
		expect(res.errors).toHaveLength(1);
		expect(res.errors[0]!.message).toContain("failed to compile schema for");
	});
});

describe("validateRequest (stateless)", () => {
	test("behaves the same as the validator instance on a valid payload", () => {
		const payload = [
			{ roomId: 1001, arrival: "2026-08-01", departure: "2026-08-05" },
		];
		const viaInstance = realValidator().validate(
			"POST /bookings",
			"request",
			payload,
		);
		const viaFn = validateRequest("POST /bookings", "request", payload);
		expect(viaFn).toEqual(viaInstance);
		expect(viaFn.valid).toBe(true);
	});

	test("behaves the same on an invalid payload", () => {
		const payload = [{ arrival: "2026-08-01" }];
		const viaInstance = realValidator().validate(
			"POST /bookings",
			"request",
			payload,
		);
		const viaFn = validateRequest("POST /bookings", "request", payload);
		expect(viaFn).toEqual(viaInstance);
		expect(viaFn.valid).toBe(false);
	});
});

describe("ValidationError / ValidationResult shape", () => {
	test("every error carries a path and message; optional fields are typed", () => {
		const res = realValidator().validate("POST /bookings", "request", [
			{ roomId: "oops", arrival: "2026-08-01" },
		]);
		expect(res.valid).toBe(false);
		for (const e of res.errors) {
			expect(typeof e.path).toBe("string");
			expect(e.path.length).toBeGreaterThan(0);
			expect(typeof e.message).toBe("string");
			expect(e.message.length).toBeGreaterThan(0);
		}
		// At least one error has a concrete JSON pointer path.
		expect(res.errors.some((e) => e.path.startsWith("/"))).toBe(true);
	});

	test("valid result is exactly { valid: true, errors: [] }", () => {
		const res = realValidator().validate("POST /bookings", "request", [
			{ roomId: 1, arrival: "2026-08-01", departure: "2026-08-05" },
		]);
		const keys = Object.keys(res).sort();
		expect(keys).toEqual(["errors", "valid"]);
		expect(res).toEqual({ valid: true, errors: [] });
	});
});
