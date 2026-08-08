/**
 * Coverage-close tests for cli.ts + setup.ts.
 *
 * Per TEST-HARNESS.md and the cross-file flakiness note: mock the two
 * workspace packages (beds24-knowledge, beds24-sdk-client) and set
 * BEDS24_KNOWLEDGE_DIR to the same shared tmpdir the other server tests use so
 * server.ts's module-level KNOWLEDGE_DIR (if it loads) agrees. mockReset() — not
 * just mockClear() — in beforeEach so queued once-stubs never leak.
 *
 * Targets:
 *  - cli.ts moduleDir() fileURLToPath fallback (lines ~42-44) — exercised via the
 *    exported moduleDir() + __setBaseDirForTests("") after the T3 pattern.
 *  - setup.ts moduleDir() fallback — exercised via serverAbsPath() with the
 *    override set to "".
 *  - setup.ts prompt/confirm (node:readline) — the readline mock fires `question`'s
 *    callback synchronously so the callback-based prompt returns the canned answer.
 *  - setup.ts chooseInteractive() + runSetup's isInteractive()→chooseInteractive
 *    branch (the 342-347 region): driven through runSetup with stdin.isTTY=true.
 */

import { test, expect, describe, beforeEach, afterEach, mock } from "bun:test";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Deterministic knowledge dir. We mock ./server.js, so server.ts never loads
// and this string is never read from disk — it only needs to be stable for the
// BEDS24_KNOWLEDGE_DIR override we set below. (We intentionally avoid importing
// `tmpdir` from node:os: mock.module("node:os") is process-global, so a
// hoisted tmpdir import here would resolve against whichever file registered
// the mock last and could fail to find the export.)
// ---------------------------------------------------------------------------
const KNOWLEDGE_DIR = "/tmp/beds24-mcp-test-knowledge";
const HOME = "/home/test";

// ---------------------------------------------------------------------------
// beds24-knowledge surface (cli.ts imports buildIndex/dbExists/countChunks/getDb/DB_PATH).
// ---------------------------------------------------------------------------
const buildIndex = mock(async () => ({ files: 1, chunks: 2 }));
const dbExists = mock(() => true);
const countChunks = mock(() => 5);
const getDb = mock(() => undefined);
const DB_PATH = "/tmp/test.db";

// ---------------------------------------------------------------------------
// beds24-sdk-client surface (cli.ts imports listEndpoints).
// ---------------------------------------------------------------------------
const listEndpoints = mock((): string[] => ["GET /bookings", "POST /bookings"]);

// ---------------------------------------------------------------------------
// Stub ./server.js so server.ts never loads (and never computes KNOWLEDGE_DIR).
// ---------------------------------------------------------------------------
const startServer = mock(async () => {});

// ---------------------------------------------------------------------------
// setup.js fs/os/child_process surface — state-driven, mirroring setup.test.ts.
// ---------------------------------------------------------------------------
const state = {
	existing: [] as string[],
	readFile: new Map<string, string>(),
};

const homedir = mock(() => HOME);
const existsSync = mock((p: string) => state.existing.includes(p));
const readFileSync = mock((p: string) => state.readFile.get(p) ?? "");
const writeFileSync = mock((_p: string, _data: string) => {});
const mkdirSync = mock((_p: string, _opts?: unknown) => undefined);
const spawnSync = mock(() => ({ status: 0 }));

// ---------------------------------------------------------------------------
// node:readline surface — `question` invokes its callback SYNCHRONOUSLY with the
// next canned answer. This makes the callback-based prompt()/confirm() return a
// real value in tests (the same trick that lets the lines be covered).
//
// These are PLAIN functions (not bun mocks) so their behavior survives the
// mockReset() calls in beforeEach — only the answer queue is reset per test.
// ---------------------------------------------------------------------------
const readlineState = {
	answers: [] as string[],
	idx: 0,
};
function resetReadline(): void {
	readlineState.answers = [];
	readlineState.idx = 0;
}

mock.module("node:readline", () => ({
	createInterface: () => ({
		question: (_q: string, cb: (line: string) => void) => {
			const ans =
				readlineState.idx < readlineState.answers.length
					? readlineState.answers[readlineState.idx++]!
					: "";
			cb(ans);
		},
		close: () => {},
	}),
}));

