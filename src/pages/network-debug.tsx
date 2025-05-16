import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface TestResult {
  endpoint: string;
  status: string;
  details: string;
  duration: number;
}

export default function NetworkDebug() {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [proxyEnabled, setProxyEnabled] = useState(false);

  useEffect(() => {
    // Get the Supabase URL from env or use fallback
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vyeiyccrageckeehyhj.supabase.co';
    setSupabaseUrl(url);
  }, []);

  const runNetworkTest = async (url: string, options: RequestInit = {}) => {
    const startTime = performance.now();
    try {
      console.log(`Fetching ${url} with options:`, options);
      const response = await fetch(url, options);
      const endTime = performance.now();
      
      let responseText = '';
      try {
        // Try to get response text if possible
        responseText = await response.text();
      } catch (e) {
        responseText = 'Unable to read response body';
      }
      
      return {
        endpoint: url,
        status: `${response.status} ${response.statusText}`,
        details: `Headers: ${JSON.stringify(Object.fromEntries(response.headers))}\n\nBody: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...(truncated)' : ''}`,
        duration: Math.round(endTime - startTime)
      };
    } catch (error: any) {
      const endTime = performance.now();
      return {
        endpoint: url,
        status: 'Error',
        details: `${error.name}: ${error.message}\n${error.stack || ''}`,
        duration: Math.round(endTime - startTime)
      };
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    // Define the endpoints to test
    const testEndpoints = [
      // Test 1: Basic connection
      { 
        url: supabaseUrl,
        options: { method: 'GET' }
      },
      // Test 2: Health check
      { 
        url: `${supabaseUrl}/auth/v1/health`,
        options: { method: 'GET' }
      },
      // Test 3: With auth headers
      { 
        url: `${supabaseUrl}/rest/v1/`,
        options: { 
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          }
        }
      },
      // Test 4: Use a different host to verify general internet connectivity
      {
        url: 'https://httpbin.org/get',
        options: { method: 'GET' }
      }
    ];

    const results: TestResult[] = [];
    
    for (const test of testEndpoints) {
      const result = await runNetworkTest(
        proxyEnabled ? `/api/proxy?url=${encodeURIComponent(test.url)}` : test.url, 
        test.options
      );
      results.push(result);
      setTestResults([...results]);  // Update after each test for real-time feedback
    }
    
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Network Connectivity Debugger</h1>
      
      <div className="mb-6 p-4 bg-gray-50 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Connection Settings</h2>
        <div className="mb-3">
          <label className="block mb-1">Supabase URL:</label>
          <input 
            type="text" 
            value={supabaseUrl} 
            onChange={(e) => setSupabaseUrl(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="mb-3">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={proxyEnabled}
              onChange={(e) => setProxyEnabled(e.target.checked)}
              className="mr-2"
            />
            Use server-side proxy (helps bypass CORS issues)
          </label>
        </div>
        
        <button
          onClick={runAllTests}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Running Tests...' : 'Run Network Tests'}
        </button>
      </div>
      
      {testResults.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {testResults.map((result, i) => (
            <div key={i} className="mb-4 p-4 border rounded-lg">
              <h3 className="font-bold">{new URL(result.endpoint).pathname || '/'} ({result.duration}ms)</h3>
              <p className={`font-semibold ${result.status.startsWith('2') ? 'text-green-600' : 'text-red-600'}`}>
                Status: {result.status}
              </p>
              <details>
                <summary>Response Details</summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded-lg overflow-x-auto whitespace-pre-wrap text-sm">
                  {result.details}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}
      
      <div className="text-gray-700 p-4 bg-gray-50 border rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Network Troubleshooting Tips</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>CORS errors may indicate the browser is blocking cross-origin requests</li>
          <li>DNS issues might indicate network configuration problems</li>
          <li>Timeouts suggest firewall or connectivity issues</li>
          <li>If server-side proxy works but direct doesn't, CORS is likely the issue</li>
          <li>Check for VPN, proxy settings, or firewall rules blocking connections</li>
        </ul>
      </div>
      
      <div className="mt-4">
        <Link href="/supabase-auth-test" className="text-blue-500 hover:underline">
          Back to Supabase Auth Test
        </Link>
      </div>
    </div>
  );
} 