# Green CI Through Test Isolation

**Date:** 2026-08-08
**Status:** Approved
**Scope:** Fix 59 test-isolation failures so `bun test` passes as a single run; CI gate stays `typecheck` + tests passing.

---

## Problem

The repo has 441 tests across 24 files. Running `bun test` as a single invocation (as CI does) produces **59 failures**. Every one of those files passes in isolation. The failures are caused by **module-level state leaking across test files** within a single Bun process — not by broken source code or broken test assertions.

CI (`.github/workflows/ci.yml`) runs on every push/PR and gates on `bun run typecheck && bun test`. Typecheck is clean. The 59 failures make CI permanently red, so the team cannot trust the gate.

## Current CI gate

```yaml
- run: bun run typecheck   # passes
- run: bun test             # 59 failures
```

No coverage gate (coverage tracked via `bun test --coverage` for visibility only, per TEST-HARNESS.md).

## Root cause analysis

All 59 failures are in the `sdk` and `knowledge` packages (zero server test failures). Running `bun test` and inspecting each failure's stack trace reveals four categories of cross-file state leak.

### Category 1: Schema cache corruption (~30 tests)

**Symptoms:**
- `TypeError: undefined is not an object (evaluating 'doc.paths')` at `schema.ts:54`
- `listEndpoints()` throws inside `new Beds24Client()` constructor (`client.test.ts`)
- `validate.test.ts` failures: validator returns `valid:true` for invalid input, errors have wrong shape, caching tests see stale state

**Mechanism:** `schema.ts` keeps a module-level `indexCache = new Map<string, SchemaIndex>()`. `schema.test.ts` calls `__resetSchemaIndex()` in `afterEach`, which clears the cache. The crafted-spec tests populate an index keyed by `CRAFTED_SPEC_PATH` (a temp yaml that lacks `paths` in some variants). When `client.test.ts` runs later and constructs `new Beds24Client`, the constructor calls `listEndpoints()` → `getIndex(defaultSpecDir())`. Because the cache was reset mid-suite, the fresh load hits a `SchemaIndex` whose `load()` returns a corrupted/empty doc (the CRAFTED_SPEC was last to touch the shared `indexCache` Map, and a cold reload against the real yaml path resolves to a stale `SchemaIndex` instance).

The `validate.test.ts` also lacks `__resetSchemaIndex()` in its `afterEach`, so cached `Beds24Validator` ajv schemas from `schema.test.ts` leak.

### Category 2: Env var leakage (~10 tests)

**Symptoms:**
- `paths.test.ts` → `defaultKnowledgeDir` resolves to wrong directory
- `embed-ollama.test.ts` → wrong embedder selected, wrong dim, e2e chain indexes 0 files
- `indexer.test.ts` → builds index against wrong corpus (0 files, 0 chunks)

**Mechanism:** Tests set `process.env.BEDS24_EMBEDDER`, `BEDS24_KNOWLEDGE_DIR`, `BEDS24_DB_PATH`, `BEDS24_SPEC_DIR` to control their behavior, but never save/restore the original values. Env vars persist across all test files in the process. A test that sets `BEDS24_EMBEDDER=ollama-bge-m3` or `BEDS24_KNOWLEDGE_DIR=/tmp/...` will cause a later test to inherit it, resolving the wrong corpus or embedder.

### Category 3: `import.meta.dir` override leak (~3 tests)

**Symptoms:**
- `moduleDir > falls back to deriving a dir from import.meta.url when dir is empty` fails
- `packageRoot > walks up to the directory holding package.json + knowledge/` fails
- `defaultKnowledgeDir > points at the shipped knowledge corpus by default` fails

**Mechanism:** `knowledge/src/paths.ts` exports `__setBaseDirForTests(dir)` — a test-only escape hatch that sets a module-level `baseDirOverride`. The `paths.test.ts` calls `__setBaseDirForTests("")` to exercise the fallback branch but never resets it to `undefined`. Every subsequent test in the process sees `baseDirOverride = ""` and takes the wrong code path.

