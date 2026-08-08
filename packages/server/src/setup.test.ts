/**
 * Unit tests for setup.ts.
 *
 * - `applyServerToText` is a pure helper (no I/O): tested directly across every
 *   status branch, asserting the beds24 entry is merged in without clobbering
 *   other servers.
 * - `detectHarnesses` + `serverSpec` + `writeConfig` touch fs/os: those modules
 *   are mocked. `node:path` is left real (the assertions are about paths).
 */

import { test, expect, describe, beforeEach, afterEach, afterAll, mock } from "bun:test";
import { dirname, join } from "node:path";
import type { ServerSpec, Harness } from "./setup.js";

// setup.ts binds to node:fs + node:os at import time, so those mocks MUST be
// registered before setup.ts is evaluated. A top-level dynamic import runs after
// the mock.module calls below (static imports are hoisted above statements, so a
// static `import ... from "./setup.js"` would load setup.ts against the real fs).
// Per-test mock configuration is held in this shared, mutable state object.
const HOME = "/home/test";
const state = {
	existing: [] as string[],
	readFile: new Map<string, string>(),
};

const homedir = mock(() => HOME);
const existsSync = mock((p: string) => state.existing.includes(p));
const readFileSync = mock((p: string) => state.readFile.get(p) ?? "");
const writeFileSync = mock((_p: string, _data: string) => {});
const mkdirSync = mock((_p: string, _opts?: unknown) => undefined);
// spawnSync is exercised by runStep (invoked from runSetup); mock it to a
// successful spawn so the orchestration can be driven without a real subprocess.
const spawnSync = mock((_cmd: string, _args: unknown, _opts?: unknown) => ({ status: 0 }));

mock.module("node:os", () => ({ homedir }));
mock.module("node:fs", () => ({ existsSync, readFileSync, writeFileSync, mkdirSync }));
mock.module("node:child_process", () => ({ spawnSync }));

const {
	applyServerToText,
	detectHarnesses,
	serverSpec,
	serverAbsPath,
	writeConfig,
	repoRoot,
	resolveTargets,
	runSetup,
	runStep,
} = await import("./setup.js");

// ---------------------------------------------------------------------------
// applyServerToText — pure, no mocks required
// ---------------------------------------------------------------------------
const SPEC: ServerSpec = { command: "bun", args: ["run", "/abs/server.ts"] };

describe("applyServerToText", () => {
	test("null config → 'created' with only the beds24 entry (mcpServers)", () => {
		const { text, status } = applyServerToText(null, SPEC, "mcpServers");
		expect(status).toBe("created");
		const parsed = JSON.parse(text) as { mcpServers: { beds24: ServerSpec } };
		expect(parsed.mcpServers.beds24).toEqual(SPEC);
	});

	test("empty object → 'created'", () => {
		const { status } = applyServerToText("{}", SPEC, "mcpServers");
		expect(status).toBe("created");
	});

	test("existing config with other servers → 'created' and others preserved", () => {
		const existing = JSON.stringify({ mcpServers: { other: { command: "x", args: [] } } });
		const { text, status } = applyServerToText(existing, SPEC, "mcpServers");
		expect(status).toBe("created");
		const parsed = JSON.parse(text) as { mcpServers: { beds24: ServerSpec; other: ServerSpec } };
		expect(parsed.mcpServers.other).toEqual({ command: "x", args: [] });
		expect(parsed.mcpServers.beds24).toEqual(SPEC);
	});

	test("beds24 already present & identical → 'unchanged'", () => {
		const existing = JSON.stringify({ mcpServers: { beds24: SPEC } });
		const { status, text } = applyServerToText(existing, SPEC, "mcpServers");
		expect(status).toBe("unchanged");
		expect(JSON.parse(text)).toEqual({ mcpServers: { beds24: SPEC } });
	});

	test("beds24 present but different → 'updated'", () => {
		const existing = JSON.stringify({ mcpServers: { beds24: { command: "old", args: [] } } });
		const { text, status } = applyServerToText(existing, SPEC, "mcpServers");
		expect(status).toBe("updated");
		expect(JSON.parse(text)).toEqual({ mcpServers: { beds24: SPEC } });
	});

	test("malformed JSON → 'replaced-corrupt' with a fresh beds24-only config", () => {
		const { text, status } = applyServerToText("{ not json", SPEC, "mcpServers");
		expect(status).toBe("replaced-corrupt");
		expect(JSON.parse(text)).toEqual({ mcpServers: { beds24: SPEC } });
	});

	test("uses the 'servers' key when asked (vscode-style configs)", () => {
		const { text } = applyServerToText(null, SPEC, "servers");
		const parsed = JSON.parse(text) as { servers: { beds24: ServerSpec } };
		expect(parsed.servers.beds24).toEqual(SPEC);
	});
});

