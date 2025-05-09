"use client";

import React from "react";
import { EditorProvider } from "@/lib/contexts/EditorContext";

export default function DirectEditorPage() {
  return (
    <div className="h-screen w-full flex flex-col">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between h-16">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold">Simple Editor</h1>
        </div>
        <div className="flex items-center space-x-4">
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            Return to Dashboard
          </a>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <EditorProvider>
          <div className="flex flex-col h-full">
            <div className="h-14 border-b">
              Toolbar
            </div>
            <div className="flex-1 flex">
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <p>Canvas: No components loaded yet</p>
              </div>
            </div>
            <div className="h-20 border-t flex items-center justify-center">
              Timeline
            </div>
          </div>
        </EditorProvider>
      </main>
    </div>
  );
} 