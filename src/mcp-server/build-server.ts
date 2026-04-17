/**
 * Prompt 43 — MCP server factory.
 *
 * Split from index.ts so tests and verification scripts can build a
 * server without spinning up the stdio transport. index.ts calls this
 * and wires in StdioServerTransport.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { TOOL_REGISTRY, type ToolName } from './schemas'
import { TOOL_HANDLERS } from './tools'
import { verifyApiKey, type McpAuthContext } from './auth'
import { checkRateLimit, logCall } from './rate-limit'

function makeDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    throw new Error(
      'MCP server missing env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are required',
    )
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

interface BuildArgs {
  rawKey?: string
  db?: SupabaseClient
}

function asToolResult(data: unknown, isError = false) {
  return {
    content: [
      {
        type: 'text' as const,
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
    isError,
  }
}

export async function buildServer(args: BuildArgs = {}) {
  const db = args.db ?? makeDb()
  const server = new McpServer({
    name: 'trendzo',
    version: '0.43.0',
  })

  let cachedAuth: McpAuthContext | null = null
  const rawKey = args.rawKey ?? process.env.TRENDZO_MCP_KEY ?? ''

  async function getAuth(): Promise<McpAuthContext> {
    if (cachedAuth) return cachedAuth
    const ctx = await verifyApiKey(db, rawKey)
    if (!ctx) {
      throw new Error(
        'UNAUTHORIZED — TRENDZO_MCP_KEY is missing, invalid, or revoked. ' +
          'Generate a key via `npx tsx scripts/mcp-create-key.ts`.',
      )
    }
    cachedAuth = ctx
    return ctx
  }

  for (const [name, schema] of Object.entries(TOOL_REGISTRY) as Array<[ToolName, any]>) {
    const description = (schema._def?.description as string | undefined) ?? name
    const handler = TOOL_HANDLERS[name]

    server.registerTool(
      name,
      {
        title: name,
        description,
        inputSchema: schema.shape,
      },
      async (input: unknown) => {
        const t0 = Date.now()
        let ctx: McpAuthContext | null = null
        let errorCode: string | null = null

        try {
          ctx = await getAuth()

          const rl = await checkRateLimit(db, ctx.agency_id, ctx.agency_tier)
          if (!rl.allowed) {
            errorCode = 'RATE_LIMIT_EXCEEDED'
            await logCall(db, {
              api_key_id: ctx.api_key_id,
              agency_id: ctx.agency_id,
              tool_name: name,
              duration_ms: Date.now() - t0,
              ok: false,
              error_code: errorCode,
            })
            return asToolResult(
              {
                error: errorCode,
                message: `Rate limit exceeded. Tier=${ctx.agency_tier} limit=${rl.limit}/24h used=${rl.used}. Reset at ${rl.reset_at}.`,
              },
              true,
            )
          }

          const parsed = (schema as any).parse(input)
          const result = await (handler as any)(db, ctx, parsed)

          await logCall(db, {
            api_key_id: ctx.api_key_id,
            agency_id: ctx.agency_id,
            tool_name: name,
            duration_ms: Date.now() - t0,
            ok: true,
          })
          return asToolResult(result)
        } catch (err) {
          errorCode = errorCode ?? (err instanceof Error ? err.message : 'UNKNOWN_ERROR')
          if (ctx) {
            await logCall(db, {
              api_key_id: ctx.api_key_id,
              agency_id: ctx.agency_id,
              tool_name: name,
              duration_ms: Date.now() - t0,
              ok: false,
              error_code: errorCode.slice(0, 200),
            })
          }
          return asToolResult(
            {
              error: errorCode,
              message: err instanceof Error ? err.message : String(err),
            },
            true,
          )
        }
      },
    )
  }

  return { server, db }
}
