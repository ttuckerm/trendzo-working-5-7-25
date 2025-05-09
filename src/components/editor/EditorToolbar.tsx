"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useEditor } from "@/lib/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { 
  Save, 
  Undo, 
  Redo, 
  Play, 
  Pause, 
  Copy, 
  Trash2, 
  LayoutGrid, 
  Plus, 
  Settings, 
  Share2, 
  Download, 
  EyeIcon,
  Edit,
  Lock,
  Unlock,
  Layers
} from "lucide-react";

/**
 * EditorToolbar Component
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Controls are minimal and contextual
 * - Emotional Design: Micro-animations for feedback
 * - Contextual Intelligence: Shows relevant tools based on selection
 * - Progressive Disclosure: Reveals advanced options when needed
 * - Sensory Harmony: Visual and interaction feedback are coordinated
 */

interface EditorToolbarProps {
  className?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ 
  className = "" 
}) => {
  // Get editor context
  const { 
    state, 
    saveTemplate, 
    undo, 
    redo, 
    selectSection, 
    addSection,
    deleteSection,
    duplicateSection,
    setEditorMode,
    togglePlayback,
    updateElement,
    deleteElement
  } = useEditor();
  
  // Local state
  const [isSaving, setIsSaving] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showHint, setShowHint] = useState<string | null>(null);
  
  // Get the currently active section and selected element
  const activeSection = state.template.sections.find(
    section => section.id === state.ui.selectedSectionId
  );
  
  const selectedElement = activeSection?.elements.find(
    element => element.id === state.ui.selectedElementId
  );
  
  // Handle save with animation feedback
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveTemplate();
      // Show success hint
      setShowHint("Template saved successfully!");
      setTimeout(() => setShowHint(null), 3000);
    } catch (error) {
      // Show error hint
      setShowHint("Failed to save template");
      setTimeout(() => setShowHint(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Toggle preview mode
  const togglePreviewMode = () => {
    setEditorMode(state.ui.editorMode === "edit" ? "preview" : "edit");
  };
  
  // Handle element locking
  const handleToggleLock = () => {
    if (!activeSection || !selectedElement) return;
    
    updateElement(
      activeSection.id,
      selectedElement.id,
      { locked: !selectedElement.locked }
    );
  };
  
  // Delete selected element or section
  const handleDelete = () => {
    if (selectedElement && activeSection) {
      deleteElement(activeSection.id, selectedElement.id);
    } else if (activeSection && !selectedElement) {
      deleteSection(activeSection.id);
    }
  };
  
  // Duplicate section
  const handleDuplicate = () => {
    if (activeSection) {
      duplicateSection(activeSection.id);
    }
  };
  
  return (
    <div className={cn(
      "flex items-center justify-between bg-background/95 backdrop-blur border-b px-4 py-2 h-14",
      className
    )}>
      {/* Left side - Context aware tools */}
      <div className="flex items-center space-x-1">
        {/* Toggle Preview/Edit */}
        <motion.button
          className={cn(
            "p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors",
            state.ui.editorMode === "preview" && "text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100"
          )}
          whileTap={{ scale: 0.95 }}
          onClick={togglePreviewMode}
          title={state.ui.editorMode === "edit" ? "Preview" : "Edit"}
        >
          {state.ui.editorMode === "edit" ? (
            <EyeIcon size={18} />
          ) : (
            <Edit size={18} />
          )}
        </motion.button>
        
        {/* History controls */}
        <div className="flex items-center border-l border-r px-1 mx-1">
          <motion.button
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
            whileTap={{ scale: 0.95 }}
            onClick={undo}
            disabled={state.history.undoStack.length === 0}
            title="Undo"
          >
            <Undo size={18} />
          </motion.button>
          
          <motion.button
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500"
            whileTap={{ scale: 0.95 }}
            onClick={redo}
            disabled={state.history.redoStack.length === 0}
            title="Redo"
          >
            <Redo size={18} />
          </motion.button>
        </div>
        
        {/* Add new section (only in edit mode) */}
        {state.ui.editorMode === "edit" && (
          <motion.button
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            whileTap={{ scale: 0.95 }}
            onClick={() => addSection()}
            title="Add Section"
          >
            <Plus size={18} />
          </motion.button>
        )}
        
        {/* Playback control (only in preview mode) */}
        {state.ui.editorMode === "preview" && (
          <motion.button
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            whileTap={{ scale: 0.95 }}
            onClick={togglePlayback}
            title={state.ui.isPlaying ? "Pause" : "Play"}
          >
            {state.ui.isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </motion.button>
        )}
      </div>
      
      {/* Middle - Template name */}
      <div className="flex items-center">
        <h1 className="text-lg font-medium truncate max-w-[240px]">
          {state.template.name || "Untitled Template"}
        </h1>
      </div>
      
      {/* Right side - Actions */}
      <div className="flex items-center space-x-1">
        {/* Context-aware actions based on selection */}
        {selectedElement && (
          <>
            <motion.button
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleLock}
              title={selectedElement.locked ? "Unlock" : "Lock"}
            >
              {selectedElement.locked ? <Unlock size={18} /> : <Lock size={18} />}
            </motion.button>
            
            <motion.button
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              title="Delete Element"
            >
              <Trash2 size={18} />
            </motion.button>
          </>
        )}
        
        {/* Section actions (when section is selected but no element) */}
        {activeSection && !selectedElement && (
          <>
            <motion.button
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              whileTap={{ scale: 0.95 }}
              onClick={handleDuplicate}
              title="Duplicate Section"
            >
              <Copy size={18} />
            </motion.button>
            
            {state.template.sections.length > 1 && (
              <motion.button
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                whileTap={{ scale: 0.95 }}
                onClick={handleDelete}
                title="Delete Section"
              >
                <Trash2 size={18} />
              </motion.button>
            )}
          </>
        )}
        
        {/* Sections dropdown (always visible) */}
        <div className="border-l pl-1 ml-1">
          <div className="relative">
            <motion.button
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              whileTap={{ scale: 0.95 }}
              title="Sections"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
            >
              <Layers size={18} />
            </motion.button>
            
            {/* Dropdown for selecting sections */}
            {showMoreOptions && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-lg z-10 w-48 py-1 border">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                  Sections
                </div>
                {state.template.sections.map((section, index) => (
                  <button
                    key={section.id}
                    className={cn(
                      "flex items-center px-3 py-2 w-full text-left hover:bg-gray-100 transition-colors",
                      section.id === state.ui.selectedSectionId && "bg-blue-50 text-blue-600"
                    )}
                    onClick={() => {
                      selectSection(section.id);
                      setShowMoreOptions(false);
                    }}
                  >
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 text-xs mr-2">
                      {index + 1}
                    </span>
                    <span className="truncate">
                      {section.name || `Section ${index + 1}`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Save button */}
        <motion.button
          className={cn(
            "p-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors",
            isSaving && "opacity-70"
          )}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={isSaving}
          title="Save Template"
        >
          <Save size={18} />
        </motion.button>
      </div>
      
      {/* Hint notification (with emotional design) */}
      {showHint && (
        <motion.div 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          {showHint}
        </motion.div>
      )}
    </div>
  );
};

export default EditorToolbar; 