# @jverneuer/beds24-knowledge

## 1.1.7

### Patch Changes

- 674c95f: Give each workspace package its own `build` script that emits compiled `.js` + `.d.ts` to `dist/`, and point each manifest's `main`/`types`/`exports` at the compiled output. The root `build` now delegates to the three packages, and the release workflow's CLI smoke test points at `packages/server/dist/cli.mjs`. Packages are now independently buildable and publishable (the SDK change is in a separate changeset).
- 659b3e1: Add focused test coverage for the knowledge package: pure helpers (`toFtsQuery`, `rrfMerge`, `parseFrontmatter`, `chunkMarkdown`), the in-memory DB path (`db.test.ts`), the embed module's batching/empty-input/normalization shape with a mocked `@huggingface/transformers`, and the indexer's walk → chunk → embed → store pipeline over a synthetic corpus. Also wires the package's own `bun test` script so the coverage gate (`bun test --coverage`) is runnable per-package. No behavioral change to the public surface.
