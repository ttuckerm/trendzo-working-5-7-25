'use client'
import React from 'react'

type CoachInput = { platform: 'tiktok'|'instagram'|'youtube'|'linkedin'; niche?: string; scriptText?: string; caption?: string; durationSec?: number; templateId?: string }

export default function CoachStudioPage(){
	const [platform, setPlatform] = React.useState<CoachInput['platform']>('tiktok')
	const [niche, setNiche] = React.useState('general')
	const [scriptText, setScriptText] = React.useState('')
	const [caption, setCaption] = React.useState('')
	const [durationSec, setDurationSec] = React.useState<number|''>('')
	const [templateId, setTemplateId] = React.useState('')
	const [loading, setLoading] = React.useState(false)
	const [slaOk, setSlaOk] = React.useState<boolean|null>(null)
	const [result, setResult] = React.useState<any>(null)
	const [applying, setApplying] = React.useState<string>('')

	React.useEffect(()=>{
		// Prefill from query if present
		try{
			const u = new URL(window.location.href)
			const p = (u.searchParams.get('platform') as any)||null
			const s = u.searchParams.get('script')
			const c = u.searchParams.get('caption')
			const d = u.searchParams.get('durationSec')
			const t = u.searchParams.get('templateId')
			if (p) setPlatform(p)
			if (s) setScriptText(s)
			if (c) setCaption(c)
			if (d) setDurationSec(Number(d))
			if (t) setTemplateId(t)
		}catch{}
	},[])

	async function onSuggest(){
		setLoading(true)
		setResult(null)
		setSlaOk(null)
		const started = Date.now()
		try{
			const body: CoachInput & { k?: number } = { platform, niche, scriptText, caption, durationSec: typeof durationSec==='number'? durationSec: undefined, templateId: templateId||undefined }
			const r = await fetch('/api/coach/suggest', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) })
			const j = await r.json()
			setResult(j)
			setSlaOk((Date.now()-started)<=5000)
		}catch(e){ setResult({ baselineProb:0, suggestions:[], error:String(e) }) }
		finally{ setLoading(false) }
	}

	async function onApply(sugg: any){
		setApplying(sugg.id)
		try{
			const body = { suggestionId: sugg.id, input: { platform, niche, scriptText, caption, durationSec: typeof durationSec==='number'? durationSec: undefined, templateId: templateId||undefined }, edit: sugg.edit, autopilot: true }
			const r = await fetch('/api/coach/apply', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) })
			const j = await r.json()
			if (j?.experimentId) {
				window.location.href = `/admin/experiments?id=${encodeURIComponent(j.experimentId)}`
			}
		}catch{}
		finally{ setApplying('') }
	}

	function copySuggestion(s:any){
		try { navigator.clipboard.writeText(s.preview || '') } catch {}
	}

	return (
		<div className="p-6 max-w-6xl mx-auto">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-2xl font-semibold">Coach Studio</h1>
				{slaOk!==null && <div className={`text-xs px-2 py-1 rounded ${slaOk? 'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>SLA ≤5s {slaOk? 'met':'missed'}</div>}
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="space-y-2">
					<div className="flex gap-2">
						<select className="border rounded px-3 py-2" value={platform} onChange={e=>setPlatform(e.target.value as any)}>
							<option value="tiktok">TikTok</option>
							<option value="instagram">Instagram</option>
							<option value="youtube">YouTube</option>
							<option value="linkedin">LinkedIn</option>
						</select>
						<input className="flex-1 border rounded px-3 py-2" placeholder="Niche" value={niche} onChange={e=>setNiche(e.target.value)} />
						<input className="w-32 border rounded px-3 py-2" placeholder="Duration (s)" value={durationSec} onChange={e=>setDurationSec(e.target.value? Number(e.target.value): '')} />
					</div>
					<textarea className="w-full h-36 border rounded px-3 py-2" placeholder="Script text" value={scriptText} onChange={e=>setScriptText(e.target.value)} />
					<input className="w-full border rounded px-3 py-2" placeholder="Caption" value={caption} onChange={e=>setCaption(e.target.value)} />
					<input className="w-full border rounded px-3 py-2" placeholder="Template ID (optional)" value={templateId} onChange={e=>setTemplateId(e.target.value)} />
					<div className="flex gap-2 items-center">
						<button className="bg-black text-white rounded px-4 py-2" disabled={loading} onClick={onSuggest}>{loading? 'Suggesting…':'Suggest'}</button>
						<a className="text-xs underline text-gray-600" href="/api/coach/examples" target="_blank" rel="noreferrer">Examples</a>
					</div>
				</div>
				<div className="space-y-3">
					{result && Array.isArray(result.suggestions) && result.suggestions.length>0 ? (
						<div className="grid grid-cols-1 gap-2">
							{result.suggestions.map((s:any)=>(
								<div key={s.id} className="border rounded p-3">
									<div className="flex items-center justify-between">
										<div>
											<div className="text-sm font-medium">{s.title}</div>
											<div className="text-xs text-gray-600">type: {s.type}</div>
										</div>
										<div className="text-right">
											<div className="text-xs text-green-700">+{Math.round((s.expectedLift||0)*100)}% uplift</div>
											<div className="text-[10px] text-gray-500">conf: {Math.round((s.confidence||0)*100)}%</div>
										</div>
									</div>
									<div className="mt-2 text-sm">{s.preview}</div>
									{Boolean(s.risks?.length) && <div className="mt-1 text-xs text-yellow-700">Risks: {s.risks.join(', ')}</div>}
									{Boolean(s.diff) && <pre className="mt-2 text-[10px] bg-gray-50 p-2 overflow-auto">{s.diff}</pre>}
									<div className="mt-2 flex items-center gap-2">
										<button className="text-xs border rounded px-2 py-1" disabled={!!applying} onClick={()=>onApply(s)}>{applying===s.id? 'Applying…':'Apply as A/B'}</button>
										<button className="text-xs border rounded px-2 py-1" onClick={()=>copySuggestion(s)}>Copy</button>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-sm text-gray-600">No suggestions yet.</div>
					)}
				</div>
			</div>
		</div>
	)
}


