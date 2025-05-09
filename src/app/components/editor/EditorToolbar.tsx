"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useEditor } from "@/lib/contexts/EditorContext";
import {
  Save,
  Undo,
  Redo,
  Layout,
  Type,
  Image as ImageIcon,
  Edit3,
  Eye,
  Download,
  ChevronDown,
  Sparkles,
} from "lucide-react";

interface EditorToolbarProps {
  className?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  className = "",
}) => {
  const { state, dispatch, saveTemplate } = useEditor();
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Toggle dropdown menus
  const toggleDropdown = (name: string) => {
    if (showDropdown === name) {
      setShowDropdown(null);
    } else {
      setShowDropdown(name);
    }
  };

  // Close dropdown when clicking outside
  const closeDropdowns = () => {
    setShowDropdown(null);
  };

  // Handle save action with animation feedback
  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    
    try {
      await saveTemplate();
      // Success animation will happen via CSS
    } catch (error) {
      console.error("Failed to save template", error);
      // Error handling would go here
    } finally {
      // Set saving to false after a delay to allow for animation
      setTimeout(() => {
        setIsSaving(false);
      }, 1000);
    }
  };

  // Toggle preview/edit mode
  const togglePreviewMode = () => {
    dispatch({
      type: "SET_EDITOR_MODE",
      payload: state.ui.editorMode === "edit" ? "preview" : "edit",
    });
  };

  // Add section handler
  const handleAddSection = (sectionType: "intro" | "hook" | "body" | "callToAction") => {
    dispatch({
      type: "ADD_SECTION",
      payload: {
        id: Math.random().toString(36).substr(2, 9),
        type: sectionType,
        startTime: 0, // Will be calculated based on existing sections
        duration: sectionType === "intro" ? 3 : sectionType === "hook" ? 5 : sectionType === "body" ? 15 : 5,
        elements: [],
      },
    });
    setShowDropdown(null);
  };

  // Button styles
  const buttonClasses = "p-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors duration-150 flex items-center gap-1.5";
  const activeButtonClasses = "p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-150 flex items-center gap-1.5";
  const dropdownButtonClasses = "w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors duration-150 flex items-center gap-1.5";
  
  // Define animation variants
  const iconVariants = {
    saving: { rotate: 360, transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity } },
    idle: { rotate: 0 },
  };

  return (
    <div className={`bg-white border-b border-gray-200 px-4 flex items-center justify-between h-16 ${className}`} onClick={closeDropdowns}>
      {/* Left side - Save & History Controls */}
      <div className="flex items-center space-x-1">
        <motion.button
          className={`${buttonClasses} group relative`}
          onClick={handleSave}
          disabled={isSaving}
          animate={isSaving ? "saving" : "idle"}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span 
            variants={iconVariants}
            className="text-blue-600 transition-colors duration-150"
          >
            <Save size={18} />
          </motion.span>
          <span className="hidden sm:inline">Save</span>
          
          {/* Success animation indicator */}
          {isSaving && (
            <motion.span 
              className="absolute inset-0 bg-green-50 rounded-md z-[-1] opacity-0"
              animate={{ opacity: [0, 0.8, 0] }}
              transition={{ duration: 1, times: [0, 0.2, 1] }}
            />
          )}
        </motion.button>

        <button className={`${buttonClasses}`} onClick={() => { /* Undo functionality */ }}>
          <Undo size={18} />
          <span className="hidden sm:inline">Undo</span>
        </button>

        <button className={`${buttonClasses}`} onClick={() => { /* Redo functionality */ }}>
          <Redo size={18} />
          <span className="hidden sm:inline">Redo</span>
        </button>
      </div>

      {/* Center - Section Controls */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <button 
            className={`${buttonClasses} bg-gray-50`}
            onClick={(e) => {
              e.stopPropagation();
              toggleDropdown("sections");
            }}
          >
            <Layout size={18} />
            <span className="hidden sm:inline">Add Section</span>
            <ChevronDown size={14} />
          </button>
          
          {/* Sections dropdown */}
          {showDropdown === "sections" && (
            <motion.div 
              className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[180px] z-10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={dropdownButtonClasses} onClick={() => handleAddSection("intro")}>
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                <span>Intro Section</span>
              </button>
              <button className={dropdownButtonClasses} onClick={() => handleAddSection("hook")}>
                <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                <span>Hook Section</span>
              </button>
              <button className={dropdownButtonClasses} onClick={() => handleAddSection("body")}>
                <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                <span>Body Section</span>
              </button>
              <button className={dropdownButtonClasses} onClick={() => handleAddSection("callToAction")}>
                <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                <span>Call to Action</span>
              </button>
            </motion.div>
          )}
        </div>

        {/* Add Element dropdown */}
        <div className="relative">
          <button 
            className={`${buttonClasses} bg-gray-50`}
            onClick={(e) => {
              e.stopPropagation();
              toggleDropdown("elements");
            }}
          >
            <Type size={18} />
            <span className="hidden sm:inline">Add Element</span>
            <ChevronDown size={14} />
          </button>
          
          {showDropdown === "elements" && (
            <motion.div 
              className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[180px] z-10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className={dropdownButtonClasses}
                onClick={() => {
                  // Add text element
                  if (!state.ui.selectedSectionId) return;
                  
                  dispatch({
                    type: "ADD_ELEMENT",
                    payload: {
                      sectionId: state.ui.selectedSectionId,
                      element: {
                        id: Math.random().toString(36).substr(2, 9),
                        type: "text",
                        content: "Add your text here",
                        position: {
                          x: 50,
                          y: 50,
                          z: 1,
                          xUnit: "%",
                          yUnit: "%",
                        },
                        size: {
                          width: 40,
                          height: 10,
                          widthUnit: "%",
                          heightUnit: "%",
                        },
                        style: {
                          fontFamily: "Inter",
                          fontSize: 20,
                          fontWeight: "500",
                          color: "#FFFFFF",
                          textAlign: "center",
                        },
                      },
                    },
                  });
                  setShowDropdown(null);
                }}
              >
                <Type size={16} className="mr-2" />
                <span>Text Element</span>
              </button>
              
              <button 
                className={dropdownButtonClasses}
                onClick={() => {
                  setShowDropdown(null);
                  alert('Media element will be implemented in a future update');
                }}
              >
                <ImageIcon size={16} className="mr-2" />
                <span>Media Element</span>
              </button>
              
              <button 
                className={dropdownButtonClasses}
                onClick={() => {
                  setShowDropdown(null);
                  alert('Effect element will be implemented in a future update');
                }}
              >
                <Sparkles size={16} className="mr-2" />
                <span>Effect Element</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Right side - Preview Controls */}
      <div className="flex items-center space-x-1">
        {/* Toggle preview mode */}
        <button
          className={state.ui.editorMode === "preview" ? activeButtonClasses : buttonClasses}
          onClick={togglePreviewMode}
        >
          {state.ui.editorMode === "preview" ? (
            <>
              <Edit3 size={18} />
              <span className="hidden sm:inline">Edit</span>
            </>
          ) : (
            <>
              <Eye size={18} />
              <span className="hidden sm:inline">Preview</span>
            </>
          )}
        </button>

        {/* Export button */}
        <button
          className={`${buttonClasses} bg-blue-600 text-white hover:bg-blue-700 hover:text-white ml-2`}
          onClick={() => {
            // Export functionality would go here
            console.log("Export template");
            alert('Export feature will be implemented in a future update');
          }}
        >
          <Download size={18} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar; 