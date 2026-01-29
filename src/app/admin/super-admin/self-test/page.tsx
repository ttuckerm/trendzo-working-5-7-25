'use client'
import React, { useEffect, useState } from 'react'

type Check = { name: string; ok: boolean; info?: any }

export default function SelfTestPage() {
  const [checks, setChecks] = useState<Check[]>([])
  const [ok, setOk] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/admin/self-test', { cache: 'no-store' })
        const json = await res.json()
        setChecks(json.checks || [])
        setOk(Boolean(json.ok))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">System Self-Test</h1>
      {loading ? (
        <div>Running checks…</div>
      ) : (
        <>
          <div className={`mb-6 font-semibold ${ok ? 'text-green-400' : 'text-red-400'}`}>
            {ok ? 'All checks passed. Safe to enable paid runs.' : 'Some checks failed. Do not enable paid runs.'}
          </div>
          <ul className="space-y-2">
            {checks.map((c) => (
              <li key={c.name} className="flex items-start gap-3">
                <span className={`mt-1 w-2 h-2 rounded-full ${c.ok ? 'bg-green-400' : 'bg-red-400'}`} />
                <div>
                  <div className="font-mono text-sm">{c.name}</div>
                  {c.info !== undefined && (
                    <pre className="text-xs opacity-70 mt-1 whitespace-pre-wrap">{JSON.stringify(c.info)}</pre>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}


