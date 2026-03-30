/**
 * TikTok Template Service
 * 
 * Provides functions to interact with the TikTok templates database tables
 */

import { createClient } from '@supabase/supabase-js';
import { TikTokTemplate, TemplateExpertInsight, TemplateAuditLog, Database } from '@/types/tiktok-templates-db';

// Get environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vyeiyccrageckeehyhj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlY2tlZWh5aGoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNjI0NzUyMCwiZXhwIjoyMDMxODIzNTIwfQ.YNgDgRya_1fvWOmO6j59aSuPLt6QVe0AAoVZkJ0iJx0';

// Create Supabase client
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * TikTok Template Service
 * Provides methods to interact with TikTok templates in the database
 */
export const tikTokTemplateService = {
  /**
   * Get all TikTok templates with optional filtering
   * @param options Optional filtering and pagination options
   * @returns List of TikTok templates
   */
  async getTemplates(options: {
    limit?: number;
    offset?: number;
    category?: string;
    isTrending?: boolean;
  } = {}): Promise<TikTokTemplate[]> {
    const { limit = 50, offset = 0, category, isTrending } = options;
    
    let query = supabase
      .from('tiktok_templates')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (isTrending !== undefined) {
      query = query.eq('is_trending', isTrending);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching TikTok templates:', error);
      return [];
    }
    
    return data;
  },
  
  /**
   * Get a single TikTok template by ID
   * @param id Template ID
   * @returns The template or null if not found
   */
  async getTemplateById(id: number): Promise<TikTokTemplate | null> {
    const { data, error } = await supabase
      .from('tiktok_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching TikTok template ${id}:`, error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Create a new TikTok template
   * @param template Template data
   * @returns The created template or null if creation failed
   */
  async createTemplate(template: Database['tiktok_templates']['Insert']): Promise<TikTokTemplate | null> {
    const { data, error } = await supabase
      .from('tiktok_templates')
      .insert([template])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating TikTok template:', error);
      return null;
    }
    
    // Log the creation in the audit log
    await this.logTemplateAction(data.id, 'create', {
      template: { ...template, id: data.id }
    });
    
    return data;
  },
  
  /**
   * Update an existing TikTok template
   * @param id Template ID
   * @param updates Fields to update
   * @returns The updated template or null if update failed
   */
  async updateTemplate(id: number, updates: Database['tiktok_templates']['Update']): Promise<TikTokTemplate | null> {
    // First get the current template data for audit logging
    const currentTemplate = await this.getTemplateById(id);
    
    if (!currentTemplate) {
      console.error(`Cannot update template ${id}: not found`);
      return null;
    }
    
    // Add updated_at timestamp
    const updatesWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('tiktok_templates')
      .update(updatesWithTimestamp)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating TikTok template ${id}:`, error);
      return null;
    }
    
    // Log the update in the audit log
    await this.logTemplateAction(id, 'update', {
      before: currentTemplate,
      after: data,
      changes: updates
    });
    
    return data;
  },
  
  /**
   * Delete a TikTok template
   * @param id Template ID
   * @returns True if deletion was successful
   */
  async deleteTemplate(id: number): Promise<boolean> {
    // First get the current template data for audit logging
    const currentTemplate = await this.getTemplateById(id);
    
    if (!currentTemplate) {
      console.error(`Cannot delete template ${id}: not found`);
      return false;
    }
    
    const { error } = await supabase
      .from('tiktok_templates')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting TikTok template ${id}:`, error);
      return false;
    }
    
    // Log the deletion in the audit log
    await this.logTemplateAction(id, 'delete', {
      template: currentTemplate
    });
    
    return true;
  },
  
  /**
   * Get expert insights for a template
   * @param templateId Template ID
   * @returns Expert insights or null if not found
   */
  async getTemplateExpertInsights(templateId: number): Promise<TemplateExpertInsight | null> {
    const { data, error } = await supabase
      .from('template_expert_insights')
      .select('*')
      .eq('template_id', templateId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Error code for 'no rows returned'
        return null;
      }
      console.error(`Error fetching expert insights for template ${templateId}:`, error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Create or update expert insights for a template
   * @param templateId Template ID
   * @param insights Expert insights data
   * @returns The created/updated insights or null if operation failed
   */
  async saveTemplateExpertInsights(
    templateId: number,
    insights: Omit<TemplateExpertInsight, 'id' | 'template_id' | 'created_at' | 'updated_at'>
  ): Promise<TemplateExpertInsight | null> {
    // Check if insights already exist for this template
    const existingInsights = await this.getTemplateExpertInsights(templateId);
    
    // Add timestamps
    const now = new Date().toISOString();
    const insightsWithTimestamp = {
      ...insights,
      template_id: templateId,
      updated_at: now
    };
    
    let result;
    
    if (existingInsights) {
      // Update existing insights
      const { data, error } = await supabase
        .from('template_expert_insights')
        .update(insightsWithTimestamp)
        .eq('id', existingInsights.id)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating expert insights for template ${templateId}:`, error);
        return null;
      }
      
      result = data;
    } else {
      // Create new insights
      const { data, error } = await supabase
        .from('template_expert_insights')
        .insert([{
          ...insightsWithTimestamp,
          created_at: now
        }])
        .select()
        .single();
      
      if (error) {
        console.error(`Error creating expert insights for template ${templateId}:`, error);
        return null;
      }
      
      result = data;
    }
    
    // If this includes a manual adjustment, log it
    if (insights.manual_adjustment) {
      await this.logTemplateAction(templateId, 'expert_adjustment', {
        insights: result,
        reason: insights.adjustment_reason || 'No reason provided'
      });
    }
    
    return result;
  },
  
  /**
   * Get audit logs for a template
   * @param templateId Template ID
   * @returns Array of audit log entries
   */
  async getTemplateAuditLogs(templateId: number): Promise<TemplateAuditLog[]> {
    const { data, error } = await supabase
      .from('template_audit_logs')
      .select('*')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Error fetching audit logs for template ${templateId}:`, error);
      return [];
    }
    
    return data;
  },
  
  /**
   * Log a template action to the audit logs
   * @param templateId Template ID
   * @param action Action name
   * @param changes Changes made
   * @param createdBy User who made the changes
   * @returns The created audit log or null if creation failed
   */
  async logTemplateAction(
    templateId: number,
    action: string,
    changes: Record<string, any>,
    createdBy?: string
  ): Promise<TemplateAuditLog | null> {
    const { data, error } = await supabase
      .from('template_audit_logs')
      .insert([{
        template_id: templateId,
        action,
        changes,
        created_by: createdBy
      }])
      .select()
      .single();
    
    if (error) {
      console.error(`Error logging template action for template ${templateId}:`, error);
      return null;
    }
    
    return data;
  },
  
  /**
   * Get trending templates
   * @param limit Maximum number of templates to return
   * @returns List of trending templates
   */
  async getTrendingTemplates(limit = 10): Promise<TikTokTemplate[]> {
    const { data, error } = await supabase
      .from('tiktok_templates')
      .select('*')
      .eq('is_trending', true)
      .order('growth_data->velocity', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching trending templates:', error);
      return [];
    }
    
    return data;
  },
  
  /**
   * Search templates by title or description
   * @param query Search query
   * @param limit Maximum number of templates to return
   * @returns List of matching templates
   */
  async searchTemplates(query: string, limit = 20): Promise<TikTokTemplate[]> {
    // Use text search if available or fallback to ILIKE
    const { data, error } = await supabase
      .from('tiktok_templates')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit);
    
    if (error) {
      console.error(`Error searching templates for "${query}":`, error);
      return [];
    }
    
    return data;
  }
}; 