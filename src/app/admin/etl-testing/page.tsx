'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { runAllTests } from '@/lib/etl/endpoint-test';

// Types
interface ETLResult {
  success: boolean;
  type: string;
  result: {
    itemsProcessed?: number;
    success?: number;
    skipped?: number;
    failed?: number;
    timeElapsed?: number;
    templatesCreated?: number;
    [key: string]: any;
  };
  message?: string;
}

interface ETLJob {
  type: string;
  schedule: string;
  description: string;
  options?: Record<string, any>;
}

// Categories for TikTok ETL
const TIKTOK_CATEGORIES = [
  'dance', 'tutorial', 'comedy', 'product', 'fashion', 
  'beauty', 'lifestyle', 'fitness', 'food', 'educational'
];

// Predefined ETL jobs
const ETL_JOBS: ETLJob[] = [
  {
    type: 'trending',
    schedule: '0 */6 * * *', // Every 6 hours
    description: 'Fetch trending TikTok videos and create templates',
    options: { maxItems: 30 }
  },
  {
    type: 'categories',
    schedule: '0 0 * * *', // Once per day (midnight)
    description: 'Fetch videos by category and create templates',
    options: {
      categories: ['dance', 'product', 'tutorial', 'comedy', 'fashion'],
      maxItems: 20
    }
  },
  {
    type: 'update-stats',
    schedule: '0 */12 * * *', // Every 12 hours
    description: 'Update statistics for existing templates',
    options: {}
  }
];

