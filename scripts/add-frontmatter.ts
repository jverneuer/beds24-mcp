/**
 * Backfill YAML frontmatter across the knowledge corpus.
 *
 *   bun run scripts/add-frontmatter.ts            # write changes
 *   bun run scripts/add-frontmatter.ts --dry-run  # report only, no writes
 *
 * Walks every .md under packages/knowledge/knowledge/ (including index.md at
 * the corpus root and in each subdir) and ensures each file declares a `bucket`
 * in its frontmatter. The bucket is derived from the file PATH, which is the
 * authoritative mapping (see bucketForPath). Everything is idempotent: any file
 * that already carries a valid `bucket:` is left untouched, so re-running is safe.
 *
 * doc_url is OPTIONAL — existing values are preserved, but we never invent fake
 * ones; the user backfills real URLs later.
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter, type Bucket } from "../packages/knowledge/src/markdown/frontmatter.ts";

const CORPUS_ROOT = join(process.cwd(), "packages", "knowledge", "knowledge");
const DRY_RUN = process.argv.includes("--dry-run");

/** Directory segments that map to the apiv1 bucket, in canonical order. */
const APIV1_DIRS = [
	"api-basics",
	"availability",
	"bookings",
	"pricing",
	"properties",
	"invoicing",
	"messages",
	"account",
] as const;

/** Directory segments that map to the general bucket, in canonical order. */
const GENERAL_DIRS = ["system-logic", "ota", "csv", "utilities"] as const;

/**
 * Derive the bucket from the file path (authoritative mapping).
 *
 * We match on path *segments* (not substrings) so a dir like `ota` can't
 * accidentally match inside some longer name. Order is unambiguous because each
 * special segment name is distinct, but we check in priority order anyway.
 */
function bucketForPath(filePath: string): Bucket {
	const segments = filePath.split("/").filter((seg) => seg.length > 0);

	if (segments.includes("xml-deprecated")) return "deprecated";
	if (APIV1_DIRS.some((dir) => segments.includes(dir))) return "apiv1";
	if (segments.includes("api-v2")) return "apiv2";
	if (GENERAL_DIRS.some((dir) => segments.includes(dir))) return "general";

	return "general";
}

/** A frontmatter block's byte region within the raw file text. */
interface BlockRegion {
	/** Index right after the opening `---\n`. */
	afterOpen: number;
}

/**
 * Detect whether the raw text opens with a `---\n ... ---` frontmatter block.
 * Mirrors the delimiter rules used by frontmatter.ts (the source of truth for
 * parsing) so our structural edits stay consistent with how the indexer reads it.
 */
function detectBlock(raw: string): BlockRegion | null {
	const opensWithDelimiter = raw.startsWith("---\n") || raw.startsWith("---\r\n");
	if (!opensWithDelimiter) return null;

	const afterOpen = raw.indexOf("\n") + 1;
	const afterOpenText = raw.slice(afterOpen);
	const closeMatch = afterOpenText.match(/^---\r?\n/m);

	// No closing delimiter → not a frontmatter block (a bare opener is body text).
	if (closeMatch === null) return null;

	return { afterOpen };
}

/** Recursively collect every .md file under dir (depth-first). */
function collectMdFiles(dir: string, out: string[]): void {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			collectMdFiles(full, out);
		} else if (entry.isFile() && entry.name.endsWith(".md")) {
			out.push(full);
		}
	}
}

/** The outcome of processing a single file. */
type FileResult =
	| { kind: "unchanged"; reason: "has-bucket" }
	| { kind: "changed"; bucket: Bucket }
	| { kind: "skipped"; reason: "error"; message: string };

/**
 * Compute (and optionally apply) the frontmatter edit for one file.
 *
 * Three cases:
 *   - frontmatter already has a valid bucket → unchanged (idempotent)
 *   - no frontmatter block             → prepend `---\nbucket: x\n---\n\n`
 *   - block exists but lacks bucket     → insert `bucket: x` after the opener
 */
function processFile(filePath: string): FileResult {
	let raw: string;
	try {
		raw = readFileSync(filePath, "utf8");
	} catch (e) {
		return { kind: "skipped", reason: "error", message: `(read) ${(e as Error).message}` };
	}

	// Idempotent: a valid bucket already present → leave it alone.
	const parsed = parseFrontmatter(raw);
	if (parsed.frontmatter.bucket) {
		return { kind: "unchanged", reason: "has-bucket" };
	}

	const bucket = bucketForPath(filePath);
	const newline = raw.startsWith("---\r\n") ? "\r\n" : "\n";

	const block = detectBlock(raw);
	let newContent: string;
	if (block === null) {
		// No frontmatter block at all → prepend a fresh one.
		newContent = `---${newline}bucket: ${bucket}${newline}---${newline}${newline}${raw}`;
	} else {
		// Block exists without a bucket → inject the line right after the opener.
		newContent =
			raw.slice(0, block.afterOpen) +
			`bucket: ${bucket}${newline}` +
			raw.slice(block.afterOpen);
	}

	if (newContent === raw) {
		return { kind: "unchanged", reason: "has-bucket" };
	}

	if (!DRY_RUN) {
		try {
			writeFileSync(filePath, newContent, "utf8");
		} catch (e) {
			return { kind: "skipped", reason: "error", message: `(write) ${(e as Error).message}` };
		}
	}

	return { kind: "changed", bucket };
}

/** Format a corpus-relative path for readable logging. */
function rel(filePath: string): string {
	return filePath.startsWith(CORPUS_ROOT) ? filePath.slice(CORPUS_ROOT.length + 1) : filePath;
}

function main(): void {
	const files: string[] = [];
	collectMdFiles(CORPUS_ROOT, files);
	files.sort();

	const perBucket: Record<Bucket, number> = {
		deprecated: 0,
		apiv1: 0,
		apiv2: 0,
		general: 0,
	};

	let changed = 0;
	let unchanged = 0;
	const errors: Array<{ file: string; message: string }> = [];

	for (const file of files) {
		const result = processFile(file);
		if (result.kind === "changed") {
			changed++;
			perBucket[result.bucket]++;
			console.error(`  [${DRY_RUN ? "dry-run" : "write"}] ${rel(file)} → bucket: ${result.bucket}`);
		} else if (result.kind === "unchanged") {
			unchanged++;
		} else {
			errors.push({ file: rel(file), message: result.message });
			console.error(`  [error] ${rel(file)} ${result.message}`);
		}
	}

	console.error("");
	console.error("=== add-frontmatter summary ===");
	console.error(`mode:       ${DRY_RUN ? "dry-run (no writes)" : "write"}`);
	console.error(`scanned:    ${files.length}`);
	console.error(`changed:    ${changed}`);
	console.error(`unchanged:  ${unchanged} (already had bucket)`);
	console.error(`errors:     ${errors.length}`);
	console.error("per-bucket (changes):");
	for (const bucket of ["deprecated", "apiv1", "apiv2", "general"] as const) {
		console.error(`  ${bucket.padEnd(10)} ${perBucket[bucket]}`);
	}

	if (errors.length > 0) {
		process.exit(1);
	}
}

main();
