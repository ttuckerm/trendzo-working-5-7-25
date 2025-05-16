import { getEnvVariable, getClientEnvVariable, getPublicEnvConfig } from '@/lib/utils/env';

/**
 * Server component to demonstrate environment variable access
 */
export function ServerEnvDisplay() {
  // Server components can access both private and public variables
  const supabaseUrl = getEnvVariable('NEXT_PUBLIC_SUPABASE_URL', 'Not configured');
  const supabaseKey = getEnvVariable('SUPABASE_SERVICE_ROLE_KEY', 'Not configured');
  const authSecret = getEnvVariable('NEXTAUTH_SECRET', 'Not configured');
  const forceEditor = getEnvVariable('NEXT_PUBLIC_FORCE_EDITOR', 'Not configured');
  const useSupabase = getEnvVariable('NEXT_PUBLIC_USE_SUPABASE', 'Not configured');
  
  // Can also use the client helper (better for consistency)
  const publicSupabaseUrl = getClientEnvVariable('SUPABASE_URL', 'Not configured');
  
  // Get all public variables
  const publicConfig = getPublicEnvConfig();
  
  return (
    <div className="p-4 border rounded-md mb-4">
      <h2 className="text-lg font-bold mb-2">Server Environment</h2>
      <ul className="space-y-1">
        <li>Supabase URL: {supabaseUrl}</li>
        <li>Supabase Service Key: {supabaseKey.substring(0, 10)}...</li>
        <li>Auth Secret: {authSecret.substring(0, 10)}...</li> 
        <li>Force Editor: {forceEditor}</li>
        <li>Use Supabase: {useSupabase}</li>
        <li>Public Supabase URL: {publicSupabaseUrl}</li>
        <li>Node Env: {getEnvVariable('NODE_ENV', 'unknown')}</li>
      </ul>
      
      <div className="mt-4">
        <h3 className="font-semibold">All Public Variables:</h3>
        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
          {JSON.stringify(publicConfig, null, 2)}
        </pre>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> In development mode, some environment variables may be loaded from 
          hardcoded defaults due to limitations in how Next.js exposes environment variables.
        </p>
      </div>
    </div>
  );
} 