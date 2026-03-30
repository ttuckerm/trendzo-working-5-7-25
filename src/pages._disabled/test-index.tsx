import React from 'react';
import Link from 'next/link';

export default function TestIndex() {
  const testPages = [
    { 
      name: 'Comprehensive Supabase Diagnostics', 
      path: '/supabase-diagnostics', 
      description: 'Advanced diagnostics tool with detailed reporting and recommendations' 
    },
    { 
      name: 'Environment Variables Debug', 
      path: '/env-debug', 
      description: 'View and verify environment variables' 
    },
    { 
      name: 'Simple Fetch Test', 
      path: '/fetch-test', 
      description: 'Test network connectivity with basic fetch API' 
    },
    { 
      name: 'Network Debug', 
      path: '/network-debug', 
      description: 'Comprehensive network connectivity testing' 
    },
    { 
      name: 'Direct Supabase Test', 
      path: '/direct-supabase-test', 
      description: 'Simple Supabase connection test' 
    },
    { 
      name: 'Supabase Auth Test', 
      path: '/supabase-auth-test', 
      description: 'Full Supabase auth testing page' 
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Supabase Integration Test Suite</h1>
      
      <p className="mb-6">
        Use these pages to debug and test the Supabase integration. We recommend starting with the comprehensive
        Connection Diagnostics tool which will automatically identify issues in your setup.
      </p>
      
      <div className="grid gap-4 md:grid-cols-2">
        {testPages.map((page) => (
          <Link 
            href={page.path} 
            key={page.path}
            className="block p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
          >
            <h2 className="text-xl font-semibold text-blue-600 mb-2">{page.name}</h2>
            <p className="text-gray-600">{page.description}</p>
          </Link>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Troubleshooting Steps</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>Run the diagnostic tool</strong> to automatically identify issues</li>
          <li>Follow the recommended actions to fix identified problems</li>
          <li>Verify environment variables are correctly set</li>
          <li>Test basic network connectivity</li>
          <li>Check for CORS or firewall issues</li>
          <li>Verify Supabase project is active and accessible</li>
          <li>Test authentication endpoints</li>
        </ol>
      </div>
    </div>
  );
} 