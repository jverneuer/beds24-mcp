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
/** Every bucket we recognize, in display order. */
export const KNOWN_BUCKETS = [
    "deprecated",
    "apiv1",
    "apiv2",
    "general",
];
/** Buckets safe to search by default (deprecated + legacy v1 are opt-in only). */
export const SAFE_BUCKETS = ["apiv2", "general"];
/** Assert at runtime that a value is one of the known buckets. */
function isBucket(value) {
    return ((value === "deprecated" ||
        value === "apiv1" ||
        value === "apiv2" ||
        value === "general"));
}
/**
 * Split a single flat `key: value` line into its parts.
 *
 * Only the first colon separates key from value, so values that themselves
 * contain colons (e.g. `https://...`) are preserved intact. Returns null for
 * blank lines, comments, and any line that isn't a plain field.
 */
function parseField(line) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#"))
        return null;
    const colon = trimmed.indexOf(":");
    if (colon === -1)
        return null;
    const key = trimmed.slice(0, colon).trim();
    const value = trimmed.slice(colon + 1).trim();
    if (key.length === 0)
        return null;
    return { key, value };
}
/** Strip a matching pair of surrounding quotes from a scalar value, if present. */
function unquote(raw) {
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
function parseFields(yaml) {
    const frontmatter = {};
    for (const line of yaml.split("\n")) {
        const field = parseField(line);
        if (field === null)
            continue;
        const { key, value } = field;
        const scalar = unquote(value);
        if (key === "bucket") {
            if (isBucket(scalar)) {
                frontmatter.bucket = scalar;
            }
            // Unknown bucket → silently drop; the indexer reports a warning.
        }
        else if (key === "doc_url" || key === "docUrl") {
            frontmatter.docUrl = scalar;
        }
        else {
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
export function parseFrontmatter(raw) {
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
//# sourceMappingURL=frontmatter.js.map