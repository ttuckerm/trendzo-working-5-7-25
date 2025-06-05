"use client";

import React from 'react';
import { TemplateEditorProvider } from '@/components/templateEditor-v2/TemplateEditorContext';
import { DragDropProvider } from '@/components/templateEditor-v2/DragContext';
import { ElementsPanel } from '@/components/templateEditor-v2/panels/ElementsPanel';
import { EditorCanvas } from '@/components/templateEditor-v2/EditorCanvas';

export default function TemplateEditorV2Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-xl font-semibold text-gray-800">Template Editor V2</h1>
      </header>
      
      <main className="flex h-[calc(100vh-56px)]">
        <TemplateEditorProvider>
          <DragDropProvider>
            <div className="w-72 border-r border-gray-200 h-full">
              <ElementsPanel onAddCustomElement={() => console.log('Add custom element')} />
            </div>
            <div className="flex-1 h-full">
              <EditorCanvas />
            </div>
          </DragDropProvider>
        </TemplateEditorProvider>
      </main>
    </div>
  );
} 