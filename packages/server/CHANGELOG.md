# @jverneuer/beds24-mcp-server

## 1.2.0

### Minor Changes

- 659b3e1: Add the OPERATE surface to the MCP server: per-request `Beds24Client`-backed operational tools, workflow prompts, server instructions, and full tool/prompt/resource test coverage. Remove the dead `beds24.ts` facade — server.ts now composes the workspace packages directly.

  Operational tools (each takes an `auth` block of `refreshToken` | `inviteCode` | `token`, builds a per-request `Beds24Client`, and delegates to the matching SDK ops): `beds24_booking_get/create/cancel`, `beds24_booking_message_list/send`, `beds24_price_set_daily/get_calendar/set_fixed`, `beds24_availability_get`, `beds24_inventory_offers`, `beds24_property_list`, `beds24_account_list`, `beds24_channel_settings_get/configure`, `beds24_webhook_register`, `beds24_invoice_list`, `beds24_channel_airbnb_push`, `beds24_stripe_setup`.

  Prompts walking an LLM through the search → inspect → validate → operate flow: `beds24_prompt_create_booking`, `beds24_prompt_set_daily_prices`, `beds24_prompt_register_webhook`.

  Server instructions (`SERVER_INSTRUCTIONS`) surfaced at initialize time encode the search-first workflow so a connected model uses the cheaper inspect/validate tools before spending API credits.

  Extracted every tool/prompt/resource handler as a named exported function for direct unit testing (no MCP transport needed). Adds an integration harness (`integration-harness.ts`) that runs in isolation against the real SDK + knowledge packages with only `@huggingface/transformers` and `globalThis.fetch` mocked, driving the server over a linked in-memory MCP transport pair. Test coverage across the server package's tools, handlers, CLI, setup, instructions, ops, and resources.

### Patch Changes

- 674c95f: Give each workspace package its own `build` script that emits compiled `.js` + `.d.ts` to `dist/`, and point each manifest's `main`/`types`/`exports` at the compiled output. The root `build` now delegates to the three packages, and the release workflow's CLI smoke test points at `packages/server/dist/cli.mjs`. Packages are now independently buildable and publishable (the SDK change is in a separate changeset).
- Updated dependencies [674c95f]
- Updated dependencies [659b3e1]
- Updated dependencies [659b3e1]
- Updated dependencies [e50828f]
  - @jverneuer/beds24-knowledge@1.1.7
  - @jverneuer/beds24-sdk-client@1.2.0
