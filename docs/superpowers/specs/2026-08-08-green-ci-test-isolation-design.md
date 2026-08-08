# Green CI Through Test Isolation

**Date:** 2026-08-08
**Status:** Approved
**Scope:** Fix 59 test-isolation failures so `bun test` passes; CI gate = `typecheck` + tests passing.

---

## Problem

The repo has 441 tests across 24 files. Running `bun test` as a single invocation (as CI does) produces **59 failures**. Every one of those files passes in isolation. The failures are caused by **`mock.module()` registrations leaking across test files** within a single Bun process — not by broken source code or broken test assertions.

CI (`.github/workflows/ci.yml`) runs on every push/PR and gates on `bun run typecheck && bun test`. Typecheck is clean. The 59 failures make CI permanently red, so the team cannot trust the gate.

## Current CI gate

```yaml
- run: bun run typecheck   # passes
- run: bun test             # 59 failures
```

No coverage gate (coverage tracked via `bun test --coverage` for visibility only, per TEST-HARNESS.md).

## Root cause

Bun's `mock.module()` is process-global. Server test files (e.g. `cli.test.ts` line 58) register:

```ts
const readFileSync = mock((_p: string, _enc: string) => "");
mock.module("node:fs", () => ({ ...fsMock, default: fsMock }));
```

This mock returns `""` for every `readFileSync` call. When `schema.ts` subsequently calls `readFileSync(yamlPath, "utf8")`, it gets empty content back. `yaml.load("")` returns `undefined`, and `doc.paths` throws `TypeError: undefined is not an object (evaluating 'doc.paths')`.

The same leakage affects: schema cache state (because the real file never loaded), `import.meta.dir` overrides, env vars (`BEDS24_*`), and `globalThis.fetch`.

All 59 failures are in the `sdk` and `knowledge` packages — the server files that register the leaking mocks run first (alphabetically) and the SDK/knowledge files that consume the mocked modules run after.

## Design: Bun `--isolate` + defensive cleanup

**The definitive fix is `bun test --isolate`**, which runs each test file in a fresh global object. Leaked `mock.module` registrations from one file cannot affect another.

### Primary change

1. **CI workflow (`ci.yml`):** `bun test` → `bun test --isolate`
2. **Release workflow (`release.yml`):** `bun test` → `bun test --isolate`
3. **Root `package.json` test script:** `"bun test"` → `"bun test --isolate"`

### Defensive cleanup (also applied)

Per-file env-var save/restore makes each test file self-contained and resilient to ordering changes. Not the root-cause fix, but good practice:

| File | Change |
|------|--------|
| `packages/sdk/src/schema/schema.test.ts` | `beforeEach`/`afterEach`: `__resetSchemaIndex()` + `BEDS24_SPEC_DIR` restore |
| `packages/sdk/src/schema/validate.test.ts` | `beforeEach`/`afterEach`: `__resetSchemaIndex()` + `BEDS24_SPEC_DIR` restore |
| `packages/sdk/tests/client.test.ts` | `afterEach`: `globalThis.fetch` restore |
| `packages/knowledge/src/paths.test.ts` | `beforeEach`/`afterEach`: `__setBaseDirForTests(undefined)` + `BEDS24_KNOWLEDGE_DIR` restore |
| `packages/knowledge/src/embed-ollama.test.ts` | Save/restore `BEDS24_EMBEDDER`, `BEDS24_DB_PATH`, `BEDS24_KNOWLEDGE_DIR` |
| `packages/knowledge/src/indexer.test.ts` | Save/restore `BEDS24_DB_PATH`, `BEDS24_EMBEDDER`, `BEDS24_KNOWLEDGE_DIR` |
| `packages/knowledge/src/db.test.ts` | Save/restore `BEDS24_DB_PATH`, `BEDS24_EMBEDDER` |

## What this does NOT change

- No source code changes (all fixes are in test files + CI config).
- No new tests for untested files (scope is strictly: make existing suite pass).
- No coverage gate in CI (coverage tracked but not blocking).
- No pre-push hook (CI is the gate; local hook is a separate concern).

## Verification

1. `bun run test` (which now runs `bun test --isolate`) → 441 pass, 0 fail.
2. `bun run typecheck` → clean.
3. CI workflow (`push` + `pull_request`) → green.

## Out of scope

- Adding tests for untested source files (`client.ts`, `embed.ts`, `server.ts`, `setup.ts`, `paths.ts` SDK).
- Enforcing 100% coverage in CI.
- Pre-push git hooks.
