'use client';

import React, { useState } from 'react';

export default function SimpleETLDashboardPage() {
  const [activeTab, setActiveTab] = useState('trending');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const simulateETLProcess = async (type: string) => {
    setIsLoading(true);
    setResult(null);
    
    // Simulate API call with timeout
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create mock result
    const mockResult = {
      success: true,
      type,
      result: {
        itemsProcessed: Math.floor(Math.random() * 20) + 5,
        timeElapsed: Math.floor(Math.random() * 5000) + 1000,
        templatesCreated: Math.floor(Math.random() * 10) + 1
      }
    };
    
    setResult(mockResult);
    setIsLoading(false);
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">ETL Dashboard (Simple Version)</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex">
          {['trending', 'categories', 'update-stats'].map((tab) => (
            <button
              key={tab}
              className={`py-4 px-6 ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">
          {activeTab === 'trending' ? 'Run Trending TikTok ETL' : 
           activeTab === 'categories' ? 'Run Categories TikTok ETL' : 
           'Update Template Stats'}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {activeTab === 'trending' ? 'Fetch trending TikTok videos and create templates.' : 
           activeTab === 'categories' ? 'Process TikTok videos by specific categories.' : 
           'Refresh statistics for existing templates.'}
        </p>
        
        <button
          onClick={() => simulateETLProcess(activeTab)}
          disabled={isLoading}
          className={`px-4 py-2 rounded ${
            isLoading 
              ? 'bg-blue-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? 'Processing...' : `Run ${activeTab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} ETL`}
        </button>
      </div>
      
      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-2">Results</h3>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="whitespace-pre-wrap overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 