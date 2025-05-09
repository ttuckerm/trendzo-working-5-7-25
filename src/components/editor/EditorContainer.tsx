"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useEditor } from "@/lib/contexts/EditorContext";
import { AnimatePresence, motion } from "framer-motion";
import { Template } from "@/lib/types/editor";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Direct imports for editor components
import EditorToolbar from "./EditorToolbar";
import TemplateCanvas from "./TemplateCanvas";
import EditorSidebar from "./EditorSidebar";
import EditorTimeline from "./EditorTimeline";

/**
 * EditorContainer - Main container for the template editor
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Layout focuses on content with minimal UI chrome
 * - Emotional Design: Smooth transitions between states
 * - Contextual Intelligence: Components adapt based on editor state
 * - Progressive Disclosure: Tools appear when needed
 * - Sensory Harmony: Consistent visual feedback
 */

// Loading state component
const LoadingState = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500">Loading editor...</p>
    </div>
  </div>
);

interface EditorContainerProps {
  templateId?: string;
  className?: string;
  initialTemplate?: Template;
}

export const EditorContainer: React.FC<EditorContainerProps> = ({ 
  templateId,
  className = "",
  initialTemplate
}) => {
  const { 
    state, 
    loadTemplate,
    selectSection,
    selectElement,
    addElement
  } = useEditor();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControlsHint, setShowControlsHint] = useState(true);
  const [showGettingStarted, setShowGettingStarted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent handling shortcuts when inside input or textarea elements
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    // Cmd/Ctrl + Z for undo
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      // undo();
    }

    // Cmd/Ctrl + Shift + Z for redo
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      // redo();
    }

    // Delete key for removing selected element
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // Only handle if not in an input field
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }
      
      // const activeSection = state.template.sections.find(s => s.id === state.ui.selectedSectionId);
      // if (activeSection && state.ui.selectedElementId) {
      //   e.preventDefault();
      //   deleteElement(activeSection.id, state.ui.selectedElementId);
      // }
    }
  }, [state.ui.selectedSectionId, state.ui.selectedElementId]);

  // Add keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Load template data effect
  useEffect(() => {
    const fetchTemplate = async () => {
      if (initialTemplate) {
        loadTemplate(initialTemplate);
        setLoading(false);
        return;
      }

      if (!templateId) {
        // Create a new empty template
        setLoading(false);
        return;
      }

      try {
        // Simulate template loading
        setLoading(true);
        
        // In a real implementation, this would fetch from an API
        setTimeout(() => {
          // Mocked template data that matches our types
          const dummyTemplate = {
            id: templateId,
            name: "Sample Template",
            description: "A sample template for demonstration",
            aspectRatio: "9:16" as const,
            sections: [
              {
                id: "intro-section",
                name: "Introduction",
                type: "intro" as const,
                duration: 5,
                elements: [
                  {
                    id: "intro-text",
                    type: "text" as const,
                    content: "Welcome to our brand!",
                    x: 50,
                    y: 50,
                    width: 300,
                    height: 60,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 1,
                    locked: false
                  },
                ],
              },
              {
                id: "hook-section",
                name: "Hook",
                type: "hook" as const,
                duration: 7,
                elements: [
                  {
                    id: "hook-text",
                    type: "text" as const,
                    content: "Discover why we're different",
                    x: 50,
                    y: 100,
                    width: 300,
                    height: 60,
                    rotation: 0,
                    opacity: 1,
                    zIndex: 1,
                    locked: false
                  },
                ],
              },
            ],
          };
          
          loadTemplate(dummyTemplate);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error("Failed to load template:", err);
        setError("Failed to load template. Please try again.");
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId, initialTemplate, loadTemplate]);

  // Progressive onboarding - disappear hints after some interactions
  useEffect(() => {
    const operationCount = state.history.past.length;
    
    if (operationCount > 3 && showControlsHint) {
      setShowControlsHint(false);
    }
    
    if (operationCount > 5 && showGettingStarted) {
      setShowGettingStarted(false);
    }
  }, [state.history.past.length, showControlsHint, showGettingStarted]);

  // Handle errors
  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-red-50 text-red-600 rounded-md p-4">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="ml-4 px-3 py-1 bg-red-100 hover:bg-red-200 rounded-md transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  // Define animations for the container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24 
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`flex flex-col h-full ${className}`}
        >
          <LoadingState />
        </motion.div>
      ) : (
        <motion.div
          key="editor"
          ref={containerRef}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn("flex flex-col h-full", className)}
        >
          <motion.div variants={itemVariants}>
            <EditorToolbar />
          </motion.div>
          
          <div className="flex-1 flex overflow-hidden">
            <motion.div variants={itemVariants} className="flex-1">
              <TemplateCanvas />
            </motion.div>
            
            {state.ui.showPropertyEditor && (
              <motion.div 
                variants={itemVariants}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
              >
                <EditorSidebar />
              </motion.div>
            )}
          </div>
          
          {/* Timeline */}
          <motion.div 
            variants={itemVariants} 
            className="border-t flex-shrink-0"
          >
            <EditorTimeline />
          </motion.div>
          
          {/* Progressive disclosure - Getting started overlay */}
          <AnimatePresence>
            {showGettingStarted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-white rounded-lg p-6 max-w-md"
                >
                  <h2 className="text-2xl font-bold mb-4">Welcome to the Template Editor</h2>
                  <p className="mb-4">Create beautiful video templates with our intuitive editor. Here's how to get started:</p>
                  <ul className="mb-6 space-y-2">
                    <li className="flex items-start">
                      <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0">1</span>
                      <span>Add sections using the timeline at the bottom</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0">2</span>
                      <span>Add elements like text, images, and videos to your sections</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0">3</span>
                      <span>Customize your elements using the property panel</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => setShowGettingStarted(false)}
                    className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Got it, let's create!
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Invisible Interface - Contextual keyboard shortcuts hint */}
          <AnimatePresence>
            {showControlsHint && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm"
              >
                Press T to add text • I for images • ⌘Z to undo • ESC to deselect
                <button
                  onClick={() => setShowControlsHint(false)}
                  className="ml-2 text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditorContainer; 