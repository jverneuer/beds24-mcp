---
"@jverneuer/beds24-knowledge": patch
---

Add focused test coverage for the knowledge package: pure helpers (`toFtsQuery`, `rrfMerge`, `parseFrontmatter`, `chunkMarkdown`), the in-memory DB path (`db.test.ts`), the embed module's batching/empty-input/normalization shape with a mocked `@huggingface/transformers`, and the indexer's walk → chunk → embed → store pipeline over a synthetic corpus. Also wires the package's own `bun test` script so the coverage gate (`bun test --coverage`) is runnable per-package. No behavioral change to the public surface.
