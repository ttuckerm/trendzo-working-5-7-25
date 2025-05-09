"use client";

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { TemplateEditorProvider } from '@/lib/contexts/TemplateEditorContext';
import { ErrorBoundary } from '@/components/debug/ErrorBoundary';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Use dynamic import with no SSR to avoid hydration issues with the editor component
const TemplateEditor = dynamic(
  () => import('@/components/templateEditor/TemplateEditor'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
        <span className="ml-2 text-gray-700">Loading editor...</span>
      </div>
    )
  }
);

// Fallback component if the editor fails to load
const EditorErrorFallback = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Editor Error</h2>
        <p className="text-gray-600 mb-6">
          We encountered an issue loading the template editor. This could be due to a browser compatibility issue or a temporary technical problem.
        </p>
        <div className="flex flex-col space-y-3">
          <Button 
            className="w-full"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
          <Link href="/dashboard-view/template-library" passHref>
            <Button variant="outline" className="w-full">
              Return to Template Library
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default function EditorPage() {
  return (
    <ErrorBoundary 
      componentName="EditorPage"
      fallback={<EditorErrorFallback />}
    >
      <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-gray-500" /></div>}>
        <TemplateEditorProvider>
          <TemplateEditor />
        </TemplateEditorProvider>
      </Suspense>
    </ErrorBoundary>
  );
} 