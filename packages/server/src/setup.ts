/**
 * Auto-installer for the beds24 MCP server.
 *
 * Detects the user's AI harness(es), writes (merges) the beds24 MCP config into
 * each harness's config file, then optionally runs `bun install` + `bun run index`.
 *
 * It is SAFE: it never clobbers the user's existing MCP servers — it only touches
 * the `beds24` entry. A corrupt config is backed up (`.bak`) before being replaced.
 * Run with `--dry-run` to preview every write without touching the filesystem.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * Directory of this module (Bun: import.meta.dir; Node: derived from
 * import.url). The server package has no paths.ts of its own, so path
 * resolution is done against the module location instead of a repo-root helper.
 */
function moduleDir(): string {
	if (typeof import.meta.dir === "string" && import.meta.dir.length > 0) {
		return import.meta.dir;
	}
	return dirname(fileURLToPath(import.meta.url));
}

/**
 * Repo root — the workspace directory holding the root package.json (which
 * defines the `index`/`install` scripts) and the `packages/` dir. Found by
 * walking up from this module; the root is the only dir that has both a
 * package.json and a `packages/` directory.
 */
function repoRoot(): string {
	let dir = moduleDir();
	for (let i = 0; i < 8; i++) {
		if (existsSync(join(dir, "package.json")) && existsSync(join(dir, "packages"))) {
			return dir;
		}
		const parent = dirname(dir);
		if (parent === dir) break; // filesystem root
		dir = parent;
	}
	// Fallback: <root>/packages/server/src → three levels up.
	return join(moduleDir(), "..", "..", "..");
}

/**
 * Locate an executable on PATH (Node equivalent of Bun.which).
 * Returns the absolute path or null if not found.
 */
function which(name: string): string | null {
	const pathDelim = process.platform === "win32" ? ";" : ":";
	const exts =
		process.platform === "win32"
			? (process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";")
			: [""];
	for (const dir of process.env.PATH?.split(pathDelim) ?? []) {
		for (const ext of exts) {
			const candidate = join(dir, name + ext);
			if (existsSync(candidate)) return candidate;
		}
	}
	return null;
}

// ---------------------------------------------------------------------------
// Server spec — the single source of truth for "how to spawn the server".
// ---------------------------------------------------------------------------

/** Absolute path to the server entry every harness config should spawn. */
export function serverAbsPath(): string {
	// <server pkg>/src/server.ts — valid when running from source via `bun run`.
	// This file lives in src/, so the entry is co-located.
	return join(moduleDir(), "server.ts");
}

export interface ServerSpec {
	command: string;
	args: string[];
}

/**
 * The `{ command, args }` block that goes into every harness config.
 *
 * When the user installs globally (`npm install -g beds24-mcp`), the harness
 * should run the global `beds24-mcp serve` binary — that survives reinstalls and
 * doesn't hard-code a path into the user's checkout. We detect that case and
 * return the global command; otherwise we fall back to `bun run <abs src>`.
 */
export function serverSpec(): ServerSpec {
	const global = which("beds24-mcp-server");
	if (global) {
		return { command: global, args: ["serve"] };
	}
	return { command: "bun", args: ["run", serverAbsPath()] };
}

// ---------------------------------------------------------------------------
// Harness registry + detection
// ---------------------------------------------------------------------------

export interface Harness {
	id: string;
	name: string;
	/** Absolute path of the harness config file to write. */
	configPath: string;
	/** JSON key that holds the server map for this harness. */
	serversKey: "mcpServers" | "servers";
	/** True if we found evidence this harness is installed / initialized. */
	detected: boolean;
}

type HarnessId = "claude" | "cursor" | "windsurf" | "vscode";

const ALL_IDS = ["claude", "cursor", "windsurf", "vscode"] as const satisfies readonly HarnessId[];

const NAMES: Record<HarnessId, string> = {
	claude: "Claude Code",
	cursor: "Cursor",
	windsurf: "Windsurf",
	vscode: "VS Code (Copilot)",
};

/** Resolve config path + servers key for a harness id, given the cwd. */
function harnessDef(id: HarnessId, cwd: string): { configPath: string; serversKey: "mcpServers" | "servers" } {
	const home = homedir();
	switch (id) {
		case "claude":
			return { configPath: join(home, ".claude", ".mcp.json"), serversKey: "mcpServers" };
		case "cursor":
			return { configPath: join(home, ".cursor", "mcp.json"), serversKey: "mcpServers" };
		case "windsurf":
			return { configPath: join(home, ".codeium", "windsurf", "mcp_config.json"), serversKey: "mcpServers" };
		case "vscode":
			return { configPath: join(cwd, ".vscode", "mcp.json"), serversKey: "servers" };
	}
}

