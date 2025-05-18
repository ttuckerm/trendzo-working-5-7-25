"use client";

import React from 'react';
import { PageTransition } from '@/lib/contexts/NavigationContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PageTransitionTest() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Page Transition Test</h1>
      
      <PageTransition>
        <div className="space-y-4 p-4 bg-gray-100 rounded-lg">
          <p>This tests if PageTransition component imports correctly.</p>
          
          <div className="flex space-x-4">
            <Button>Test Button</Button>
            <Link href="/dashboard-view/template-editor">
              <Button variant="outline">Go to Template Editor</Button>
            </Link>
          </div>
        </div>
      </PageTransition>
    </div>
  );
} 