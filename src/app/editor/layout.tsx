"use client";

import { useSearchParams } from 'next/navigation';

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  
  // Build the new URL with the parameters
  const id = searchParams?.get('id');
  const source = searchParams?.get('source');
  let redirectUrl = '/dashboard-view/template-editor';
  
  // Add query params if they exist
  if (id || source) {
    redirectUrl += '?';
    if (id) {
      redirectUrl += `id=${id}`;
    }
    if (source) {
      redirectUrl += `${id ? '&' : ''}source=${source}`;
    }
  }
  
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="refresh" content={`0;url=${redirectUrl}`} />
      </head>
      <body>{children}</body>
    </html>
  );
} 