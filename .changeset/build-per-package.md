---
"beds24-knowledge": patch
"beds24-mcp-server": patch
---

Give each workspace package its own `build` script that emits compiled `.js` + `.d.ts` to `dist/`, and point each manifest's `main`/`types`/`exports` at the compiled output. The root `build` now delegates to the three packages, and the release workflow's CLI smoke test points at `packages/server/dist/cli.mjs`. Packages are now independently buildable and publishable (the SDK change is in a separate changeset).
