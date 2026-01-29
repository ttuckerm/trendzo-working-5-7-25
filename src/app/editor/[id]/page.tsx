"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function EditorWithIdPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  useEffect(() => {
    // Redirect to the main editor page with the ID as a query parameter
    if (id) {
      router.replace(`/editor?id=${id}`);
    }
  }, [id, router]);

  // Return a simple loading state while redirecting
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-lg text-gray-600">Loading editor...</p>
      </div>
    </div>
  );
} 