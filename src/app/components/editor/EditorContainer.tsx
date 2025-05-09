"use client";

import React, { useEffect, useState } from "react";
import { useEditor } from "@/lib/contexts/EditorContext";
import { AnimatePresence, motion } from "framer-motion";

// Placeholder components - these will be implemented separately
const TemplateCanvas = () => <div className="flex-1 bg-gray-50 rounded-md">Canvas Placeholder</div>;
const EditorToolbar = () => <div className="h-14 border-b">Toolbar Placeholder</div>;
const EditorSidebar = () => <div className="w-64 border-l">Sidebar Placeholder</div>;
const EditorTimeline = () => <div className="h-20 border-t">Timeline Placeholder</div>;
const LoadingState = () => <div className="flex items-center justify-center h-full w-full">Loading...</div>;

interface EditorContainerProps {
  templateId?: string;
  className?: string;
}

export const EditorContainer: React.FC<EditorContainerProps> = ({ 
  templateId,
  className = "" 
}) => {
  const { state, dispatch, loadTemplate } = useEditor();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load template data effect
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) {
        // Create a new empty template
        dispatch({
          type: "SET_TEMPLATE",
          payload: {
            id: "",
            name: "Untitled Template",
            sections: [],
            duration: 0,
          },
        });
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
            sections: [
              {
                id: "intro-section",
                type: "intro" as const,
                startTime: 0,
                duration: 5,
                elements: [
                  {
                    id: "intro-text",
                    type: "text" as const,
                    content: "Welcome to our brand!",
                    position: {
                      x: 50,
                      y: 50,
                      z: 1,
                      xUnit: "%" as const,
                      yUnit: "%" as const,
                    },
                    size: {
                      width: 80,
                      height: 10,
                      widthUnit: "%" as const,
                      heightUnit: "%" as const,
                    },
                    style: {
                      fontFamily: "Inter",
                      fontSize: 28,
                      fontWeight: "600",
                      color: "#FFFFFF",
                      textAlign: "center" as const,
                    },
                  },
                ],
              },
              {
                id: "hook-section",
                type: "hook" as const,
                startTime: 5,
                duration: 7,
                elements: [
                  {
                    id: "hook-text",
                    type: "text" as const,
                    content: "Discover why we're different",
                    position: {
                      x: 50,
                      y: 50,
                      z: 1,
                      xUnit: "%" as const,
                      yUnit: "%" as const,
                    },
                    size: {
                      width: 80,
                      height: 10,
                      widthUnit: "%" as const,
                      heightUnit: "%" as const,
                    },
                    style: {
                      fontFamily: "Inter",
                      fontSize: 24,
                      fontWeight: "500",
                      color: "#FFFFFF",
                      textAlign: "center" as const,
                    },
                  },
                ],
              },
            ],
            duration: 12,
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
  }, [templateId, dispatch, loadTemplate]);

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
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`flex flex-col h-full ${className}`}
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
          
          <motion.div variants={itemVariants}>
            <EditorTimeline />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditorContainer; 