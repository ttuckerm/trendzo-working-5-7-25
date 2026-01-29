'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminApiManagementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('keys');

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">API Management</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Manage API keys, endpoints, and monitor usage across the platform.
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {['keys', 'endpoints', 'usage', 'documentation'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'keys' && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">API Keys</h3>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Generate New Key
            </button>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Key
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Used
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    { id: 1, name: 'Production API Key', key: 'tr_k_prod_************************', status: 'Active', created: '2023-05-15', lastUsed: '10 minutes ago' },
                    { id: 2, name: 'Staging API Key', key: 'tr_k_stag_************************', status: 'Active', created: '2023-05-15', lastUsed: '3 hours ago' },
                    { id: 3, name: 'Testing API Key', key: 'tr_k_test_************************', status: 'Active', created: '2023-05-20', lastUsed: '2 days ago' },
                    { id: 4, name: 'Legacy API Key', key: 'tr_k_legc_************************', status: 'Revoked', created: '2022-11-10', lastUsed: '45 days ago' },
                  ].map((apiKey) => (
                    <tr key={apiKey.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{apiKey.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{apiKey.key}</code>
                          <button className="ml-2 text-gray-400 hover:text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          apiKey.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {apiKey.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {apiKey.created}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {apiKey.lastUsed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                        {apiKey.status === 'Active' ? (
                          <button className="text-red-600 hover:text-red-900">Revoke</button>
                        ) : (
                          <button className="text-gray-600 hover:text-gray-900">Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'endpoints' && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">API Endpoints</h3>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Endpoint
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate Limit
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Access Level
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    { id: 1, endpoint: '/api/v1/templates', method: 'GET', status: 'Active', rateLimit: '100/min', accessLevel: 'Public' },
                    { id: 2, endpoint: '/api/v1/templates', method: 'POST', status: 'Active', rateLimit: '20/min', accessLevel: 'Private' },
                    { id: 3, endpoint: '/api/v1/templates/{id}', method: 'GET', status: 'Active', rateLimit: '100/min', accessLevel: 'Public' },
                    { id: 4, endpoint: '/api/v1/templates/{id}', method: 'PUT', status: 'Active', rateLimit: '20/min', accessLevel: 'Private' },
                    { id: 5, endpoint: '/api/v1/templates/{id}', method: 'DELETE', status: 'Active', rateLimit: '10/min', accessLevel: 'Admin' },
                    { id: 6, endpoint: '/api/v1/insights', method: 'GET', status: 'Active', rateLimit: '50/min', accessLevel: 'Public' },
                    { id: 7, endpoint: '/api/v1/analytics', method: 'GET', status: 'Active', rateLimit: '30/min', accessLevel: 'Private' },
                  ].map((endpoint) => (
                    <tr key={endpoint.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm text-gray-800">{endpoint.endpoint}</code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded ${
                          endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                          endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
                          endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {endpoint.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          endpoint.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {endpoint.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {endpoint.rateLimit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          endpoint.accessLevel === 'Public' ? 'bg-gray-100 text-gray-800' :
                          endpoint.accessLevel === 'Private' ? 'bg-purple-100 text-purple-800' :
                          'bg-indigo-100 text-indigo-800'
                        }`}>
                          {endpoint.accessLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">Configure</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">API Usage</h3>
          </div>
          <div className="p-4">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 border border-gray-200 rounded-lg p-4">
                <h4 className="text-base font-medium text-gray-900 mb-4">Usage by Endpoint</h4>
                <div className="space-y-4">
                  {[
                    { id: 1, endpoint: '/api/v1/templates (GET)', requests: 15784, percentage: 45 },
                    { id: 2, endpoint: '/api/v1/templates/{id} (GET)', requests: 8651, percentage: 25 },
                    { id: 3, endpoint: '/api/v1/insights (GET)', requests: 5217, percentage: 15 },
                    { id: 4, endpoint: '/api/v1/analytics (GET)', requests: 3472, percentage: 10 },
                    { id: 5, endpoint: 'Other', requests: 1735, percentage: 5 },
                  ].map((item) => (
                    <div key={item.id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.endpoint}</span>
                        <span className="text-sm text-gray-500">{item.requests.toLocaleString()} requests</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 border border-gray-200 rounded-lg p-4">
                <h4 className="text-base font-medium text-gray-900 mb-4">Recent API Activity</h4>
                <div className="space-y-3">
                  {[
                    { id: 1, endpoint: '/api/v1/templates', method: 'GET', status: 200, time: '2 min ago', latency: '124ms', user: 'user@example.com' },
                    { id: 2, endpoint: '/api/v1/templates/456', method: 'GET', status: 200, time: '5 min ago', latency: '98ms', user: 'admin@company.com' },
                    { id: 3, endpoint: '/api/v1/templates', method: 'POST', status: 201, time: '10 min ago', latency: '245ms', user: 'admin@company.com' },
                    { id: 4, endpoint: '/api/v1/analytics', method: 'GET', status: 200, time: '15 min ago', latency: '187ms', user: 'user@example.com' },
                    { id: 5, endpoint: '/api/v1/templates/123', method: 'PUT', status: 400, time: '22 min ago', latency: '156ms', user: 'editor@company.com' },
                  ].map((activity) => (
                    <div key={activity.id} className="flex items-center py-2 border-b border-gray-100">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        activity.status >= 200 && activity.status < 300 ? 'bg-green-500' :
                        activity.status >= 400 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs font-semibold rounded mr-2 ${
                            activity.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                            activity.method === 'POST' ? 'bg-green-100 text-green-800' :
                            activity.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {activity.method}
                          </span>
                          <code className="text-sm text-gray-800">{activity.endpoint}</code>
                        </div>
                        <div className="flex justify-between mt-1">
                          <div className="text-xs text-gray-500">
                            {activity.user} • {activity.time} • {activity.latency}
                          </div>
                          <div className="text-xs font-medium">
                            Status: {activity.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documentation' && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">API Documentation</h3>
          </div>
          <div className="p-4">
            <div className="prose max-w-none">
              <p>
                The Trendzo API allows you to programmatically access TikTok template data, analytics, and insights.
                Our RESTful API uses standard HTTP response codes and returns JSON.
              </p>
              
              <h4>Authentication</h4>
              <p>
                All API requests require authentication using an API key. You can generate API keys in the API Keys tab.
                Include your API key as a bearer token in the Authorization header:
              </p>
              <pre className="bg-gray-50 p-3 rounded-md"><code>Authorization: Bearer tr_k_prod_your_api_key</code></pre>
              
              <h4>Rate Limiting</h4>
              <p>
                The API enforces rate limits to ensure fair usage. Rate limits vary by endpoint and are specified in the Endpoints tab.
                When you exceed your rate limit, the API will return a 429 Too Many Requests response.
              </p>
              
              <h4>Example Request</h4>
              <pre className="bg-gray-50 p-3 rounded-md"><code>{`curl -X GET "https://api.trendzo.io/v1/templates?limit=10" \\
  -H "Authorization: Bearer tr_k_prod_your_api_key" \\
  -H "Content-Type: application/json"
`}</code></pre>
              
              <h4>Example Response</h4>
              <pre className="bg-gray-50 p-3 rounded-md overflow-auto"><code>{`{
  "data": [
    {
      "id": "template_123",
      "title": "Summer Sale Promotion",
      "category": "E-commerce",
      "views": 15000,
      "likes": 2300,
      "shares": 450
    },
    {
      "id": "template_124",
      "title": "Product Showcase",
      "category": "E-commerce",
      "views": 8700,
      "likes": 1200,
      "shares": 320
    }
  ],
  "meta": {
    "total": 156,
    "page": 1,
    "limit": 10
  }
}
`}</code></pre>
              
              <h4>SDKs & Libraries</h4>
              <p>
                We provide official client libraries for several languages:
              </p>
              <ul>
                <li>JavaScript/TypeScript: <code>@trendzo/api-client</code></li>
                <li>Python: <code>trendzo-api</code></li>
                <li>PHP: <code>trendzo/api-client</code></li>
                <li>Ruby: <code>trendzo-api</code></li>
              </ul>
              
              <h4>Need Help?</h4>
              <p>
                If you have any questions about using the API, please contact our developer support team at <a href="mailto:api-support@trendzo.io" className="text-blue-600">api-support@trendzo.io</a>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 