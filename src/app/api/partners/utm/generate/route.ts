import { NextRequest, NextResponse } from 'next/server'

function signRef(code: string, url: string): string {
  const src = `${code}:${url}`
  let h = 2166136261
  for (let i = 0; i < src.length; i++) { h ^= src.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24) }
  return (h>>>0).toString(16)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('affiliate_code') || ''
  const campaign = searchParams.get('campaign') || 'partner'
  const base = searchParams.get('base') || `${process.env.NEXT_PUBLIC_BASE_URL || ''}`
  const url = `${base}/?utm_source=${encodeURIComponent(code)}&utm_medium=partner&utm_campaign=${encodeURIComponent(campaign)}`
  const signature = signRef(code, url)
  return NextResponse.json({ url, referral: { code, signature } })
}



