import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(_req: NextRequest){
  try{
    const ROOT = path.join(process.cwd(), 'fixtures', 'scale')
    try{ if (!fs.existsSync(ROOT)) fs.mkdirSync(ROOT, { recursive: true }) } catch {}
    for (const n of ['creators.ndjson','plans.ndjson','sessions.ndjson','runs.ndjson']){
      try{ fs.writeFileSync(path.join(ROOT, n), '') } catch {}
    }
    return NextResponse.json({ ok:true })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) })
  }
}


