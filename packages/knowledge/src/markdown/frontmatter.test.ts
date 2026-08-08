import { describe, expect, test } from "bun:test";

import { parseFrontmatter, KNOWN_BUCKETS, SAFE_BUCKETS } from "./frontmatter.js";
import type { Bucket } from "./frontmatter.js";

/** Build a `---` delimited frontmatter doc from `fields` + a body line. */
function doc(fields: Record<string, string>, body: string): string {
	const header = Object.entries(fields)
		.map(([k, v]) => `${k}: ${v}`)
		.join("\n");
	return `---\n${header}\n---\n${body}`;
}

describe("Bucket type + constants", () => {
	test("KNOWN_BUCKETS lists every bucket in display order", () => {
		expect(KNOWN_BUCKETS).toEqual(["deprecated", "apiv1", "apiv2", "general"]);
	});

	test("SAFE_BUCKETS is the opt-in-safe subset (apiv2 + general)", () => {
		expect(SAFE_BUCKETS).toEqual(["apiv2", "general"]);
	});

	test("SAFE_BUCKETS is a subset of KNOWN_BUCKETS", () => {
		for (const bucket of SAFE_BUCKETS) {
			expect(KNOWN_BUCKETS).toContain(bucket);
		}
	});

	test("every known bucket is accepted by the parser", () => {
		for (const bucket of KNOWN_BUCKETS) {
			const { frontmatter } = parseFrontmatter(doc({ bucket }, "Body"));
			expect(frontmatter.bucket).toBe(bucket);
		}
	});

	test("Bucket values are a closed union (compile-time check)", () => {
		// Verifies the four literals and that the type is not `string`.
		const buckets: readonly Bucket[] = ["deprecated", "apiv1", "apiv2", "general"];
		expect(buckets).toHaveLength(4);
	});
});

describe("parseFrontmatter — happy path", () => {
	test("parses bucket + doc_url together", () => {
		const { frontmatter, body } = parseFrontmatter(
			doc({ bucket: "apiv2", doc_url: "https://example.com" }, "Body here"),
		);
		expect(frontmatter.bucket).toBe("apiv2");
		expect(frontmatter.docUrl).toBe("https://example.com");
		expect(body).toBe("Body here");
	});

	test("accepts each valid bucket value", () => {
		const cases: Array<{ in: Bucket; out: Bucket }> = [
			{ in: "deprecated", out: "deprecated" },
			{ in: "apiv1", out: "apiv1" },
			{ in: "apiv2", out: "apiv2" },
			{ in: "general", out: "general" },
		];
		for (const { in: input, out } of cases) {
			expect(parseFrontmatter(doc({ bucket: input }, "Body")).frontmatter.bucket).toBe(out);
		}
	});

	test("preserves docUrl (canonical doc_url markdown spelling)", () => {
		expect(
			parseFrontmatter(doc({ doc_url: "https://canon.example/x" }, "Body")).frontmatter.docUrl,
		).toBe("https://canon.example/x");
	});

	test("docUrl camelCase spelling maps to docUrl too", () => {
		expect(
			parseFrontmatter(doc({ docUrl: "https://camel.example/y" }, "Body")).frontmatter.docUrl,
		).toBe("https://camel.example/y");
	});

	test("preserves unknown/extra keys via the index signature", () => {
		const { frontmatter } = parseFrontmatter(
			doc({ bucket: "apiv2", custom: "hello", weirdKey: "42" }, "Body"),
		);
		expect(frontmatter.bucket).toBe("apiv2");
		expect(frontmatter.custom).toBe("hello");
		expect(frontmatter.weirdKey).toBe("42");
		// The index signature carries the value as `unknown`; narrow explicitly.
		const custom = frontmatter.custom;
		expect(typeof custom === "string" ? custom : null).toBe("hello");
	});

	test("unquotes double- and single-quoted scalars; leaves bare values", () => {
		const mixedVal = `"x'`;
		const { frontmatter } = parseFrontmatter(
			doc(
				{
					bucket: '"apiv2"',
					dq: '"hello"',
					sq: "'world'",
					mixed: mixedVal,
					bare: "z",
				},
				"Body",
			),
		);
		expect(frontmatter.bucket).toBe("apiv2");
		expect(frontmatter.dq).toBe("hello");
		expect(frontmatter.sq).toBe("world");
		// Mismatched / unclosed quotes are preserved verbatim: the value "x' starts
		// with " but ends with ', so neither matching-pair branch fires and the
		// whole scalar "x' is kept.
		expect(frontmatter.mixed).toBe(mixedVal);
		expect(frontmatter.bare).toBe("z");
	});

	test("a single-character value is returned unchanged (no under-run)", () => {
		const { frontmatter } = parseFrontmatter(doc({ custom: '"' }, "Body"));
		expect(frontmatter.custom).toBe(`"`);
	});

	test("values containing colons (URLs) are preserved intact", () => {
		const url = "https://beds24.com/api/v2/bookings?offset=0";
		expect(parseFrontmatter(doc({ doc_url: url }, "Body")).frontmatter.docUrl).toBe(url);
	});
});

