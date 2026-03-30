'use client'
import React, { useEffect, useState } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r=>r.json())

export default function KeysAdminPage() {
  const { data, mutate } = useSWR('/api/admin/api-keys', fetcher)
  const [name, setName] = useState('')
  const [rateLimit, setRateLimit] = useState(120)

  const createKey = async () => {
    const res = await fetch('/api/admin/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, rateLimit }) })
    if (res.ok) { setName(''); mutate() }
  }
  const revoke = async (id: string) => {
    await fetch(`/api/admin/api-keys/${id}`, { method: 'DELETE' }); mutate()
  }

  if (!data) return <div className="p-6">Loading...</div>
  const rows = data?.data?.apiKeys || []
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">API Keys</h1>
      <div className="flex space-x-2 mb-4">
        <input className="border px-2 py-1" placeholder="Key name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border px-2 py-1 w-24" type="number" value={rateLimit} onChange={e=>setRateLimit(parseInt(e.target.value||'0'))} />
        <button className="bg-blue-600 text-white px-3 py-1" onClick={createKey} disabled={!name}>Create</button>
      </div>
      <table className="min-w-full text-sm">
        <thead><tr><th className="text-left">Name</th><th>Preview</th><th>Status</th><th>Rate</th><th>Last used</th><th></th></tr></thead>
        <tbody>
          {rows.map((k:any)=> (
            <tr key={k.id} className="border-b">
              <td>{k.name}</td>
              <td>{k.keyPreview}</td>
              <td>{k.status}</td>
              <td className="text-center">{k.rateLimit || '-'}</td>
              <td>{k.lastUsed ? new Date(k.lastUsed).toLocaleString() : '-'}</td>
              <td><button className="text-red-600" onClick={()=>revoke(k.id)}>Revoke</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