// ---------------------------------------------------------------------------
// Harness detection + path selection — mock os.homedir + fs.existsSync
// ---------------------------------------------------------------------------

describe("detectHarnesses — path selection per harness id", () => {
	const cwd = "/proj";

	/** Look up a harness by id; the registry always emits all four known ids. */
	function byId(harnesses: Harness[], id: string): Harness {
		const found = harnesses.find((h) => h.id === id);
		if (!found) throw new Error(`missing harness in registry: ${id}`);
		return found;
	}

	test("maps each id to its config path + servers key", () => {
		state.existing = [];
		const harnesses = detectHarnesses(cwd);

		expect(byId(harnesses, "claude").configPath).toBe(join(HOME, ".claude", ".mcp.json"));
		expect(byId(harnesses, "claude").serversKey).toBe("mcpServers");

		expect(byId(harnesses, "cursor").configPath).toBe(join(HOME, ".cursor", "mcp.json"));
		expect(byId(harnesses, "cursor").serversKey).toBe("mcpServers");

		expect(byId(harnesses, "windsurf").configPath).toBe(
			join(HOME, ".codeium", "windsurf", "mcp_config.json"),
		);
		expect(byId(harnesses, "windsurf").serversKey).toBe("mcpServers");

		expect(byId(harnesses, "vscode").configPath).toBe(join(cwd, ".vscode", "mcp.json"));
		expect(byId(harnesses, "vscode").serversKey).toBe("servers");
	});

	test("detected flag reflects filesystem presence", () => {
		state.existing = [join(HOME, ".claude"), join(cwd, ".vscode")];
		const harnesses = detectHarnesses(cwd);

		expect(byId(harnesses, "claude").detected).toBe(true);
		expect(byId(harnesses, "vscode").detected).toBe(true);
		expect(byId(harnesses, "cursor").detected).toBe(false);
		expect(byId(harnesses, "windsurf").detected).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// repoRoot + resolveTargets — pure logic (repoRoot walk-up is fs-gated, so the
// walk is driven against a mocked existsSync).
// ---------------------------------------------------------------------------
describe("repoRoot", () => {
	test("walks up and returns the first dir holding both package.json + packages", () => {
		// moduleDir() resolves to this src/ dir. Walking up: the test makes the
		// grandparent (packages/server → packages) the first match.
		const here = serverAbsPath(); // .../src/server.ts
		const srcDir = dirname(here);
		const pkgDir = dirname(srcDir); // .../packages/server
		const withPackageJson = join(pkgDir, "package.json");
		const withPackages = join(pkgDir, "packages");
		state.existing = [withPackageJson, withPackages];
		expect(repoRoot()).toBe(pkgDir);
	});

	test("falls back to three levels up when no ancestor matches", () => {
		state.existing = [];
		const here = serverAbsPath();
		const srcDir = dirname(here);
		expect(repoRoot()).toBe(join(srcDir, "..", "..", ".."));
	});
});

describe("resolveTargets", () => {
	const all = detectHarnesses("/proj");

	test("maps requested ids to their harness objects in order", () => {
		const targets = resolveTargets(["vscode", "claude"], all);
		expect(targets.map((h) => h.id)).toEqual(["vscode", "claude"]);
	});

	test("throws on an unknown harness id", () => {
		expect(() => resolveTargets(["bogus"], all)).toThrow(
			/unknown harness\(es\): bogus/,
		);
	});
});

// ---------------------------------------------------------------------------
// serverSpec — global binary present vs. bun fallback (mock fs + PATH)
// ---------------------------------------------------------------------------
describe("serverSpec", () => {
	const originalPath = process.env.PATH;

	beforeEach(() => {
		process.env.PATH = "/usr/local/bin";
	});

	afterEach(() => {
		process.env.PATH = originalPath;
	});

	test("returns the global binary when it is on PATH", () => {
		const globalPath = join("/usr/local/bin", "beds24-mcp-server");
		state.existing = [globalPath];
		expect(serverSpec()).toEqual({ command: globalPath, args: ["serve"] });
	});

	test("falls back to `bun run <abs>` when no global binary", () => {
		state.existing = [];
		expect(serverSpec()).toEqual({ command: "bun", args: ["run", serverAbsPath()] });
	});
});

describe("serverAbsPath", () => {
	test("points at server.ts next to this module", () => {
		expect(serverAbsPath().endsWith("server.ts")).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// writeConfig — mock fs, assert path + JSON written
// ---------------------------------------------------------------------------
describe("writeConfig", () => {
	const harness: Harness = {
		id: "claude",
		name: "Claude Code",
		configPath: join(HOME, ".claude", ".mcp.json"),
		serversKey: "mcpServers",
		detected: true,
	};

	beforeEach(() => {
		state.existing = [];
		state.readFile = new Map();
		readFileSync.mockClear();
		writeFileSync.mockClear();
		mkdirSync.mockClear();
		// The non-interactive "no target" branch sets process.exitCode = 1; reset it
		// each test so a prior test doesn't leak a non-zero code into bun's exit.
		process.exitCode = 0;
	});

	// Guard against any test leaving process.exitCode set to a non-zero value,
	// which would otherwise make `bun test` exit non-zero despite all passing.
	afterAll(() => {
		process.exitCode = 0;
	});

	test("writes a valid, merged JSON config to the harness path", () => {
		const res = writeConfig(harness, SPEC, false);
		expect(res.status).toBe("created");
		expect(res.path).toBe(harness.configPath);
		expect(mkdirSync).toHaveBeenCalledWith(join(HOME, ".claude"), { recursive: true });
		expect(writeFileSync).toHaveBeenCalledTimes(1);
		const [writtenPath, writtenData] = writeFileSync.mock.calls[0]!;
		expect(writtenPath).toBe(harness.configPath);
		const parsed = JSON.parse(writtenData as string) as { mcpServers: { beds24: ServerSpec } };
		expect(parsed.mcpServers.beds24).toEqual(SPEC);
	});

	test("preserves other servers when merging into an existing config", () => {
		// beds24 was absent → status is "created" (a fresh beds24 entry), while the
		// pre-existing "other" server is left untouched.
		const existing = JSON.stringify({ mcpServers: { other: { command: "x", args: [] } } });
		state.existing = [harness.configPath];
		state.readFile.set(harness.configPath, existing);
		const res = writeConfig(harness, SPEC, false);
		expect(res.status).toBe("created");
		const [, writtenData] = writeFileSync.mock.calls[0]!;
		const parsed = JSON.parse(writtenData as string) as {
			mcpServers: { beds24: ServerSpec; other: ServerSpec };
		};
		expect(parsed.mcpServers.other).toEqual({ command: "x", args: [] });
		expect(parsed.mcpServers.beds24).toEqual(SPEC);
	});

	test("backs up corrupt config before replacing it", () => {
		state.existing = [harness.configPath];
		state.readFile.set(harness.configPath, "{ corrupt");
		const res = writeConfig(harness, SPEC, false);
		expect(res.status).toBe("replaced-corrupt");
		// backup write + replacement write = 2 calls, backup path gets the .bak suffix.
		expect(writeFileSync).toHaveBeenCalledTimes(2);
		const [backupPath, backupData] = writeFileSync.mock.calls[0]!;
		expect(backupPath).toBe(`${harness.configPath}.bak`);
		expect(backupData).toBe("{ corrupt");
	});

	test("dryRun reports status without writing", () => {
		const res = writeConfig(harness, SPEC, true);
		expect(res.status).toBe("created");
		expect(writeFileSync).not.toHaveBeenCalled();
		expect(mkdirSync).not.toHaveBeenCalled();
	});
});

// ---------------------------------------------------------------------------
// runSetup — non-interactive orchestration (spawnSync mocked to success).
// The interactive prompt path (chooseInteractive, which needs the browser/Node
// `prompt`/`confirm` globals) is exercised by the T14 integration test.
// ---------------------------------------------------------------------------
describe("runSetup — non-interactive flow", () => {
	const origIsTTY = process.stdin.isTTY;

	beforeEach(() => {
		state.existing = [];
		state.readFile = new Map();
		writeFileSync.mockClear();
		mkdirSync.mockClear();
		spawnSync.mockClear();
		// Force the non-interactive branch (no TTY → no interactive prompts).
		process.stdin.isTTY = false;
	});

	afterEach(() => {
		process.stdin.isTTY = origIsTTY;
	});

	test("configures detected harnesses with --all (writes + install + index)", async () => {
		// Mark claude as detected so the non-interactive fallback has a target.
		state.existing = [join(HOME, ".claude")];
		const errorSpy = mock((_msg: string) => {});
		const origError = console.error;
		console.error = errorSpy as typeof console.error;
		try {
			await runSetup({ all: true, cwd: "/proj" });
		} finally {
			console.error = origError;
		}
		// One config write (claude) + install + index steps.
		expect(writeFileSync).toHaveBeenCalledTimes(1);
		expect(spawnSync).toHaveBeenCalledTimes(2); // bun install + bun run index
	});

	test("dryRun writes nothing and installs nothing", async () => {
		state.existing = [join(HOME, ".claude")];
		await runSetup({ all: true, dryRun: true, cwd: "/proj" });
		expect(writeFileSync).not.toHaveBeenCalled();
		expect(spawnSync).not.toHaveBeenCalled();
	});

	test("skipInstall + skipIndex still write config but run no steps", async () => {
		state.existing = [join(HOME, ".claude")];
		await runSetup({ all: true, skipInstall: true, skipIndex: true, cwd: "/proj" });
		expect(writeFileSync).toHaveBeenCalledTimes(1);
		expect(spawnSync).not.toHaveBeenCalled();
	});

	test("exits non-zero when nothing is detected and no targets requested", async () => {
		state.existing = [];
		await runSetup({ cwd: "/proj" });
		// Non-interactive, no detected harness, no explicit targets → the flow
		// sets process.exitCode = 1 and returns without writing any config.
		expect(process.exitCode).toBe(1);
		expect(writeFileSync).not.toHaveBeenCalled();
	});

	// runStep is exported purely for unit coverage of its guard branches; the
	// success + failure behaviour is also exercised indirectly via runSetup above.
	describe("runStep", () => {
		test("returns false on an empty command without spawning", () => {
			const errorSpy = mock((_msg: string) => {});
			const originalError = console.error;
			console.error = errorSpy as typeof console.error;
			try {
				expect(runStep("empty", [], "/proj")).toBe(false);
			} finally {
				console.error = originalError;
			}
			expect(spawnSync).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalledWith("[beds24] ✗ empty failed (empty command).");
		});

		test("returns true when the spawn succeeds", () => {
			const errorSpy = mock((_msg: string) => {});
			const originalError = console.error;
			console.error = errorSpy as typeof console.error;
			try {
				expect(runStep("ok", ["bun", "install"], "/proj")).toBe(true);
			} finally {
				console.error = originalError;
			}
			expect(spawnSync).toHaveBeenCalledWith("bun", ["install"], {
				cwd: "/proj",
				stdio: "inherit",
				shell: false,
			});
		});
	});

	test("a failed install step reports failure (covers runStep failure branch)", async () => {
		state.existing = [join(HOME, ".claude")];
		// Make the `bun install` spawn fail; index is skipped so only one failing step.
		spawnSync.mockImplementation(() => ({ status: 1 }));
		const errorSpy = mock((_msg: string) => {});
		const origError = console.error;
		console.error = errorSpy as typeof console.error;
		try {
			await runSetup({ all: true, skipIndex: true, cwd: "/proj" });
		} finally {
			console.error = origError;
		}
		// One failing install step; the final summary reports failure.
		expect(spawnSync).toHaveBeenCalledTimes(1);
		expect(errorSpy).toHaveBeenCalledWith("[beds24] ✗ bun install failed (exit 1).");
	});
});
