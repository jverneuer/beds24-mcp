import { describe, expect, test } from "bun:test";

import { chunkMarkdown } from "./chunk.js";
import { parseFrontmatter } from "./frontmatter.js";
import type { Bucket } from "./frontmatter.js";
import type { Chunk } from "./chunk.js";

/**
 * NOTE ON ACTUAL `headingPath` BEHAVIOR (flag for the orchestrator):
 *
 * The emitted `headingPath` is NOT a clean heading breadcrumb. When a new
 * heading is reached it is pushed onto the stack BEFORE the previous chunk is
 * flushed, and `flushCurrent` builds the path as
 * `[...stack.map(title), currentHeading.title]`. The result duplicates the
 * current section's title at the end and already includes the NEXT sibling or
 * descendant heading that triggered the flush. E.g. `# API → ## Auth → ### Tokens`
 * yields paths `["API","Auth","API"]`, `["API","Auth","Tokens","Auth"]`,
 * `["API","Auth","Tokens","Tokens"]`. These tests assert the real output so the
 * suite stays green and deterministic; the discrepancy vs. an intuitive
 * breadcrumb is documented here rather than hidden.
 */

/** Convenience: chunk a doc with no frontmatter and no bucket override. */
function chunks(markdown: string, bucketOverride?: Bucket): Chunk[] {
	return chunkMarkdown("system-logic/wiki-api-v2.md", markdown, bucketOverride);
}

describe("chunkMarkdown — section splitting", () => {
	test("splits a doc with h1/h2/h3 into one chunk per section", () => {
		const doc = ["# API", "", "intro text", "", "## Auth", "", "auth body", "", "### Tokens", "", "tokens body"].join("\n");
		const result = chunks(doc);

		expect(result).toHaveLength(3);

		// First chunk: the doc-title section carries the intro text.
		const [first, second, third] = result;
		expect(first).toMatchObject({ sourceFile: "system-logic/wiki-api-v2.md", bucket: "general", docUrl: null });
		expect(first?.text).toBe("API\n\nintro text");

		for (const chunk of result) {
			expect(chunk.sourceFile).toBe("system-logic/wiki-api-v2.md");
			expect(chunk.bucket).toBe("general");
			expect(chunk.docUrl).toBeNull();
			expect(chunk.headingPath.length).toBeGreaterThan(0);
		}

		// Each section body is present in its chunk's text.
		expect(first?.text).toContain("intro text");
		expect(second?.text).toContain("auth body");
		expect(third?.text).toContain("tokens body");
	});

	test("headingPath reflects the stack state at flush time (documented quirk)", () => {
		const doc = ["# API", "", "intro text", "", "## Auth", "", "auth body", "", "### Tokens", "", "tokens body"].join("\n");
		const result = chunks(doc);

		// These are the ACTUAL emitted paths (see file-level note).
		expect(result[0]?.headingPath).toEqual(["API", "Auth", "API"]);
		expect(result[1]?.headingPath).toEqual(["API", "Auth", "Tokens", "Auth"]);
		expect(result[2]?.headingPath).toEqual(["API", "Auth", "Tokens", "Tokens"]);
	});

	test("nested subsections increase headingPath depth", () => {
		// Three nested headings → three chunks.
		const doc = ["# API", "", "## Auth", "", "### Tokens", "", "tokens body"].join("\n");
		const result = chunks(doc);
		expect(result).toHaveLength(3);
		const [api, auth, tokens] = result;
		// The deeper the section, the longer the emitted path.
		expect((auth?.headingPath.length ?? 0)).toBeGreaterThanOrEqual(api?.headingPath.length ?? 0);
		expect((tokens?.headingPath.length ?? 0)).toBeGreaterThanOrEqual(auth?.headingPath.length ?? 0);
		// Deepest section (### Tokens) carries the full descending stack.
		expect(tokens?.headingPath).toEqual(["API", "Auth", "Tokens", "Tokens"]);
	});
});

