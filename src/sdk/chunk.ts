/**
 * Heading-aware markdown splitter.
 *
 * The knowledge facts are already atomic (one statement + citation per bullet),
 * so the right chunk granularity is the section boundary — NOT fixed-size
 * windows. Fixed-size shredding would splice unrelated facts together and
 * sever their citations ("vector soup"). Splitting at `##` / `###` keeps each
 * chunk self-contained with its heading path and inline citations intact.
 *
 * Inline citations (`[wiki → Name](url)`, `[extracted ...]`) are preserved
 * verbatim — we never strip or rewrite them.
 */

/** A single section chunk produced from one markdown file. */
export interface Chunk {
	/** Path relative to the knowledge root, e.g. `system-logic/wiki-api-v2.md`. */
	sourceFile: string;
	/** Heading breadcrumb from the doc title down to this section. */
	headingPath: string[];
	/** Inclusive 1-based start line in the source file. */
	lineStart: number;
	/** Inclusive 1-based end line in the source file. */
	lineEnd: number;
	/** Full section text (heading line + body), citations preserved. */
	text: string;
}

/** Match an ATX heading line: `## Heading` (optionally trailing ` #`). */
const HEADING_RE = /^(#{1,6})\s+(.*?)\s*#*\s*$/;

/** Strip a trailing run of `#` from ATX closing-sequence headings. */
function cleanHeading(raw: string): string {
	return raw.replace(/\s+#+\s*$/, "").trim();
}

/**
 * Split a markdown document into section chunks.
 *
 * The text appearing before the first heading is attached to the document-title
 * chunk (the first `# ` heading) so intro paragraphs are still searchable.
 * Each subsequent `##` / `###` starts a new chunk whose `headingPath` records the
 * full breadcrumb.
 */
export function chunkMarkdown(sourceFile: string, markdown: string): Chunk[] {
	const lines = markdown.split("\n");
	const chunks: Chunk[] = [];

	// Stack of [level, title] for open headings, outermost first.
	const stack: Array<{ level: number; title: string }> = [];

	let docTitle: string | null = null;
	let pendingIntro: string[] = [];

	let currentHeading: { level: number; title: string } | null = null;
	let currentBody: string[] = [];
	let currentStart = 1;

	const flushCurrent = (): void => {
		if (currentHeading === null) return;
		const headingPath = [
			...stack.map((h) => h.title),
			currentHeading.title,
		];
		const text = [currentHeading.title, ...currentBody].join("\n").trim();
		if (text.length > 0) {
			chunks.push({
				sourceFile,
				headingPath,
				lineStart: currentStart,
				lineEnd: currentStart + currentBody.length,
				text,
			});
		}
	};

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? "";
		const lineno = i + 1;
		const match = HEADING_RE.exec(line);

		if (match) {
			const level = match[1]!.length;
			const title = cleanHeading(match[2]!);

			// Record the document title (first h1) for the intro chunk.
			if (docTitle === null && level === 1) {
				docTitle = title;
			}

			// Pop the stack to the parent level, then push this heading.
			while (stack.length > 0 && stack[stack.length - 1]!.level >= level) {
				stack.pop();
			}
			stack.push({ level, title });

			// Any heading starts a new chunk. Flush the previous one first.
			flushCurrent();

			// Seed the new chunk. If this is the very first heading, prepend any
			// intro text that preceded it (attached to the doc-title chunk).
			const isFirstHeading = currentHeading === null;
			currentHeading = { level, title };
			currentBody = isFirstHeading ? [...pendingIntro] : [];
			currentStart = lineno;
			pendingIntro = [];
		} else {
			if (currentHeading === null) {
				// Body text before the first heading → intro.
				pendingIntro.push(line);
			} else {
				currentBody.push(line);
			}
		}
	}

	flushCurrent();

	// Edge case: a file with no headings at all → one chunk holding everything.
	if (chunks.length === 0 && markdown.trim().length > 0) {
		chunks.push({
			sourceFile,
			headingPath: docTitle ? [docTitle] : [],
			lineStart: 1,
			lineEnd: lines.length,
			text: markdown.trim(),
		});
	}

	return chunks;
}
