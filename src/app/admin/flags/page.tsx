"use client"
import { useEffect, useState } from 'react'

type Flag = { id: string; description?: string }

export default function FlagsAdminPage() {
	const [flags, setFlags] = useState<Flag[]>([])
	useEffect(() => { (async ()=>{
		const res = await fetch('/api/admin/flags/list').then(r=>r.json()).catch(()=>({ flags: [] }))
		setFlags(res.flags||[])
	})() }, [])
	return (
		<div className="p-6">
			<h1 className="text-xl font-semibold mb-4">Feature Flags</h1>
			<ul className="space-y-2">
				{flags.map(f => <li key={f.id} className="border rounded p-3"><div className="font-medium">{f.id}</div><div className="text-sm text-gray-500">{f.description||''}</div></li>)}
			</ul>
		</div>
	)
}












