"use client";

import React from "react";
import { ElementsPanel } from "./panels/ElementsPanel";
import { PropertiesPanel } from "./panels/PropertiesPanel";
import { EditorCanvas } from "./EditorCanvas";
import { useTemplateEditor } from "./TemplateEditorContext";

interface EditorLayoutProps {
  className?: string;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({ className = "" }) => {
  const { state } = useTemplateEditor();
  const { panels } = state.ui;

  return (
    <div 
      className={`grid grid-cols-12 h-[calc(100vh-4rem)] ${className}`}
      data-testid="editor-layout"
    >
      {/* Elements Panel */}
      {panels.elementsOpen && (
        <div className="col-span-2 border-r overflow-hidden flex flex-col bg-white"
             data-testid="editor-elements-panel">
          <ElementsPanel />
        </div>
      )}

      {/* Canvas */}
      <div 
        className={`${
          panels.elementsOpen && panels.propertiesOpen
            ? "col-span-8"
            : panels.elementsOpen || panels.propertiesOpen
            ? "col-span-10"
            : "col-span-12"
        } overflow-hidden flex flex-col`}
        data-testid="editor-canvas"
      >
        <EditorCanvas />
      </div>

      {/* Properties Panel */}
      {panels.propertiesOpen && (
        <div className="col-span-2 border-l overflow-hidden flex flex-col bg-white"
             data-testid="editor-properties-panel">
          <PropertiesPanel />
        </div>
      )}
    </div>
  );
};

export default EditorLayout; 