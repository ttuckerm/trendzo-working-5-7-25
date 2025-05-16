// src/pages/minimal-test.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/minimal-supabase';

export default function MinimalTest() {
  const [status, setStatus] = useState('Testing...');
  const [data, setData] = useState(null);

  useEffect(() => {
    async function testConnection() {
      try {
        // Just try to get any data
        const { data, error } = await supabase
          .from('feature_flags')
          .select('*')
          .limit(1);

        if (error) throw error;
        
        setStatus('Connection successful!');
        setData(data);
      } catch (error) {
        console.error('Error:', error);
        setStatus(`Error: ${error.message}`);
      }
    }

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Minimal Supabase Test</h1>
      <p><strong>Status:</strong> {status}</p>
      
      {data && (
        <div>
          <h2>Data Retrieved:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}