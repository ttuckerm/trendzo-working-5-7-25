"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/**
 * Legacy Editor Page - Redirects to new integration
 * 
 * This redirects from the standalone /editor page to the new
 * integrated editor at /dashboard-view/template-editor
 */
export default function EditorPage() {
  const searchParams = useSearchParams();
  
  // Build the new URL with the parameters
  const id = searchParams?.get('id');
  const source = searchParams?.get('source');
  const restricted = searchParams?.get('restricted');
  let redirectUrl = '/template-editor';
  
  // Add query params if they exist
  const params = new URLSearchParams();
  if (id) params.append('id', id);
  if (source) params.append('source', source);
  if (restricted) params.append('restricted', restricted);
  
  if (params.toString()) {
    redirectUrl += '?' + params.toString();
  }
  
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500 mx-auto" />
        <span className="mt-4 block text-gray-700">Redirecting to new editor interface...</span>
        <p className="mt-2 text-gray-500">
          If you are not redirected automatically, 
          <Link href={redirectUrl} className="text-blue-500 ml-1 hover:underline">
            click here
          </Link>.
        </p>
      </div>
    </div>
  );
} 