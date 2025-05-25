"use client";

import React, { useState } from 'react';
import { TemplateEditorProvider } from '@/components/templateEditor-v2/TemplateEditorContext';
import { EditorCanvas } from '@/components/templateEditor-v2/EditorCanvas';
import { DragDropProvider } from '@/components/templateEditor-v2/DragContext';
import { PreviewSystem } from '@/components/templateEditor-v2/PreviewSystem';
import { ZeroUIEditing } from '@/components/templateEditor-v2/ZeroUIEditing';
import { Layers, Play } from 'lucide-react';

export default function SimpleEditorTest() {
  const [activeView, setActiveView] = useState<'editor' | 'preview'>('editor');
  
  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold">Simple Editor Test</h1>
        
        <div className="flex space-x-4 mt-4">
          <button
            className={`px-4 py-2 rounded-md ${
              activeView === 'editor' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveView('editor')}
          >
            <div className="flex items-center">
              <Layers size={16} className="mr-2" />
              Canvas Editor
            </div>
          </button>
          
          <button
            className={`px-4 py-2 rounded-md ${
              activeView === 'preview' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveView('preview')}
          >
            <div className="flex items-center">
              <Play size={16} className="mr-2" />
              Preview
            </div>
          </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <TemplateEditorProvider>
          <DragDropProvider>
            {activeView === 'editor' ? (
              <div className="h-full flex flex-col">
                <div className="flex-1">
                  <EditorCanvas />
                </div>
                <ZeroUIEditing />
              </div>
            ) : (
              <PreviewSystem />
            )}
          </DragDropProvider>
        </TemplateEditorProvider>
      </div>
    </div>
  );
} 