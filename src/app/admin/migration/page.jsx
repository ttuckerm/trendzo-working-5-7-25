'use client';

import { useState } from 'react';
import { runMigration } from '@/lib/utils/migration';

export default function MigrationPage() {
  const [status, setStatus] = useState('idle'); // idle, running, success, error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const handleRunMigration = async () => {
    try {
      setStatus('running');
      setError(null);
      
      // Run the migration
      const migrationResult = await runMigration();
      setResult(migrationResult);
      
      if (migrationResult.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setError(migrationResult.error || 'Migration failed. See details below.');
      }
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Unexpected error during migration');
      console.error('Migration error:', err);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Firebase to Supabase Migration</h1>
      
      <div className="mb-8">
        <p className="mb-4">
          This tool will migrate your data from Firebase to Supabase, including:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>User accounts (authentication)</li>
          <li>User metadata</li>
        </ul>
        <p className="mb-4 font-medium">
          Note: This process only needs to be run once. Running it multiple times may create duplicate users in Supabase.
        </p>
      </div>
      
      <div className="flex justify-start mb-8">
        <button
          onClick={handleRunMigration}
          disabled={status === 'running'}
          className={`py-2 px-6 rounded-md font-medium ${
            status === 'running'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {status === 'running' ? 'Migration Running...' : 'Start Migration'}
        </button>
      </div>
      
      {/* Status display */}
      {status !== 'idle' && (
        <div className={`p-4 rounded-md mb-6 ${
          status === 'running' ? 'bg-blue-50 border border-blue-200' :
          status === 'success' ? 'bg-green-50 border border-green-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <h2 className="font-semibold mb-2">
            {status === 'running' ? 'Migration in Progress' :
             status === 'success' ? 'Migration Successful' : 
             'Migration Failed'}
          </h2>
          
          {status === 'error' && error && (
            <p className="text-red-600 mb-2">{error}</p>
          )}
          
          {status === 'success' && (
            <p className="text-green-600 mb-2">
              All data has been successfully migrated to Supabase!
            </p>
          )}
        </div>
      )}
      
      {/* Result details */}
      {result && (
        <div className="border rounded-md p-4">
          <h3 className="font-semibold mb-3">Migration Details</h3>
          
          {/* User migration results */}
          {result.userResults && result.userResults.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">User Migration</h4>
              <div className="bg-gray-50 p-3 rounded overflow-auto max-h-64">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Email</th>
                      <th className="text-left py-2 px-3">Status</th>
                      <th className="text-left py-2 px-3">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.userResults.map((user, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-3">{user.email}</td>
                        <td className="py-2 px-3">
                          <span className={`inline-block py-1 px-2 rounded-full text-xs ${
                            user.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {user.success 
                            ? `Firebase UID: ${user.firebaseUid} → Supabase ID: ${user.supabaseUserId}`
                            : user.error
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Cleanup results */}
          {result.cleanupResult && (
            <div>
              <h4 className="font-medium mb-2">Cleanup</h4>
              <p className={result.cleanupResult.success ? 'text-green-600' : 'text-red-600'}>
                {result.cleanupResult.success 
                  ? result.cleanupResult.message 
                  : `Cleanup failed: ${result.cleanupResult.error}`}
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="font-semibold mb-2">Next Steps</h3>
        <p className="mb-2">After migration is complete:</p>
        <ol className="list-decimal pl-6">
          <li className="mb-1">Test login functionality with migrated users</li>
          <li className="mb-1">Update your code to use Supabase authentication instead of Firebase</li>
          <li className="mb-1">Set the <code>NEXT_PUBLIC_USE_SUPABASE=true</code> environment variable</li>
        </ol>
      </div>
    </div>
  );
} 