'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ETLJobStatus from '@/components/admin/ETLJobStatus';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Play, BarChart } from 'lucide-react';
import Link from 'next/link';

const TIKTOK_CATEGORIES = [
  'trending',
  'beauty',
  'fashion',
  'fitness',
  'food',
  'comedy',
  'lifestyle',
  'tech',
  'gaming',
  'music'
];

export default function ETLDashboardPage() {
  const { user, isAdmin } = useAuth();
  const [category, setCategory] = useState('trending');
  const [customCategory, setCustomCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState('status');
  
  // In testing mode, we don't need to run ETL
  const isTestingMode = process.env.NEXT_PUBLIC_TESTING_MODE === 'true';
  
  // Run ETL function
  const runETL = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Prepare the category to use
      const categoryToUse = category === 'custom' ? customCategory.trim() : category;
      
      if (category === 'custom' && !customCategory.trim()) {
        throw new Error('Please enter a custom category');
      }
      
      // Prepare API request
      const response = await fetch('/api/etl/run-tiktok-etl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY || '',
        },
        body: JSON.stringify({
          type: 'category',
          options: {
            category: categoryToUse,
            maxItems: 30,
          },
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run ETL process');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Error running ETL:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // If user is not authorized, show login message
  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="mx-auto max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-4">Admin Access Required</h1>
          <p className="text-gray-600 mb-6 text-center">
            You need to be logged in as an admin to access this page.
          </p>
          <div className="flex justify-center">
            <a 
              href="/login" 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">ETL Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Monitor and manage TikTok template ETL pipelines
      </p>
      
      <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="status">Job Status</TabsTrigger>
          <TabsTrigger value="run">Run ETL Jobs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="space-y-6">
          <ETLJobStatus />
        </TabsContent>
        
        <TabsContent value="run">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Run ETL Process</h2>
            
            <form onSubmit={runETL} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIKTOK_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                  <option value="custom">Custom Category</option>
                </select>
              </div>
              
              {category === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Category Name
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category name"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || isTestingMode}
                  className={`
                    flex items-center justify-center px-4 py-2 rounded-md text-white
                    ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}
                    ${isTestingMode ? 'bg-gray-400 cursor-not-allowed' : ''}
                    transition duration-200
                  `}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run ETL Process
                    </>
                  )}
                </button>
                
                {isTestingMode && (
                  <p className="mt-2 text-sm text-yellow-600">
                    <AlertTriangle className="inline-block w-4 h-4 mr-1" />
                    ETL execution is disabled in testing mode.
                  </p>
                )}
              </div>
            </form>
            
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                <XCircle className="inline-block w-4 h-4 mr-2" />
                {error}
              </div>
            )}
            
            {result && (
              <div className="mt-6 border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Result</h3>
                <div className="bg-green-50 p-4 rounded-md">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">ETL Process Completed</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Execution time: {result.executionTime || 'N/A'}
                      </p>
                      <div className="mt-2 text-sm">
                        <p>
                          <span className="font-medium">Videos processed:</span>{' '}
                          {result.processed || 0}
                        </p>
                        {result.templates !== undefined && (
                          <p>
                            <span className="font-medium">Templates created:</span>{' '}
                            {result.templates}
                          </p>
                        )}
                        {result.skipped !== undefined && (
                          <p>
                            <span className="font-medium">Videos skipped:</span>{' '}
                            {result.skipped}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Advanced ETL Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Find Similar Templates</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Run batch analysis to find similar templates across categories.
                </p>
                <button 
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded text-sm"
                  onClick={() => alert('This feature is coming soon!')}
                >
                  Start Similarity Analysis
                </button>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Detect Trending Templates</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Analyze growth velocity to identify trending templates.
                </p>
                <button 
                  className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded text-sm"
                  onClick={() => alert('This feature is coming soon!')}
                >
                  Detect Trends
                </button>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Historical Impact Analysis</h3>
                <p className="text-sm text-gray-600 mb-3">
                  View detailed analysis of how expert adjustments affect prediction accuracy.
                </p>
                <Link 
                  href="/impact-analysis"
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-sm inline-flex items-center"
                >
                  <BarChart className="w-4 h-4 mr-1" />
                  View Impact Dashboard
                </Link>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 