'use client'
import React from 'react'

export default function LearningLabPage(){
  const [sum, setSum] = React.useState<any|null>(null)
  const [cur, setCur] = React.useState<any|null>(null)
  const [cand, setCand] = React.useState<any|null>(null)
  const [loading, setLoading] = React.useState(false)

  const load = async () => {
    const s = await fetch('/api/learning/summary', { cache: 'no-store' }).then(r=>r.json())
    setSum(s)
    const c = await fetch('/api/learning/model?which=current', { cache: 'no-store' }).then(r=>r.json()).catch(()=>null)
    setCur(c)
    const d = await fetch('/api/learning/model?which=candidate', { cache: 'no-store' }).then(r=>r.json()).catch(()=>null)
    setCand(d)
  }

  React.useEffect(()=>{ load() }, [])

  const runUpdate = async () => { setLoading(true); await fetch('/api/learning/update', { method:'POST' }); await load(); setLoading(false) }
  const promote = async () => { setLoading(true); await fetch('/api/learning/promote', { method:'POST' }); await load(); setLoading(false) }

  const delta = (a?:number,b?:number)=> a!=null&&b!=null? (a-b): undefined

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Learning Lab</h1>
        <div className="flex gap-2">
          <button disabled={loading} className="text-xs border rounded px-2 py-1" onClick={runUpdate}>{loading? 'Running…':'Run Update'}</button>
          {cand && <button disabled={loading} className="text-xs border rounded px-2 py-1" onClick={promote}>Promote Candidate</button>}
          {cur && <a className="text-xs border rounded px-2 py-1" href="/api/learning/model?which=current" download>Download Current JSON</a>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Current Model</div>
          <div className="text-xl font-semibold">v{cur?.version||sum?.currentVersion||1}</div>
          {cur && (
            <div className="mt-2 text-sm">
              <div>Threshold: {cur.threshold}</div>
              <div>Weights:</div>
              <table className="text-xs"><tbody>
                {Object.entries(cur.weights).map(([k,v])=>(<tr key={k}><td className="pr-2">{k}</td><td className="font-mono">{v}</td></tr>))}
              </tbody></table>
              <div className="mt-2">ECE {cur.metricsAtBuild?.ece?.toFixed?.(3)||'0.000'} • AUROC {cur.metricsAtBuild?.auroc?.toFixed?.(3)||'0.000'} • Brier {cur.metricsAtBuild?.brier?.toFixed?.(3)||'0.000'} • Validated {cur.metricsAtBuild?.validated||0}</div>
            </div>
          )}
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Candidate Model</div>
          {cand? (
            <div>
              <div className="text-xl font-semibold">v{cand.version} <span className="text-xs text-gray-500">(parent v{cand.parentVersion})</span></div>
              <div className="mt-2 text-sm">Threshold: {cand.threshold}</div>
              <div className="mt-2">Weights Δ vs current:</div>
              <table className="text-xs"><tbody>
                {Object.entries(cand.weights).map(([k,v])=>{
                  const curW = cur?.weights?.[k]
                  const d = delta(v as number, curW)
                  return (<tr key={k}><td className="pr-2">{k}</td><td className={`${(d??0)>0?'text-green-700':(d??0)<0?'text-red-700':''}`}>{v}{curW!=null && <span className="ml-1">({d!==(undefined as any)? (d>0?'+':'')+d.toFixed(2):''})</span>}</td></tr>)
                })}
              </tbody></table>
              <div className="mt-2">Metrics at build:</div>
              <div className="text-sm">Accuracy {cand.metricsAtBuild.accuracy.toFixed(3)} ({cur? ((cand.metricsAtBuild.accuracy - cur.metricsAtBuild.accuracy)>=0? '+':'')+(cand.metricsAtBuild.accuracy - cur.metricsAtBuild.accuracy).toFixed(3):''}) • ECE {cand.metricsAtBuild.ece.toFixed(3)} ({cur? ((cand.metricsAtBuild.ece - cur.metricsAtBuild.ece)>=0? '+':'')+(cand.metricsAtBuild.ece - cur.metricsAtBuild.ece).toFixed(3):''}) • AUROC {cand.metricsAtBuild.auroc.toFixed(3)} ({cur? ((cand.metricsAtBuild.auroc - cur.metricsAtBuild.auroc)>=0? '+':'')+(cand.metricsAtBuild.auroc - cur.metricsAtBuild.auroc).toFixed(3):''}) • Brier {cand.metricsAtBuild.brier.toFixed(3)} ({cur? ((cand.metricsAtBuild.brier - cur.metricsAtBuild.brier)>=0? '+':'')+(cand.metricsAtBuild.brier - cur.metricsAtBuild.brier).toFixed(3):''}) • N={cand.metricsAtBuild.validated}</div>
            </div>
          ): (<div className="text-sm text-gray-500">No candidate yet</div>)}
        </div>
      </div>

      <div className="p-4 border rounded">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Trend (30d)</div>
          <div className={`text-xs ${sum?.driftIndex<0.15?'text-green-600': sum?.driftIndex<0.3?'text-yellow-600':'text-red-600'}`}>Weather: {sum? (sum.driftIndex<0.15?'Stable': sum.driftIndex<0.3?'Shifting':'Storm'): 'Unknown'}</div>
        </div>
        <div className="grid grid-cols-30 gap-0.5 items-end h-24">
          {(sum?.accuracyTrend||[]).map((d:any)=>{
            const h = Math.round((d.accuracy||0)*100)
            return <div key={d.day} className="bg-blue-500" title={`${d.day} acc ${(d.accuracy*100).toFixed(1)}% of ${d.validated}`} style={{ height: `${Math.max(1,h)}%`, width:'3px' }} />
          })}
        </div>
      </div>
    </div>
  )
}