/** Heuristic: does this harness appear to be installed / initialized? */
function detect(id: HarnessId, cwd: string): boolean {
	const home = homedir();
	switch (id) {
		case "claude":
			return existsSync(join(home, ".claude")) || existsSync(join(home, ".claude.json"));
		case "cursor":
			return existsSync(join(home, ".cursor")) || existsSync(join(cwd, ".cursor"));
		case "windsurf":
			return existsSync(join(home, ".codeium", "windsurf"));
		case "vscode":
			return existsSync(join(cwd, ".vscode"));
	}
}

/** List every known harness with its detection state for the given cwd. */
export function detectHarnesses(cwd: string): Harness[] {
	return ALL_IDS.map((id) => {
		const def = harnessDef(id, cwd);
		return {
			id,
			name: NAMES[id],
			configPath: def.configPath,
			serversKey: def.serversKey,
			detected: detect(id, cwd),
		};
	});
}

// ---------------------------------------------------------------------------
// Config merge — never clobbers other MCP servers
// ---------------------------------------------------------------------------

export type ApplyStatus = "created" | "updated" | "unchanged" | "replaced-corrupt";

/**
 * Return the config text with the beds24 server merged in, and a status tag.
 * Pure function (no I/O) so it can be unit-tested and used by `--dry-run`.
 */
export function applyServerToText(
	existing: string | null,
	spec: ServerSpec,
	serversKey: "mcpServers" | "servers",
): { text: string; status: ApplyStatus } {
	// No file yet → create one containing just beds24.
	if (existing === null) {
		return {
			text: JSON.stringify({ [serversKey]: { beds24: spec } }, null, 2) + "\n",
			status: "created",
		};
	}

	let parsed: Record<string, unknown>;
	try {
		parsed = JSON.parse(existing) as Record<string, unknown>;
	} catch {
		// Malformed JSON — caller backs the file up, we start clean.
		return {
			text: JSON.stringify({ [serversKey]: { beds24: spec } }, null, 2) + "\n",
			status: "replaced-corrupt",
		};
	}

	const servers = (parsed[serversKey] ?? {}) as Record<string, unknown>;
	const before = JSON.stringify(servers["beds24"] ?? undefined);
	servers["beds24"] = spec;
	parsed[serversKey] = servers;

	const status: ApplyStatus =
		before === undefined ? "created" : before === JSON.stringify(spec) ? "unchanged" : "updated";

	return { text: JSON.stringify(parsed, null, 2) + "\n", status };
}

export interface WriteResult {
	status: ApplyStatus;
	path: string;
}

