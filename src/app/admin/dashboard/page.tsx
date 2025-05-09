'use client';

import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Admin Dashboard</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Welcome to the admin dashboard. Here you can see an overview of your system.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Status Cards */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-blue-100 p-3">
              <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900">Active Users</h4>
              <p className="text-2xl font-bold text-blue-600">1,254</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-green-100 p-3">
              <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900">Templates</h4>
              <p className="text-2xl font-bold text-green-600">347</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-yellow-100 p-3">
              <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900">Expert Insights</h4>
              <p className="text-2xl font-bold text-yellow-600">89</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-purple-100 p-3">
              <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900">API Requests</h4>
              <p className="text-2xl font-bold text-purple-600">28,429</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-start">
                  <div className="flex-shrink-0 rounded-full h-10 w-10 bg-blue-100 flex items-center justify-center text-blue-600">
                    U
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">User updated template #{item + 100}</p>
                    <p className="text-xs text-gray-500">{new Date(Date.now() - item * 3600000).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">System Status</h3>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">API Server</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Database</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">ETL Processes</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Template Analyzer</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Operational
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">AI Brain Interface</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 