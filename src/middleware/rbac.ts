export function isMemberPath(pathname: string): boolean {
  return pathname.startsWith('/membership')
}

export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin')
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

type Role = 'super_admin' | 'admin' | 'analyst' | 'viewer'

export interface TenantContext {
  tenantId: string | null
  role: Role | null
}

function getDb(): SupabaseClient | null {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  } catch {
    return null
  }
}

export async function getTenantContext(req: NextRequest): Promise<TenantContext> {
  const tenantHint = req.headers.get('x-tenant-id')
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    // Dev-mode permissive fallback without DB
    if (process.env.NODE_ENV !== 'production') return { tenantId: tenantHint || null, role: 'super_admin' }
    return { tenantId: tenantHint || null, role: null }
  }
  try {
    const db = getDb()
    if (!db) {
      if (process.env.NODE_ENV !== 'production') return { tenantId: tenantHint || null, role: 'super_admin' }
      return { tenantId: tenantHint || null, role: null }
    }
    const { data } = await db
      .from('user_role')
      .select('organization_id, role')
      .eq('user_id', userId)
      .limit(1)
    const row = (Array.isArray(data) && data.length ? (data as any)[0] : null) as any
    if (!row) return { tenantId: tenantHint || null, role: null }
    return { tenantId: String(row.organization_id), role: String(row.role) as Role }
  } catch {
    return { tenantId: tenantHint || null, role: null }
  }
}

export function requireTenantAccess(options?: { roles?: Role[]; allowSuperAdminBypass?: boolean }) {
  const roles = options?.roles || ['admin', 'analyst', 'viewer', 'super_admin']
  const bypass = options?.allowSuperAdminBypass !== false
  return async function guard(req: NextRequest): Promise<NextResponse | null> {
    const ctx = await getTenantContext(req)
    if (!ctx.role) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    if (bypass && ctx.role === 'super_admin') return null
    if (!roles.includes(ctx.role)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    return null
  }
}

export function scopeQueryToTenant<T extends { tenant_id?: string | null }>(rows: T[], tenantId: string | null, role: Role | null): T[] {
  if (!tenantId || role === 'super_admin') return rows
  return rows.filter(r => !('tenant_id' in r) || (r.tenant_id || null) === tenantId)
}