/** Read → merge → (maybe) write one harness config. Returns what happened. */
export function writeConfig(harness: Harness, spec: ServerSpec, dryRun: boolean): WriteResult {
	const existing = existsSync(harness.configPath) ? readFileSync(harness.configPath, "utf8") : null;
	const result = applyServerToText(existing, spec, harness.serversKey);

	if (!dryRun) {
		if (result.status === "replaced-corrupt" && existing !== null) {
			writeFileSync(`${harness.configPath}.bak`, existing);
		}
		mkdirSync(dirname(harness.configPath), { recursive: true });
		writeFileSync(harness.configPath, result.text);
	}

	return { status: result.status, path: harness.configPath };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export interface SetupOptions {
	/** Working directory (for project-level harnesses). Default: process.cwd(). */
	cwd?: string;
	/** Explicit harness ids to configure. */
	harnesses?: string[];
	/** Configure every detected harness, non-interactively. */
	all?: boolean;
	/** Preview writes without touching the filesystem. */
	dryRun?: boolean;
	/** Skip `bun install`. */
	skipInstall?: boolean;
	/** Skip `bun run index`. */
	skipIndex?: boolean;
}

const STATUS_LABEL: Record<ApplyStatus, string> = {
	created: "created",
	updated: "updated",
	unchanged: "already configured",
	"replaced-corrupt": "replaced (corrupt config, backed up)",
};

/** True if stdin is a TTY — i.e. we can ask interactive questions. */
function isInteractive(): boolean {
	return Boolean(process.stdin.isTTY);
}

/**
 * Ask the user which harnesses to configure. Pre-selects detected ones.
 * Returns null only when stdin is non-interactive and nothing was pre-selected.
 */
function chooseInteractive(detected: Harness[]): string[] | null {
	const found = detected.filter((h) => h.detected);
	console.log("\nDetected harnesses:");
	for (const h of detected) {
		console.log(`  ${h.detected ? "✓" : "·"} ${h.name.padEnd(20)} → ${h.configPath}`);
	}

	if (found.length > 0) {
		const all = confirm(`\nConfigure all ${found.length} detected harness?`);
		if (all) return found.map((h) => h.id);

		const pick = prompt("Which? (comma-separated names: claude, cursor, windsurf, vscode):");
		if (pick && pick.trim()) {
			return pick.split(",").map((s) => s.trim().toLowerCase());
		}
		return [];
	}

	console.log("\nNone detected automatically — you can still pick manually.");
	const pick = prompt("Configure which? (comma-separated: claude, cursor, windsurf, vscode):");
	if (pick && pick.trim()) {
		return pick.split(",").map((s) => s.trim().toLowerCase());
	}
	return null;
}

/** Validate requested harness ids, throwing on unknown ones. Throws on error. */
function resolveTargets(requested: string[], all: Harness[]): Harness[] {
	const byId = new Map(all.map((h) => [h.id, h]));
	const unknown = requested.filter((id) => !byId.has(id));
	if (unknown.length > 0) {
		throw new Error(`unknown harness(es): ${unknown.join(", ")} — expected one of: ${ALL_IDS.join(", ")}`);
	}
	return requested.map((id) => byId.get(id) as Harness);
}

function runStep(label: string, args: string[], cwd: string): boolean {
	console.error(`\n[beds24] ${label}`);
	const [cmd, ...rest] = args;
	if (!cmd) {
		console.error(`[beds24] ✗ ${label} failed (empty command).`);
		return false;
	}
	const proc = spawnSync(cmd, rest, { cwd, stdio: "inherit", shell: process.platform === "win32" });
	if (proc.status !== 0) {
		console.error(`[beds24] ✗ ${label} failed (exit ${proc.status}).`);
		return false;
	}
	console.error(`[beds24] ✓ ${label} done.`);
	return true;
}

/** Top-level setup flow. */
export async function runSetup(opts: SetupOptions = {}): Promise<void> {
	const cwd = opts.cwd ?? process.cwd();
	const all = detectHarnesses(cwd);
	const spec = serverSpec();

	console.log("beds24 MCP — auto-installer");
	console.log("─────────────────────────");
	console.log(`server:  ${serverAbsPath()}`);
	console.log(`command: ${spec.command} ${spec.args.join(" ")}`);

	// Decide which harnesses to configure.
	let targetIds: string[];
	if (opts.harnesses && opts.harnesses.length > 0) {
		targetIds = opts.harnesses;
	} else if (opts.all) {
		targetIds = all.filter((h) => h.detected).map((h) => h.id);
	} else if (isInteractive()) {
		const chosen = chooseInteractive(all);
		if (chosen === null) {
			console.log("Nothing selected — nothing to do.");
			return;
		}
		targetIds = chosen;
	} else {
		// Non-interactive fallback: configure anything we detected.
		targetIds = all.filter((h) => h.detected).map((h) => h.id);
		if (targetIds.length === 0) {
			console.error(
				"[beds24] no harness detected non-interactively — re-run with --harness <name> (or --all).",
			);
			process.exitCode = 1;
			return;
		}
	}

	if (targetIds.length === 0) {
		console.log("No harnesses selected — nothing to do.");
		return;
	}

	const targets = resolveTargets(targetIds, all);

	// Write each config.
	console.log("\nConfig:");
	let wrote = false;
	for (const h of targets) {
		const res = writeConfig(h, spec, opts.dryRun ?? false);
		const flag = res.status === "unchanged" ? "·" : opts.dryRun ? "›" : "✓";
		console.log(`  ${flag} ${h.name.padEnd(20)} → ${res.path}  (${STATUS_LABEL[res.status]})`);
		if (res.status !== "unchanged") wrote = true;
	}

	if (opts.dryRun) {
		console.log("\n(dry run — no files changed, nothing installed.)");
		return;
	}

	if (!wrote) {
		console.log("\nConfig already in place — no changes.");
	}

	// Install deps + build the index. Both run from the repo root so the
	// workspace install and the root `index` script resolve correctly.
	const root = repoRoot();
	let ok = true;
	if (!opts.skipInstall) {
		ok = runStep("bun install", ["bun", "install"], root) && ok;
	}
	if (!opts.skipIndex) {
		ok = runStep("bun run index  (builds vector index from knowledge/)", ["bun", "run", "index"], root) && ok;
	}

	console.log("\nDone. " + (ok ? "Restart your harness to load the beds24 tools." : "Some steps failed — see above."));
}
