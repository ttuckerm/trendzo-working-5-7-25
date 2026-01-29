'use client';

import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AdminTestRoutes() {
  const routes = [
    '/admin/viral-approval-queue',
    '/admin/mvp',
    '/admin/framework-reservoir',
    '/viral-intelligence-demo',
    '/admin/mvp/settings',
    '/admin/mvp/templates'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Route Testing</h1>
        <p className="text-gray-600">Test all the routes that were reported as 404</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Routes</h2>
        <div className="space-y-3">
          {routes.map((route) => (
            <div key={route} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <code className="text-sm text-gray-900">{route}</code>
              </div>
              <Link
                href={route}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Test Route
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Click on each "Test Route" button</li>
          <li>If the page loads without errors, the route is working</li>
          <li>If you get a 404, there may be a server or build issue</li>
          <li>If you get a blank page or errors, there may be component issues</li>
        </ol>
      </div>
    </div>
  );
}