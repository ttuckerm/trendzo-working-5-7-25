"use client";

import React from 'react';
import { TemplateEditorProvider } from '@/lib/contexts/TemplateEditorContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EditorProviderTest() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">TemplateEditorProvider Test</h1>
      
      <TemplateEditorProvider initialTemplateId="test-template-id">
        <div className="p-4 bg-gray-100 rounded-lg">
          <p className="mb-4">This tests if TemplateEditorProvider correctly wraps components.</p>
          
          <div className="flex space-x-4">
            <Button>Test Button</Button>
            <Link href="/dashboard-view/template-editor">
              <Button variant="outline">Go to Real Editor</Button>
            </Link>
          </div>
        </div>
      </TemplateEditorProvider>
    </div>
  );
} 