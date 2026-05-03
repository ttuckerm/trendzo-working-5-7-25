import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserAgencyId } from '@/lib/auth/agency-utils'
import { ComponentType } from '@/lib/clay/component-registry'
import { fetchComponentData } from '@/lib/clay/component-data-fetcher'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    // Authenticate
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

    const { types, creatorId, briefId } = await req.json() as {
      types: string[]
      creatorId?: string
      briefId?: string
    }

    if (!types || !Array.isArray(types) || types.length === 0) {
      return NextResponse.json({ error: 'types array required' }, { status: 400 })
    }

    const agencyId = await getUserAgencyId(userId)
    const today = new Date().toISOString().split('T')[0]

    const results: Record<string, unknown> = {}

    await Promise.all(
      types.map(async (type) => {
        const componentType = type as ComponentType
        const data = await fetchComponentData(componentType, {
          agencyId: agencyId || undefined,
          creatorId,
          briefId,
          date: today,
        })
        if (data) {
          results[type] = data
        }
      })
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error('[clay/component-data] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
