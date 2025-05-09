'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

interface ETLJob {
  id: string;
  name: string;
  type: string;
  status: 'completed' | 'failed' | 'running' | 'scheduled';
  startTime: string;
  endTime?: string;
  error?: string;
  result?: {
    processed: number;
    failed?: number;
    templates?: number;
  };
}

export default function ETLJobStatus() {
  const [jobs, setJobs] = useState<ETLJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // Seconds
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Function to fetch ETL jobs
  const fetchETLJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, we would fetch from an API endpoint
      const response = await fetch('/api/etl/job-status');
      
      if (!response.ok) {
        throw new Error(`Error fetching ETL jobs: ${response.statusText}`);
      }
      
      const data = await response.json();
      setJobs(data.jobs);
    } catch (err: any) {
      console.error('Error fetching ETL jobs:', err);
      setError(err.message || 'Failed to fetch ETL jobs');
      
      // Always use mock data when there's an error (including Unauthorized)
      setJobs(getMockJobs());
    } finally {
      setLoading(false);
    }
  };
  
  // Auto-refresh effect
  useEffect(() => {
    fetchETLJobs();
    
    let intervalId: NodeJS.Timeout;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchETLJobs();
      }, refreshInterval * 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [refreshInterval, autoRefresh]);
  
  // Function to format duration
  const formatDuration = (start: string, end?: string): string => {
    if (!end) return 'In progress';
    
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMs = endTime - startTime;
    
    // Format as minutes and seconds
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };
  
  // Function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get status icon
  const getStatusIcon = (status: ETLJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" />;
      case 'failed':
        return <XCircle className="text-red-500" />;
      case 'running':
        return <Clock className="text-blue-500 animate-pulse" />;
      case 'scheduled':
        return <AlertTriangle className="text-yellow-500" />;
      default:
        return null;
    }
  };
  
  // Get row background color based on status
  const getRowClass = (status: ETLJob['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50';
      case 'failed':
        return 'bg-red-50';
      case 'running':
        return 'bg-blue-50';
      case 'scheduled':
        return 'bg-yellow-50';
      default:
        return '';
    }
  };
  
  // Mock data for development
  const getMockJobs = (): ETLJob[] => [
    {
      id: '1',
      name: 'Daily Trending Templates',
      type: 'trending',
      status: 'completed',
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() - 3550000).toISOString(),
      result: {
        processed: 28,
        failed: 2,
        templates: 20
      }
    },
    {
      id: '2',
      name: 'Beauty Category Analysis',
      type: 'category',
      status: 'running',
      startTime: new Date(Date.now() - 120000).toISOString()
    },
    {
      id: '3',
      name: 'Template Similarity Detection',
      type: 'find-similar',
      status: 'failed',
      startTime: new Date(Date.now() - 7200000).toISOString(),
      endTime: new Date(Date.now() - 7150000).toISOString(),
      error: 'API limit exceeded'
    },
    {
      id: '4',
      name: 'Weekly Analytics Update',
      type: 'detect-trending',
      status: 'scheduled',
      startTime: new Date(Date.now() + 3600000).toISOString()
    }
  ];
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">ETL Job Status</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <label htmlFor="refresh-interval" className="mr-2 text-sm text-gray-600">
              Refresh every:
            </label>
            <select 
              id="refresh-interval"
              className="border rounded p-1 text-sm"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
            >
              <option value="10">10s</option>
              <option value="30">30s</option>
              <option value="60">1m</option>
              <option value="300">5m</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="auto-refresh" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="auto-refresh" className="text-sm text-gray-600">
              Auto refresh
            </label>
          </div>
          
          <button 
            onClick={fetchETLJobs}
            className="flex items-center bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
          >
            <RefreshCw size={16} className="mr-1" />
            Refresh
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Job Name</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Type</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Start Time</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Duration</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Results</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className={`border-b ${getRowClass(job.status)}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {getStatusIcon(job.status)}
                        <span className="ml-2 text-sm capitalize">{job.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{job.name}</td>
                    <td className="px-4 py-3 text-sm">{job.type}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(job.startTime)}</td>
                    <td className="px-4 py-3 text-sm">{formatDuration(job.startTime, job.endTime)}</td>
                    <td className="px-4 py-3 text-sm">
                      {job.result ? (
                        <div>
                          <span className="font-medium">
                            {job.result.processed} processed
                          </span>
                          {job.result.failed !== undefined && (
                            <span className="text-red-500 ml-2">
                              ({job.result.failed} failed)
                            </span>
                          )}
                          {job.result.templates !== undefined && (
                            <span className="text-green-500 ml-2">
                              {job.result.templates} templates
                            </span>
                          )}
                        </div>
                      ) : job.error ? (
                        <span className="text-red-500">{job.error}</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No ETL jobs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-right text-xs text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
} 