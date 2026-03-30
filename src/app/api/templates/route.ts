import { NextRequest, NextResponse } from 'next/server'
import { templateService } from '@/lib/services/templateService'
import { Template } from '@/lib/types/template'
import { getCurrentUserId, handleApiError } from '@/lib/utils/apiHelpers'
import { generateRecipeBook } from '@/lib/templates/service'

// GET all templates for the current user
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const range = (url.searchParams.get('range') as any) || null
    const platform = url.searchParams.get('platform') || undefined
    const niche = url.searchParams.get('niche') || undefined
    const sort = url.searchParams.get('sort') || undefined

    // Discovery-mode listing when range param is present (stable external contract)
    if (range) {
      const rb = await generateRecipeBook({ window: (range === '7d' || range === '90d' ? range : '30d') as any, platform, niche })
      const mapState = (s: string) => (s.toLowerCase() === 'hot' ? 'hot' : s.toLowerCase() === 'cooling' ? 'cooling' : s.toLowerCase() === 'new' ? 'new' : 'stable')
      const shape = (t: any) => ({
        id: String(t.id),
        name: String(t.name || t.id),
        status: mapState(t.state || ''),
        sr: Number((t.successRate ?? 0) * 1),
        uses: Number(t.uses || 0),
        examples: Array.isArray(t.examples) ? t.examples.length : 0,
        entity: { sound: 'Trending', hashtags: ['#viral', '#trendzo'] },
        last_seen_at: String(t.lastSeenTs || rb.generatedAtISO || new Date().toISOString()),
        trend: [Math.random(), Math.random(), Math.random(), Math.random(), Math.random()],
        safety: { nsfw: 0, copyright: 0 },
        uplift_pct: 0,
        support: t.uses || 0,
      })
      let items = [...rb.hot, ...rb.cooling, ...rb.newly].map(shape)
      if (sort === 'Success Rate') items = items.sort((a,b)=> (b.sr||0) - (a.sr||0))
      if (sort === 'Recency') items = items.sort((a,b)=> new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime())
      if (sort === 'Uses') items = items.sort((a,b)=> (b.uses||0) - (a.uses||0))
      return NextResponse.json(items)
    }

    // Default: return user-specific templates collection
    const userId = getCurrentUserId(request)
    const templates = await templateService.getUserTemplates(userId)
    return NextResponse.json(templates)
  } catch (error) {
    return handleApiError(error, 'Failed to fetch templates')
  }
}

// POST create a new template
export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId(request)
    
    // Parse the template data from request body
    const templateData = await request.json() as Partial<Template>
    
    // Create the new template
    const newTemplate = await templateService.createTemplate(userId, templateData)
    
    return NextResponse.json(newTemplate, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Failed to create template')
  }
} 