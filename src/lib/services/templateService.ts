// import { 
//   doc, 
//   collection, 
//   getDoc, 
//   getDocs, 
//   setDoc, 
//   updateDoc, 
//   deleteDoc, 
//   query, 
//   where, 
//   orderBy, 
//   serverTimestamp, 
//   Timestamp
// } from 'firebase/firestore' // Firebase SDK
// import { db } from '@/lib/firebase/firebase' // Firebase db is null
import { Template as AppTemplate, TemplateSection } from '@/lib/types/template'
import type { Template as DbTemplate } from '@/lib/types/database'
import { getServerSupabase } from '@/lib/supabase-server'

function computeTotalDuration(sections: TemplateSection[] | undefined, fallback?: number): number {
  if (Array.isArray(sections) && sections.length) {
    return sections.reduce((sum, s) => sum + (Number(s.duration) || 0), 0)
  }
  return Number(fallback || 0)
}

function toSections(structure: any): TemplateSection[] {
  const names: string[] = Array.isArray(structure?.sections) ? structure.sections : []
  const total: number = Number(structure?.duration || 0)
  const safeTotal = total > 0 ? total : Math.max(1, names.length) * 5
  const each = names.length ? Math.max(1, Math.floor(safeTotal / names.length)) : safeTotal
  return names.map((name: string, index: number) => ({
    id: `${index + 1}`,
    name: String(name || `Section ${index + 1}`),
    duration: each,
    textOverlays: [],
    order: index,
  }))
}

function mapDbToAppTemplate(row: DbTemplate, userId?: string): AppTemplate {
  const sections = toSections(row.structure)
  const totalDuration = row.duration_seconds || row.structure?.duration || computeTotalDuration(sections)
  return {
    id: String(row.id),
    userId: userId || 'unknown-user',
    name: row.name,
    industry: row.niche || 'general',
    category: row.category,
    description: row.original_creator ? `From @${row.original_creator.username} (${row.original_creator.platform})` : undefined,
    sections,
    views: 0,
    usageCount: Number(row.usage_count || 0),
    isPublished: true,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    thumbnailUrl: row.thumbnail_url || undefined,
    totalDuration: Number(totalDuration || 0),
    soundId: undefined,
    soundTitle: undefined,
    soundAuthor: undefined,
    soundUrl: undefined,
  }
}

function buildDbInsertFromApp(userId: string, t: Partial<AppTemplate>) {
  const names = Array.isArray(t.sections) && t.sections.length ? t.sections.map(s => s.name) : ['hook', 'build', 'payoff', 'cta']
  const duration = computeTotalDuration(t.sections, t.totalDuration || 30)
  return {
    name: t.name || 'Untitled Template',
    category: t.category || 'General',
    niche: (t.industry as any) || 'general',
    platform: Array.isArray((t as any).platform) ? (t as any).platform : ['tiktok'],
    viral_score: 0,
    usage_count: 0,
    original_creator: null,
    structure: { sections: names, duration },
    preview_url: null,
    thumbnail_url: t.thumbnailUrl || null,
    duration_seconds: duration,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export const templateService = {
  async getTemplate(templateId: string): Promise<AppTemplate | null> {
    try {
      const supabase = getServerSupabase()
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single()
      if (error || !data) {
        if (error) console.error('Error fetching template:', error)
        return null
      }
      return mapDbToAppTemplate(data as DbTemplate)
    } catch (error) {
      console.error('Template service error:', error)
      return null
    }
  },

  async getUserTemplates(userId: string): Promise<AppTemplate[]> {
    try {
      const supabase = getServerSupabase()
      // First, find templates the user has saved/edited
      const { data: saved, error: savedErr } = await supabase
        .from('user_templates')
        .select('template_id')
        .eq('user_id', userId)
      if (savedErr) {
        console.warn('user_templates not available or query failed; falling back to featured templates', savedErr.message)
      }
      const ids = Array.isArray(saved) ? (saved as any[]).map(r => String((r as any).template_id)) : []
      if (ids.length) {
        const { data: rows, error } = await supabase
          .from('templates')
          .select('*')
          .in('id', ids)
        if (!error && Array.isArray(rows)) {
          return (rows as DbTemplate[]).map(r => mapDbToAppTemplate(r, userId))
        }
      }
      // Fallback: return recent featured/top templates so UI has content
      const { data: fallback, error: fbErr } = await supabase
        .from('templates')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(20)
      if (fbErr || !Array.isArray(fallback)) return []
      return (fallback as DbTemplate[]).map(r => mapDbToAppTemplate(r, userId))
    } catch (e) {
      console.error('getUserTemplates failed:', e)
      return []
    }
  },

  async createTemplate(userId: string, templateData: Partial<AppTemplate>): Promise<AppTemplate> {
    const supabase = getServerSupabase()
    const insert = buildDbInsertFromApp(userId, templateData)
    const { data, error } = await supabase
      .from('templates')
      .insert(insert)
      .select('*')
      .single()
    if (error || !data) {
      throw new Error(`Failed to create template: ${error?.message || 'unknown'}`)
    }
    const created = data as DbTemplate
    // Link to user_templates for ownership/customization tracking
    try {
      await supabase
        .from('user_templates')
        .insert({ user_id: userId, template_id: created.id, customization: templateData || {} })
    } catch (e) {
      console.warn('Failed linking user_templates (non-fatal):', (e as any)?.message || e)
    }
    return mapDbToAppTemplate(created, userId)
  },

  async updateTemplate(templateId: string, templateData: Partial<AppTemplate>): Promise<AppTemplate> {
    const supabase = getServerSupabase()
    const fields: any = {}
    if (templateData.name) fields.name = templateData.name
    if (templateData.category) fields.category = templateData.category
    if (templateData.industry) fields.niche = templateData.industry
    if (templateData.thumbnailUrl !== undefined) fields.thumbnail_url = templateData.thumbnailUrl
    if (Array.isArray(templateData.sections)) {
      const names = templateData.sections.map(s => s.name)
      const duration = computeTotalDuration(templateData.sections, templateData.totalDuration)
      fields.structure = { sections: names, duration }
      fields.duration_seconds = duration
    }
    fields.updated_at = new Date().toISOString()
    const { data, error } = await supabase
      .from('templates')
      .update(fields)
      .eq('id', templateId)
      .select('*')
      .single()
    if (error || !data) {
      throw new Error(`Failed to update template: ${error?.message || 'unknown'}`)
    }
    return mapDbToAppTemplate(data as DbTemplate)
  },

  async deleteTemplate(templateId: string): Promise<boolean> {
    const supabase = getServerSupabase()
    const { error } = await supabase.from('templates').delete().eq('id', templateId)
    if (error) throw new Error(`Failed to delete template: ${error.message}`)
    try { await supabase.from('user_templates').delete().eq('template_id', templateId) } catch {}
    return true
  },

  async incrementTemplateViews(_templateId: string): Promise<void> {
    // No views column on templates; skip as no-op to avoid placeholders
    return
  },

  async incrementTemplateUsage(templateId: string): Promise<void> {
    const supabase = getServerSupabase()
    // Best-effort atomic increment
    const { data, error } = await supabase
      .from('templates')
      .select('usage_count')
      .eq('id', templateId)
      .single()
    if (error || !data) return
    const current = Number((data as any).usage_count || 0)
    await supabase
      .from('templates')
      .update({ usage_count: current + 1, updated_at: new Date().toISOString() })
      .eq('id', templateId)
  },

  calculateTotalDuration(sections: TemplateSection[]): number {
    return computeTotalDuration(sections)
  }
}