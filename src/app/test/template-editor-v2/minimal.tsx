"use client";

import React from 'react';
import { TemplateEditorProvider } from '@/components/templateEditor-v2/TemplateEditorContext';

export default function MinimalTest() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Minimal Test</h1>
      <p>This is a minimal test to check if the context provider renders without errors.</p>
      
      <div className="mt-4 p-4 border rounded">
        <TemplateEditorProvider>
          <div>Context Provider Loaded Successfully</div>
        </TemplateEditorProvider>
      </div>
    </div>
  );
} 