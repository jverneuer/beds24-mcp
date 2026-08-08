---
"beds24-mcp-server": patch
---

Add three operational MCP tools that expose SDK surfaces previously unreachable from the server: `beds24_invoice_list` (GET /bookings/invoices via InvoicingOps), `beds24_channel_airbnb_push` (POST /channels/airbnb via ChannelActionsOps), and `beds24_stripe_setup` (POST /channels/stripe via StripeOps). Remove the dead `beds24.ts` facade (server.ts composes the workspace packages directly) and the stale `openapi-fetch` lockfile entry.
