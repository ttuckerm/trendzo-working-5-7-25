'use client';

import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminInsightsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Expert Insights</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Manage expert insights and analysis for content trends.
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((item) => (
            <li key={item}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-md bg-yellow-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-yellow-600">Insight #{item}</div>
                      <div className="text-sm text-gray-500">
                        Category: {['Hook Analysis', 'Trend Prediction', 'Engagement Strategy', 'Algorithm Insight', 'Content Structure'][item % 5]}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                      Edit
                    </button>
                    <button className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 