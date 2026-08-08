import { parseFrontmatter } from "./frontmatter.js";
/** Match an ATX heading line: `## Heading` (optionally trailing ` #`). */
const HEADING_RE = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
/** Strip a trailing run of `#` from ATX closing-sequence headings. */
function cleanHeading(raw) {
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
export function chunkMarkdown(sourceFile, markdown, bucketOverride) {
    // Strip YAML frontmatter up front so it is never embedded in a chunk's text.
    const { frontmatter, body } = parseFrontmatter(markdown);
    const bucket = frontmatter.bucket ?? bucketOverride ?? "general";
    const docUrl = frontmatter.docUrl ?? null;
    const lines = body.split("\n");
    const chunks = [];
    // Stack of [level, title] for open headings, outermost first.
    const stack = [];
    let docTitle = null;
    let pendingIntro = [];
    let currentHeading = null;
    let currentBody = [];
    let currentStart = 1;
    const flushCurrent = () => {
        if (currentHeading === null)
            return;
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
                bucket,
                docUrl,
            });
        }
    };
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? "";
        const lineno = i + 1;
        const match = HEADING_RE.exec(line);
        if (match) {
            const level = match[1].length;
            const title = cleanHeading(match[2]);
            // Record the document title (first h1) for the intro chunk.
            if (docTitle === null && level === 1) {
                docTitle = title;
            }
            // Pop the stack to the parent level, then push this heading.
            while (stack.length > 0 && stack[stack.length - 1].level >= level) {
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
        }
        else {
            if (currentHeading === null) {
                // Body text before the first heading → intro.
                pendingIntro.push(line);
            }
            else {
                currentBody.push(line);
            }
        }
    }
    flushCurrent();
    // Edge case: a file with no headings at all → one chunk holding everything.
    if (chunks.length === 0 && body.trim().length > 0) {
        chunks.push({
            sourceFile,
            headingPath: docTitle ? [docTitle] : [],
            lineStart: 1,
            lineEnd: lines.length,
            text: body.trim(),
            bucket,
            docUrl,
        });
    }
    return chunks;
}
//# sourceMappingURL=chunk.js.map