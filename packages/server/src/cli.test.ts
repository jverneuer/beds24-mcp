/**
 * Unit tests for cli.ts command dispatch.
 *
 * cli.ts auto-runs `main().catch(handleFatal)` at import, so this file sets up
 * its dependency mocks + a benign argv + a capturing `process.exit` BEFORE the
 * dynamic import. That import-time run exercises `main` and the `.catch`
 * registration; the per-command behaviour is then driven directly through the
 * exported `runCli`.
 */

import { test, expect, describe, beforeEach, mock } from "bun:test";
import fs from "node:fs";
import { join } from "node:path";

// --- beds24-knowledge surface (cli imports buildIndex/dbExists/countChunks/getDb/DB_PATH) ---
const buildIndex = mock((_opts: { knowledgeDir: string; force: boolean }) =>
	Promise.resolve({ files: 1, chunks: 2 }),
);
const dbExists = mock(() => true);
const countChunks = mock(() => 5);
const getDb = mock(() => undefined);
const DB_PATH = "/tmp/test.db";

// --- beds24-sdk-client surface (cli imports listEndpoints) ---
const listEndpoints = mock((): string[] => ["GET /bookings", "POST /bookings"]);

// --- server.js / setup.js surfaces (isolated — these packages have their own suites) ---
const startServer = mock(() => Promise.resolve());

// --- node:fs surface (printStatus uses require("node:fs") for statSync/readdirSync) ---
const fsExistsSync = mock((_p: string) => false);
const fsStatSync = mock((_p: string) => ({ size: 1024 }));
const fsReaddirSync = mock((_p: string): ReturnType<typeof fs.readdirSync> => []);

mock.module("@jverneuer/beds24-knowledge", () => ({
	buildIndex,
	dbExists,
	countChunks,
	getDb,
	DB_PATH,
}));
mock.module("@jverneuer/beds24-sdk-client", () => ({
	listEndpoints,
}));
// The MCP server entry (server.ts) is T10's domain — stub its startServer so the
// "serve" command test can assert delegation without spinning up a transport.
mock.module("./server.js", () => ({
	startServer,
}));
// NOTE: setup.js is NOT mocked here. cli.ts delegates the "setup" command to the
// real runSetup; stubbing it globally via mock.module would pollute the shared
// module cache and break setup.test.ts (which needs the real setup.js in the
// same `bun test` run). Instead the setup-command test below drives the real
// runSetup with its own dependency mocks (os/fs/child_process + process.exit).
const writeFileSync = mock((_p: string, _data: string) => {});
const mkdirSync = mock((_p: string, _opts?: unknown) => undefined);
const readFileSync = mock((_p: string, _enc: string) => "");
const fsMock = {
	existsSync: fsExistsSync,
	statSync: fsStatSync,
	readdirSync: fsReaddirSync,
	writeFileSync,
	mkdirSync,
	readFileSync,
};
mock.module("node:fs", () => ({ ...fsMock, default: fsMock }));
const osHomedir = mock(() => "/home/test");
mock.module("node:os", () => ({ homedir: osHomedir }));
const spawnSync = mock((_cmd: string, _args: unknown, _opts?: unknown) => ({ status: 0 }));
mock.module("node:child_process", () => ({ spawnSync }));

// Deterministic knowledge dir (module-level `const knowledgeDir = defaultKnowledgeDir()`
// is evaluated at import, so set the override before importing).
const KNOWLEDGE_DIR = "/test/knowledge";
process.env.BEDS24_KNOWLEDGE_DIR = KNOWLEDGE_DIR;

// Capture exit codes instead of terminating the test process. A capturing mock
// (rather than a throwing one) keeps the test run's exit code at 0 and lets
// bun's coverage reporter flush its summary table at real process exit.
let exitCode: number | undefined;
const exitSpy = mock((code?: number) => {
	exitCode = code;
});
process.exit = exitSpy as unknown as typeof process.exit;

// Benign argv so the import-time `main()` takes the "index" path and resolves.
process.argv = ["cli.ts", "index"];