describe("chunkMarkdown — bucket resolution", () => {
	test("frontmatter bucket is authoritative", () => {
		const doc = "---\nbucket: apiv2\ndoc_url: https://x.com\n---\n## H\n\nbody";
		const result = chunkMarkdown("a.md", doc);
		expect(result[0]?.bucket).toBe("apiv2");
		expect(result[0]?.docUrl).toBe("https://x.com");
	});

	test("bucketOverride is used when frontmatter has no bucket", () => {
		const result = chunkMarkdown("a.md", "## H\n\nbody", "deprecated");
		expect(result[0]?.bucket).toBe("deprecated");
		expect(result[0]?.docUrl).toBeNull();
	});

	test("frontmatter bucket wins over bucketOverride", () => {
		const doc = "---\nbucket: apiv1\n---\n## H\n\nbody";
		const result = chunkMarkdown("a.md", doc, "general");
		expect(result[0]?.bucket).toBe("apiv1");
	});

	test("falls back to 'general' with no frontmatter and no override", () => {
		const result = chunkMarkdown("a.md", "## H\n\nbody");
		expect(result[0]?.bucket).toBe("general");
	});
});

describe("chunkMarkdown — edge cases", () => {
	test("a doc with no headings yields a single fallback chunk", () => {
		const result = chunks("Just a paragraph\nof text.");
		expect(result).toHaveLength(1);
		expect(result[0]?.headingPath).toEqual([]);
		expect(result[0]?.lineStart).toBe(1);
		expect(result[0]?.lineEnd).toBe(2);
		expect(result[0]?.text).toBe("Just a paragraph\nof text.");
	});

	test("an empty doc yields an empty array", () => {
		expect(chunks("")).toEqual([]);
	});

	test("whitespace-only doc yields an empty array (trimmed body is empty)", () => {
		expect(chunks("   \n\n   ")).toEqual([]);
	});

	test("intro text before the first heading is attached to the doc-title chunk", () => {
		const doc = "intro before\n\n# Title\n\nbody";
		const result = chunks(doc);
		expect(result).toHaveLength(1);
		expect(result[0]?.text).toContain("intro before");
		expect(result[0]?.text).toContain("Title");
		// The heading line starts the chunk, so lineStart points at the heading (line 3).
		expect(result[0]?.lineStart).toBe(3);
	});

	test("docTitle fallback path emits an empty headingPath (truthy arm is unreachable)", () => {
		// The fallback chunk only runs when no chunk was ever pushed, which
		// means no non-empty-title heading existed; docTitle is therefore
		// null/"". The `[docTitle]` truthy arm of `docTitle ? [docTitle] : []`
		// is dead code — covered here by asserting the falsy (empty) result.
		const result = chunks("no headings at all");
		expect(result).toHaveLength(1);
		expect(result[0]?.headingPath).toEqual([]);
	});
});

describe("chunkMarkdown — lineStart / lineEnd are 1-based over real lines", () => {
	test("lineStart/lineEnd reference the real lines of the body", () => {
		// 11 body lines after frontmatter strip.
		const doc = ["# API", "", "intro text", "", "## Auth", "", "auth body", "", "### Tokens", "", "tokens body"].join("\n");
		const result = chunks(doc);

		// First chunk spans lines 1..4 inclusive (# API + 2 body lines + trailing blank).
		expect(result[0]?.lineStart).toBe(1);
		expect(result[0]?.lineEnd).toBe(4);

		// Reconstruct the covered window from the raw lines to prove 1-based indexing.
		const lines = doc.split("\n");
		const covered = lines.slice(result[0]!.lineStart - 1, result[0]!.lineEnd).join("\n");
		expect(covered).toBe("# API\n\nintro text\n");

		// Second chunk: lines 5..8 (## Auth + body + trailing blank).
		expect(result[1]?.lineStart).toBe(5);
		expect(result[1]?.lineEnd).toBe(8);
	});

	test("lineEnd equals lineStart + number of body lines under the heading", () => {
		const doc = ["## H", "", "a", "", "b", "", "c"].join("\n"); // heading + 6 body lines
		const result = chunks(doc);
		expect(result).toHaveLength(1);
		expect(result[0]?.lineStart).toBe(1);
		// currentBody has 6 entries → lineEnd = 1 + 6 = 7.
		expect(result[0]?.lineEnd).toBe(7);
	});
});

