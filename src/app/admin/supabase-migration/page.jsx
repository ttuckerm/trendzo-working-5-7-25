'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { runMigration } from '@/lib/utils/migration';
import { useSupabaseAuth } from '@/lib/auth/provider-switcher';

export default function SupabaseMigrationPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const isUsingSupabase = useSupabaseAuth();

  const handleRunMigration = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      const migrationResult = await runMigration();
      setResult(migrationResult);
      
      if (!migrationResult.success) {
        setError(migrationResult.error || 'Migration failed for unknown reasons');
      }
    } catch (err) {
      console.error('Error running migration:', err);
      setError(err.message || 'An unexpected error occurred');
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Firebase to Supabase Migration</h1>
      
      {isUsingSupabase && (
        <Alert variant="warning" className="mb-6">
          <AlertTitle>Supabase Already Enabled</AlertTitle>
          <AlertDescription>
            Your app is already configured to use Supabase for authentication.
            Running this migration again may cause duplicate user accounts.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Migration Tool</CardTitle>
          <CardDescription>
            This tool will migrate your user accounts from Firebase to Supabase.
            Make sure you have Supabase properly configured before proceeding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border p-4 rounded-md bg-muted/20">
              <h3 className="font-medium mb-2">Prerequisites:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Supabase project set up and configured</li>
                <li>NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY set in .env.local</li>
                <li>SUPABASE_SERVICE_ROLE_KEY set in .env.local (required for user creation)</li>
                <li>Firebase properly configured</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleRunMigration} 
            disabled={isRunning}
            variant="default"
          >
            {isRunning ? 'Running Migration...' : 'Run Migration'}
          </Button>
        </CardFooter>
      </Card>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Migration Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>
              {result.success ? '✅ Migration Successful' : '❌ Migration Completed with Issues'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.userResults && (
                <div>
                  <h3 className="font-medium mb-2">User Migration Results:</h3>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {result.userResults.map((user, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 whitespace-nowrap">{user.email}</td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {user.success ? (
                                <span className="text-green-500">✓ Success</span>
                              ) : (
                                <span className="text-red-500">✗ Failed</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {user.success ? (
                                <span className="text-sm">
                                  {user.message || `Firebase UID: ${user.firebaseUid} → Supabase ID: ${user.supabaseUserId}`}
                                </span>
                              ) : (
                                <span className="text-sm text-red-500">{user.error}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {result.cleanupResult && result.cleanupResult.nextSteps && (
                <div>
                  <h3 className="font-medium mb-2">Next Steps:</h3>
                  <ol className="list-decimal pl-5 space-y-1">
                    {result.cleanupResult.nextSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
 