### Category 4: `globalThis.fetch` not restored (~2 tests)

**Symptoms:**
- `Beds24Client auth > mints a token lazily` — `mockFetch.calls()` returns wrong data
- `Beds24Client request validation > rejects an invalid request body` — `retryable` is `true` instead of `false`

**Mechanism:** `client.test.ts` sets `globalThis.fetch = mockFetch.fn` in `beforeEach`. The `network errors` test replaces fetch with a throwing stub. If a later test in the same file doesn't get a fresh mock (because the stub leaked past the `beforeEach` boundary), the mock's response queue is stale. More critically, the `validateRequest()` path creates a `Beds24Validator` which may use a cached, corrupted schema from Category 1, causing the validator to NOT reject invalid input (so the client proceeds to fetch, changing the error shape).

## Design: Defensive cleanup per test file

**Principle:** every test file owns its cleanup. No file assumes it's the only one in the process. Each `afterEach` restores the global state it touched to its pre-test value.

### Cleanup helpers

Add a small shared helper (or inline pattern) for env-var save/restore:

```ts
// Pattern used in every test file that touches process.env
const originalEnv = { ...process.env };
afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
});
```

Or more targeted (preferred — only touch what you use):

```ts
const original = process.env.BEDS24_EMBEDDER;
afterEach(() => {
  if (original === undefined) delete process.env.BEDS24_EMBEDDER;
  else process.env.BEDS24_EMBEDDER = original;
});
```

### Per-file changes

#### `packages/sdk/src/schema/schema.test.ts`
- **Already has:** `afterEach(() => { __resetSchemaIndex() })`
- **Add:** Save/restore `process.env.BENDS24_SPEC_DIR`

#### `packages/sdk/src/schema/validate.test.ts`
- **Add:** `afterEach(() => { __resetSchemaIndex() })` (currently missing)
- **Add:** Save/restore `process.env.BEDS24_SPEC_DIR`

#### `packages/sdk/tests/client.test.ts`
- **Already has:** `beforeEach` that reinstalls `globalThis.fetch = mockFetch.fn`
- **Add:** Module-level `const originalFetch = globalThis.fetch` and `afterEach(() => { globalThis.fetch = originalFetch })` so a throwing-stub fetch from one test never leaks into the next file.

#### `packages/knowledge/src/paths.test.ts`
- **Add:** `afterEach(() => { __setBaseDirForTests(undefined) })` to clear the override.

#### `packages/knowledge/src/embed-ollama.test.ts`
- **Add:** Save/restore `process.env.BEDS24_EMBEDDER`, `BEDS24_KNOWLEDGE_DIR`, `BEDS24_DB_PATH`.

#### `packages/knowledge/src/indexer.test.ts`
- **Already has:** `rmSync` temp-dir cleanup and `__resetDbForTests()` per test.
- **Add:** Save/restore `process.env.BEDS24_EMBEDDER`, `BEDS24_KNOWLEDGE_DIR`, `BEDS24_DB_PATH`.

#### `packages/knowledge/src/db.test.ts`
- **Add:** Save/restore `process.env.BEDS24_DB_PATH`.

## What this does NOT change

- No source code changes (all fixes are in test files).
- No new tests for untested files (scope is strictly: make existing suite pass).
- No coverage gate in CI (coverage tracked but not blocking).
- No pre-push hook (CI is the gate; local hook is a separate concern).
- No process-isolation configuration (fix the bugs, don't mask them).

## Verification

1. `bun test` → 441 pass, 0 fail (full single-process run).
2. `bun run typecheck` → clean.
3. CI workflow (`push` + `pull_request`) → green.

## Out of scope

- Adding tests for untested source files (`client.ts`, `embed.ts`, `server.ts`, `setup.ts`, `paths.ts` SDK).
- Enforcing 100% coverage in CI.
- Process-level test isolation (`--isolated-modules` or similar).
- Pre-push git hooks.
