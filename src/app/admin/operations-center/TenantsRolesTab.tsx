"use client";
import { useEffect, useState } from 'react'

type Tenant = { id: string; name: string }
type ApiKey = { id: string; name: string; last_used_at?: string | null; revoked_at?: string | null }

export default function TenantsRolesTab() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  useEffect(() => { loadTenants() }, [])
  async function loadTenants() {
    const res = await fetch('/api/admin/tenants')
    const data = await res.json()
    setTenants(data.tenants || [])
  }
  async function loadKeys(tenantId: string) {
    const res = await fetch(`/api/admin/tenants/${tenantId}/keys`)
    const data = await res.json()
    setApiKeys(data.keys || [])
  }
  async function createKey() {
    if (!selectedTenant) return
    await fetch(`/api/admin/tenants/${selectedTenant}/keys`, { method: 'POST' })
    await loadKeys(selectedTenant)
  }
  async function revokeKey(id: string) {
    if (!selectedTenant) return
    await fetch(`/api/admin/tenants/${selectedTenant}/keys/${id}`, { method: 'DELETE' })
    await loadKeys(selectedTenant)
  }
  return (
    <div>
      <h3>Tenants & Roles</h3>
      <div data-testid='tenants-table'>
        {tenants.map(t => (
          <button key={t.id} onClick={() => { setSelectedTenant(t.id); loadKeys(t.id) }} style={{ display: 'block', margin: '4px 0' }}>{t.name}</button>
        ))}
      </div>
      {selectedTenant && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h4>API Keys</h4>
            <button onClick={createKey}>Create</button>
          </div>
          <div data-testid='apikeys-table'>
            {apiKeys.map(k => (
              <div key={k.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ width: 240 }}>{k.name}</div>
                <div>last used: {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : '—'}</div>
                <button onClick={() => revokeKey(k.id)} disabled={!!k.revoked_at}>Revoke</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


