'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

// Define the ETL job type
interface ETLJob {
  id: string;
  type: string;
  status: string;
  startTime: string;
  endTime?: string;
  itemsProcessed?: number;
  templatesCreated?: number;
  templatesUpdated?: number;
  categories?: string[];
  error?: string;
}

// Mock ETL job history data for testing mode
const MOCK_ETL_HISTORY: ETLJob[] = [
  { 
    id: 'job-001',
    type: 'trending',
    status: 'success',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 3).toISOString(), // 3 minutes later
    itemsProcessed: 25,
    templatesCreated: 8
  },
  { 
    id: 'job-002',
    type: 'categories',
    status: 'success',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 8 + 1000 * 60 * 5).toISOString(), // 5 minutes later
    itemsProcessed: 42,
    templatesCreated: 12,
    categories: ['dance', 'comedy', 'fashion']
  },
  { 
    id: 'job-003',
    type: 'update-stats',
    status: 'success',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 12 + 1000 * 60 * 1).toISOString(), // 1 minute later
    itemsProcessed: 150,
    templatesUpdated: 150
  },
  { 
    id: 'job-004',
    type: 'trending',
    status: 'failed',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 18 + 1000 * 60 * 1).toISOString(), // 1 minute later
    error: 'API rate limit exceeded'
  },
  { 
    id: 'job-005',
    type: 'categories',
    status: 'success',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 24 hours ago
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 60 * 4).toISOString(), // 4 minutes later
    itemsProcessed: 38,
    templatesCreated: 10,
    categories: ['product', 'tutorial']
  }
];

export default function ETLStatusPage() {
  const { user } = useAuth();
  const [etlHistory, setEtlHistory] = useState<ETLJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchETLHistory() {
      setIsLoading(true);
      setError(null);
      
      try {
        const isTesting = process.env.NEXT_PUBLIC_TESTING_MODE === 'true' || process.env.TESTING_MODE === 'true';
        
        if (isTesting) {
          // In testing mode, use mock data
          console.log('🧪 TESTING MODE: Using mock ETL history data');
          setEtlHistory(MOCK_ETL_HISTORY);
        } else {
          // Make API call to fetch real data
          const response = await fetch('/api/etl/history', {
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ETL_API_KEY}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch ETL history');
          }
          
          const data = await response.json();
          setEtlHistory(data.jobs);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchETLHistory();
  }, []);

  useEffect(() => {
    // In testing mode, directly access the static HTML file
    if (process.env.NEXT_PUBLIC_TESTING_MODE === 'true') {
      window.location.href = '/admin-dashboard.html';
    } else {
      // In production, we could implement different behavior if needed
      window.location.href = '/admin-dashboard.html';
    }
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  // Calculate duration between two timestamps
  const calculateDuration = (start: string, end?: string) => {
    if (!end) return 'In Progress';
    
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const seconds = Math.floor((endTime - startTime) / 1000);
    
    if (seconds < 60) return `${seconds} seconds`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-2xl font-bold text-center">ETL Status</h1>
        <p className="mb-6 text-center text-gray-600">
          Redirecting to the ETL Dashboard...
        </p>
        <div className="flex justify-center">
          <Link 
            href="/admin-dashboard.html"
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 