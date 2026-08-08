# Versioning & publishing

This monorepo versions and publishes each package **independently** with
[Changesets](https://github.com/changesets/changesets). There is no shared
version and no `v*.*.*` tag — each package (`beds24-sdk-client`,
`beds24-knowledge`, `beds24-mcp-server`) carries its own semver and is released
when its own changes go out.

## Making a change

Every PR that should bump a package ships a **changeset** — a markdown file in
`.changeset/` describing what changed and how. Generate one interactively:

```bash
bun changeset
```

It prompts you for the affected package(s) and the bump type (patch / minor /
major), then writes a file like `.changeset/bold-otters-cheer.md`:

```md
---
"@jverneuer/beds24-sdk-client": minor
---

Make SDK strictly typed against generated OpenAPI types
```

A maintenance PR with no user-facing change does not need a changeset.

## Releasing

The `release` workflow (`.github/workflows/release.yml`) runs on push to `main`:

1. `changeset action` — if any unpublished changesets remain, it opens a
   **Version Packages** PR that consumes them, bumps each package's version, and
   writes changelog entries.
2. Once that PR lands on `main` (no changesets left), the same action runs
   `changeset publish` and publishes **only the packages whose version advanced**
   to npm.

So publishing is just "merge the Version Packages PR"; CI handles the rest.

## Why this way

- **Independent versions.** A patch to the SDK no longer forces a bump (and a
  republish) of the server or knowledge packages.
- **Only what changed gets published.** `changeset publish` compares each
  package's version against the npm registry and skips up-to-date ones.
- **Workspace deps stay in sync.** The server declares `beds24-sdk-client` and
  `beds24-knowledge` as `workspace:*`. At publish time npm rewrites those to the
  concrete current version, and `updateInternalDependencies: "patch"` makes sure
  a dependency bump flows a patch to dependents.
