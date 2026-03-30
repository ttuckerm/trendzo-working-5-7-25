import { NextResponse } from 'next/server'
import { orchestrator } from '@/lib/jarvis/orchestrator'
import { getSystemSnapshot } from '@/lib/jarvis/read_model'

export async function GET() {
  const snapshot = await getSystemSnapshot()
  const phrase = 'restart system'
  const resolved = { intent: phrase, resolved_skill: 'cache_clear', confirmation: 'required', executed: false }
  const evidence_path = `storage/evidence/jarvis_mock_1.zip`
  return NextResponse.json({ ...resolved, snapshot, evidence_path })
}