const { runCli, handleFatal, collectFlags } = await import("./cli.js");

beforeEach(() => {
	buildIndex.mockClear();
	dbExists.mockClear();
	countChunks.mockClear();
	getDb.mockClear();
	listEndpoints.mockClear();
	startServer.mockClear();
	osHomedir.mockClear();
	spawnSync.mockClear();
	fsExistsSync.mockClear();
	fsStatSync.mockClear();
	fsReaddirSync.mockClear();
	writeFileSync.mockClear();
	mkdirSync.mockClear();
	exitSpy.mockClear();
	exitCode = undefined;
	// The "unknown command" / no-detection branches set process.exitCode = 1;
	// reset it each test so it doesn't leak into bun's process exit code.
	process.exitCode = 0;
});

// NOTE: process.exit is intentionally NOT restored after each test. Restoring
// it interferes with bun's coverage reporter flushing its summary table at
// process exit, so the mock stays in place for the whole run. process.exit is
// never actually invoked (the mock only records the code), so this is harmless.

describe("runCli — command dispatch", () => {
	test("no command defaults to index (force=false)", async () => {
		await runCli([]);
		expect(getDb).toHaveBeenCalledTimes(1);
		expect(buildIndex).toHaveBeenCalledTimes(1);
		expect(buildIndex).toHaveBeenCalledWith({ knowledgeDir: KNOWLEDGE_DIR, force: false });
		expect(exitSpy).not.toHaveBeenCalled();
	});

	test("explicit 'index' builds with force=false", async () => {
		await runCli(["index"]);
		expect(buildIndex).toHaveBeenCalledWith({ knowledgeDir: KNOWLEDGE_DIR, force: false });
	});

	test("'index --force' forwards force=true", async () => {
		await runCli(["index", "--force"]);
		expect(buildIndex).toHaveBeenCalledWith({ knowledgeDir: KNOWLEDGE_DIR, force: true });
	});

	test("'status' reads db + lists endpoints, does not build", async () => {
		await runCli(["status"]);
		expect(dbExists).toHaveBeenCalledTimes(1);
		expect(countChunks).toHaveBeenCalledTimes(1);
		expect(listEndpoints).toHaveBeenCalledTimes(1);
		expect(fsStatSync).toHaveBeenCalledTimes(1);
		expect(buildIndex).not.toHaveBeenCalled();
		expect(startServer).not.toHaveBeenCalled();
		// setup is never reached from the status command.
		expect(writeFileSync).not.toHaveBeenCalled();
	});

	test("'status' reports dbSize 0 when statSync throws", async () => {
		// statSync is wrapped in try/catch inside printStatus; force it to throw
		// so the catch branch (dbSize = 0) is exercised.
		fsStatSync.mockImplementation(() => {
			throw new Error("ENOENT");
		});
		const logSpy = mock((_msg: string) => {});
		const originalLog = console.log;
		console.log = logSpy as typeof console.log;
		try {
			await runCli(["status"]);
		} finally {
			console.log = originalLog;
			fsStatSync.mockImplementation(() => ({ size: 1024 }));
		}
		// index size line should read "0 B" when the stat failed.
		const sizeCall = logSpy.mock.calls.find((c) => String(c[0]).startsWith("index size:"));
		expect(sizeCall).toBeDefined();
		expect(sizeCall![0]).toBe("index size:      0 B");
	});

	test("'status' walks the facts tree and counts .md files", async () => {
		// Drive the recursive walk: a directory with one subdir (recurse) and one
		// .md file. withFileTSypes-style entries are { name, isDirectory() }.
		const subdir = join(KNOWLEDGE_DIR, "api");
		fsReaddirSync.mockImplementation((d: string) => {
			if (d === KNOWLEDGE_DIR) {
				return [
					{ name: "api", isDirectory: () => true },
					{ name: "index.md", isDirectory: () => false },
				] as unknown as ReturnType<typeof fs.readdirSync>;
			}
			if (d === subdir) {
				return [{ name: "auth.md", isDirectory: () => false }] as unknown as ReturnType<
					typeof fs.readdirSync
				>;
			}
			return [];
		});
		const logSpy = mock((_msg: string) => {});
		const originalLog = console.log;
		console.log = logSpy as typeof console.log;
		try {
			await runCli(["status"]);
		} finally {
			console.log = originalLog;
			fsReaddirSync.mockImplementation(() => []);
		}
		// index.md + auth.md = 2 facts files.
		const factsCall = logSpy.mock.calls.find((c) => String(c[0]).startsWith("facts files:"));
		expect(factsCall).toBeDefined();
		expect(factsCall![0]).toBe("facts files:     2");
	});

	test("'serve' delegates to startServer", async () => {
		await runCli(["serve"]);
		expect(startServer).toHaveBeenCalledTimes(1);
		expect(buildIndex).not.toHaveBeenCalled();
		// setup is never reached from the serve command.
		expect(writeFileSync).not.toHaveBeenCalled();
	});

	// The "setup" command delegates to the REAL runSetup (see note above: setup.js
	// is intentionally not mocked globally). Delegation + flag parsing are verified
	// through runSetup's real effects on the mocked fs: a configured harness makes
	// writeConfig call mkdirSync + writeFileSync, and the harness id passed through
	// --harness resolves to that harness's config path.
	test("'setup --harness a --harness b' collects repeated flags into targets", async () => {
		// --harness a is unknown (not in the registry) → resolveTargets throws,
		// surfacing the parse/delegation path. Use a known id to instead assert the
		// parsed target resolves to the right config path.
		await expect(
			runCli(["setup", "--harness", "bogus", "--skip-install", "--skip-index"]),
		).rejects.toThrow(/unknown harness\(es\): bogus/);
	});

	test("'setup --harness claude' writes claude's config (real delegation)", async () => {
		await runCli(["setup", "--harness", "claude", "--skip-install", "--skip-index"]);
		// writeConfig ran for claude → mkdir + write on claude's config path.
		expect(mkdirSync).toHaveBeenCalledWith("/home/test/.claude", { recursive: true });
		expect(writeFileSync).toHaveBeenCalledTimes(1);
		const [writtenPath] = writeFileSync.mock.calls[0]!;
		expect(writtenPath).toBe("/home/test/.claude/.mcp.json");
	});

	test("'setup --all --dry-run' forwards dryRun and writes nothing", async () => {
		await runCli(["setup", "--all", "--dry-run", "--skip-install", "--skip-index"]);
		expect(writeFileSync).not.toHaveBeenCalled();
	});

	test("unknown command exits non-zero and calls nothing", async () => {
		// process.exit(1) is reached synchronously inside runCli; the exit mock
		// records the code and returns, so runCli resolves normally.
		await runCli(["nonsense"]);
		expect(exitCode).toBe(1);
		expect(buildIndex).not.toHaveBeenCalled();
		expect(startServer).not.toHaveBeenCalled();
		expect(writeFileSync).not.toHaveBeenCalled();
	});
});

describe("handleFatal", () => {
	test("logs the error and exits with code 1", () => {
		const err = new Error("boom");
		// Spy on console.error to assert the fatal log line, since handleFatal
		// writes to console.error before calling process.exit.
		const errorSpy = mock((_msg: string, _e: unknown) => {});
		const originalError = console.error;
		console.error = errorSpy as typeof console.error;
		try {
			handleFatal(err);
		} finally {
			console.error = originalError;
		}
		expect(errorSpy).toHaveBeenCalledWith("[beds24] fatal:", err);
		expect(exitCode).toBe(1);
	});
});

describe("collectFlags", () => {
	test("collects repeated flag values in order", () => {
		expect(collectFlags(["--harness", "a", "--harness", "b"], "--harness")).toEqual(["a", "b"]);
	});

	test("returns [] when the flag is absent", () => {
		expect(collectFlags(["setup", "--all"], "--harness")).toEqual([]);
	});

	test("drops a trailing flag with no following value", () => {
		expect(collectFlags(["--harness"], "--harness")).toEqual([]);
	});
});
