/**
 * Thin CLI over the knowledge + SDK packages: "bun run src/cli.ts index
 * [--force]" and "... status".
 *
 * The knowledge corpus defaults to the beds24-knowledge package's corpus
 * (packages/knowledge/knowledge/ in this checkout); override with
 * BEDS24_KNOWLEDGE_DIR. All real logic lives in the beds24-knowledge /
 * beds24-sdk-client workspace packages — this file only parses argv and prints.
 */

import { countChunks, dbExists, getDb, DB_PATH } from "beds24-knowledge";
import { buildIndex } from "beds24-knowledge";
import { listEndpoints } from "beds24-sdk-client";
import { startServer } from "./server.ts";
import { runSetup } from "./setup.ts";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Directory of this module (Bun: import.meta.dir; Node: derived from
 * import.meta.url). Used to resolve the knowledge corpus relative to this
 * checkout without hard-coding a path from the repo root.
 */
function moduleDir(): string {
	if (typeof import.meta.dir === "string" && import.meta.dir.length > 0) {
		return import.meta.dir;
	}
	return dirname(fileURLToPath(import.meta.url));
}

/**
 * Default knowledge corpus dir. The beds24-knowledge package owns the canonical
 * path (its defaultKnowledgeDir()), but that helper is not part of the package's
 * public barrel, so we mirror its logic here: env override, else the corpus
 * shipped inside the knowledge package (two levels up from this server src).
 */
function defaultKnowledgeDir(): string {
	return process.env.BEDS24_KNOWLEDGE_DIR ?? join(moduleDir(), "..", "..", "knowledge", "knowledge");
}

/** Collect repeated flag values, e.g. `--harness a --harness b` → `["a","b"]`. */
export function collectFlags(args: string[], flag: string): string[] {
	const out: string[] = [];
	for (let i = 0; i < args.length; i++) {
		if (args[i] === flag && i + 1 < args.length) {
			out.push(args[i + 1] ?? "");
		}
	}
	return out;
}

const args = process.argv.slice(2);
const command = args[0];
const force = args.includes("--force");

const knowledgeDir = defaultKnowledgeDir();

/** Print a human-readable byte count. */
function fmtBytes(n: number): string {
	const units = ["B", "KB", "MB", "GB"];
	let i = 0;
	let value = n;
	while (value >= 1024 && i < units.length - 1) {
		value /= 1024;
		i += 1;
	}
	return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/** Report the current index status to stdout. */
function printStatus(): void {
	const exists = dbExists();
	const chunks = exists ? countChunks() : 0;
	let dbSize = 0;
	if (exists) {
		try {
			const fs = require("node:fs") as typeof import("node:fs");
			dbSize = fs.statSync(DB_PATH).size;
		} catch {
			dbSize = 0;
		}
	}
	// Touch the schema index so the endpoint count reflects the spec on disk.
	let endpointCount = 0;
	let factsFiles = 0;
	try {
		endpointCount = listEndpoints().length;
		const fs = require("node:fs") as typeof import("node:fs");
		const walk = (d: string): number => {
			let n = 0;
			for (const e of fs.readdirSync(d, { withFileTypes: true })) {
				const p = join(d, e.name);
				if (e.isDirectory()) n += walk(p);
				else if (e.name.endsWith(".md")) n += 1;
			}
			return n;
		};
		factsFiles = walk(knowledgeDir);
	} catch {
		/* facts dir may not exist; report 0 */
	}

	console.log("Beds24 index status");
	console.log("-------------------");
	console.log(`index file:      ${DB_PATH} ${exists ? "(present)" : "(missing)"}`);
	console.log(`index size:      ${fmtBytes(dbSize)}`);
	console.log(`chunks indexed:  ${chunks}`);
	console.log(`facts files:     ${factsFiles}`);
	console.log(`API endpoints:   ${endpointCount}`);
}

async function main(): Promise<void> {
	if (command === "index" || command === undefined) {
		console.error(`[beds24] building index from ${knowledgeDir} (force=${force})...`);
		// Ensure the db connection is initialized before embedding.
		getDb();
		const result = await buildIndex({ knowledgeDir, force });
		console.error(`[beds24] done. ${result.files} files, ${result.chunks} chunks.`);
		return;
	}

	if (command === "status") {
		printStatus();
		return;
	}

	if (command === "serve") {
		// Start the MCP server (same as `bun run src/server.ts`).
		await startServer();
		return;
	}

	if (command === "setup") {
		const harnessArgs = args.slice(1);
		const requested = collectFlags(harnessArgs, "--harness");
		await runSetup({
			harnesses: requested.length > 0 ? requested : undefined,
			all: harnessArgs.includes("--all"),
			dryRun: harnessArgs.includes("--dry-run"),
			skipInstall: harnessArgs.includes("--skip-install"),
			skipIndex: harnessArgs.includes("--skip-index"),
		});
		return;
	}

	console.error(`Unknown command: ${command}`);
	console.error(
		"Usage: beds24-mcp index [--force] | status | serve | setup [--harness <name>] [--all] [--dry-run]",
	);
	process.exit(1);
}

main().catch((err) => {
	console.error("[beds24] fatal:", err);
	process.exit(1);
});
