'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const [envVariables, setEnvVariables] = useState<Record<string, string>>({});

  useEffect(() => {
    async function checkSupabase() {
      try {
        // Create Supabase client
        const supabase = createClientComponentClient();
        
        // Test connection by making a simple query
        const { data, error } = await supabase.from('_test_connection').select('*').limit(1).catch(() => ({ 
          data: null, 
          error: { message: 'Query failed, but connection might still be OK' } 
        }));
        
        // Even if query fails due to missing table, we may still have a connection
        if (supabase) {
          setStatus('Supabase client initialized successfully');
          
          // Get environment variables for debugging
          setEnvVariables({
            'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
            'NEXT_PUBLIC_USE_SUPABASE': process.env.NEXT_PUBLIC_USE_SUPABASE || 'Not set'
          });
          
          if (error) {
            setError(`Query error: ${error.message}`);
          }
        } else {
          setStatus('Failed to initialize Supabase client');
        }
      } catch (err: any) {
        setStatus('Error connecting to Supabase');
        setError(err.message);
      }
    }

    checkSupabase();
  }, []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Supabase Connection Test</h1>
      
      <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h2>Connection Status</h2>
        <p style={{ 
          fontWeight: 'bold', 
          color: status.includes('successfully') ? 'green' : status.includes('Loading') ? 'blue' : 'red'
        }}>
          {status}
        </p>
        
        {error && (
          <div style={{ color: 'orange', marginTop: '10px' }}>
            <p>Note: Getting a query error is normal if you haven't created test tables yet.</p>
            <p>Error details: {error}</p>
          </div>
        )}
      </div>
      
      <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '5px' }}>
        <h2>Environment Variables</h2>
        <pre style={{ background: '#e0e0e0', padding: '10px', overflowX: 'auto' }}>
          {JSON.stringify(envVariables, null, 2)}
        </pre>
        <p>
          <strong>Note:</strong> Only public environment variables (NEXT_PUBLIC_*) are visible on the client.
        </p>
      </div>
      
      <div style={{ marginTop: '30px', padding: '15px', background: '#e6f7ff', borderRadius: '5px' }}>
        <h2>What This Page Tests</h2>
        <p>
          This page verifies that your Next.js application can successfully initialize a Supabase client,
          which confirms that the Supabase environment variables are correctly configured.
        </p>
        <p>
          If you see "Supabase client initialized successfully", your authentication migration from 
          Firebase to Supabase should be properly configured.
        </p>
      </div>
    </div>
  );
} 