import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { commonRateLimiters } from '@/lib/security/rate-limiter'
import { requireRole, UserRole } from '@/lib/security/auth-middleware'

function precisionAtK(yTrue: number[], yScore: number[], k: number) {
  const idx = yScore.map((s,i)=>[s,i]).sort((a,b)=>b[0]-a[0]).slice(0,k).map(x=>x[1])
  const hits = idx.reduce((acc,i)=> acc + (yTrue[i]===1 ? 1 : 0), 0)
  return hits / Math.max(1, Math.min(k, yTrue.length))
}
function expectedCalibrationError(yTrue: number[], yProb: number[], bins = 10) {
  const bucket = Array.from({length: bins},()=>({n:0, p:0, y:0}))
  yProb.forEach((p,i)=>{ const b = Math.min(bins-1, Math.floor(p*bins)); const s=bucket[b] as any; s.n++; s.p+=p; s.y+=yTrue[i] })
  let ece=0,total=0; bucket.forEach(b=>{ if (b.n>0){ const ap=b.p/b.n, ay=b.y/b.n; ece += b.n*Math.abs(ap-ay); total+=b.n } });
  return total? ece/total : 0
}

export async function GET(req: NextRequest) {
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const limited = await commonRateLimiters.admin(req)
  if (limited) return limited
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const since30 = new Date(Date.now()-30*24*3600*1000).toISOString()
  try {
    const { data } = await db
      .from('prediction_validation')
      .select('platform,niche,predicted_viral_probability,label_viral,heated_flag,created_at')
      .gte('created_at', since30)
      .limit(100000)
    const rows = (data||[]).filter((r:any)=> !r.heated_flag && typeof r.predicted_viral_probability === 'number' && typeof r.label_viral === 'boolean')
    const groups = new Map<string, any[]>()
    for (const r of rows) {
      const key = `${r.platform||'tiktok'}|${r.niche||'general'}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(r)
    }
    const out: any[] = []
    for (const [key, arr] of groups.entries()) {
      const y = arr.map((r:any)=> r.label_viral ? 1 : 0)
      const p = arr.map((r:any)=> Number(r.predicted_viral_probability))
      // AUROC via Mann–Whitney
      const pos = p.filter((_:any,i:number)=>y[i]===1), neg = p.filter((_:any,i:number)=>y[i]===0)
      let conc=0, pairs=pos.length*neg.length; pos.forEach((pv:any)=>neg.forEach((nv:any)=>{ if (pv>nv) conc++; else if (pv===nv) conc+=0.5; }))
      const auroc = pairs ? conc/pairs : 0.5
      const plat = key.split('|')[0], niche = key.split('|')[1]
      out.push({ platform: plat, niche, n: arr.length, auroc, precision_at_100: precisionAtK(y,p,100), ece: expectedCalibrationError(y,p,10) })
    }
    return NextResponse.json({ rows: out.sort((a,b)=> b.n-a.n) })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message||'error' }, { status: 500 })
  }
}


