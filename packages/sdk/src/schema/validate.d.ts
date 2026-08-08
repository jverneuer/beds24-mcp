/**
 * Validate a draft payload against a resolved endpoint schema (ajv).
 *
 * Errors are post-processed into a clean, LLM-actionable shape: each carries a
 * JSON path, a human-readable message, and — where it helps — the expected vs.
 * actual type and a "did you mean?" suggestion for unknown fields.
 */
import { type Field } from "./schema.js";
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
/** Stateful validator bound to a spec directory (defaults to the SDK's apiV2.yaml). */
export declare class Beds24Validator {
    private specDir;
    private ajv;
    private constructor();
    /** Create a validator that resolves schemas from `specDir` (defaults to the SDK apiV2.yaml). */
    static create(opts?: {
        specDir?: string;
    }): Beds24Validator;
    /**
     * Validate `payload` against the resolved schema for `endpoint`/`direction`.
     *
     * V2 POST endpoints accept a JSON array of items; when `payload` is an
     * array we validate its first element (the shape all items must share).
     */
    validate(endpoint: string, direction: "request" | "response", payload: unknown): ValidationResult;
}
/**
 * Standalone request validation — used by the API client to check a request
 * body against the endpoint schema *before* sending it (fail fast, save a
 * credit). Same logic as `Beds24Validator.validate`, but stateless: pass the
 * specDir each call (defaults to the SDK apiV2.yaml). Returns `{ valid: true }`
 * or `{ valid, errors }`.
 */
export declare function validateRequest(endpoint: string, direction: "request", payload: unknown, specDir?: string): ValidationResult;
export type { Field };
//# sourceMappingURL=validate.d.ts.map