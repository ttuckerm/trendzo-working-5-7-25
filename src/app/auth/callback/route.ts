import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Ensure a profiles row exists for the authenticated user.
 * Uses service role to bypass RLS.
 *
 * The DB trigger (handle_new_user) creates the row with role='creator' on
 * auth.users INSERT. This function:
 *   1. Inserts if somehow missing (ON CONFLICT DO NOTHING).
 *   2. If the email matches NEXT_PUBLIC_ADMIN_EMAIL, explicitly UPDATEs
 *      the role to 'chairman' — the trigger always writes 'creator', so
 *      we must overwrite it.
 */
async function ensureProfile(userId: string, email: string | undefined) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) return

  const adminClient = createClient(url, serviceKey)

  // Step 1: Insert if missing (trigger may have already created the row)
  const { error: insertError } = await adminClient
    .from('profiles')
    .upsert(
      {
        id: userId,
        role: 'creator',
        email: email || null,
        display_name: email?.split('@')[0] || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {},
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )

  if (insertError) {
    console.error('[auth callback] Profile insert error:', insertError)
  }

  // Step 2: If chairman email, upgrade role (separate UPDATE so it always applies)
  const chairmanEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (chairmanEmail && email === chairmanEmail) {
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ role: 'chairman', updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      console.error('[auth callback] Chairman role update error:', updateError)
    }
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    // Collect cookies to set on the response
    const cookiesToSet: { name: string; value: string; options: any }[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookies) {
            // Collect cookies to set on response later
            cookies.forEach(({ name, value, options }) => {
              cookiesToSet.push({ name, value, options })
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }

    // Ensure profile row exists with correct role
    if (data?.user) {
      await ensureProfile(data.user.id, data.user.email)
    }

    // Create response and set all collected cookies
    const response = NextResponse.redirect(new URL(next, requestUrl.origin))
    for (const { name, value, options } of cookiesToSet) {
      response.cookies.set(name, value, options)
    }
    return response
  }

  // No code provided, redirect to next URL
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
