/**
 * Fetch the canonical Beds24 OpenAPI spec and compare it to the local copy.
 *
 *   bun run scripts/fetch-spec.ts            # fetch + diff; rewrite only if changed
 *   bun run scripts/fetch-spec.ts --force    # always rewrite the local copy
 *
 * The spec is owned by the `beds24-sdk-client` package and lives at packages/sdk/apiV2.yaml
 * (NOT knowledge/apiV2.yaml — that path is gone in the restructured monorepo).
 *
 * Drift detection is semantic, not textual: both docs are parsed to JSON and
 * re-serialized with sorted keys, so upstream reordering/comment-churn doesn't
 * count as a change. We diff the resolved endpoint set + component schema names
 * and report added/removed/changed. The raw upstream *text* is what gets written
 * (preserves upstream formatting + comments), so the local copy is a true
 * mirror — not a re-serialization of our parser.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";

const UPSTREAM_URL = "https://beds24.com/api/v2/apiV2.yaml";
const LOCAL_PATH = join(process.cwd(), "packages", "sdk", "apiV2.yaml");
const FORCE = process.argv.includes("--force");

/** Any JS value → deep-sorted-keys JSON (stable canonical form for comparison). */
function canonical(value: unknown): string {
	return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sortKeys);
	if (value && typeof value === "object") {
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(value as Record<string, unknown>).sort()) {
			out[key] = sortKeys((value as Record<string, unknown>)[key]);
		}
		return out;
	}
	return value;
}

/** `METHOD /path` keys present in a parsed spec. */
function endpointKeys(doc: Record<string, unknown>): Set<string> {
	const keys = new Set<string>();
	const paths = (doc.paths ?? {}) as Record<string, unknown>;
	for (const path of Object.keys(paths)) {
		const node = paths[path] as Record<string, unknown> | undefined;
		if (!node || typeof node !== "object") continue;
		for (const method of ["get", "post", "put", "delete", "patch"]) {
			if (node[method]) keys.add(`${method.toUpperCase()} ${path}`);
		}
	}
	return keys;
}

function schemaNames(doc: Record<string, unknown>): Set<string> {
	const schemas = ((doc as Record<string, unknown>).components as
		| Record<string, unknown>
		| undefined)?.schemas as Record<string, unknown> | undefined;
	return new Set(schemas ? Object.keys(schemas) : []);
}

function diffSets(a: Set<string>, b: Set<string>): { added: string[]; removed: string[] } {
	const added = [...b].filter((x) => !a.has(x)).sort();
	const removed = [...a].filter((x) => !b.has(x)).sort();
	return { added, removed };
}

async function main(): Promise<void> {
	let upstreamText: string;
	try {
		const res = await fetch(UPSTREAM_URL, {
			headers: { "user-agent": "beds24-mcp spec-sync", accept: "text/yaml, text/x-yaml, */*" },
			signal: AbortSignal.timeout(30_000),
		});
		if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
		upstreamText = await res.text();
	} catch (e) {
		console.error(`[beds24] failed to fetch upstream spec: ${(e as Error).message}`);
		process.exit(1);
	}

	let upstreamDoc: Record<string, unknown>;
	try {
		upstreamDoc = yaml.load(upstreamText) as Record<string, unknown>;
	} catch (e) {
		console.error(`[beds24] failed to parse upstream yaml: ${(e as Error).message}`);
		process.exit(1);
	}

	const localText = (() => {
		try {
			return readFileSync(LOCAL_PATH, "utf8");
		} catch {
			return null;
		}
	})();

	const localDoc = localText
		? (yaml.load(localText) as Record<string, unknown>)
		: null;

	const changed = localDoc === null || canonical(upstreamDoc) !== canonical(localDoc);

	if (!changed && !FORCE) {
		console.error("[beds24] apiV2.yaml up to date — no upstream drift.");
		return;
	}

	// Report the semantic diff (only meaningful when a local copy existed).
	if (localDoc) {
		const epDiff = diffSets(endpointKeys(localDoc), endpointKeys(upstreamDoc));
		const scDiff = diffSets(schemaNames(localDoc), schemaNames(upstreamDoc));
		console.error("[beds24] apiV2.yaml drift detected:");
		for (const e of epDiff.added) console.error(`  + endpoint ${e}`);
		for (const e of epDiff.removed) console.error(`  - endpoint ${e}`);
		for (const s of scDiff.added) console.error(`  + schema ${s}`);
		for (const s of scDiff.removed) console.error(`  - schema ${s}`);
		if (epDiff.added.length + epDiff.removed.length + scDiff.added.length + scDiff.removed.length === 0) {
			console.error("  (structure identical — content-only change)");
		}
	} else {
		console.error("[beds24] no local copy — fetching initial apiV2.yaml.");
	}

	writeFileSync(LOCAL_PATH, upstreamText, "utf8");
	console.error(`[beds24] wrote ${LOCAL_PATH} (${upstreamText.length} bytes).`);
}

main().catch((e) => {
	console.error(`[beds24] fatal: ${(e as Error).message}`);
	process.exit(1);
});
