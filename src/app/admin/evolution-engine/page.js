'use client';

import React, { useState } from 'react';

export default function EvolutionEnginePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRunEvolution = async () => {
    setIsRunning(true);
    setError(null);
    setLastResult(null);
    
    try {
      const response = await fetch('/api/admin/evolution-engine/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to run EvolutionEngine');
      }
      
      setLastResult(data);
    } catch (err) {
      console.error('Error running EvolutionEngine:', err);
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleTestEvolution = async () => {
    setIsTesting(true);
    setError(null);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/admin/evolution-engine/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to test EvolutionEngine');
      }
      
      setTestResult(data);
    } catch (err) {
      console.error('Error testing EvolutionEngine:', err);
      setError(err.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">🧪 EvolutionEngine</h1>
        <p className="text-gray-600">
          Analyze template performance trends and classify as HOT, COOLING, NEW, or STABLE
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Run Analysis</h2>
          <p className="text-gray-600 mb-4">
            Execute EvolutionEngine on all templates in the database
          </p>
          <button
            onClick={handleRunEvolution}
            disabled={isRunning || isTesting}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isRunning
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRunning ? 'Running Analysis...' : 'Run EvolutionEngine'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Test System</h2>
          <p className="text-gray-600 mb-4">
            Test EvolutionEngine with synthetic data
          </p>
          <button
            onClick={handleTestEvolution}
            disabled={isRunning || isTesting}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isTesting
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isTesting ? 'Testing...' : 'Test EvolutionEngine'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Run Results */}
      {lastResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">✅ Analysis Complete</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{lastResult.summary?.HOT || 0}</div>
              <div className="text-sm text-gray-600">HOT</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{lastResult.summary?.COOLING || 0}</div>
              <div className="text-sm text-gray-600">COOLING</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{lastResult.summary?.NEW || 0}</div>
              <div className="text-sm text-gray-600">NEW</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{lastResult.summary?.STABLE || 0}</div>
              <div className="text-sm text-gray-600">STABLE</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p>Duration: {lastResult.duration}ms</p>
            <p>Templates Analyzed: {lastResult.templatesAnalyzed}</p>
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">🧪 Test Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{testResult.statusCounts?.HOT || 0}</div>
              <div className="text-sm text-gray-600">HOT</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{testResult.statusCounts?.COOLING || 0}</div>
              <div className="text-sm text-gray-600">COOLING</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{testResult.statusCounts?.NEW || 0}</div>
              <div className="text-sm text-gray-600">NEW</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{testResult.statusCounts?.STABLE || 0}</div>
              <div className="text-sm text-gray-600">STABLE</div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <p>Success: {testResult.success ? '✅ Yes' : '❌ No'}</p>
            <p>Duration: {testResult.duration}ms</p>
            <p>Templates Analyzed: {testResult.templatesAnalyzed}</p>
          </div>
        </div>
      )}

      {/* Algorithm Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Algorithm Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Classification Rules</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>HOT:</strong> ≥15% trend increase, ≥20 virals</li>
              <li><strong>COOLING:</strong> ≤-15% trend decrease, previous rate ≥5%</li>
              <li><strong>NEW:</strong> &lt;3 days old, ≥10 virals</li>
              <li><strong>STABLE:</strong> All other cases</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Performance Targets</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>Processing:</strong> &lt;10 seconds for 1,000 templates</li>
              <li><strong>Analysis Window:</strong> 7-day current vs previous</li>
              <li><strong>Frequency:</strong> Runs every 24 hours</li>
              <li><strong>Comparison:</strong> Uses negative pool for context</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}