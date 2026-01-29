'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, UserRole } from '@/types/admin';
import { hasPermission, Resource, Action, PermissionContext } from '@/lib/permissions';

// =============================================
// TYPES
// =============================================

interface AdminUserState {
  user: any | null; // Supabase auth user
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseAdminUserReturn extends AdminUserState {
  hasPermission: (resource: Resource, action: Action, context?: PermissionContext) => boolean;
  refetch: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isChairman: boolean;
  agencyId: string | undefined;
  developerId: string | undefined;
}

// =============================================
// HOOK
// =============================================

export function useAdminUser(): UseAdminUserReturn {
  const [state, setState] = useState<AdminUserState>({
    user: null,
    profile: null,
    role: null,
    isLoading: true,
    error: null,
  });

  const supabase = createClient();

  const fetchUser = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get auth user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      
      if (!user) {
        setState({
          user: null,
          profile: null,
          role: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Get profile with role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw profileError;
      }

      // If no profile exists, create a default one
      if (!profile) {
        const defaultProfile: Partial<Profile> = {
          id: user.id,
          role: 'creator' as UserRole,
          email: user.email,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {},
        };

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert(defaultProfile)
          .select()
          .single();

        if (insertError) {
          console.warn('Could not create profile:', insertError);
          // Use the default profile locally even if insert fails
          setState({
            user,
            profile: defaultProfile as Profile,
            role: 'creator' as UserRole,
            isLoading: false,
            error: null,
          });
          return;
        }

        setState({
          user,
          profile: newProfile,
          role: newProfile?.role as UserRole || 'creator',
          isLoading: false,
          error: null,
        });
        return;
      }

      setState({
        user,
        profile,
        role: profile?.role as UserRole || null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching admin user:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  }, [supabase]);

  useEffect(() => {
    fetchUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          fetchUser();
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            role: null,
            isLoading: false,
            error: null,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUser, supabase.auth]);

  const checkPermission = useCallback(
    (resource: Resource, action: Action, context?: PermissionContext): boolean => {
      if (!state.role) return false;
      
      const fullContext: PermissionContext = {
        ...context,
        userId: state.profile?.id,
        userAgencyId: state.profile?.metadata?.agency_id as string | undefined,
        userDeveloperId: state.profile?.metadata?.developer_id as string | undefined,
      };
      
      return hasPermission(state.role, resource, action, fullContext);
    },
    [state.role, state.profile]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      profile: null,
      role: null,
      isLoading: false,
      error: null,
    });
  }, [supabase.auth]);

  // Derived values
  const isAuthenticated = !!state.user && !!state.profile;
  const isAdmin = state.role === 'chairman' || state.role === 'sub_admin';
  const isChairman = state.role === 'chairman';
  const agencyId = state.profile?.metadata?.agency_id as string | undefined;
  const developerId = state.profile?.metadata?.developer_id as string | undefined;

  return {
    ...state,
    hasPermission: checkPermission,
    refetch: fetchUser,
    signOut,
    isAuthenticated,
    isAdmin,
    isChairman,
    agencyId,
    developerId,
  };
}

// =============================================
// MOCK HOOK (for development/testing)
// =============================================

export function useMockAdminUser(mockRole: UserRole = 'chairman'): UseAdminUserReturn {
  const mockProfile: Profile = {
    id: 'mock-user-id',
    role: mockRole,
    display_name: 'Test User',
    avatar_url: null,
    email: 'test@cleancopy.ai',
    phone: null,
    timezone: 'UTC',
    language: 'en',
    is_active: true,
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {},
  };

  return {
    user: { id: 'mock-user-id', email: 'test@cleancopy.ai' },
    profile: mockProfile,
    role: mockRole,
    isLoading: false,
    error: null,
    hasPermission: (resource, action, context) => {
      return hasPermission(mockRole, resource, action, context);
    },
    refetch: async () => {},
    signOut: async () => {},
    isAuthenticated: true,
    isAdmin: mockRole === 'chairman' || mockRole === 'sub_admin',
    isChairman: mockRole === 'chairman',
    agencyId: undefined,
    developerId: undefined,
  };
}

// =============================================
// DEV FALLBACK PROFILE
// =============================================

const DEV_FALLBACK_PROFILE: Profile = {
  id: 'dev-user-id',
  role: 'chairman',
  display_name: 'Dev User (Chairman)',
  avatar_url: null,
  email: 'dev@cleancopy.ai',
  phone: null,
  timezone: 'UTC',
  language: 'en',
  is_active: true,
  last_login_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  metadata: {},
};

// Hook that returns a dev fallback when not authenticated (for local development)
export function useAdminUserWithDevFallback(): UseAdminUserReturn {
  const realHook = useAdminUser();
  
  // In development, provide a fallback if not authenticated
  if (process.env.NODE_ENV === 'development' && !realHook.isLoading && !realHook.user) {
    return {
      user: { id: 'dev-user-id', email: 'dev@cleancopy.ai' },
      profile: DEV_FALLBACK_PROFILE,
      role: 'chairman',
      isLoading: false,
      error: null,
      hasPermission: (resource, action, context) => {
        return hasPermission('chairman', resource, action, context);
      },
      refetch: async () => {},
      signOut: async () => {},
      isAuthenticated: true,
      isAdmin: true,
      isChairman: true,
      agencyId: undefined,
      developerId: undefined,
    };
  }
  
  return realHook;
}

// Default export with environment-aware behavior
export default useAdminUser;
