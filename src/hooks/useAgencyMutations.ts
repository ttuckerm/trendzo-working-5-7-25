// src/hooks/useAgencyMutations.ts

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Agency } from '@/lib/supabase/types';

export function useAgencyMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

  const createAgency = async (data: Partial<Agency>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: newAgency, error: createError } = await supabase
        .from('agencies')
        .insert(data)
        .select()
        .single();

      if (createError) throw createError;
      return newAgency;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAgency = async (id: string, data: Partial<Agency>) => {
    setLoading(true);
    setError(null);
    try {
      const { data: updated, error: updateError } = await supabase
        .from('agencies')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAgency = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('agencies')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createAgency,
    updateAgency,
    deleteAgency,
    loading,
    error,
  };
}