// src/pages/basic-test.tsx - Updated version with error handling
import { useState, useEffect } from 'react';
import { supabaseClient } from '../lib/supabase-client';

export default function BasicTest() {
  const [status, setStatus] = useState('Testing Supabase connection...');
  const [error, setError] = useState<any>(null);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [flag, setFlag] = useState<any>(null);

  useEffect(() => {
    // Add console logs for better debugging
    console.log('BasicTest component mounted');
    console.log('Supabase client:', supabaseClient);
    
    async function testConnection() {
      try {
        console.log('Testing connection...');
        
        // First, just check if we can connect at all
        const { data: testData, error: testError } = await supabaseClient
          .from('feature_flags')
          .select('count')
          .limit(1);
          
        if (testError) {
          console.error('Connection test error:', testError);
          throw testError;
        }
        
        console.log('Basic connection successful');
        setConnectionInfo({
          connected: true,
          count: testData?.length || 0
        });
        
        // Now try to get our specific flag
        const { data, error } = await supabaseClient
          .from('feature_flags')
          .select('*')
          .eq('key', 'use_supabase_auth')
          .single();
        
        if (error) {
          console.error('Error fetching flag:', error);
          throw error;
        }
        
        console.log('Flag data:', data);
        setFlag(data);
        setStatus('Connection successful!');
      } catch (err) {
        console.error('Test failed:', err);
        setError(err);
        setStatus(`Connection error: ${err.message || 'Unknown error'}`);
      }
    }
    
    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        Supabase Connection Test
      </h1>
      
      <div style={{ 
        padding: '16px', 
        backgroundColor: error ? '#fee2e2' : '#f3f4f6', 
        borderRadius: '4px',
        marginBottom: '16px'
      }}>
        <p><strong>Status:</strong> {status}</p>
        
        {connectionInfo && (
          <div style={{ marginTop: '8px' }}>
            <p><strong>Connection:</strong> {connectionInfo.connected ? 'Successful' : 'Failed'}</p>
            <p><strong>Tables accessible:</strong> {connectionInfo.connected ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>
      
      {error && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#fee2e2', 
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
            Error Details:
          </h2>
          <p><strong>Message:</strong> {error.message}</p>
          <p><strong>Code:</strong> {error.code || 'N/A'}</p>
          <p><strong>Details:</strong> {error.details || 'N/A'}</p>
          <p><strong>Hint:</strong> {error.hint || 'N/A'}</p>
        </div>
      )}
      
      {flag && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f0fff4', 
          borderRadius: '4px' 
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
            Feature Flag Found:
          </h2>
          <p><strong>Key:</strong> {flag.key}</p>
          <p><strong>Description:</strong> {flag.description || 'No description'}</p>
          <p><strong>Enabled:</strong> {flag.enabled ? 'Yes' : 'No'}</p>
          <p><strong>Value:</strong></p>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            backgroundColor: '#e6ffec', 
            padding: '8px', 
            borderRadius: '4px' 
          }}>
            {JSON.stringify(flag.value, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
          Debugging Info:
        </h2>
        <p>Check your browser console for detailed logs.</p>
        <p>Make sure your Supabase environment variables are set correctly.</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '8px'
          }}
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}