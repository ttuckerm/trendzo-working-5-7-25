"use client";

import React from 'react';
import { EditorProvider, useEditor } from '@/lib/contexts/EditorContext';

/**
 * Component that uses the editor context
 */
function EditorConsumer() {
  const { state } = useEditor();
  
  return (
    <div>
      <p>Editor Consumer Component</p>
      <p>Template ID: {state.template.id}</p>
    </div>
  );
}

/**
 * Minimal test for EditorProvider
 */
export default function MinimalEditorProviderTest() {
  return (
    <div>
      <h1>Minimal EditorProvider Test</h1>
      <EditorProvider>
        <div>
          <p>This content should have access to the editor context:</p>
          <EditorConsumer />
        </div>
      </EditorProvider>
    </div>
  );
} 