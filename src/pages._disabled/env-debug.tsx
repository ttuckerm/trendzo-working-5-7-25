import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface EnvVar {
  name: string;
  value: string;
  isSensitive: boolean;
  isSet: boolean;
}

export default function EnvDebug() {
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [showSensitive, setShowSensitive] = useState(false);

  useEffect(() => {
    // Collect environment variables
    const vars: EnvVar[] = [
      {
        name: 'NEXT_PUBLIC_SUPABASE_URL',
        value: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        isSensitive: false,
        isSet: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      },
      {
        name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        isSensitive: true,
        isSet: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      {
        name: 'NEXT_PUBLIC_USE_SUPABASE',
        value: process.env.NEXT_PUBLIC_USE_SUPABASE || '',
        isSensitive: false,
        isSet: !!process.env.NEXT_PUBLIC_USE_SUPABASE
      },
      {
        name: 'NODE_ENV',
        value: process.env.NODE_ENV || '',
        isSensitive: false,
        isSet: !!process.env.NODE_ENV
      }
    ];

    setEnvVars(vars);
  }, []);

  const checkSupabaseConnection = async () => {
    // Add client-side code to validate the Supabase connection
    console.log('Testing Supabase connection with current environment variables');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      alert('Missing Supabase URL or key in environment variables');
      return;
    }
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey
        }
      });
      
      if (response.ok) {
        alert(`Connection successful! Status: ${response.status}`);
      } else {
        alert(`Connection failed. Status: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      alert(`Connection error: ${error.message}`);
    }
  };

  // Format the value for display
  const formatValue = (variable: EnvVar) => {
    if (!variable.isSet) return 'Not set';
    if (variable.isSensitive && !showSensitive) {
      // Show only first 8 characters followed by asterisks
      return variable.value.substring(0, 8) + '************************';
    }
    return variable.value;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Debug</h1>
      
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showSensitive}
            onChange={(e) => setShowSensitive(e.target.checked)}
            className="mr-2"
          />
          Show sensitive values
        </label>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Supabase Configuration</h2>
        <div className="bg-gray-50 p-4 rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Variable</th>
                <th className="text-left py-2">Value</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {envVars.map((variable) => (
                <tr key={variable.name} className="border-b">
                  <td className="py-2 font-mono text-sm">{variable.name}</td>
                  <td className="py-2 font-mono text-sm break-all">
                    {formatValue(variable)}
                  </td>
                  <td className="py-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold 
                      ${variable.isSet ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {variable.isSet ? 'Set' : 'Not Set'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Client-Side Network Info</h2>
        <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
          <div>
            <p><strong>User Agent:</strong> <span id="useragent" className="font-mono text-sm">{typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</span></p>
          </div>
          <div>
            <p><strong>Online Status:</strong> <span id="online" className="font-mono text-sm">{typeof window !== 'undefined' ? (window.navigator.onLine ? 'Online' : 'Offline') : 'N/A'}</span></p>
          </div>
          <div>
            <button
              onClick={checkSupabaseConnection}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Check Supabase Connection
            </button>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Troubleshooting Tips</h2>
        <div className="bg-gray-50 p-4 rounded-lg border">
          <ul className="list-disc pl-5 space-y-2">
            <li>If environment variables are not set, check your <code className="bg-gray-200 px-1 rounded">.env.local</code> file</li>
            <li>For development, make sure you're using <code className="bg-gray-200 px-1 rounded">npm run dev</code> to start the server</li>
            <li>Restart your development server after changing environment variables</li>
            <li>Environment variables are embedded at build time - deploy again if you update them</li>
            <li>Only variables prefixed with <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_</code> are available in the browser</li>
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <Link href="/fetch-test" className="text-blue-500 hover:underline mr-4">
          Network Tests
        </Link>
        <Link href="/supabase-auth-test" className="text-blue-500 hover:underline">
          Back to Auth Test
        </Link>
      </div>
    </div>
  );
} 