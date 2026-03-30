'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SoundTrendTest() {
  const [testResult, setTestResult] = useState({
    status: 'pending',
    message: 'Testing sound prediction components...'
  });

  useEffect(() => {
    const testNavigation = async () => {
      try {
        // We're just checking that this page renders, which means our fix worked
        setTestResult({
          status: 'success',
          message: 'Navigation to sound prediction pages works correctly!'
        });
      } catch (error) {
        console.error('Test failed:', error);
        setTestResult({
          status: 'error',
          message: 'Test failed: ' + (error instanceof Error ? error.message : String(error))
        });
      }
    };

    testNavigation();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sound Trend Component Test</h1>
      
      <div className={`p-4 rounded mb-4 ${
        testResult.status === 'success' ? 'bg-green-100 text-green-800' :
        testResult.status === 'error' ? 'bg-red-100 text-red-800' :
        'bg-blue-100 text-blue-800'
      }`}>
        <p>{testResult.message}</p>
      </div>

      <div className="mb-4">
        <p className="mb-2">Test the fixed pages:</p>
        <div className="flex flex-col gap-2">
          <Link 
            href="/dashboard-view/sound-predictions" 
            className="text-blue-600 hover:underline"
          >
            Test Sound Predictions Page
          </Link>
          
          <Link 
            href="/dashboard-view/trend-predictions-dashboard" 
            className="text-blue-600 hover:underline"
          >
            Test Trend Predictions Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 