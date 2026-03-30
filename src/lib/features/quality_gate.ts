import { FeatureSchema, FEATURE_SCHEMA_V1 } from '@/lib/features/schema'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export type QualityReport = { missing: number; drift: number; outliers: number; pass: boolean }

export async function runQualityChecks(vec: number[], schema: FeatureSchema = FEATURE_SCHEMA_V1): Promise<QualityReport> {
  // Missing: count NaN or undefined
  const missing = vec.filter(v => v === null || v === undefined || Number.isNaN(v)).length

  // Drift: compare each dimension mean to cohort baseline if available (last 30d videos table)
  let drift = 0
  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data } = await db.from('videos').select('view_count,like_count,comment_count,share_count,creator_followers,hours_since_upload').gte('created_at', new Date(Date.now()-30*24*3600*1000).toISOString()).limit(1000)
    if (Array.isArray(data) && data.length) {
      const cols = ['viewCount','likeCount','commentCount','shareCount','followerCount','hoursSinceUpload']
      const means = [0,0,0,0,0,0]
      for (const r of data as any[]) {
        means[0] += Number(r.view_count||0)
        means[1] += Number(r.like_count||0)
        means[2] += Number(r.comment_count||0)
        means[3] += Number(r.share_count||0)
        means[4] += Number(r.creator_followers||0)
        means[5] += Number(r.hours_since_upload||0)
      }
      for (let i=0;i<means.length;i++) means[i] /= data.length
      // Relative drift on first 4 dims (engagement signals)
      const denom = means.map(m=> Math.max(1, m))
      drift = Number(((Math.abs(vec[0]-means[0])/denom[0] + Math.abs(vec[1]-means[1])/denom[1] + Math.abs(vec[2]-means[2])/denom[2] + Math.abs(vec[3]-means[3])/denom[3]) / 4).toFixed(3))
    }
  } catch { drift = 0 }

  // Outliers: z-score > 3 for any metric using simple cohort variance
  let outliers = 0
  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data } = await db.from('videos').select('view_count,like_count,comment_count,share_count').gte('created_at', new Date(Date.now()-30*24*3600*1000).toISOString()).limit(500)
    if (Array.isArray(data) && data.length) {
      const cols = ['view_count','like_count','comment_count','share_count'] as const
      const arrays = cols.map(c => (data as any[]).map(r => Number(r[c]||0)))
      const means = arrays.map(a => a.reduce((s,v)=>s+v,0)/a.length)
      const stds = arrays.map((a,i)=> Math.sqrt(a.reduce((s,v)=> s + Math.pow(v-means[i],2),0)/a.length))
      for (let i=0;i<4;i++) {
        const sd = stds[i] || 1
        const z = Math.abs(((vec[i]||0) - means[i]) / sd)
        if (z > 3) outliers++
      }
    }
  } catch { outliers = 0 }

  const pass = missing === 0 && drift < 0.3 && outliers <= 2
  return { missing, drift, outliers, pass }
}












