'use client';

import { useEffect, useState } from 'react';

export default function DiagnosticsPage() {
  const [errors, setErrors] = useState<string[]>([]);
  const [info, setInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    // Capture console errors
    const originalError = console.error;
    const capturedErrors: string[] = [];
    
    console.error = (...args) => {
      capturedErrors.push(args.join(' '));
      originalError(...args);
    };

    // Check for missing resources
    const checkResource = async (url: string) => {
      try {
        const response = await fetch(url);
        return { url, status: response.status, ok: response.ok };
      } catch (error) {
        return { url, status: 'error', ok: false, error: error.message };
      }
    };

    // Run diagnostics
    const runDiagnostics = async () => {
      const resources = [
        '/favicon.ico',
        '/admin/layout.css',
        '/admin/admin.css',
        '/_next/static/chunks/pages-internals.js',
      ];

      const results = await Promise.all(resources.map(checkResource));
      
      setInfo({
        resources: results,
        nextVersion: process.env.NEXT_PUBLIC_NEXT_VERSION || 'unknown',
        nodeEnv: process.env.NODE_ENV,
        errors: capturedErrors,
      });
      setErrors(capturedErrors);
    };

    runDiagnostics();

    // Cleanup
    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Diagnostics</h1>
      
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Resource Check</h2>
          <div className="space-y-2">
            {info.resources?.map((resource: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span className="font-mono text-sm">{resource.url}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  resource.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {resource.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Console Errors</h2>
          {errors.length === 0 ? (
            <p className="text-gray-500">No errors captured</p>
          ) : (
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div key={index} className="p-2 bg-red-50 rounded text-sm text-red-700">
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Environment Info</h2>
          <dl className="space-y-2">
            <div>
              <dt className="font-semibold">Node Environment:</dt>
              <dd className="text-gray-600">{info.nodeEnv}</dd>
            </div>
            <div>
              <dt className="font-semibold">Browser:</dt>
              <dd className="text-gray-600">{typeof window !== 'undefined' ? navigator.userAgent : 'Server-side'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}