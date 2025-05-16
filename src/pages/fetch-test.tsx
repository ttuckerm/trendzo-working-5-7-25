import React, { useState } from 'react';
import Link from 'next/link';

export default function FetchTest() {
  const [url, setUrl] = useState(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vyeiyccrageckeehyhj.supabase.co');
  const [mode, setMode] = useState<RequestMode>('cors');
  const [credentials, setCredentials] = useState<RequestCredentials>('same-origin');
  const [results, setResults] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showAddlHeaders, setShowAddlHeaders] = useState(false);
  const [headers, setHeaders] = useState('');

  const runTest = async () => {
    setLoading(true);
    setResults('');
    
    let log = '';
    const logLine = (text: string) => {
      log += text + '\n';
      setResults(log);
    };
    
    try {
      // Parse custom headers
      const headersObj: Record<string, string> = {};
      if (showAddlHeaders && headers.trim()) {
        try {
          headers.split('\n').forEach(line => {
            const [key, value] = line.split(':').map(part => part.trim());
            if (key && value) headersObj[key] = value;
          });
        } catch (e) {
          logLine(`⚠️ Error parsing headers: ${e}`);
        }
      }

      logLine(`🔄 Testing URL: ${url}`);
      logLine(`⚙️ Options: mode=${mode}, credentials=${credentials}`);
      if (Object.keys(headersObj).length > 0) {
        logLine(`📋 Headers: ${JSON.stringify(headersObj, null, 2)}`);
      }
      logLine('---------------------');
      
      // Network test
      logLine('Starting fetch...');
      const startTime = performance.now();
      
      const response = await fetch(url, {
        method: 'GET',
        mode,
        credentials,
        headers: headersObj
      });
      
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      logLine(`✅ Response received in ${duration}ms`);
      logLine(`Status: ${response.status} ${response.statusText}`);
      logLine('Headers:');
      response.headers.forEach((value, key) => {
        logLine(`  ${key}: ${value}`);
      });
      
      // Response body
      try {
        // First try to parse as JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await response.json();
          logLine('Body (JSON):');
          logLine(JSON.stringify(json, null, 2));
        } else {
          const text = await response.text();
          logLine('Body:');
          logLine(text.length > 1000 ? text.substring(0, 1000) + '... (truncated)' : text);
        }
      } catch (e) {
        logLine(`Error reading response body: ${e}`);
      }
      
    } catch (error: any) {
      logLine(`❌ Error: ${error.name}: ${error.message}`);
      if (error.cause) logLine(`Cause: ${JSON.stringify(error.cause)}`);
      if (error.stack) logLine(`Stack: ${error.stack}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Simple Fetch Test</h1>
      
      <div className="mb-4 p-4 bg-gray-50 border rounded">
        <div className="mb-3">
          <label className="block mb-1">URL:</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1">Fetch Mode:</label>
            <select 
              value={mode}
              onChange={(e) => setMode(e.target.value as RequestMode)}
              className="w-full p-2 border rounded"
            >
              <option value="cors">cors (default)</option>
              <option value="no-cors">no-cors</option>
              <option value="same-origin">same-origin</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-1">Credentials:</label>
            <select 
              value={credentials}
              onChange={(e) => setCredentials(e.target.value as RequestCredentials)}
              className="w-full p-2 border rounded"
            >
              <option value="same-origin">same-origin (default)</option>
              <option value="include">include</option>
              <option value="omit">omit</option>
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={showAddlHeaders}
              onChange={(e) => setShowAddlHeaders(e.target.checked)}
              className="mr-2"
            />
            Add custom headers
          </label>
          
          {showAddlHeaders && (
            <div className="mt-2">
              <textarea
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder="Content-Type: application/json
apikey: your-key-here"
                className="w-full p-2 border rounded font-mono text-sm"
                rows={4}
              />
              <p className="text-sm text-gray-600 mt-1">
                Enter headers in "Key: Value" format, one per line
              </p>
            </div>
          )}
        </div>
        
        <button
          onClick={runTest}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Run Test'}
        </button>
      </div>
      
      {results && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Results</h2>
          <pre className="p-4 bg-black text-green-400 rounded-lg font-mono text-sm overflow-x-auto whitespace-pre-wrap">
            {results}
          </pre>
        </div>
      )}
      
      <div className="mt-4">
        <Link href="/network-debug" className="text-blue-500 hover:underline mr-4">
          Advanced Network Debug
        </Link>
        <Link href="/supabase-auth-test" className="text-blue-500 hover:underline">
          Back to Auth Test
        </Link>
      </div>
    </div>
  );
} 