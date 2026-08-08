/**
 * End-to-end integration tests for the composed three-package stack.
 *
 * GOAL: prove that `beds24-mcp-server` composes the REAL `beds24-knowledge`
 * (search/index/embed) and `beds24-sdk-client` (schema/validate/ops) packages,
 * not mocks of them. Only the two external boundaries are mocked for
 * determinism: the embedding model (@huggingface/transformers) returns a
 * constant unit vector, and globalThis.fetch returns canned auth + API
 * responses. The server->sdk->knowledge module graph itself is real.
 *
 * WHY a subprocess: `bun test` runs test files in PARALLEL workers (default
 * --parallel = CPU count) that share the global mock.module registry, which is
 * keyed by resolved module identity and is last-registration-wins. The sibling
 * server-*.test.ts files mock the two workspace packages at top level; under
 * parallel those mocks clobber this file imports nondeterministically
 * (verified: the scenarios pass with --parallel=1 but flake under parallel
 * discovery). The fix endorsed by the task ("OR spawn the server process and
 * drive it over real stdio pipes") is to run the real scenarios in a CLEAN
 * child process immune to sibling mocks. integration-harness.ts holds the real
 * scenarios; this file spawns it and asserts green.
 */

import { test, expect, describe } from "bun:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const harnessPath = join(here, "integration-harness.ts");

function runHarness() {
	const res = spawnSync("bun", ["test", harnessPath], {
		encoding: "utf8",
		env: process.env,
		timeout: 60_000,
	});
	return {
		status: res.status,
		stdout: res.stdout ?? "",
		stderr: res.stderr ?? "",
		// bun test writes its per-test results to stderr; merge for matching.
		output: (res.stdout ?? "") + (res.stderr ?? ""),
	};
}

const run = runHarness();

describe("composed beds24-mcp stack (real knowledge + sdk)", () => {
	test("harness runs green in a clean subprocess (no sibling mocks)", () => {
		// bun test writes results to stderr; surface both streams.
		if (run.stdout) process.stdout.write(run.stdout);
		if (run.stderr) process.stderr.write(run.stderr);
		expect(run.status, "integration-harness.ts exited non-zero").toBe(0);
	});

	const names = [
		"beds24_search returns real hits from a real in-memory index",
		"SAFE_BUCKETS excludes deprecated; search_all includes it",
		"beds24_search_in_bucket filters to one bucket",
		"real knowledge library: search / searchAll / searchInBucket",
		"each step resolves and hands off through the real sdk",
		"server exposes instructions and the three prompts resolve with tool refs",
		"beds24://endpoints returns the real spec index; facts reads a real file",
		"a failing operational tool surfaces isError: true through the client",
		"a network-level failure is also flagged isError",
		"types from both workspace packages coexist and compose in one scope",
	];

	for (const name of names) {
		test(`scenario: ${name}`, () => {
			// Harness lines look like: (pass) describe > name [1.23ms]
			const lineMatch = new RegExp("\\(pass\\)[\\s\\S]*?" + name + "\\s*\\[", "m");
			const failMatch = new RegExp("\\(fail\\)[\\s\\S]*?" + name + "\\s*\\[", "m");
			const passed = lineMatch.test(run.output);
			const failed = failMatch.test(run.output);
			expect(passed && !failed, `scenario "${name}" did not pass.\n${run.output}`).toBe(true);
		});
	}
});
