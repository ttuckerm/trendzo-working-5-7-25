"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useEditor } from "@/lib/contexts/EditorContext";
import { TemplateElement, TemplateSection, MediaSource } from "@/lib/types/templateEditor";
import { Pencil, Move, Plus, Lock, Unlock, Eye, EyeOff, Copy } from "lucide-react";

interface TemplateCanvasProps {
  className?: string;
}

// Extend TemplateSection type to include optional background media
interface ExtendedTemplateSection extends TemplateSection {
  videoUrl?: string;
  imageUrl?: string;
}

export const TemplateCanvas: React.FC<TemplateCanvasProps> = ({ className = "" }) => {
  const { state, dispatch } = useEditor();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    elementId: string | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    elementId: null,
  });

  // Get the current active section
  const activeSection = state.ui.selectedSectionId
    ? state.template.sections.find((section) => section.id === state.ui.selectedSectionId)
    : state.template.sections[0];

  // Update canvas size on resize
  useEffect(() => {
    if (!canvasRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === canvasRef.current) {
          setCanvasSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    });

    resizeObserver.observe(canvasRef.current);

    return () => {
      if (canvasRef.current) {
        resizeObserver.unobserve(canvasRef.current);
      }
    };
  }, []);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [contextMenu]);

  // Handle element selection
  const handleElementSelect = (
    e: React.MouseEvent<HTMLDivElement>,
    elementId: string
  ) => {
    e.stopPropagation();
    dispatch({ type: "SET_SELECTED_ELEMENT", payload: elementId });
  };

  // Handle element deselection (click on canvas)
  const handleCanvasClick = () => {
    if (state.ui.selectedElementId) {
      dispatch({ type: "SET_SELECTED_ELEMENT", payload: null });
    }
  };

  // Handle context menu for elements
  const handleContextMenu = (
    e: React.MouseEvent<HTMLDivElement>,
    elementId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      elementId,
    });
  };

  // Framer Motion drag handlers
  const handleDragStart = () => {
    if (state.ui.editorMode === "preview") return;
    setIsDragging(true);
  };

  const handleDrag = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
    elementId: string
  ) => {
    if (state.ui.editorMode === "preview" || !activeSection) return;
    
    // Find the element to update
    const element = activeSection.elements.find((el) => el.id === elementId);
    if (!element) return;
    
    // Calculate new position
    let newX = element.position.x;
    let newY = element.position.y;
    
    if (element.position.xUnit === "%") {
      // Convert pixel movement to percentage
      newX += (info.delta.x / canvasSize.width) * 100;
    } else {
      newX += info.delta.x;
    }
    
    if (element.position.yUnit === "%") {
      newY += (info.delta.y / canvasSize.height) * 100;
    } else {
      newY += info.delta.y;
    }
    
    // Clamp values to prevent elements from going off-screen
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));
    
    // Update the element position
    dispatch({
      type: "UPDATE_ELEMENT",
      payload: {
        sectionId: activeSection.id,
        elementId,
        data: {
          position: {
            ...element.position,
            x: newX,
            y: newY,
          },
        },
      },
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Handle duplicate element
  const handleDuplicateElement = (elementId: string) => {
    if (!activeSection) return;
    
    const element = activeSection.elements.find((el) => el.id === elementId);
    if (!element) return;
    
    // Create a new element with the same properties
    const newElement: TemplateElement = {
      ...JSON.parse(JSON.stringify(element)),
      id: Math.random().toString(36).substr(2, 9),
      position: {
        ...element.position,
        x: element.position.x + 5,
        y: element.position.y + 5,
      },
    };
    
    dispatch({
      type: "ADD_ELEMENT",
      payload: {
        sectionId: activeSection.id,
        element: newElement,
      },
    });
    
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Handle delete element
  const handleDeleteElement = (elementId: string) => {
    if (!activeSection) return;
    
    dispatch({
      type: "DELETE_ELEMENT",
      payload: {
        sectionId: activeSection.id,
        elementId,
      },
    });
    
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Create a new text element at the clicked position
  const handleAddTextElement = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeSection || state.ui.editorMode === "preview") return;
    
    // Calculate position in percentage
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newElement: TemplateElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: "text",
      content: "Add your text here",
      position: {
        x,
        y,
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
    };
    
    dispatch({
      type: "ADD_ELEMENT",
      payload: {
        sectionId: activeSection.id,
        element: newElement,
      },
    });
  };

  // Render elements based on their type
  const renderElement = (element: TemplateElement) => {
    const isSelected = element.id === state.ui.selectedElementId;
    
    // Common element properties
    const style = {
      left: `${element.position.x}${element.position.xUnit}`,
      top: `${element.position.y}${element.position.yUnit}`,
      width: `${element.size.width}${element.size.widthUnit}`,
      height: `${element.size.height}${element.size.heightUnit}`,
      zIndex: element.position.z,
      cursor: state.ui.editorMode === "edit" ? "move" : "default",
    };
    
    // Element-specific rendering
    switch (element.type) {
      case "text": {
        const textContent = typeof element.content === "string" ? element.content : "";
        
        return (
          <motion.div
            key={element.id}
            className={`absolute transition-shadow duration-150 ${isSelected ? "shadow-focus-ring" : ""}`}
            style={{
              ...style,
              fontFamily: element.style.fontFamily,
              fontSize: `${element.style.fontSize}px`,
              fontWeight: element.style.fontWeight,
              color: element.style.color,
              textAlign: element.style.textAlign || "left",
              backgroundColor: element.style.backgroundColor,
              opacity: element.style.opacity,
              borderRadius: element.style.borderRadius ? `${element.style.borderRadius}px` : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: element.style.textAlign === "center" 
                ? "center" 
                : element.style.textAlign === "right" 
                  ? "flex-end" 
                  : "flex-start",
              padding: "8px",
              overflow: "hidden",
              boxSizing: "border-box",
            }}
            onClick={(e) => handleElementSelect(e as React.MouseEvent<HTMLDivElement>, element.id)}
            onContextMenu={(e) => handleContextMenu(e as React.MouseEvent<HTMLDivElement>, element.id)}
            drag={state.ui.editorMode === "edit"}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDrag={(e, info) => handleDrag(e, info, element.id)}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {textContent}
            
            {/* Show controls when selected */}
            {isSelected && state.ui.editorMode === "edit" && (
              <div className="absolute -top-8 left-0 bg-white rounded-t-md shadow-sm flex items-center">
                <button className="p-1.5 text-gray-700 hover:text-blue-600 transition-colors duration-150">
                  <Pencil size={14} />
                </button>
                <button className="p-1.5 text-gray-700 hover:text-blue-600 transition-colors duration-150">
                  <Move size={14} />
                </button>
                <button 
                  className="p-1.5 text-gray-700 hover:text-blue-600 transition-colors duration-150"
                  onClick={() => handleDuplicateElement(element.id)}
                >
                  <Copy size={14} />
                </button>
              </div>
            )}
          </motion.div>
        );
      }
      
      case "media": {
        const mediaSource = typeof element.content !== "string" 
          ? (element.content as MediaSource) 
          : { url: "", type: "image" as const };
        
        return (
          <motion.div
            key={element.id}
            className={`absolute transition-shadow duration-150 ${isSelected ? "shadow-focus-ring" : ""}`}
            style={{
              ...style,
              backgroundColor: element.style.backgroundColor || "#000",
              opacity: element.style.opacity,
              borderRadius: element.style.borderRadius ? `${element.style.borderRadius}px` : undefined,
              overflow: "hidden",
            }}
            onClick={(e) => handleElementSelect(e as React.MouseEvent<HTMLDivElement>, element.id)}
            onContextMenu={(e) => handleContextMenu(e as React.MouseEvent<HTMLDivElement>, element.id)}
            drag={state.ui.editorMode === "edit"}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDrag={(e, info) => handleDrag(e, info, element.id)}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.02 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {mediaSource.type === "image" ? (
              <img
                src={mediaSource.url}
                alt={mediaSource.altText || "Template media"}
                className="w-full h-full object-cover"
              />
            ) : mediaSource.type === "video" ? (
              <video
                src={mediaSource.url}
                controls={false}
                autoPlay={state.ui.editorMode === "preview"}
                loop
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                Media placeholder
              </div>
            )}
            
            {/* Show controls when selected */}
            {isSelected && state.ui.editorMode === "edit" && (
              <div className="absolute -top-8 left-0 bg-white rounded-t-md shadow-sm flex items-center">
                <button className="p-1.5 text-gray-700 hover:text-blue-600 transition-colors duration-150">
                  <Move size={14} />
                </button>
                <button 
                  className="p-1.5 text-gray-700 hover:text-blue-600 transition-colors duration-150"
                  onClick={() => handleDuplicateElement(element.id)}
                >
                  <Copy size={14} />
                </button>
              </div>
            )}
          </motion.div>
        );
      }
      
      default:
        return null;
    }
  };

  // Check if section has background media (as ExtendedTemplateSection)
  const extendedSection = activeSection as ExtendedTemplateSection | undefined;
  const hasVideo = extendedSection?.videoUrl;
  const hasImage = extendedSection?.imageUrl;

  return (
    <div className={`relative overflow-hidden bg-gray-900 ${className}`}>
      {/* Canvas */}
      <div
        ref={canvasRef}
        className={`relative w-full h-full ${
          state.ui.editorMode === "edit" ? "cursor-crosshair" : "cursor-default"
        }`}
        onClick={handleCanvasClick}
        onDoubleClick={state.ui.editorMode === "edit" ? handleAddTextElement : undefined}
      >
        {/* Background video/image for the section */}
        {hasVideo && (
          <video
            src={extendedSection!.videoUrl}
            autoPlay={state.ui.editorMode === "preview"}
            loop
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {hasImage && !hasVideo && (
          <img
            src={extendedSection!.imageUrl}
            alt="Template background"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {/* Placeholder when no section is selected */}
        {!activeSection && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <p className="text-lg mb-4">No template section selected</p>
            <button 
              onClick={() => dispatch({ 
                type: "ADD_SECTION", 
                payload: {
                  id: Math.random().toString(36).substr(2, 9),
                  type: "intro",
                  startTime: 0,
                  duration: 5,
                  elements: [],
                }
              })}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-150"
            >
              <Plus size={16} />
              Add a section
            </button>
          </div>
        )}
        
        {/* Render elements */}
        {activeSection && activeSection.elements.map((element) => renderElement(element))}
      </div>
      
      {/* Add element floating button (only in edit mode) */}
      {state.ui.editorMode === "edit" && activeSection && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-4 right-4 rounded-full bg-blue-600 text-white p-4 shadow-lg hover:bg-blue-700 transition-colors duration-150"
          onClick={(e) => {
            e.stopPropagation();
            if (!activeSection) return;
            
            const newElement: TemplateElement = {
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
            };
            
            dispatch({
              type: "ADD_ELEMENT",
              payload: {
                sectionId: activeSection.id,
                element: newElement,
              },
            });
          }}
        >
          <Plus size={24} />
        </motion.button>
      )}
      
      {/* Context menu */}
      <AnimatePresence>
        {contextMenu.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
            className="fixed bg-white rounded-md shadow-lg py-1 z-50"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              onClick={() => {
                if (contextMenu.elementId) {
                  handleDuplicateElement(contextMenu.elementId);
                }
              }}
            >
              <Copy size={14} />
              Duplicate
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
              onClick={() => {
                if (contextMenu.elementId) {
                  handleDeleteElement(contextMenu.elementId);
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TemplateCanvas; 