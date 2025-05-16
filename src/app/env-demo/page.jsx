import { ServerEnvDisplay } from '@/components/ui/ServerEnvDisplay';
import { ClientEnvDisplay } from '@/components/ui/EnvDisplay';
import { getPublicEnvConfig } from '@/lib/utils/env';
import { debugServerEnv } from './env-debug';

export const metadata = {
  title: 'Environment Variables Demo',
  description: 'A demo of proper environment variable handling in Next.js',
};

export default function EnvDemoPage() {
  // Run diagnostic tool on the server
  const publicEnvVars = debugServerEnv();
  console.log('Environment variables loaded on server render:', publicEnvVars);
  
  // This code runs on the server
  const publicConfig = getPublicEnvConfig();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Demo</h1>
      
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded">
        <h2 className="text-lg font-semibold mb-2">Environment Diagnostic</h2>
        <p>
          Check the server console for detailed environment variable diagnostics.
          Next.js loaded these environment files: <code>.env.local</code>, <code>.env.development</code>, <code>.env</code>
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Server-Side Access</h2>
        <p className="mb-4 text-gray-700">
          Server components can access both public and private environment variables.
        </p>
        <ServerEnvDisplay />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Client-Side Access</h2>
        <p className="mb-4 text-gray-700">
          Client components can only access variables prefixed with NEXT_PUBLIC_.
        </p>
        <ClientEnvDisplay />
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Usage Guide</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Server Components:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mt-2">
              {`import { getEnvVariable } from '@/lib/utils/env';

// Access any env variable on the server
const apiKey = getEnvVariable('API_KEY');
const publicUrl = getEnvVariable('NEXT_PUBLIC_SITE_URL');`}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium">Client Components:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mt-2">
              {`import { getClientEnvVariable } from '@/lib/utils/env';

// Only public variables are accessible
// Note: No need to add NEXT_PUBLIC_ prefix
const siteUrl = getClientEnvVariable('SITE_URL');`}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium">Available Public Variables:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto mt-2">
              {JSON.stringify(publicConfig, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
} 