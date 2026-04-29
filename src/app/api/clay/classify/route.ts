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

    const result = await classifyIntent(message, {
      role: role || 'operator',
      tier: tier || 'standard',
      recentComponents: (recentComponents || []) as ComponentType[],
      agencyId: agencyId || undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[clay/classify] Error:', error)
    return NextResponse.json(
      { suggestedComponents: [], componentData: {}, renderStrategy: 'lead-with-text', intents: ['general'] },
    )
  }
}
