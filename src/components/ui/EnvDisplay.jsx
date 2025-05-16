'use client';

import { useState, useEffect } from 'react';
import { getClientEnvVariable } from '@/lib/utils/env';

/**
 * Client component to demonstrate environment variable access
 */
export function ClientEnvDisplay() {
  const [envValues, setEnvValues] = useState({});
  
  useEffect(() => {
    try {
      // Access client-side environment variables
      const supabaseUrl = getClientEnvVariable('SUPABASE_URL', 'Not configured');
      const useSupabase = getClientEnvVariable('USE_SUPABASE', 'Not configured');
      const forceEditor = getClientEnvVariable('FORCE_EDITOR', 'Not configured');
      
      // Try getting a server-only variable (will return default since not public)
      const supabaseKey = getClientEnvVariable('SUPABASE_SERVICE_ROLE_KEY', 'Not accessible on client');
      
      setEnvValues({
        supabaseUrl,
        supabaseKey,
        useSupabase,
        forceEditor,
        nodeEnv: getClientEnvVariable('NODE_ENV', 'unknown'),
        baseUrl: getClientEnvVariable('BASE_URL', 'Not configured')
      });
    } catch (error) {
      console.error('Error accessing environment variables:', error);
    }
  }, []);

  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-lg font-bold mb-2">Client Environment</h2>
      <ul className="space-y-1">
        <li>Supabase URL: {envValues.supabaseUrl}</li>
        <li>Supabase Key: {envValues.supabaseKey}</li>
        <li>Use Supabase: {envValues.useSupabase}</li>
        <li>Force Editor: {envValues.forceEditor}</li>
        <li>Base URL: {envValues.baseUrl}</li>
        <li>Node Env: {envValues.nodeEnv}</li>
      </ul>
    </div>
  );
} 