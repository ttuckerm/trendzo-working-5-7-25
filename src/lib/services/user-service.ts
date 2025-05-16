// src/lib/services/user-service.ts
// Update to match the types (with number IDs instead of UUIDs)

import { supabase } from '../supabase';
import { UserProfile, UserPermission } from '../types/database';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data as UserProfile;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  // Don't allow updating the user_id
  const { user_id, id, ...validUpdates } = updates as any;
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update(validUpdates)
    .eq('user_id', userId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
  
  return data as UserProfile;
}

export async function getUserPermissions(userId: string): Promise<UserPermission[]> {
  const { data, error } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
  
  return data as UserPermission[];
}

export async function checkUserPermission(userId: string, permissionKey: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_permissions')
    .select('permission_value')
    .eq('user_id', userId)
    .eq('permission_key', permissionKey)
    .single();
    
  if (error || !data) {
    // Default to false if not found or error
    return false;
  }
  
  return data.permission_value;
}

// Get user subscription tier
export async function getUserSubscriptionTier(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('user_id', userId)
    .single();
    
  if (error || !data) {
    console.error('Error fetching user subscription tier:', error);
    return 'free'; // Default to free tier
  }
  
  return data.subscription_tier;
}