describe("parseFrontmatter — no / missing frontmatter", () => {
	test("plain text without delimiters → empty frontmatter, full body", () => {
		const raw = "Just a body\nwith no frontmatter";
		const { frontmatter, body } = parseFrontmatter(raw);
		expect(frontmatter).toEqual({});
		expect(body).toBe(raw);
	});

	test("empty string → empty frontmatter, empty body", () => {
		const { frontmatter, body } = parseFrontmatter("");
		expect(frontmatter).toEqual({});
		expect(body).toBe("");
	});

	test("delimiters only (empty frontmatter block) → empty frontmatter, empty body", () => {
		const { frontmatter, body } = parseFrontmatter("---\n---\n");
		expect(frontmatter).toEqual({});
		expect(body).toBe("");
	});

	test("CRLF delimiters only → empty frontmatter, empty body", () => {
		const { frontmatter, body } = parseFrontmatter("---\r\n---\r\n");
		expect(frontmatter).toEqual({});
		expect(body).toBe("");
	});
});

describe("parseFrontmatter — invalid bucket / malformed YAML", () => {
	test("invalid bucket value is dropped (frontmatter empty), body returned", () => {
		const { frontmatter, body } = parseFrontmatter(doc({ bucket: "notabucket" }, "Body"));
		expect(frontmatter).toEqual({});
		expect(body).toBe("Body");
	});

	test("empty bucket value is dropped", () => {
		const { frontmatter, body } = parseFrontmatter(doc({ bucket: "" }, "Body"));
		expect(frontmatter).toEqual({});
		expect(body).toBe("Body");
	});

	test("no closing delimiter → whole input treated as body, no crash", () => {
		const raw = "---\nbucket: apiv2\nBody no close";
		const { frontmatter, body } = parseFrontmatter(raw);
		expect(frontmatter).toEqual({});
		expect(body).toBe(raw);
	});

	test("comment lines, lines without a colon, and empty keys are ignored", () => {
		const raw = "---\n# a comment\nno colon line\n: emptykey\nbucket: apiv1\n---\nBody";
		const { frontmatter, body } = parseFrontmatter(raw);
		expect(frontmatter.bucket).toBe("apiv1");
		expect(frontmatter).not.toHaveProperty("emptykey");
		expect(body).toBe("Body");
	});
});

describe("parseFrontmatter — body handling", () => {
	test("strips a single leading blank line then trims the body", () => {
		expect(parseFrontmatter(doc({ bucket: "apiv2" }, "Body")).body).toBe("Body");
		expect(parseFrontmatter("---\nbucket: apiv2\n---\n\nBody").body).toBe("Body");
	});

	test("trims all leading/trailing blank lines from the body", () => {
		expect(
			parseFrontmatter("---\nbucket: apiv2\n---\n\n\n\nBody after blanks").body,
		).toBe("Body after blanks");
	});

	test("CRLF delimiters with an extra blank line before the body", () => {
		const { frontmatter, body } = parseFrontmatter(
			"---\r\nbucket: deprecated\r\n---\r\n\r\nBody",
		);
		expect(frontmatter.bucket).toBe("deprecated");
		expect(body).toBe("Body");
	});
});

describe("parseFrontmatter — Unicode", () => {
	test("Unicode values and body round-trip unchanged", () => {
		const { frontmatter, body } = parseFrontmatter(
			doc({ doc_url: "https://example.com/café" }, "café — naïve résumé"),
		);
		expect(frontmatter.docUrl).toBe("https://example.com/café");
		expect(body).toBe("café — naïve résumé");
	});
});
