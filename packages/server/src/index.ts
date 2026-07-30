/**
 * Public surface of the `beds24-mcp-server` package.
 *
 * This package is the MCP host: it depends on `beds24-sdk-client` (typed API client,
 * schema introspection, validation) and `beds24-knowledge` (hybrid vector+FTS
 * search over the cited docs), and composes them into an MCP server + CLI. There
 * is no reusable logic of its own here — it wires the two workspace packages.
 *
 * ```
 * import { startServer } from "beds24-mcp-server";
 * await startServer();
 * ```
 */

export { startServer } from "./server.ts";
export { runSetup } from "./setup.ts";
export type { SetupOptions } from "./setup.ts";
