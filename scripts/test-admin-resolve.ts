import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

;(async () => {
  const { createClient } = await import('@supabase/supabase-js')
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
  console.log('URL:', SUPABASE_URL)
  console.log('Service key present:', !!SUPABASE_SERVICE_KEY)
  console.log('Admin email:', process.env.NEXT_PUBLIC_ADMIN_EMAIL)

  const sc = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data, error } = await sc.auth.admin.listUsers()
  if (error) {
    console.log('listUsers error:', error)
    return
  }
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  const adminUser = data?.users?.find((u: any) => u.email === adminEmail)
  console.log('Total users:', data?.users?.length)
  console.log('Admin user found:', adminUser ? { id: adminUser.id, email: adminUser.email } : 'NOT FOUND')

  if (adminUser?.id) {
    const { data: members } = await sc
      .from('agency_members')
      .select('agency_id')
      .eq('user_id', adminUser.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    console.log('agency_members lookup result:', members)
  }
})().catch(e => { console.error(e); process.exit(1) })
