import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserAgencyId } from '@/lib/auth/agency-utils'
import MemoryClient from './MemoryClient'
export const dynamic = 'force-dynamic';

export default async function AgencyMemoryPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let agencyId: string | null = null
  if (user) {
    agencyId = await getUserAgencyId(user.id)
  }

  if (!user || !agencyId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080d' }}>
        <div className="text-center">
          <h1 className="font-display text-2xl text-[#e8e8f0] mb-2">No Agency Found</h1>
          <p className="text-sm text-[#8888a0]">Sign in with an account linked to an agency.</p>
        </div>
      </div>
    )
  }

  return <MemoryClient agencyId={agencyId} />
}
