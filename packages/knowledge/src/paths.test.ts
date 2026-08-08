/**
 * Unit tests for the path helpers (`paths.ts`).
 *
 * `defaultKnowledgeDir()` is the canonical corpus root; it honors the
 * `BEDS24_KNOWLEDGE_DIR` env override. `moduleDir()` / `packageRoot()` resolve
 * the package root from `import.meta`, with a filesystem fallback for non-Bun
 * runtimes. Each test restores the globals it mutates.
 */

import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ORIGINAL_BEDS24_KNOWLEDGE_DIR = process.env.BEDS24_KNOWLEDGE_DIR;

beforeEach(async () => {
	const p = await import("./paths.js");
	p.__setBaseDirForTests(undefined);
	delete process.env.BEDS24_KNOWLEDGE_DIR;
});

afterEach(async () => {
	const p = await import("./paths.js");
	p.__setBaseDirForTests(undefined);
	if (ORIGINAL_BEDS24_KNOWLEDGE_DIR === undefined) {
		delete process.env.BEDS24_KNOWLEDGE_DIR;
	} else {
		process.env.BEDS24_KNOWLEDGE_DIR = ORIGINAL_BEDS24_KNOWLEDGE_DIR;
	}
});

describe("defaultKnowledgeDir", () => {
	test("points at the shipped knowledge corpus by default", async () => {
		delete process.env.BEDS24_KNOWLEDGE_DIR;
		const { defaultKnowledgeDir } = await import("./paths.js");
		const dir = defaultKnowledgeDir();
		expect(typeof dir).toBe("string");
		expect(dir.length).toBeGreaterThan(0);
		// The repo ships the corpus, so the resolved path must exist on disk.
		expect(existsSync(dir)).toBe(true);
		// It should land on the `knowledge/` directory.
		expect(dir.endsWith(`${join("knowledge")}`)).toBe(true);
	});

	test("honors the BEDS24_KNOWLEDGE_DIR env override", async () => {
		const override = "/tmp/beds24-knowledge-custom";
		process.env.BEDS24_KNOWLEDGE_DIR = override;
		const { defaultKnowledgeDir } = await import("./paths.js");
		expect(defaultKnowledgeDir()).toBe(override);
	});
});

describe("moduleDir", () => {
	test("returns import.meta.dir when present (Bun)", async () => {
		const { moduleDir } = await import("./paths.js");
		// Under bun:test, import.meta.dir is a real directory string.
		const dir = moduleDir();
		expect(typeof dir).toBe("string");
		expect(dir.length).toBeGreaterThan(0);
		expect(existsSync(dir)).toBe(true);
	});

	test("falls back to deriving a dir from import.meta.url when dir is empty", async () => {
		// Simulate a non-Bun runtime with no import.meta.dir: an empty override
		// fails the `dir.length > 0` check, forcing the fileURLToPath fallback.
		const p = await import("./paths.js");
		p.__setBaseDirForTests("");
		const dir = p.moduleDir();
		expect(typeof dir).toBe("string");
		expect(dir.length).toBeGreaterThan(0);
		// The fallback derives a real path from import.meta.url, which exists.
		expect(existsSync(dir)).toBe(true);
	});
});

describe("packageRoot", () => {
	test("walks up to the directory holding package.json + knowledge/", async () => {
		const { packageRoot, defaultKnowledgeDir } = await import("./paths.js");
		const root = packageRoot();
		expect(existsSync(join(root, "package.json"))).toBe(true);
		expect(existsSync(join(root, "knowledge"))).toBe(true);
		// defaultKnowledgeDir's corpus lives directly under the package root.
		expect(defaultKnowledgeDir()).toBe(join(root, "knowledge"));
	});

	test("falls back to the parent of moduleDir when no ancestor qualifies", async () => {
		// Point at a path whose 8 ancestors hold neither package.json nor
		// knowledge/ → the loop exhausts and the fallback returns its parent.
		const p = await import("./paths.js");
		p.__setBaseDirForTests("/tmp");
		expect(p.packageRoot()).toBe("/");
	});
});
