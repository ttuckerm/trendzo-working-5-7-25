import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { generateMarketingDrafts } from '@/lib/marketing/generate_assets'

export async function GET(_req: NextRequest) {
  await generateMarketingDrafts(10, 'general')
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: rows } = await db.from('marketing_assets').select('id,kind,predicted_score,created_at').order('created_at', { ascending: false }).limit(10)
  // create a sample case study via API for proof (client would POST normally)
  const caseStudy = { predictions: rows?.slice(0,2)||[], recommendations: 'Focus on HOT templates; test hooks A/B.' }
  return NextResponse.json({ ok:true, created: rows?.length||0, case_study_template: caseStudy })
}


