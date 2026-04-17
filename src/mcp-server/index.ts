/**
 * Prompt 43 — MCP stdio server entrypoint.
 *
 * Register as a Claude Code MCP server:
 *   claude mcp add trendzo -- npx tsx C:/Projects/CleanCopy/src/mcp-server/index.ts
 * With environment variables:
 *   TRENDZO_MCP_KEY=mcp_live_...
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_KEY=...
 *
 * This file ONLY wires the factory to StdioServerTransport and runs.
 * All server construction lives in ./build-server.ts so verification
 * scripts can import the factory without starting stdio.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { resolve } from 'path'
import { config } from 'dotenv'

// Load .env.local so the server can run standalone under `tsx`.
try {
  config({ path: resolve(process.cwd(), '.env.local') })
} catch {
  // ignore — assume env is already set by the parent
}

import { buildServer } from './build-server'

async function main() {
  const { server } = await buildServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[mcp] fatal:', err)
  process.exit(1)
})