mock.module("beds24-knowledge", () => ({
	buildIndex,
	dbExists,
	countChunks,
	getDb,
	DB_PATH,
}));
mock.module("beds24-sdk-client", () => ({
	listEndpoints,
}));
mock.module("./server.js", () => ({
	startServer,
}));
mock.module("node:os", () => ({
	homedir,
	// Re-export tmpdir: this file (and cli.test.ts in the same run) import it.
	// Node's os.tmpdir() is process.platform-aware; a stable /tmp is enough for
	// the KNOWLEDGE_DIR path the other server tests also build.
	tmpdir: () => "/tmp",
}));
const fsMock = {
	existsSync,
	readFileSync,
	writeFileSync,
	mkdirSync,
	// statSync/readdirSync are used by cli.ts printStatus via require("node:fs").
	statSync: mock((_p: string) => ({ size: 1024 })),
	readdirSync: mock((_p: string) => []),
};
mock.module("node:fs", () => ({ ...fsMock, default: fsMock }));
mock.module("node:child_process", () => ({ spawnSync }));

// ---------------------------------------------------------------------------
// Deterministic environment + argv, captured exit — same pattern as cli.test.ts.
// ---------------------------------------------------------------------------
process.env.BEDS24_KNOWLEDGE_DIR = KNOWLEDGE_DIR;
process.argv = ["cli.ts"];

const exitSpy = mock((_code?: number) => {});
process.exit = exitSpy as unknown as typeof process.exit;

// Top-level dynamic imports run AFTER the mock registrations above.
const cli = await import("./cli.js");
const setup = await import("./setup.js");

// ---------------------------------------------------------------------------
// Per-test reset — mockReset (not mockClear) per the flakiness note.
// ---------------------------------------------------------------------------
let origIsTTY = process.stdin.isTTY;

beforeEach(() => {
	state.existing = [];
	state.readFile = new Map();
	resetReadline();
	origIsTTY = process.stdin.isTTY;
	process.exitCode = 0;

	buildIndex.mockReset();
	dbExists.mockReset();
	countChunks.mockReset();
	getDb.mockReset();
	listEndpoints.mockReset();
	startServer.mockReset();
	homedir.mockReset();
	existsSync.mockReset();
	readFileSync.mockReset();
	writeFileSync.mockReset();
	mkdirSync.mockReset();
	spawnSync.mockReset();
	exitSpy.mockReset();

	// Re-establish the default happy-path behavior (mockReset clears impls).
	buildIndex.mockResolvedValue({ files: 1, chunks: 2 });
	dbExists.mockReturnValue(true);
	countChunks.mockReturnValue(5);
	getDb.mockReturnValue(undefined);
	listEndpoints.mockReturnValue(["GET /bookings", "POST /bookings"]);
	homedir.mockReturnValue(HOME);
	existsSync.mockImplementation((p: string) => state.existing.includes(p));
	readFileSync.mockImplementation((p: string) => state.readFile.get(p) ?? "");
	spawnSync.mockImplementation(() => ({ status: 0 }));
});

afterEach(() => {
	process.stdin.isTTY = origIsTTY;
	process.exitCode = 0;
});

// ---------------------------------------------------------------------------
// cli.ts — moduleDir() fileURLToPath fallback
// ---------------------------------------------------------------------------
describe("cli.ts moduleDir() — fileURLToPath fallback", () => {
	test("falls back to deriving a dir from import.meta.url when override is empty", () => {
		// An empty override fails the `dir.length > 0` check, forcing the
		// fileURLToPath branch — exactly the T3 knowledge/paths.ts pattern.
		cli.__setBaseDirForTests("");
		const dir = cli.moduleDir();
		expect(typeof dir).toBe("string");
		expect(dir.length).toBeGreaterThan(0);
		// Both paths resolve to the src/ dir; the assertion proves the fallback
		// line executed (import.meta.url is always set, so this is the only way
		// to reach the fileURLToPath branch under Bun).
		expect(dir).toBe(import.meta.dir);
	});

	test("uses the override verbatim when it is non-empty", () => {
		cli.__setBaseDirForTests("/custom/dir");
		expect(cli.moduleDir()).toBe("/custom/dir");
	});
});

