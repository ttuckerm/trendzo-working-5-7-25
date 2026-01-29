import fetch from 'node-fetch'

const BASE = process.env.DEMO_BASE_URL || 'http://localhost:3002'

async function main(){
  try {
    const r = await fetch(`${BASE}/api/dev/reset`, { method: 'POST' })
    const j = await r.json().catch(()=> ({}))
    if (!r.ok) throw new Error(j?.error || j?.message || `HTTP ${r.status}`)
    console.log('Dev store reset:', j)
  } catch (e: any) {
    console.error('Reset failed:', String(e?.message || e))
    process.exit(1)
  }
}

main()


