'use client';

import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminTemplatesPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Template Management</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Manage and organize templates across the platform.
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((item) => (
            <li key={item}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-blue-600">Template #{item}</div>
                      <div className="text-sm text-gray-500">
                        Category: {['Educational', 'Entertainment', 'Tutorial', 'Storytelling', 'Motivational'][item % 5]}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                      Edit
                    </button>
                    <button className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700">
                      View
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