// ---------------------------------------------------------------------------
// setup.ts — moduleDir() fileURLToPath fallback (via serverAbsPath)
// ---------------------------------------------------------------------------
describe("setup.ts moduleDir() — fileURLToPath fallback via serverAbsPath", () => {
	test("serverAbsPath derives from import.meta.url when override is empty", () => {
		setup.__setBaseDirForTests("");
		const abs = setup.serverAbsPath();
		// moduleDir() fallback → src dir → join(src, "server.ts").
		expect(abs.endsWith(join("src", "server.ts"))).toBe(true);
		expect(abs.startsWith("/")).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// setup.ts — prompt / confirm (node:readline)
// ---------------------------------------------------------------------------
describe("setup.ts prompt / confirm", () => {
	test("prompt returns the readline answer when interactive", () => {
		process.stdin.isTTY = true;
		readlineState.answers.push("hello");
		expect(setup.prompt("> ")).toBe("hello");
	});

	test("prompt returns null when non-interactive", () => {
		process.stdin.isTTY = false;
		expect(setup.prompt("> ")).toBe(null);
	});

	test("confirm returns true for a yes-style answer", () => {
		process.stdin.isTTY = true;
		readlineState.answers.push("yes");
		expect(setup.confirm("proceed? ")).toBe(true);
	});

	test("confirm returns true for a bare 'y'", () => {
		process.stdin.isTTY = true;
		readlineState.answers.push("y");
		expect(setup.confirm("proceed? ")).toBe(true);
	});

	test("confirm returns false for a negative answer", () => {
		process.stdin.isTTY = true;
		readlineState.answers.push("n");
		expect(setup.confirm("proceed? ")).toBe(false);
	});

	test("confirm returns false when non-interactive", () => {
		process.stdin.isTTY = false;
		expect(setup.confirm("proceed? ")).toBe(false);
	});
});

// ---------------------------------------------------------------------------
// setup.ts — line 392 map callback (non-interactive else branch, detection
// non-empty). Bun's function coverage counts an arrow passed to `.map()` as a
// separate function; when the mapped array is empty the line runs but the
// callback body never does. setup.test.ts only ever drives line 392 with empty
// detection, leaving that `(h) => h.id` callback as the lone uncovered function
// (32/33). This test exercises the branch WITH a detected harness so the
// callback actually runs.
// ---------------------------------------------------------------------------
describe("runSetup — non-interactive else branch with detection (covers line 392 callback)", () => {
	const logSpy = mock((_msg: string) => {});

	beforeEach(() => {
		state.existing = [];
		state.readFile = new Map();
		// Force the non-interactive branch (process.stdin.isTTY === false).
		process.stdin.isTTY = false;
		logSpy.mockReset();
	});

	test("detects claude non-interactively → configures it (line 392 map callback runs)", async () => {
		state.existing = [join(HOME, ".claude")];

		const origLog = console.log;
		console.log = logSpy as unknown as typeof console.log;
		try {
			await setup.runSetup({ cwd: "/proj" });
		} finally {
			console.log = origLog;
		}

		// Reached the non-interactive else branch with a non-empty detection →
		// the `.filter(...).map((h) => h.id)` callback at line 392 executed.
		expect(writeFileSync).toHaveBeenCalledTimes(1);
		const [writtenPath] = writeFileSync.mock.calls[0]!;
		expect(writtenPath).toBe(join(HOME, ".claude", ".mcp.json"));
		expect(spawnSync).toHaveBeenCalledTimes(2); // bun install + bun run index
	});
});

// ---------------------------------------------------------------------------
// setup.ts — runSetup interactive path (chooseInteractive + the 342-347 branch)
// ---------------------------------------------------------------------------
describe("runSetup — interactive chooseInteractive() path", () => {
	const logSpy = mock((_msg: string) => {});

	beforeEach(() => {
		state.existing = [];
		state.readFile = new Map();
		process.stdin.isTTY = true; // force the isInteractive() branch
		logSpy.mockReset();
	});

	test("detected harness + confirm 'all' → configures all detected ids", async () => {
		// Mark claude as detected (HOME/.claude exists).
		state.existing = [join(HOME, ".claude")];
		// confirm("Configure all 1 detected harness?") → "y".
		readlineState.answers.push("y");

		const origLog = console.log;
		console.log = logSpy as unknown as typeof console.log;
		try {
			await setup.runSetup({ cwd: "/proj" });
		} finally {
			console.log = origLog;
		}

		// One config write for claude + install + index steps.
		expect(writeFileSync).toHaveBeenCalledTimes(1);
		const [writtenPath] = writeFileSync.mock.calls[0]!;
		expect(writtenPath).toBe(join(HOME, ".claude", ".mcp.json"));
		// targetIds = chosen reached (the confirm "all" path).
		expect(spawnSync).toHaveBeenCalledTimes(2); // bun install + bun run index
	});

	test("detected harness + pick-by-name → configures the chosen ids", async () => {
		state.existing = [join(HOME, ".claude")];
		// confirm("all?") → "n"; prompt("Which?") → "claude".
		readlineState.answers.push("n");
		readlineState.answers.push("claude");

		const origLog = console.log;
		console.log = logSpy as unknown as typeof console.log;
		try {
			await setup.runSetup({ cwd: "/proj" });
		} finally {
			console.log = origLog;
		}

		expect(writeFileSync).toHaveBeenCalledTimes(1);
		const [writtenPath] = writeFileSync.mock.calls[0]!;
		expect(writtenPath).toBe(join(HOME, ".claude", ".mcp.json"));
	});

	test("nothing detected + empty pick → chooseInteractive returns null, no writes", async () => {
		// Nothing detected → found.length === 0.
		state.existing = [];
		// prompt("Configure which?") → "" (empty) → returns null.
		readlineState.answers.push("");

		const origLog = console.log;
		console.log = logSpy as unknown as typeof console.log;
		try {
			await setup.runSetup({ cwd: "/proj" });
		} finally {
			console.log = origLog;
		}

		// runSetup hits the `chosen === null` branch → logs "Nothing selected"
		// and returns without writing any config.
		expect(writeFileSync).not.toHaveBeenCalled();
		const nothingSelected = logSpy.mock.calls.find(
			(c) => String(c[0]).includes("Nothing selected"),
		);
		expect(nothingSelected).toBeDefined();
	});

	// Covers the `found.length === 0` branch where the user DOES type harness
	// names manually (setup.ts chooseInteractive lines ~330-333: the manual-pick
	// path under "None detected automatically"). Without this, that branch — and
	// the targetIds = chosen assignment in runSetup — stays uncovered.
	test("nothing detected + manual pick → configures the manually chosen ids", async () => {
		state.existing = [];
		// prompt("Configure which? (comma-separated...)") → "claude".
		readlineState.answers.push("claude");

		const origLog = console.log;
		console.log = logSpy as unknown as typeof console.log;
		try {
			await setup.runSetup({ cwd: "/proj" });
		} finally {
			console.log = origLog;
		}

		expect(writeFileSync).toHaveBeenCalledTimes(1);
		const [writtenPath] = writeFileSync.mock.calls[0]!;
		expect(writtenPath).toBe(join(HOME, ".claude", ".mcp.json"));
	});

	// Covers the `found.length > 0` branch where the user declines "all" and then
	// gives an empty pick → chooseInteractive returns [] (setup.ts ~line 323).
	// runSetup then hits the `targetIds.length === 0` guard and writes nothing.
	test("detected harness + decline all + empty pick → no harnesses selected, no writes", async () => {
		state.existing = [join(HOME, ".claude")];
		// confirm("all?") → "n"; prompt("Which?") → "" (empty).
		readlineState.answers.push("n");
		readlineState.answers.push("");

		const origLog = console.log;
		console.log = logSpy as unknown as typeof console.log;
		try {
			await setup.runSetup({ cwd: "/proj" });
		} finally {
			console.log = origLog;
		}

		// chooseInteractive returned []; runSetup logs "No harnesses selected".
		expect(writeFileSync).not.toHaveBeenCalled();
		const noneSelected = logSpy.mock.calls.find(
			(c) => String(c[0]).includes("No harnesses selected"),
		);
		expect(noneSelected).toBeDefined();
	});

	// Covers the `if (!wrote)` branch in runSetup (setup.ts lines 424-425): when
	// every target's config is already identical ("unchanged"). Note writeConfig
	// always rewrites the file (even when unchanged — status is just a label), so
	// the `wrote` flag stays false ONLY when all statuses are "unchanged"; we
	// assert that flag indirectly via the absence of install/index steps and the
	// "Config already in place" log line.
	test("all configs already in place → !wrote branch logs 'already in place'", async () => {
		const spec = setup.serverSpec();
		const claudePath = join(HOME, ".claude", ".mcp.json");
		// Seed an existing config byte-identical to what writeConfig produces →
		// applyServerToText returns status "unchanged" → wrote stays false.
		const existing = JSON.stringify({ mcpServers: { beds24: spec } }, null, 2) + "\n";
		state.existing = [join(HOME, ".claude"), claudePath];
		state.readFile.set(claudePath, existing);
		// confirm("all?") → "y" (accept all detected).
		readlineState.answers.push("y");

		const origLog = console.log;
		console.log = logSpy as unknown as typeof console.log;
		try {
			await setup.runSetup({ cwd: "/proj" });
		} finally {
			console.log = origLog;
		}

		// Status "unchanged" → the `!wrote` branch logs "Config already in
		// place" (the ONLY behavior gated on `wrote`). The install/index block
		// runs regardless — building the knowledge index is independent of
		// whether the config files changed — so spawnSync fires twice here.
		expect(spawnSync).toHaveBeenCalledTimes(2);
		const already = logSpy.mock.calls.find((c) => String(c[0]).includes("already in place"));
		expect(already).toBeDefined();
	});
});
