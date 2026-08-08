---
"beds24-sdk-client": patch
"beds24-knowledge": patch
"beds24-mcp-server": patch
---

Documentation-only: rewrite the root README to reflect the current `packages/{sdk,knowledge,server}` workspace layout and add per-package READMEs (`packages/sdk/README.md`, `packages/knowledge/README.md`, `packages/server/README.md`). Add Changesets entries for the recent SDK ops additions, the knowledge test coverage, and the server's operational-tools/prompts/instructions surface. No source changes — npm publishes will pick up the latest substantive changesets.