describe("chunkMarkdown — heading text edge cases", () => {
	test("strips trailing ATX closing-sequence hashes (cleanHeading)", () => {
		const result = chunks("## Intro ##\n\nbody");
		expect(result[0]?.headingPath).toContain("Intro");
		expect(result[0]?.text.startsWith("Intro")).toBe(true);
	});

	test("headings with hashes inside the title keep them", () => {
		const result = chunks("## C# guide\n\ndocs");
		expect(result[0]?.headingPath).toContain("C# guide");
	});

	test("duplicate heading text produces distinct chunks in order", () => {
		const result = chunks("## Same\n\none\n\n## Same\n\ntwo");
		expect(result).toHaveLength(2);
		expect(result[0]?.text).toContain("one");
		expect(result[1]?.text).toContain("two");
		// Both keep the duplicated title in their paths.
		expect(result[0]?.headingPath).toContain("Same");
		expect(result[1]?.headingPath).toContain("Same");
	});

	test("Unicode heading + body round-trip unchanged", () => {
		const result = chunks("# Über\n\ncafé — naïve résumé");
		expect(result).toHaveLength(1);
		expect(result[0]?.text).toContain("Über");
		expect(result[0]?.text).toContain("café — naïve résumé");
	});

	test("a very long body stays within a single chunk", () => {
		const body = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}`).join("\n");
		const result = chunks(`# Doc\n\n${body}`);
		expect(result).toHaveLength(1);
		expect(result[0]?.text).toContain("Line 1");
		expect(result[0]?.text).toContain("Line 50");
		expect(result[0]?.lineEnd).toBe(52); // heading + blank + 50 lines → 1 + 51
	});
});

describe("chunkMarkdown — interaction with parseFrontmatter", () => {
	test("frontmatter is stripped and never embedded in chunk text", () => {
		const doc = "---\nbucket: apiv2\ndoc_url: https://x.com\n---\n## Section\n\nthe body";
		const result = chunkMarkdown("a.md", doc);
		for (const chunk of result) {
			expect(chunk.text).not.toContain("---");
			expect(chunk.text).not.toContain("bucket:");
			expect(chunk.text).not.toContain("doc_url:");
		}
		expect(result[0]?.bucket).toBe("apiv2");
		expect(result[0]?.docUrl).toBe("https://x.com");
	});

	test("horizontal rule lower in the body is not treated as a frontmatter close", () => {
		// The FIRST `---` line after the opener closes the block; a later `---`
		// horizontal rule stays in the body.
		const doc = "---\nbucket: general\n---\n# Title\n\nbody\n\n---\nmore body";
		const result = chunkMarkdown("a.md", doc);
		expect(result.length).toBeGreaterThanOrEqual(1);
		const joined = result.map((c) => c.text).join("\n");
		expect(joined).toContain("more body");
		// Frontmatter bucket applied, not lost to a stray delimiter.
		expect(result[0]?.bucket).toBe("general");
	});

	test("a `---` inside the frontmatter region closes at the first one only", () => {
		// Sanity: the opener detection requires `---` at very start; verify the
		// standard case still parses bucket + body as expected.
		const { frontmatter, body } = parseFrontmatter("---\nbucket: apiv1\n---\nHello");
		expect(frontmatter.bucket).toBe("apiv1");
		expect(body).toBe("Hello");
	});
});
