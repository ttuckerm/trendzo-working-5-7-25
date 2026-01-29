import { NextRequest, NextResponse } from 'next/server'
import { promoteCandidate } from '@/lib/learning/store'

export async function POST(req?: NextRequest) {
  try {
    const url = new URL(req?.url || 'http://local')
    const rollback = url.searchParams.get('rollback')
    // Simple rollback strategy: if model_v{n-1}.json exists, copy to current
    if (rollback) {
      try {
        const fs = require('fs') as typeof import('fs')
        const path = require('path') as typeof import('path')
        const root = path.join(process.cwd(), 'fixtures', 'learning')
        const curPath = path.join(root, 'model_current.json')
        const files = fs.readdirSync(root).filter((f:string)=>/^model_v\d+\.json$/.test(f)).sort()
        if (files.length >= 2) {
          const prev = path.join(root, files[files.length-2])
          const data = JSON.parse(fs.readFileSync(prev,'utf8'))
          fs.writeFileSync(curPath, JSON.stringify(data, null, 2))
          return NextResponse.json(data)
        }
      } catch {}
    }
    const cur = await promoteCandidate()
    return NextResponse.json(cur)
  } catch (e:any) {
    return NextResponse.json({ error: 'promote_failed' })
  }
}


