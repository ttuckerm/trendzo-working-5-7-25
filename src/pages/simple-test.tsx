// src/pages/simple-test.tsx

import { useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabase-client';

export default function SimpleTest() {
  const [status, setStatus] = useState('Testing Supabase connection...');
  const [featureFlags, setFeatureFlags] = useState([]);
  
  useEffect(() => {
    async function testConnection() {
      try {
        // Simple test query
        const { data, error } = await supabaseClient
          .from('feature_flags')
          .select('*')
          .limit(5);
        
        if (error) {
          throw error;
        }
        
        setFeatureFlags(data || []);
        setStatus('Connection successful!');
      } catch (error) {
        console.error('Supabase error:', error);
        setStatus(`Error: ${error.message}`);
      }
    }
    
    testConnection();
  }, []);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Simple Supabase Test</h1>
      
      <div className="p-4 bg-gray-100 rounded mb-4">
        <p><strong>Status:</strong> {status}</p>
      </div>
      
      {featureFlags.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Feature Flags:</h2>
          <ul className="list-disc pl-6">
            {featureFlags.map((flag) => (
              <li key={flag.id} className="mb-1">
                {flag.name} - {flag.enabled ? 'Enabled' : 'Disabled'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}