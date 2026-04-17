import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserAgencyId } from '@/lib/auth/agency-utils'
import { classifyIntent } from '@/lib/clay/intent-classifier'
import { ComponentType } from '@/lib/clay/component-registry'

export const runtime = 'nodejs'

/**
 * POST /api/clay/classify
 * Takes a user message + context, returns intent classification + prefetched component data.
 * Called by the client alongside the chat request.
 */
export async function POST(req: Request) {
  // #region agent log
  const _t0 = Date.now(); const _dl = (loc: string, msg: string, data?: any) => fetch('http://127.0.0.1:7620/ingest/204e847a-b9ca-4f4d-8fbf-8ff6a93211a9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'082614'},body:JSON.stringify({sessionId:'082614',location:loc,message:msg,data:{...data,elapsed:Date.now()-_t0},timestamp:Date.now(),hypothesisId:'H-D'})}).catch(()=>{});
  await _dl('classify:start','classify POST started');
  // #endregion
  try {
    let userId: string
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      userId = 'dev-user'
    } else {
      const supabase = await createServerSupabaseClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
    }
    // #region agent log
    await _dl('classify:auth','auth done',{userId});
    // #endregion

    const { message, recentComponents, role, tier } = await req.json() as {
      message: string
      recentComponents?: string[]
      role?: string
      tier?: string
    }

    if (!message) {
      return NextResponse.json({ error: 'message required' }, { status: 400 })
    }

    const agencyId = await getUserAgencyId(userId)
    // #region agent log
    await _dl('classify:agency','getUserAgencyId done',{agencyId});
    // #endregion

    const result = await classifyIntent(message, {
      role: role || 'operator',
      tier: tier || 'standard',
      recentComponents: (recentComponents || []) as ComponentType[],
      agencyId: agencyId || undefined,
    })
    // #region agent log
    await _dl('classify:done','classifyIntent complete',{intents:result.intents,components:result.suggestedComponents});
    // #endregion

    return NextResponse.json(result)
  } catch (error) {
    console.error('[clay/classify] Error:', error)
    return NextResponse.json(
      { suggestedComponents: [], componentData: {}, renderStrategy: 'lead-with-text', intents: ['general'] },
    )
  }
}
