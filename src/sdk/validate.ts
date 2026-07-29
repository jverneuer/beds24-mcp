/**
 * Validate a draft payload against a resolved endpoint schema (ajv).
 *
 * Errors are post-processed into a clean, LLM-actionable shape: each carries a
 * JSON path, a human-readable message, and — where it helps — the expected vs.
 * actual type and a "did you mean?" suggestion for unknown fields.
 */

import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import { getSchema, type Field } from "./schema.ts";

/** A single validation error, shaped for LLM consumption. */
export interface ValidationError {
	path: string;
	message: string;
	expected?: string;
	actual?: string;
	suggestion?: string;
}

/** Result of validating one payload. */
export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
}

/** Build and cache an ajv instance configured for our schemas. */
function makeAjv(): Ajv {
	const ajv = new Ajv({
		allErrors: true,
		strict: false,
		allowUnionTypes: true,
	});
	addFormats(ajv);
	return ajv;
}

/** Flatten a schema's required field names for "did you mean?" suggestions. */
function collectFieldNames(node: unknown, out: Set<string>): void {
	if (!node || typeof node !== "object") return;
	const n = node as Record<string, unknown>;
	if (n.properties && typeof n.properties === "object") {
		for (const key of Object.keys(n.properties as Record<string, unknown>)) {
			out.add(key);
		}
	}
	if (Array.isArray(n.allOf)) {
		for (const m of n.allOf) collectFieldNames(m, out);
	}
	if (Array.isArray(n.oneOf)) {
		for (const m of n.oneOf) collectFieldNames(m, out);
	}
	if (n.items && typeof n.items === "object") {
		collectFieldNames(n.items, out);
	}
}

/** Cheap case-insensitive Levenshtein suggestion against known field names. */
function suggestField(given: string, known: Set<string>): string | undefined {
	if (known.size === 0) return undefined;
	let best: string | undefined;
	let bestScore = Infinity;
	for (const name of known) {
		const score = levenshtein(given.toLowerCase(), name.toLowerCase());
		if (score < bestScore) {
			bestScore = score;
			best = name;
		}
	}
	// Only suggest when plausibly a typo (small relative edit distance).
	return best !== undefined && bestScore <= Math.max(2, Math.floor(given.length / 2))
		? best
		: undefined;
}

function levenshtein(a: string, b: string): number {
	if (a === b) return 0;
	if (a.length === 0) return b.length;
	if (b.length === 0) return a.length;
	let prev = new Array<number>(b.length + 1);
	let curr = new Array<number>(b.length + 1);
	for (let j = 0; j <= b.length; j++) prev[j] = j;
	for (let i = 1; i <= a.length; i++) {
		curr[0] = i;
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
		}
		[prev, curr] = [curr, prev];
	}
	return prev[b.length]!;
}

/** Translate one ajv error into our clean shape. */
function toValidationError(
	err: ErrorObject,
	knownFields: Set<string>,
): ValidationError {
	const path = err.instancePath === "" ? "(root)" : err.instancePath;
	const keyword = err.keyword;

	if (keyword === "required") {
		const missing = (err.params as { missingProperty: string }).missingProperty;
		return {
			path,
			message: `required field missing: ${missing}`,
			expected: "present",
			actual: "missing",
		};
	}

	if (keyword === "additionalProperties") {
		const extra = (err.params as { additionalProperty: string }).additionalProperty;
		const suggestion = suggestField(extra, knownFields);
		return {
			path,
			message: `unknown field: ${extra}${suggestion ? ` (did you mean ${suggestion}?)` : ""}`,
			expected: "known field",
			actual: extra,
			suggestion,
		};
	}

	if (keyword === "type" || keyword === "format") {
		const expected = (err.params as { type?: string }).type ?? keyword;
		return {
			path,
			message: `wrong type: ${path} should be ${expected}`,
			expected,
			actual: "value",
		};
	}

	if (keyword === "enum") {
		const allowed = (err.params as { allowedValues?: unknown[] }).allowedValues;
		return {
			path,
			message: `invalid value at ${path}${allowed ? `: expected one of ${allowed.join(", ")}` : ""}`,
			expected: allowed ? allowed.join(" | ") : undefined,
			actual: "value",
		};
	}

	// Fallback for any other keyword (minimum, pattern, etc.).
	return {
		path,
		message: `${path} ${err.message ?? "is invalid"}`.trim(),
	};
}

/** Stateful validator bound to a knowledge directory. */
export class Beds24Validator {
	private factsDir: string;
	private ajv: Ajv;

	private constructor(factsDir: string) {
		this.factsDir = factsDir;
		this.ajv = makeAjv();
	}

	/** Create a validator that resolves schemas from `factsDir/apiV2.yaml`. */
	static create(opts: { factsDir: string }): Beds24Validator {
		return new Beds24Validator(opts.factsDir);
	}

	/**
	 * Validate `payload` against the resolved schema for `endpoint`/`direction`.
	 *
	 * V2 POST endpoints accept a JSON array of items; when `payload` is an
	 * array we validate its first element (the shape all items must share).
	 */
	validate(
		endpoint: string,
		direction: "request" | "response",
		payload: unknown,
	): ValidationResult {
		const schema = getSchema(this.factsDir, endpoint, direction);
		if (!schema || typeof schema !== "object") {
			return {
				valid: false,
				errors: [
					{
						path: "(root)",
						message: `no ${direction} schema found for "${endpoint}"`,
					},
				],
			};
		}

		// For array payloads (V2 POST), validate a single item.
		const data = Array.isArray(payload) ? payload[0] : payload;

		let validate;
		try {
			validate = this.ajv.compile(schema);
		} catch (e) {
			return {
				valid: false,
				errors: [
					{
						path: "(root)",
						message: `failed to compile schema for "${endpoint}": ${(e as Error).message}`,
					},
				],
			};
		}

		const valid = validate(data);
		if (valid) return { valid: true, errors: [] };

		const knownFields = new Set<string>();
		collectFieldNames(schema, knownFields);

		const errors = (validate.errors ?? []).map((e) => toValidationError(e, knownFields));
		return { valid: false, errors };
	}
}

export type { Field };
