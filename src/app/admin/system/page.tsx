'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminSystemHealthPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('24h');

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">System Health</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Monitor system performance and health metrics.
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">System Status</h3>
          <div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-500">CPU Usage</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Normal
              </span>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-bold text-gray-900">24%</p>
              <div className="mt-1 relative pt-1">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                  <div style={{ width: "24%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                </div>
              </div>
              <p className="text-sm text-gray-500">Peak: 42% at 10:45 AM</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-500">Memory</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Normal
              </span>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-bold text-gray-900">68%</p>
              <div className="mt-1 relative pt-1">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                  <div style={{ width: "68%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                </div>
              </div>
              <p className="text-sm text-gray-500">8.2 GB of 12 GB used</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-500">Database</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Normal
              </span>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-bold text-gray-900">165ms</p>
              <div className="mt-1 relative pt-1">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                  <div style={{ width: "22%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                </div>
              </div>
              <p className="text-sm text-gray-500">Avg. query response time</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-500">API Latency</h4>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Warning
              </span>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-bold text-gray-900">312ms</p>
              <div className="mt-1 relative pt-1">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                  <div style={{ width: "78%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"></div>
                </div>
              </div>
              <p className="text-sm text-gray-500">Increased by 42ms</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Service Status</h3>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uptime
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Incident
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { id: 1, name: 'API Server', status: 'Operational', uptime: '99.98%', lastIncident: '15 days ago' },
                  { id: 2, name: 'Database', status: 'Operational', uptime: '100%', lastIncident: '32 days ago' },
                  { id: 3, name: 'ETL Pipeline', status: 'Operational', uptime: '99.5%', lastIncident: '3 days ago' },
                  { id: 4, name: 'Template Analyzer', status: 'Degraded', uptime: '98.2%', lastIncident: '6 hours ago' },
                  { id: 5, name: 'AI Brain', status: 'Operational', uptime: '99.7%', lastIncident: '8 days ago' },
                ].map((service) => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{service.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        service.status === 'Operational' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {service.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.uptime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {service.lastIncident}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Events</h3>
        </div>
        <div className="p-4">
          <ul className="space-y-4">
            {[
              { id: 1, type: 'info', message: 'Database optimization completed', time: '2 hours ago' },
              { id: 2, type: 'warning', message: 'Template analyzer response time increased', time: '6 hours ago' },
              { id: 3, type: 'error', message: 'ETL job failed: TikTok API rate limit exceeded', time: '3 days ago' },
              { id: 4, type: 'info', message: 'System backup completed successfully', time: '4 days ago' },
              { id: 5, type: 'warning', message: 'High memory usage detected', time: '5 days ago' },
            ].map((event) => (
              <li key={event.id} className="border-l-4 px-4 py-3 rounded-r-md bg-gray-50 flex justify-between items-center" style={{
                borderColor: event.type === 'info' ? '#3B82F6' : event.type === 'warning' ? '#F59E0B' : '#EF4444'
              }}>
                <div>
                  <p className="text-sm font-medium text-gray-900">{event.message}</p>
                  <p className="text-xs text-gray-500">{event.time}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  event.type === 'info' ? 'bg-blue-100 text-blue-800' : 
                  event.type === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 