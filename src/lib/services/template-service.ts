// src/lib/services/template-service.ts
// Update to match the types (with number IDs instead of UUIDs)

import { supabase } from '../supabase';
import { Template, TemplateTag, UserSavedTemplate } from '../types/database';

export async function getTemplates(limit = 20, offset = 0, filters?: any): Promise<Template[]> {
  let query = supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
    
  // Apply any filters
  if (filters) {
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.isTrending) {
      query = query.eq('is_trending', true);
    }
    // Add more filters as needed
  }
  
  const { data, error } = await query;
    
  if (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
  
  return data as Template[];
}

export async function getTemplateById(id: string): Promise<Template | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error(`Error fetching template with id ${id}:`, error);
    return null;
  }
  
  return data as Template;
}

export async function saveTemplateForUser(userId: string, templateId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_saved_templates')
    .insert({
      user_id: userId,
      template_id: templateId
    });
    
  if (error) {
    console.error('Error saving template for user:', error);
    return false;
  }
  
  return true;
}

export async function getUserSavedTemplates(userId: string): Promise<Template[]> {
  const { data, error } = await supabase
    .from('user_saved_templates')
    .select('template_id')
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching user saved templates:', error);
    return [];
  }
  
  const templateIds = data.map(item => item.template_id);
  
  if (templateIds.length === 0) {
    return [];
  }
  
  const { data: templates, error: templatesError } = await supabase
    .from('templates')
    .select('*')
    .in('id', templateIds);
    
  if (templatesError) {
    console.error('Error fetching saved templates:', templatesError);
    return [];
  }
  
  return templates as Template[];
}

export async function getTemplatesByTags(tags: string[], limit = 20): Promise<Template[]> {
  // First get template IDs that match the tags
  const { data: tagData, error: tagError } = await supabase
    .from('template_tags')
    .select('template_id')
    .in('tag', tags);
    
  if (tagError) {
    console.error('Error fetching templates by tags:', tagError);
    return [];
  }
  
  const templateIds = tagData.map(item => item.template_id);
  
  if (templateIds.length === 0) {
    return [];
  }
  
  // Then fetch the templates with those IDs
  const { data: templates, error: templatesError } = await supabase
    .from('templates')
    .select('*')
    .in('id', templateIds)
    .limit(limit);
    
  if (templatesError) {
    console.error('Error fetching templates by IDs:', templatesError);
    return [];
  }
  
  return templates as Template[];
}