export default function ETLTestingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // States
  const [selectedJob, setSelectedJob] = useState<string>('trending');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['dance', 'tutorial', 'comedy']);
  const [maxItems, setMaxItems] = useState<number>(20);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ETLResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState<'manual' | 'simulated'>('simulated');
  const [activeTab, setActiveTab] = useState<'run' | 'scheduled' | 'history'>('run');
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Build job options based on selected job type
  const buildJobOptions = () => {
    const options: Record<string, any> = {};
    
    if (selectedJob === 'trending' || selectedJob === 'categories') {
      options.maxItems = maxItems;
    }
    
    if (selectedJob === 'categories') {
      options.categories = selectedCategories;
    }
    
    return options;
  };

  // Run ETL job manually
  const runETLJob = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const jobOptions = {
        type: selectedJob,
        options: buildJobOptions()
      };

      console.log('Running ETL job with options:', jobOptions);

      // In simulated mode, we don't make real API calls
      if (testMode === 'simulated') {
        console.log('[SIMULATED] ETL job call');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
        
        // Create a simulated result
        const simulatedResult: ETLResult = {
          success: true,
          type: selectedJob,
          result: {
            itemsProcessed: Math.floor(Math.random() * 20) + 5,
            success: Math.floor(Math.random() * 10) + 1,
            skipped: Math.floor(Math.random() * 5),
            failed: 0,
            timeElapsed: Math.floor(Math.random() * 30000) + 5000, // 5-35 seconds
          },
          message: 'Job completed successfully (simulated)'
        };
        
        setResult(simulatedResult);
      } else {
        // Make the actual API call
        const response = await fetch('/api/etl/run-tiktok-etl', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ETL_API_KEY}`
          },
          body: JSON.stringify(jobOptions)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to run ETL process');
        }

        const data = await response.json();
        setResult(data);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle category selection toggling
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Format time in milliseconds to readable format
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Get cron expression explanation
  const explainCron = (expression: string): string => {
    const parts = expression.split(' ');
    if (parts.length !== 5) return 'Invalid cron expression';

    const [minute, hour, dayMonth, month, dayWeek] = parts;

    if (minute === '0' && hour === '*/6') {
      return 'Every 6 hours (at minute 0)';
    } else if (minute === '0' && hour === '*/12') {
      return 'Every 12 hours (at minute 0)';
    } else if (minute === '0' && hour === '0') {
      return 'Once per day at midnight';
    } else if (minute === '*' && hour === '*') {
      return 'Every minute';
    }

    return `At ${minute} ${hour} on ${dayMonth} of ${month} (${dayWeek})`;
  };

  // Run tests function
  const handleRunTests = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      const results = await runAllTests();
      console.log('Test results:', results);
      setTestResults(results);
    } catch (err) {
      console.error('Error running tests:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  // Only show loading or authenticated content
  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect due to useEffect above
  }

  return (
    <div className="container p-4 mx-auto">
      <h1 className="mb-6 text-2xl font-bold">ETL Testing Dashboard</h1>
      
      {/* Navigation tabs */}
      <div className="flex mb-6 space-x-2 border-b">
        <button
          className={`px-4 py-2 ${activeTab === 'run' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('run')}
        >
          Run Manual Jobs
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'scheduled' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('scheduled')}
        >
          Scheduled Jobs
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'history' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('history')}
        >
          Job History
        </button>
      </div>
      
      {activeTab === 'run' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Configuration panel */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold">ETL Job Configuration</h2>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Test Mode
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="testMode"
                    value="simulated"
                    checked={testMode === 'simulated'}
                    onChange={() => setTestMode('simulated')}
                  />
                  <span className="ml-2">Simulated (No API calls)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="testMode"
                    value="manual"
                    checked={testMode === 'manual'}
                    onChange={() => setTestMode('manual')}
                  />
                  <span className="ml-2">Real API Call</span>
                </label>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                ETL Job Type
              </label>
              <select
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
              >
                <option value="trending">Trending Videos</option>
                <option value="categories">Category-based Videos</option>
                <option value="update-stats">Update Template Stats</option>
              </select>
            </div>
            
            {(selectedJob === 'trending' || selectedJob === 'categories') && (
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Max Items to Process
                </label>
                <input
                  type="number"
                  className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={maxItems}
                  onChange={(e) => setMaxItems(Number(e.target.value))}
                  min={1}
                  max={100}
                />
              </div>
            )}
            
            {selectedJob === 'categories' && (
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Categories
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIKTOK_CATEGORIES.map((category) => (
                    <label key={category} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                      />
                      <span className="ml-2 capitalize">{category}</span>
                    </label>
                  ))}
                </div>
                {selectedCategories.length === 0 && (
                  <p className="mt-2 text-sm text-red-500">Please select at least one category</p>
                )}
              </div>
            )}
            
            <button
              className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              onClick={runETLJob}
              disabled={isLoading || (selectedJob === 'categories' && selectedCategories.length === 0)}
            >
              {isLoading ? 'Running...' : 'Run ETL Job'}
            </button>
          </div>
          
          {/* Results panel */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-xl font-semibold">Job Results</h2>
            
            {isLoading && (
              <div className="flex flex-col items-center justify-center p-10">
                <div className="w-12 h-12 border-4 border-t-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Running ETL job...</p>
              </div>
            )}
            
            {error && (
              <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
                <h3 className="font-semibold">Error</h3>
                <p>{error}</p>
              </div>
            )}
            
            {result && !isLoading && (
              <div className={`p-4 mb-4 rounded-lg ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <h3 className="mb-2 font-semibold">
                  {result.success ? 'Job Completed Successfully' : 'Job Failed'}
                  {testMode === 'simulated' && ' (Simulated)'}
                </h3>
                
                <div className="mt-4 space-y-2">
                  <p><span className="font-medium">Job Type:</span> {result.type}</p>
                  {result.result.timeElapsed && (
                    <p><span className="font-medium">Time Elapsed:</span> {formatTime(result.result.timeElapsed)}</p>
                  )}
                  {result.result.itemsProcessed !== undefined && (
                    <p><span className="font-medium">Items Processed:</span> {result.result.itemsProcessed}</p>
                  )}
                  {result.result.success !== undefined && (
                    <p><span className="font-medium">Successful:</span> {result.result.success}</p>
                  )}
                  {result.result.skipped !== undefined && (
                    <p><span className="font-medium">Skipped:</span> {result.result.skipped}</p>
                  )}
                  {result.result.failed !== undefined && (
                    <p><span className="font-medium">Failed:</span> {result.result.failed}</p>
                  )}
                  {result.message && (
                    <p className="mt-2 italic">{result.message}</p>
                  )}
                </div>
              </div>
            )}
            
            {!isLoading && !error && !result && (
              <div className="flex flex-col items-center justify-center p-10 text-gray-500">
                <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p>Run an ETL job to see results</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'scheduled' && (
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold">Scheduled ETL Jobs</h2>
          <p className="mb-4 text-gray-600">
            These jobs are configured to run automatically based on their schedule.
            You can test them here to see how they would run when scheduled.
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="text-xs font-medium text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">Job Type</th>
                  <th className="px-6 py-3 text-left">Schedule</th>
                  <th className="px-6 py-3 text-left">Description</th>
                  <th className="px-6 py-3 text-left">Options</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ETL_JOBS.map((job) => (
                  <tr key={job.type}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                        {job.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>{job.schedule}</div>
                      <div className="text-xs text-gray-500">{explainCron(job.schedule)}</div>
                    </td>
                    <td className="px-6 py-4">{job.description}</td>
                    <td className="px-6 py-4">
                      <pre className="p-2 text-xs bg-gray-50 rounded">
                        {JSON.stringify(job.options, null, 2)}
                      </pre>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        className="px-2 py-1 text-sm text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                        onClick={() => {
                          setSelectedJob(job.type);
                          if (job.type === 'categories' && job.options?.categories) {
                            setSelectedCategories(job.options.categories as string[]);
                          }
                          if (job.options?.maxItems) {
                            setMaxItems(job.options.maxItems as number);
                          }
                          setActiveTab('run');
                        }}
                      >
                        Test Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 mt-4 border border-gray-200 rounded-lg">
            <h3 className="mb-2 text-lg font-medium">Scheduling Information</h3>
            <p className="mb-2">
              ETL jobs are scheduled using node-cron syntax. Here's a breakdown of the cron expressions:
            </p>
            <ul className="pl-5 mb-3 space-y-1 list-disc">
              <li><code className="px-2 py-1 bg-gray-100 rounded">0 */6 * * *</code> - Every 6 hours (at 00:00, 06:00, 12:00, 18:00)</li>
              <li><code className="px-2 py-1 bg-gray-100 rounded">0 0 * * *</code> - Once per day at midnight</li>
              <li><code className="px-2 py-1 bg-gray-100 rounded">0 */12 * * *</code> - Every 12 hours (at 00:00, 12:00)</li>
            </ul>
            <p>
              To modify these schedules, edit the <code className="px-2 py-1 bg-gray-100 rounded">scripts/schedule-etl.js</code> file.
            </p>
          </div>
        </div>
      )}
      
      {activeTab === 'history' && (
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-xl font-semibold">Job History</h2>
          <p className="text-gray-600">
            View the ETL job history for a detailed log of past runs and their outcomes.
          </p>
          
          <div className="mt-4">
            <Link 
              href="/admin/etl-status"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Go to ETL Status Dashboard
            </Link>
          </div>
        </div>
      )}
      
      {/* Information Panel */}
      <div className="p-4 mt-6 bg-white rounded-lg shadow">
        <h2 className="mb-4 text-xl font-semibold">Command Line Testing</h2>
        <p className="mb-2">
          For advanced testing, you can use the command-line script:
        </p>
        <pre className="p-3 mb-4 overflow-x-auto text-sm bg-gray-100 rounded-lg">
          <code>node scripts/test-scheduled-etl.js [command] [job-type]</code>
        </pre>
        
        <h3 className="mt-4 mb-2 text-lg font-medium">Available Commands:</h3>
        <ul className="pl-5 mb-4 space-y-1 list-disc">
          <li><strong>manual</strong> - Run a specific ETL job manually</li>
          <li><strong>schedule</strong> - Test the scheduler by running a job immediately</li>
          <li><strong>validate</strong> - Validate the scheduling configuration without running jobs</li>
        </ul>
        
        <h3 className="mt-4 mb-2 text-lg font-medium">Examples:</h3>
        <ul className="pl-5 space-y-1 list-disc">
          <li><code className="px-2 py-1 bg-gray-100 rounded">node scripts/test-scheduled-etl.js manual trending --limit=10</code></li>
          <li><code className="px-2 py-1 bg-gray-100 rounded">node scripts/test-scheduled-etl.js schedule categories --categories=dance,comedy</code></li>
          <li><code className="px-2 py-1 bg-gray-100 rounded">node scripts/test-scheduled-etl.js validate</code></li>
        </ul>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-4">API Endpoint Testing</h2>
        <p className="mb-4">
          This will test the core API endpoints needed for the template analyzer:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1">
          <li>Fetch Videos API</li>
          <li>Analyze Video API</li>
          <li>Trending Templates API</li>
          <li>Template Filtering</li>
        </ul>
        
        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className={`px-4 py-2 rounded-md font-medium ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isRunning ? 'Running Tests...' : 'Run API Tests'}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}
        
        {testResults && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">Test Results:</h3>
            
            {/* Fetch Videos Result */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium flex items-center">
                <span 
                  className={`w-4 h-4 rounded-full mr-2 ${
                    testResults.fetchResult.fetchVideosSuccess ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></span>
                Fetch Videos API
              </h4>
              
              {testResults.fetchResult.fetchVideosSuccess ? (
                <div className="mt-2">
                  <p>Successfully fetched {testResults.fetchResult.fetchData.videos.length} videos</p>
                  <p className="text-sm text-gray-500">Source: {testResults.fetchResult.fetchData.source}</p>
                </div>
              ) : (
                <p className="text-red-600 mt-2">
                  {testResults.fetchResult.error?.message || 'Failed to fetch videos'}
                </p>
              )}
            </div>
            
            {/* Analyze Video Result */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium flex items-center">
                <span 
                  className={`w-4 h-4 rounded-full mr-2 ${
                    testResults.analyzeResult.analyzeSuccess ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></span>
                Analyze Video API
              </h4>
              
              {testResults.analyzeResult.analyzeSuccess ? (
                <div className="mt-2">
                  <p>Successfully analyzed video</p>
                  <p className="text-sm text-gray-500">Source: {testResults.analyzeResult.analyzeData.source}</p>
                </div>
              ) : (
                <p className="text-red-600 mt-2">
                  {testResults.analyzeResult.error?.message || testResults.analyzeResult.error || 'Failed to analyze video'}
                </p>
              )}
            </div>
            
            {/* Trending Templates Result */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium flex items-center">
                <span 
                  className={`w-4 h-4 rounded-full mr-2 ${
                    testResults.trendingResult.trendingSuccess ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></span>
                Trending Templates API
              </h4>
              
              {testResults.trendingResult.trendingSuccess ? (
                <div className="mt-2">
                  <p>Successfully fetched {testResults.trendingResult.trendingData.templates?.length || 0} trending templates</p>
                </div>
              ) : (
                <p className="text-red-600 mt-2">
                  {testResults.trendingResult.error?.message || 'Failed to fetch trending templates'}
                </p>
              )}
            </div>
            
            {/* Template Filtering Result */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium flex items-center">
                <span 
                  className={`w-4 h-4 rounded-full mr-2 ${
                    testResults.filterResult.filterSuccess ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></span>
                Template Filtering
              </h4>
              
              {testResults.filterResult.filterSuccess ? (
                <div className="mt-2">
                  <p>Successfully filtered templates by category</p>
                  <p className="text-sm text-gray-500">
                    Category: {testResults.filterResult.filterData.templates?.[0]?.category || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Results: {testResults.filterResult.filterData.templates?.length || 0} templates
                  </p>
                </div>
              ) : (
                <p className="text-red-600 mt-2">
                  {testResults.filterResult.error?.message || 'Failed to filter templates'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-4">ETL Process Test</h2>
        <p className="mb-4">
          Test the full ETL pipeline for template analysis. This will:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1">
          <li>Extract trending videos</li>
          <li>Transform with AI analysis</li>
          <li>Load into the template library</li>
        </ul>
        <p className="text-gray-500 text-sm mb-4">
          Note: This test uses the existing ETL test functionality.
        </p>
        
        <a
          href="/admin/etl-dashboard"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium inline-block"
        >
          Go to ETL Dashboard
        </a>
      </div>
    </div>
  );
} 