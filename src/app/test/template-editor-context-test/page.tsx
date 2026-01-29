"use client";

import React from 'react';
import { TemplateEditorProvider, useTemplateEditor } from '@/lib/contexts/TemplateEditorContext';

/**
 * Component that uses the template editor context
 */
function TemplateEditorConsumer() {
  const { state } = useTemplateEditor();
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <p className="font-bold">Template Editor Consumer Component</p>
      <p className="mt-2">Template ID: {state.template.id}</p>
      <p>Mode: {state.ui.mode}</p>
      <p>Selected Section: {state.ui.selectedSectionId || 'None'}</p>
    </div>
  );
}

/**
 * Minimal test for TemplateEditorProvider
 */
export default function TemplateEditorContextTest() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Template Editor Context Test</h1>
      
      <TemplateEditorProvider initialTemplateId="test-template-id">
        <div className="mb-8">
          <p className="mb-4">This content should have access to the template editor context:</p>
          <TemplateEditorConsumer />
        </div>
      </TemplateEditorProvider>
    </div>
  );
} 