/**
 * Parse + strip the YAML frontmatter block that precedes each knowledge doc.
 *
 * Every markdown fact carries a `---` delimited header declaring at least a
 * `bucket` (which index/search pool it lands in) and, for the API-reference
 * docs, a `doc_url` linking the chunk back to its public documentation. This
 * module is the single source of truth for the `Bucket` type, the bucket
 * constants, and the frontmatter parser — chunk.ts, indexer.ts and search.ts
 * all import from here.
 *
 * The frontmatter is flat string fields only, so we hand-parse `key: value`
 * lines instead of pulling in a yaml dependency. Unknown keys are preserved
 * on the returned object via the index signature, so forward-compatible
 * fields are never dropped.
 */

/** The index/search pools a fact can belong to. */
export type Bucket = "deprecated" | "apiv1" | "apiv2" | "general";

/** Every bucket we recognize, in display order. */
export const KNOWN_BUCKETS: readonly Bucket[] = [
	"deprecated",
	"apiv1",
	"apiv2",
	"general",
] as const;

/** Buckets safe to search by default (deprecated + legacy v1 are opt-in only). */
export const SAFE_BUCKETS: readonly Bucket[] = ["apiv2", "general"] as const;

/** The structured header parsed out of a knowledge doc's frontmatter block. */
export interface Frontmatter {
	/** Target bucket; absent if the doc declares none. */
	bucket?: Bucket;
	/** Public documentation URL the chunk is sourced from. */
	docUrl?: string;
	/** Any other flat fields the doc declares, preserved verbatim. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: unknown;
}

/** A parsed doc: its structured header plus the remaining markdown body. */
export interface ParsedMarkdown {
	/** Frontmatter fields (empty object when no frontmatter block is present). */
	frontmatter: Frontmatter;
	/** Everything after the closing `---`, trimmed of leading blank lines. */
	body: string;
}

/** Assert at runtime that a value is one of the known buckets. */
function isBucket(value: unknown): value is Bucket {
	return (
		(value === "deprecated" ||
			value === "apiv1" ||
			value === "apiv2" ||
			value === "general")
	);
}

/** A line of flat `key: value` YAML, already split on the first colon. */
interface Field {
	key: string;
	value: string;
}

/**
 * Split a single flat `key: value` line into its parts.
 *
 * Only the first colon separates key from value, so values that themselves
 * contain colons (e.g. `https://...`) are preserved intact. Returns null for
 * blank lines, comments, and any line that isn't a plain field.
 */
function parseField(line: string): Field | null {
	const trimmed = line.trim();
	if (trimmed.length === 0 || trimmed.startsWith("#")) return null;

	const colon = trimmed.indexOf(":");
	if (colon === -1) return null;

	const key = trimmed.slice(0, colon).trim();
	const value = trimmed.slice(colon + 1).trim();
	if (key.length === 0) return null;

	return { key, value };
}

/** Strip a matching pair of surrounding quotes from a scalar value, if present. */
function unquote(raw: string): string {
	if (raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')) {
		return raw.slice(1, -1);
	}
	if (raw.length >= 2 && raw.startsWith("'") && raw.endsWith("'")) {
		return raw.slice(1, -1);
	}
	return raw;
}

/**
 * Parse the text between the `---` delimiters into a Frontmatter object.
 *
 * Accepts both `doc_url` (the canonical markdown spelling) and `docUrl`; the
 * result always exposes `docUrl`. A `bucket` that isn't one of KNOWN_BUCKETS
 * is dropped (the indexer logs the warning).
 */
function parseFields(yaml: string): Frontmatter {
	const frontmatter: Frontmatter = {};

	for (const line of yaml.split("\n")) {
		const field = parseField(line);
		if (field === null) continue;

		const { key, value } = field;
		const scalar = unquote(value);

		if (key === "bucket") {
			if (isBucket(scalar)) {
				frontmatter.bucket = scalar;
			}
			// Unknown bucket → silently drop; the indexer reports a warning.
		} else if (key === "doc_url" || key === "docUrl") {
			frontmatter.docUrl = scalar;
		} else {
			// Preserve unknown keys via the index signature for forward compat.
			frontmatter[key] = scalar;
		}
	}

	return frontmatter;
}

/**
 * Parse and strip the YAML frontmatter from a raw knowledge doc.
 *
 * If the doc opens with `---\n`, the text up to the next `---` line is parsed
 * as flat `key: value` fields and everything after the closing delimiter is
 * returned as the body. Otherwise the whole input is treated as the body with
 * an empty frontmatter object.
 */
export function parseFrontmatter(raw: string): ParsedMarkdown {
	const opensWithDelimiter = raw.startsWith("---\n") || raw.startsWith("---\r\n");
	if (!opensWithDelimiter) {
		return { frontmatter: {}, body: raw };
	}

	// Drop the leading `---\n`, then locate the closing delimiter. The first
	// `---` line after the opener closes the block (per the frontmatter spec) —
	// a `---` horizontal rule lower in the doc is therefore not considered.
	const afterOpen = raw.slice(raw.indexOf("\n") + 1);
	const closeMatch = afterOpen.match(/^---\r?\n/m);

	if (closeMatch === null) {
		// No closing delimiter — treat the whole thing as body, no frontmatter.
		return { frontmatter: {}, body: raw };
	}

	const closeIdx = closeMatch.index ?? 0;
	const yaml = afterOpen.slice(0, closeIdx);
	const rest = afterOpen.slice(closeIdx + closeMatch[0].length);

	const frontmatter = parseFields(yaml);
	const body = rest.replace(/^\r?\n/, "").trim();

	return { frontmatter, body };
}
