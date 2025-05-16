import { supabase } from '../supabase';
import { Sound, SoundTemplateMapping } from '../types/database';

export async function getSounds(limit = 20, offset = 0, filters?: any): Promise<Sound[]> {
  let query = supabase
    .from('sounds')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
    
  // Apply any filters
  if (filters) {
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.genre) {
      query = query.eq('genre', filters.genre);
    }
    // Add more filters as needed
  }
  
  const { data, error } = await query;
    
  if (error) {
    console.error('Error fetching sounds:', error);
    return [];
  }
  
  return data as Sound[];
}

export async function getSoundById(id: string): Promise<Sound | null> {
  const { data, error } = await supabase
    .from('sounds')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error(`Error fetching sound with id ${id}:`, error);
    return null;
  }
  
  return data as Sound;
}

export async function getSoundsForTemplate(templateId: string): Promise<Sound[]> {
  // First get sound IDs mapped to this template
  const { data: mappings, error: mappingError } = await supabase
    .from('sound_template_mappings')
    .select('sound_id')
    .eq('template_id', templateId);
    
  if (mappingError) {
    console.error('Error fetching sound mappings for template:', mappingError);
    return [];
  }
  
  const soundIds = mappings.map(mapping => mapping.sound_id);
  
  if (soundIds.length === 0) {
    return [];
  }
  
  // Then fetch the sounds with those IDs
  const { data: sounds, error: soundsError } = await supabase
    .from('sounds')
    .select('*')
    .in('id', soundIds);
    
  if (soundsError) {
    console.error('Error fetching sounds by IDs:', soundsError);
    return [];
  }
  
  return sounds as Sound[];
}

export async function getRecommendedSoundsForTemplate(templateId: string, limit = 5): Promise<Sound[]> {
  // Get sounds with highest correlation scores for this template
  const { data: mappings, error: mappingError } = await supabase
    .from('sound_template_mappings')
    .select('sound_id, correlation_score')
    .eq('template_id', templateId)
    .order('correlation_score', { ascending: false })
    .limit(limit);
    
  if (mappingError) {
    console.error('Error fetching recommended sounds for template:', mappingError);
    return [];
  }
  
  const soundIds = mappings.map(mapping => mapping.sound_id);
  
  if (soundIds.length === 0) {
    return [];
  }
  
  // Fetch the sounds with those IDs
  const { data: sounds, error: soundsError } = await supabase
    .from('sounds')
    .select('*')
    .in('id', soundIds);
    
  if (soundsError) {
    console.error('Error fetching sounds by IDs:', soundsError);
    return [];
  }
  
  return sounds as Sound[];
}