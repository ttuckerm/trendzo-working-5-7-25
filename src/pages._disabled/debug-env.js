// src/pages/debug-env.js
export default function DebugEnv() {
    // Client-side environment variables (only NEXT_PUBLIC_* ones)
    const clientEnvVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
        'Present (truncated)' : 'Not set',
      NEXT_PUBLIC_USE_SUPABASE: process.env.NEXT_PUBLIC_USE_SUPABASE,
      NODE_ENV: process.env.NODE_ENV,
    };
  
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Environment Variables Debug</h1>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Client-Side Environment Variables</h2>
          <pre className="bg-black text-green-400 p-3 rounded overflow-auto">
            {JSON.stringify(clientEnvVars, null, 2)}
          </pre>
        </div>
  
        <div className="mt-4">
          <p className="font-medium">Notes:</p>
          <ul className="list-disc ml-6">
            <li>Only variables prefixed with NEXT_PUBLIC_ are available on the client side</li>
            <li>If variables are missing, check your .env.local file</li>
            <li>After updating .env.local, you need to restart the development server</li>
          </ul>
        </div>
      </div>
    );
  }