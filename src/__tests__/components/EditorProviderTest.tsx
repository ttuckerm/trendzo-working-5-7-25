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
      <p>Successfully using editor context</p>
      <p>Current template ID: {state.template.id}</p>
    </div>
  );
}

/**
 * Minimal test component to verify EditorProvider and useEditor hook
 */
export default function EditorProviderTest() {
  return (
    <div className="test-container">
      <h1>EditorProvider Test</h1>
      
      <EditorProvider>
        <div className="content-area">
          <p>This tests if EditorProvider correctly provides context to children.</p>
          <EditorConsumer />
        </div>
      </EditorProvider>
    </div>
  );
} 