'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, UserRole } from '@/types/admin';
import { useAdminUser } from './useAdminUser';

// =============================================
// CONSTANTS
// =============================================

const IMPERSONATION_KEY = 'cleancopy_impersonation';

// =============================================
// TYPES
// =============================================

interface ImpersonationState {
  isImpersonating: boolean;
  impersonatedUser: Profile | null;
}

interface UseImpersonationReturn extends ImpersonationState {
  realUser: Profile | null;
  realRole: UserRole | null;
  effectiveUser: Profile | null;
  effectiveRole: UserRole | null;
  canImpersonate: boolean;
  startImpersonation: (userId: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  isLoading: boolean;
}

// =============================================
// HOOK
// =============================================

export function useImpersonation(): UseImpersonationReturn {
  const { profile: realUser, role: realRole } = useAdminUser();
  const [state, setState] = useState<ImpersonationState>({
    isImpersonating: false,
    impersonatedUser: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  // Only chairman can impersonate
  const canImpersonate = realRole === 'chairman';

  // Check for existing impersonation on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const stored = sessionStorage.getItem(IMPERSONATION_KEY);
    if (stored && canImpersonate) {
      try {
        const impersonatedUser = JSON.parse(stored);
        setState({
          isImpersonating: true,
          impersonatedUser,
        });
      } catch {
        sessionStorage.removeItem(IMPERSONATION_KEY);
      }
    }
  }, [canImpersonate]);

  const startImpersonation = useCallback(async (userId: string) => {
    if (!canImpersonate) {
      throw new Error('Only chairman can impersonate users');
    }

    setIsLoading(true);

    try {
      // Fetch the user to impersonate
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!user) throw new Error('User not found');

      // Log impersonation start
      try {
        await supabase.from('audit_log').insert({
          actor_id: realUser?.id,
          actor_role: realRole,
          action: 'impersonation.started',
          resource_type: 'user',
          resource_id: userId,
          target_name: user.display_name || user.email,
          changes: {
            before: null,
            after: { impersonated_user_id: userId, impersonated_role: user.role }
          }
        });
      } catch (auditError) {
        console.warn('Failed to log impersonation start:', auditError);
        // Continue even if audit fails
      }

      // Store in session
      sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(user));

      setState({
        isImpersonating: true,
        impersonatedUser: user,
      });
    } finally {
      setIsLoading(false);
    }
  }, [canImpersonate, realUser, realRole, supabase]);

  const stopImpersonation = useCallback(async () => {
    if (!state.isImpersonating) return;

    setIsLoading(true);

    try {
      // Log impersonation end
      try {
        await supabase.from('audit_log').insert({
          actor_id: realUser?.id,
          actor_role: realRole,
          action: 'impersonation.ended',
          resource_type: 'user',
          resource_id: state.impersonatedUser?.id,
          target_name: state.impersonatedUser?.display_name || state.impersonatedUser?.email,
          changes: {
            before: { impersonated_user_id: state.impersonatedUser?.id },
            after: null
          }
        });
      } catch (auditError) {
        console.warn('Failed to log impersonation end:', auditError);
        // Continue even if audit fails
      }

      sessionStorage.removeItem(IMPERSONATION_KEY);

      setState({
        isImpersonating: false,
        impersonatedUser: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, [state.isImpersonating, state.impersonatedUser, realUser, realRole, supabase]);

  return {
    isImpersonating: state.isImpersonating,
    impersonatedUser: state.impersonatedUser,
    realUser,
    realRole,
    effectiveUser: state.isImpersonating ? state.impersonatedUser : realUser,
    effectiveRole: state.isImpersonating 
      ? (state.impersonatedUser?.role as UserRole) 
      : realRole,
    canImpersonate,
    startImpersonation,
    stopImpersonation,
    isLoading,
  };
}

export default useImpersonation;


























































































