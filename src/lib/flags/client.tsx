"use client"
import React, { createContext, useContext, useEffect, useState } from 'react'

const FlagContext = createContext<Record<string, boolean>>({})

export function FlagProvider({ userId, tenantId, plans, keys, children }:{ userId?:string; tenantId?:string; plans?:string[]; keys:string[]; children: React.ReactNode }){
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  useEffect(() => { (async () => {
    try {
      const res = await fetch('/api/flags', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ keys, userId, tenantId, plans: plans || [] }) 
      })
      if (!res.ok) {
        console.warn(`Flag API returned ${res.status}: ${res.statusText}`)
        setFlags({})
        return
      }
      const json = await res.json()
      setFlags(json || {})
    } catch (error) { 
      console.warn('Failed to fetch feature flags, using defaults:', error)
      setFlags({}) 
    }
  })() }, [userId, tenantId, JSON.stringify(plans||[]), JSON.stringify(keys||[])])
  return <FlagContext.Provider value={flags}>{children}</FlagContext.Provider>
}

export function useFlag(key: string){
  const map = useContext(FlagContext)
  return !!map[key]
}

export function FeatureGate({ feature, children }:{ feature: string; children: React.ReactNode }){
  return useFlag(feature) ? <>{children}</> : null
}


