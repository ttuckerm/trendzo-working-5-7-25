import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Aggregate JSON report and provide a minimal PDF via simple HTML -> PDF (browser prints)
  const origin = new URL(req.url).origin
  const [status, modules, alerts] = await Promise.all([
    fetch(`${origin}/api/admin/pipeline/status`, { headers: req.headers as any }).then(r=> r.json()),
    fetch(`${origin}/api/admin/pipeline/modules`, { headers: req.headers as any }).then(r=> r.json()),
    fetch(`${origin}/api/admin/pipeline/alerts`, { headers: req.headers as any }).then(r=> r.json()),
  ])
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Daily Ops Report</title></head><body>
  <h1>Daily Ops Report</h1>
  <h2>Status</h2><pre>${escapeHtml(JSON.stringify(status, null, 2))}</pre>
  <h2>Modules</h2><pre>${escapeHtml(JSON.stringify(modules, null, 2))}</pre>
  <h2>Alerts</h2><pre>${escapeHtml(JSON.stringify(alerts, null, 2))}</pre>
  </body></html>`
  return new NextResponse(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })
}

function escapeHtml(s: string){ return s.replace(/[&<>]/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;'} as any)[c]) }


