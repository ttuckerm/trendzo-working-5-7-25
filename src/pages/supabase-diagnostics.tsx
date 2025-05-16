import React from 'react';
import SupabaseDiagnosticTool from '../components/SupabaseDiagnosticTool';
import Link from 'next/link';

export default function SupabaseDiagnosticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <header className="mb-8 border-b pb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Supabase Connection Diagnostics</h1>
            <Link href="/test-index" className="text-blue-500 hover:underline">
              Back to Test Index
            </Link>
          </div>
          <p className="text-gray-600 mt-2">
            Diagnose and troubleshoot Supabase connectivity issues with comprehensive tests
          </p>
        </header>
        
        <main>
          <SupabaseDiagnosticTool />
        </main>
      </div>
    </div>
  );
} 