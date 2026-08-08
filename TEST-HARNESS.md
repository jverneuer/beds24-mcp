# Test harness standard (FROZEN — all subagents follow this)

Every subagent writing tests MUST follow these conventions so the suite is
consistent, the coverage gate is enforceable, and tests compose across packages.

## Framework

- **Runner:** Bun's built-in test runner — `bun test` (zero config, discovers `*.test.ts`).
- **Imports:** `import { test, expect, describe, beforeEach, afterEach, mock } from "bun:test";`
- **Assertions:** `expect(...)` from `bun:test` (Jest-compatible API).
- **No Jest, no Vitest, no external coverage tool.**

## Coverage gate (the bar)

- Target: **100% statement / branch / function / line** on the files in scope.
- Measure: `bun test --coverage` (Bun prints a per-file coverage table).
- No task is "done" until its package's coverage on the touched files is 100%.
- When a subagent finishes, it runs the FULL package test suite and reports the
  coverage table in its completion message.

## File placement & naming

- Co-locate tests with sources: `<pkg>/src/<module>.test.ts` alongside `<module>.ts`.
- One test file per source file (e.g. `search.ts` → `search.test.ts`).
- Pure-logic files with no deps (frontmatter, chunk, rrfMerge, toFtsQuery) get
  focused unit tests. DB/embed/search tests go in their own files.

## Per-package mocking patterns

### `beds24-sdk-client` (packages/sdk)

- **HTTP:** mock `globalThis.fetch` (see `tests/client.test.ts` for the canonical
  `createMockFetch()` helper — a controllable queue of `Response`s + a calls log).
- **Ops:** use the `recordingClient()` pattern (see `tests/ops.test.ts`) — a fake
  `Beds24Client` whose `request()` records `{ endpoint, body }` instead of fetching.
- **Spec:** the SDK resolves its own `apiV2.yaml`. Tests call `getSchema`/`validate`
  with the real spec dir (`defaultSpecDir()`) for positive cases; pass a temp dir
  with a crafted YAML for negative/edge cases. Call `__resetSchemaIndex()` in
  `afterEach` to isolate cached state between tests.

### `beds24-knowledge` (packages/knowledge)

- **Embed (`@huggingface/transformers`):** mock the module. The real model is
  slow and network-bound — never hit it in tests. Mock `embed()` to return a
  deterministic 384-dim vector (e.g. a seeded pseudo-random unit vector), and
  assert callers handle batching / empty input / normalization. Use
  `mock.module("@huggingface/transformers", ...)` or mock the local `embed.ts`
  surface.
- **DB (libsql):** use an **in-memory** database (`:memory:`) so db/search tests
  are fast and isolated. Construct the store directly via the exported helpers
  (`getDb`, `insertChunk`, `countChunks`, …) rather than relying on the on-disk
  `DB_PATH`. Each test seeds only the rows it needs.
- **FS (indexer):** mock `node:fs` (`readdirSync`, `readFileSync`, `statSync`,
  `existsSync`) to present a synthetic corpus, OR point `buildIndex` at a tempdir
  the test writes real fixture files into. Prefer real tempdir fixtures — they
  exercise the real walk + chunk + embed + store path.
- **Pure helpers** (`toFtsQuery`, `rrfMerge`, `parseFrontmatter`, `chunkMarkdown`):
  no mocking needed — table-drive them with edge cases.

### `beds24-mcp-server` (packages/server)

- **Tool handlers:** the server imports named exports from `beds24-knowledge` and
  `beds24-sdk-client`. Mock those modules with `mock.module(...)` to isolate the
  handler logic (e.g. assert `beds24_validate` calls `Beds24Validator.create()`
  then `.validate()` and serializes the result). Drive the real `McpServer` via the
  MCP SDK's `Client` over an in-memory transport pair, OR invoke the registered
  handler functions directly.
- **CLI / setup:** mock `node:fs` for config-file reads/writes and assert the
  correct JSON is written to the right harness path. `setup.ts`'s pure helpers
  (e.g. `applyServerToText`) get focused unit tests.
- **startServer:** mock the knowledge `buildIndex`/`dbExists` and the stdio
  transport to assert the auto-index path and the connect call.

## TypeScript discipline (from TYPESCRIPT-RULES.md — non-negotiable)

- `strict: true` is on. No `any`. Use discriminated unions, exhaustive checks.
- `noUnusedLocals` / `noUnusedParameters` are on — tests must not have dead vars.
- `noUncheckedIndexedAccess` is on — index access is `| undefined`; handle it.
- Use `as const satisfies <GeneratedType>` to lock wire-format enums/aliases to
  the generated schemas so they can never drift.

## Verification checklist (subagent signs off with this)

1. `bun run typecheck` passes for the package.
2. `bun test` passes for the package — all green.
3. `bun test --coverage` shows 100% on the touched files (paste the table).
4. New/changed signatures are reflected in `CONTRACT.md`.
5. No cross-package boundary rule is violated (see CONTRACT.md §Boundary rules).
