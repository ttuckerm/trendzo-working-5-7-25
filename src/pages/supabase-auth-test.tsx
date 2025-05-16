import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseClient, testConnection as supabaseTestConnection } from '../lib/supabase-client';
import Link from 'next/link';

export default function SupabaseAuthTest() {
  const { user, loading, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [testResults, setTestResults] = useState({
    connection: 'Not tested',
    featureFlags: 'Not tested',
    userProfile: 'Not tested'
  });

  // Run connection test
  const testConnection = async () => {
    try {
      console.log('=== Starting Supabase connection test ===');
      setMessage('Testing Supabase connection...');
      
      // First do a ping test
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vyeiyccrageckeehyhj.supabase.co';
      console.log(`Testing connection to Supabase URL: ${supabaseUrl}`);
      
      const healthEndpoint = `${supabaseUrl}/auth/v1/health`;
      console.log(`Health check endpoint: ${healthEndpoint}`);
      
      const headers = {
        'Content-Type': 'application/json',
      };
      console.log('Request headers:', headers);
      
      console.log('Attempting health check fetch...');
      let pingResponse;
      try {
        pingResponse = await fetch(healthEndpoint, {
          method: 'GET',
          headers,
        });
        console.log('Health check response status:', pingResponse.status);
        console.log('Health check response statusText:', pingResponse.statusText);
      } catch (error) {
        const fetchError = error as Error;
        console.error('Fetch error details:', fetchError);
        console.error('Error name:', fetchError.name);
        console.error('Error message:', fetchError.message);
        console.error('Error cause:', (fetchError as any).cause);
        console.error('Error stack:', fetchError.stack);
        
        throw new Error(`Network error: ${fetchError.message}`);
      }
      
      if (!pingResponse.ok) {
        console.error('Health check failed with status:', pingResponse.status);
        let responseText = 'Unable to read response';
        try {
          responseText = await pingResponse.text();
          console.error('Error response body:', responseText);
        } catch (textError) {
          console.error('Failed to read error response:', textError);
        }
        
        throw new Error(`Health check failed - Status: ${pingResponse.status} ${pingResponse.statusText} - ${responseText}`);
      }
      
      console.log('Health check successful, proceeding to data test');
      
      // If ping is successful, try a data query
      console.log('Calling testConnection function...');
      const result = await supabaseTestConnection();
      console.log('testConnection result:', result);
      
      if (!result.success) {
        // Show detailed error information
        console.error('Data connection test failed:', result);
        const errorMessage = result.error instanceof Error 
          ? result.error.message 
          : (typeof result.error === 'object' && result.error !== null && 'message' in result.error)
            ? String(result.error.message)
            : 'Unknown error';
            
        const errorDetails = result.details ? JSON.stringify(result.details, null, 2) : '';
        console.error('Error message:', errorMessage);
        console.error('Error details:', errorDetails);
        
        setTestResults(prev => ({ ...prev, connection: `Failed ❌: ${errorMessage}` }));
        setMessage(`Error: ${errorMessage}\n${errorDetails}`);
        return;
      }
      
      console.log('Connection test completed successfully:', result.data);
      setTestResults(prev => ({ ...prev, connection: 'Success ✅' }));
      setMessage(`Connection successful! Found data: ${JSON.stringify(result.data)}`);
      console.log('=== Supabase connection test completed ===');
    } catch (error: any) {
      console.error('=== Supabase connection test failed ===');
      console.error('Error object:', error);
      console.error('Error constructor name:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      const errorMessage = error.message || 'Unknown error';
      setTestResults(prev => ({ ...prev, connection: `Failed ❌: ${errorMessage}` }));
      setMessage(`Error: ${errorMessage}\n\nPlease check your Supabase configuration and ensure your project is accessible.`);
    }
  };

  // Test feature flags
  const testFeatureFlags = async () => {
    try {
      setMessage('Testing feature flags...');
      const { data, error } = await supabaseClient
        .from('feature_flags')
        .select('*')
        .eq('name', 'use_supabase_auth')
        .single();
      
      if (error) throw error;
      
      setTestResults(prev => ({ ...prev, featureFlags: 'Success ✅' }));
      setMessage(`Found flag: ${data.name}, enabled: ${data.enabled}`);
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, featureFlags: `Failed ❌: ${error.message}` }));
      setMessage(`Error: ${error.message}`);
    }
  };

  // Test user profile
  const testUserProfile = async () => {
    if (!user) {
      setMessage('Please sign in first');
      return;
    }

    try {
      setMessage('Testing user profile...');
      const { data, error } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "No rows returned" - that's okay for a new user
        throw error;
      }
      
      if (data) {
        setTestResults(prev => ({ ...prev, userProfile: 'Success ✅' }));
        setMessage(`Found profile for user. Tier: ${data.tier}`);
      } else {
        setMessage('No profile found. Creating one...');
        
        // Create profile
        const { error: createError } = await supabaseClient
          .from('user_profiles')
          .insert({
            user_id: user.id,
            tier: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (createError) throw createError;
        
        setTestResults(prev => ({ ...prev, userProfile: 'Created ✅' }));
        setMessage('Profile created successfully!');
      }
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, userProfile: `Failed ❌: ${error.message}` }));
      setMessage(`Error: ${error.message}`);
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Signing in...');
    
    const { user, error } = await signInWithEmail(email, password);
    
    if (error) {
      setMessage(`Error signing in: ${error.message}`);
    } else {
      setMessage(`Signed in as ${user?.email}`);
    }
  };

  // Handle registration
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Signing up...');
    
    const { user, error } = await signUpWithEmail(email, password);
    
    if (error) {
      setMessage(`Error signing up: ${error.message}`);
    } else if (user) {
      setMessage(`Signed up successfully! Check your email for confirmation.`);
    } else {
      setMessage('Signed up successfully! Please check your email.');
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    setMessage('Signing out...');
    await signOut();
    setMessage('Signed out successfully');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Supabase Authentication Test</h1>
      
      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Authentication Status</h2>
        {loading ? (
          <p>Loading authentication status...</p>
        ) : user ? (
          <div>
            <p className="text-green-600 font-semibold">
              Authenticated as {user.email}
            </p>
            <p><strong>User ID:</strong> {user.id}</p>
            <button 
              onClick={handleSignOut}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <p className="text-red-600">Not authenticated</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-bold mb-4">Sign In</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Sign In
            </button>
          </form>
        </div>

        <div className="p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-bold mb-4">Sign Up</h2>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>

      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Supabase Connection Tests</h2>
        <div className="flex space-x-4 mb-4">
          <button
            onClick={testConnection}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Connection
          </button>
          <button
            onClick={testFeatureFlags}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Test Feature Flags
          </button>
          <button
            onClick={testUserProfile}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Test User Profile
          </button>
        </div>
        
        <div className="mt-4">
          <h3 className="font-bold mb-2">Test Results:</h3>
          <ul className="space-y-2">
            <li><strong>Connection:</strong> {testResults.connection}</li>
            <li><strong>Feature Flags:</strong> {testResults.featureFlags}</li>
            <li><strong>User Profile:</strong> {testResults.userProfile}</li>
          </ul>
        </div>
        
        {message && (
          <div className="mt-4 p-3 border rounded bg-blue-50">
            <p>{message}</p>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <Link href="/" className="text-blue-500 hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
} 