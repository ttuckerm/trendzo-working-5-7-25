import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DirectSupabaseTest() {
  const [status, setStatus] = useState('Not tested');
  const [message, setMessage] = useState('');
  const [projectDetails, setProjectDetails] = useState({
    url: '',
    key: ''
  });
  const [networkLogs, setNetworkLogs] = useState<string[]>([]);

  useEffect(() => {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    setProjectDetails({
      url: supabaseUrl || 'Not set',
      key: supabaseKey ? 'Set (hidden)' : 'Not set'
    });

    // Log client details
    addLog(`Page loaded at: ${new Date().toISOString()}`);
    addLog(`Browser: ${navigator.userAgent}`);
    addLog(`Network status: ${navigator.onLine ? 'Online' : 'Offline'}`);
  }, []);

  // Helper to add logs with timestamps
  const addLog = (log: string) => {
    setNetworkLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  const testConnection = async () => {
    setStatus('Testing...');
    addLog('Starting connection test...');
    
    try {
      // Hard-coded values as fallbacks
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vyeiyccrageckeehyhj.supabase.co';
      
      // First test a simple ping to the Supabase URL
      setMessage(`Testing connectivity to ${supabaseUrl}...`);
      addLog(`Sending request to ${supabaseUrl}`);
      
      const startTime = performance.now();
      
      // Try with different fetch options for diagnostic purposes
      try {
        const pingResponse = await fetch(supabaseUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          headers: { 'Accept': 'application/json' },
        });
        
        const endTime = performance.now();
        addLog(`Response received in ${Math.round(endTime - startTime)}ms`);
        addLog(`Status: ${pingResponse.status} ${pingResponse.statusText}`);
        
        // Try to get response body
        try {
          const text = await pingResponse.text();
          addLog(`Response body: ${text.substring(0, 100)}${text.length > 100 ? '...(truncated)' : ''}`);
        } catch (bodyErr) {
          addLog(`Error reading response body: ${bodyErr}`);
        }
        
        setMessage(previous => previous + `\nServer ping status: ${pingResponse.status} ${pingResponse.statusText}`);
      } catch (fetchErr: any) {
        addLog(`⚠️ Fetch error: ${fetchErr.name}: ${fetchErr.message}`);
        if (fetchErr.cause) addLog(`Error cause: ${JSON.stringify(fetchErr.cause)}`);
        
        // Try with no-cors mode as fallback
        addLog('Retrying with no-cors mode...');
        try {
          const noCorsResponse = await fetch(supabaseUrl, {
            method: 'GET',
            mode: 'no-cors',
          });
          addLog(`no-cors response type: ${noCorsResponse.type}`);
          setMessage(previous => previous + `\nno-cors request: ${noCorsResponse.type}`);
        } catch (noCorsErr: any) {
          addLog(`⚠️ no-cors fetch error: ${noCorsErr.message}`);
          setMessage(previous => previous + `\nBoth modes failed: ${noCorsErr.message}`);
        }
      }
      
      // Try DNS lookup via image load (non-CORS technique)
      addLog('Testing DNS resolution via image...');
      const imgTest = new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => resolve('DNS resolution successful');
        img.onerror = () => resolve('DNS resolution failed');
        img.src = `${supabaseUrl}/favicon.ico?random=${Date.now()}`;
        setTimeout(() => resolve('DNS test timed out'), 5000);
      });
      
      const dnsResult = await imgTest;
      addLog(`Image load test: ${dnsResult}`);
      
      // Final status
      addLog('Test completed');
      setStatus('Completed');
      
    } catch (error: any) {
      addLog(`❌ Error during test: ${error.name}: ${error.message}`);
      setStatus('Failed');
      setMessage(previous => previous + `\nError: ${error.message}\n\nThis likely indicates a network, CORS, or configuration issue.`);
      console.error('Direct connection test error:', error);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Direct Supabase Connection Test</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
        <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {projectDetails.url}</p>
        <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {projectDetails.key}</p>
      </div>
      
      <div className="mb-4">
        <button 
          onClick={testConnection}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Basic Connectivity
        </button>
      </div>
      
      <div className="mb-4 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Status: {status}</h2>
        {message && (
          <pre className="whitespace-pre-wrap bg-gray-100 p-3 rounded">
            {message}
          </pre>
        )}
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Network Logs</h2>
        <div className="h-64 overflow-y-auto bg-black text-green-400 font-mono p-3 rounded">
          {networkLogs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
      
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h2 className="text-lg font-semibold mb-2">Troubleshooting Tips</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>CORS errors indicate browser security policy restrictions</li>
          <li>"Failed to fetch" usually means network connectivity issues</li>
          <li>Check if your network blocks or restricts outgoing connections</li>
          <li>Try accessing the Supabase URL directly in your browser</li>
          <li>Verify your Supabase project is active in the Supabase dashboard</li>
        </ul>
      </div>
      
      <Link href="/test-index" className="text-blue-500 hover:underline">
        Back to test index
      </Link>
    </div>
  );
} 