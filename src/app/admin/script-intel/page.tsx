"use client"

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import IntelStatusBadge from '@/components/IntelStatusBadge'

type Tone = 'authority'|'friendly'|'edgy'|'inspirational'

export default function ScriptIntelStudio(){
  const [platform, setPlatform] = useState<'tiktok'|'instagram'|'youtube'|'linkedin'>('tiktok')
  const [niche, setNiche] = useState('general')
  const [tone, setTone] = useState<Tone>('friendly')
  const [lengthSecTarget, setLength] = useState<number|''>('')
  const [seed, setSeed] = useState('Double your leads in 7 days with one page tweak')
  const [draft, setDraft] = useState<any>(null)
  const [scriptText, setScriptText] = useState('')
  const [analysis, setAnalysis] = useState<any>(null)

  const onGenerate = async () => {
    const r = await fetch('/api/script/generate', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ seedIdea: seed, platform, niche, tone, lengthSecTarget: typeof lengthSecTarget==='number'? lengthSecTarget: undefined }) })
    const j = await r.json()
    setDraft(j)
    setScriptText([j.hook, '', j.body, '', j.cta].join('\n'))
  }
  const onAnalyze = async () => {
    const r = await fetch('/api/script/analyze', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ text: scriptText, platform, niche }) })
    const j = await r.json()
    setAnalysis(j)
  }
  const onApply = async (type: string) => {
    // Client-side simple transforms mirroring edit ops
    if (!scriptText) return
    if (type === 'questionize') {
      const first = scriptText.split('\n')[0]||''
      const q = first.trim().endsWith('?') ? first : (first.replace(/[.!]+$/, '') + '?')
      setScriptText([q, ...scriptText.split('\n').slice(1)].join('\n'))
    } else if (type === 'insertCTA') {
      const idx = Math.floor(scriptText.split('\n').length * 0.8)
      const lines = scriptText.split('\n')
      lines.splice(idx, 0, 'Follow for proven systems that work.')
      setScriptText(lines.join('\n'))
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-2 flex items-center justify-between mb-2">
        <h1 className="text-xl font-semibold">Script Intelligence</h1>
        <IntelStatusBadge />
      </div>
      <Card>
        <CardHeader><CardTitle>Generator</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={seed} onChange={e=>setSeed(e.target.value)} placeholder="Seed idea" />
          <div className="grid grid-cols-3 gap-2">
            <Select value={platform} onValueChange={v=>setPlatform(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
              </SelectContent>
            </Select>
            <Input value={niche} onChange={e=>setNiche(e.target.value)} placeholder="Niche" />
            <Select value={tone} onValueChange={v=>setTone(v as Tone)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="authority">Authority</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="edgy">Edgy</SelectItem>
                <SelectItem value="inspirational">Inspirational</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 items-center">
            <Input type="number" value={lengthSecTarget} onChange={e=>setLength(e.target.value? Number(e.target.value):'')} placeholder="Length target (sec)" />
            <Button onClick={onGenerate}>Generate</Button>
          </div>
          {draft && (
            <div className="space-y-2">
              <div className="font-semibold">Hook</div>
              <Textarea value={scriptText} onChange={e=>setScriptText(e.target.value)} rows={12} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={()=>onApply('questionize')}>Apply: Questionize</Button>
                <Button variant="outline" onClick={()=>onApply('insertCTA')}>Apply: Insert CTA</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Analyzer</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={scriptText} onChange={e=>setScriptText(e.target.value)} rows={14} placeholder="Paste or edit script here" />
          <Button onClick={onAnalyze}>Analyze</Button>
          {analysis && (
            <div className="space-y-3">
              <div className="text-3xl font-bold">{Math.round((analysis.probScript ?? analysis.script?.probScript ?? 0)*100)}%</div>
              <div className="flex gap-2 flex-wrap">
                {(analysis.matchedPatterns ?? analysis.script?.matchedPatterns ?? []).map((p:any)=> (
                  <Badge key={p.id}>{p.id}:{Math.round(p.score*100)}</Badge>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(analysis.breakdown ?? analysis.script?.breakdown ?? {}).map(([k,v]) => (
                  <div key={k} className="text-sm border rounded p-2"><div className="text-gray-500">{k}</div><div className="font-semibold">{Number(v).toFixed(2)}</div></div>
                ))}
              </div>
              <div className="space-y-1">
                {(analysis.recommendations || []).map((r:any, i:number)=> (
                  <div key={i} className="text-sm">• <span className="font-medium">{r.title}</span> — {r.change}</div>
                ))}
              </div>
              <div className="flex gap-2">
                <a className="text-blue-600 underline" href={`/admin/analysis?script=${encodeURIComponent(scriptText)}`}>Send to Instant Analysis</a>
                <Button variant="outline" onClick={async()=>{ await fetch('/api/script/generate', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ seedIdea: seed, platform, niche, tone }) }); }}>Save draft</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}






























































