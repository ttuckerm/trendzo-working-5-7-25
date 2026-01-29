"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, PanInfo, useDragControls } from "framer-motion";
import { useEditor } from "@/lib/contexts/EditorContext";
import { Element, TextElement, ImageElement, VideoElement, AudioElement } from "@/lib/types/editor";
import { cn } from "@/lib/utils";
import { Edit2, Move, Trash2, Lock, Unlock, Play, Pause, Image, Plus } from "lucide-react";

/**
 * TemplateCanvas Component
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Controls appear only when needed
 * - Emotional Design: Smooth animations and feedback
 * - Contextual Intelligence: Context-aware toolbars
 * - Progressive Disclosure: Complex options appear gradually
 * - Sensory Harmony: Visual feedback and motion are coordinated
 */

interface TemplateCanvasProps {
  className?: string;
}

export const TemplateCanvas: React.FC<TemplateCanvasProps> = ({ 
  className = "" 
}) => {
  // Get editor context
  const { 
    state, 
    selectSection,
    selectElement,
    moveElement,
    resizeElement,
    deleteElement,
    updateElement,
    addElement
  } = useEditor();
  
  // Local state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState<{
    x: number;
    y: number;
    elementId: string;
  } | null>(null);
  const dragControls = useDragControls();

  // Get the currently active section
  const activeSection = state.template.sections.find(
    section => section.id === state.ui.selectedSectionId
  );

  // Update canvas size on resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const { width, height } = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width, height });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showContextMenu && !e.defaultPrevented) {
        setShowContextMenu(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showContextMenu]);

  // Close context menu on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowContextMenu(null);
        
        // Only deselect if not in text editing mode
        if (!(e.target instanceof HTMLInputElement) && 
            !(e.target instanceof HTMLTextAreaElement)) {
          selectElement(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectElement]);

  // Calculate aspect ratio based on template settings
  const getCanvasDimensions = () => {
    const { aspectRatio = "9:16" } = state.template;
    const [width, height] = aspectRatio.split(":").map(Number);
    
    const containerWidth = canvasSize.width;
    const containerHeight = canvasSize.height;
    
    let canvasWidth, canvasHeight;
    
    // Determine if constrained by width or height
    const containerRatio = containerWidth / containerHeight;
    const aspectRatioValue = width / height;
    
    if (containerRatio > aspectRatioValue) {
      // Constrained by height
      canvasHeight = containerHeight * 0.9; // 90% of container height
      canvasWidth = canvasHeight * aspectRatioValue;
    } else {
      // Constrained by width
      canvasWidth = containerWidth * 0.9; // 90% of container width
      canvasHeight = canvasWidth / aspectRatioValue;
    }
    
    return { width: canvasWidth, height: canvasHeight };
  };

  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions();

  // Handle element selection (with emotional design feedback)
  const handleElementSelect = (
    e: React.MouseEvent<HTMLDivElement>,
    elementId: string
  ) => {
    e.stopPropagation();
    selectElement(elementId);
  };

  // Handle canvas click to deselect (invisible interface)
  const handleCanvasClick = () => {
    selectElement(null);
  };

  // Context menu for element options (progressive disclosure)
  const handleContextMenu = (
    e: React.MouseEvent<HTMLDivElement>,
    elementId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    const { clientX, clientY } = e;
    
    setShowContextMenu({
      x: clientX,
      y: clientY,
      elementId,
    });
    
    selectElement(elementId);
  };

  // Drag handlers with sensory feedback
  const handleDragStart = (e: PointerEvent, elementId: string) => {
    if (state.ui.editorMode === "preview") return;
    setIsDragging(true);
    
    // Find the selected element
    if (activeSection) {
      const element = activeSection.elements.find(el => el.id === elementId);
      if (element?.locked) return;
    }
  };

  const handleDrag = (
    _event: PointerEvent,
    info: PanInfo,
    elementId: string
  ) => {
    if (state.ui.editorMode === "preview" || !activeSection) return;
    
    // Find the element to update
    const element = activeSection.elements.find(el => el.id === elementId);
    if (!element || element.locked) return;
    
    // Calculate new position based on canvas dimensions
    const pixelsToPercentX = (pixels: number) => (pixels / canvasWidth) * 100;
    const pixelsToPercentY = (pixels: number) => (pixels / canvasHeight) * 100;
    
    const deltaXPercent = pixelsToPercentX(info.delta.x);
    const deltaYPercent = pixelsToPercentY(info.delta.y);
    
    moveElement(
      activeSection.id,
      elementId,
      element.x + deltaXPercent,
      element.y + deltaYPercent
    );
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Handle element duplication (with emotional design feedback)
  const handleDuplicateElement = (elementId: string) => {
    if (!activeSection) return;
    
    const element = activeSection.elements.find(el => el.id === elementId);
    if (!element) return;
    
    // Clone the element with slight offset
    const elementType = element.type;
    const originalElement = { ...element };
    
    // Remove properties that should be unique
    delete (originalElement as any).id;
    
    // Offset position slightly
    originalElement.x += 5;
    originalElement.y += 5;
    
    // Add the new element
    addElement(activeSection.id, elementType);
    
    setShowContextMenu(null);
  };

  // Handle element deletion
  const handleDeleteElement = (elementId: string) => {
    if (!activeSection) return;
    deleteElement(activeSection.id, elementId);
    setShowContextMenu(null);
  };

  // Toggle element lock
  const handleToggleLock = (elementId: string) => {
    if (!activeSection) return;
    
    const element = activeSection.elements.find(el => el.id === elementId);
    if (!element) return;
    
    updateElement(
      activeSection.id,
      elementId,
      { locked: !element.locked }
    );
    
    setShowContextMenu(null);
  };

  // Add new text element on double click (invisible interface)
  const handleAddTextElement = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeSection || state.ui.editorMode === "preview") return;
    
    // Get click position relative to canvas
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((e.clientX - rect.left) / canvasWidth) * 100;
    const y = ((e.clientY - rect.top) / canvasHeight) * 100;
    
    // Add text element at clicked position
    addElement(activeSection.id, "text");
    
    // Select the newly added element
    const newElement = activeSection.elements[activeSection.elements.length - 1];
    if (newElement) {
      // Move element to clicked position after it's created
      setTimeout(() => {
        moveElement(activeSection.id, newElement.id, x, y);
      }, 10);
    }
  };

  // Render specific element type
  const renderElement = (element: Element) => {
    const isSelected = element.id === state.ui.selectedElementId;
    
    // Base styles for all elements
    const elementStyle: React.CSSProperties = {
      position: "absolute",
      left: `${element.x}%`,
      top: `${element.y}%`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      opacity: element.opacity,
      transform: `rotate(${element.rotation}deg)`,
      zIndex: element.zIndex,
      cursor: element.locked || state.ui.editorMode === "preview" ? "default" : "move",
    };
    
    // Element-specific rendering with Emotion Design principles
    switch (element.type) {
      case "text": {
        const textElement = element as TextElement;
        return (
          <motion.div
            key={element.id}
            style={{
              ...elementStyle,
              color: textElement.color || "#FFFFFF",
              backgroundColor: textElement.backgroundColor,
              fontSize: `${textElement.fontSize}px`,
              fontWeight: textElement.fontWeight,
              fontFamily: textElement.fontFamily,
              textAlign: textElement.textAlign as any,
              display: "flex",
              alignItems: "center",
              justifyContent: textElement.textAlign === "center" 
                ? "center" 
                : textElement.textAlign === "right"
                ? "flex-end"
                : "flex-start",
              padding: "8px",
              borderRadius: "4px",
              boxSizing: "border-box",
              border: isSelected ? "1px solid #3B82F6" : "1px solid transparent",
              outline: isSelected ? "2px solid rgba(59, 130, 246, 0.5)" : "none",
            }}
            animate={isSelected ? { 
              boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)"
            } : { 
              boxShadow: "none" 
            }}
            transition={{ duration: 0.2 }}
            onClick={(e) => handleElementSelect(e as React.MouseEvent<HTMLDivElement>, element.id)}
            onContextMenu={(e) => handleContextMenu(e as React.MouseEvent<HTMLDivElement>, element.id)}
            dragControls={dragControls}
            drag={!element.locked && state.ui.editorMode === "edit"}
            dragMomentum={false}
            dragElastic={0}
            onDragStart={(e) => handleDragStart(e as PointerEvent, element.id)}
            onDrag={(e, info) => handleDrag(e as PointerEvent, info, element.id)}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.02 }}
          >
            <div
              contentEditable={!element.locked && state.ui.editorMode === "edit"}
              suppressContentEditableWarning={true}
              className="w-full h-full outline-none"
              dangerouslySetInnerHTML={{ __html: textElement.content }}
              onBlur={(e) => {
                const content = e.currentTarget.innerHTML;
                if (content !== textElement.content) {
                  updateElement(activeSection!.id, element.id, {
                    content
                  });
                }
              }}
            />
            
            {/* Show controls when selected and in edit mode */}
            {isSelected && state.ui.editorMode === "edit" && (
              <div className="absolute -top-9 left-0 bg-white rounded-t-md shadow-sm flex items-center">
                <button 
                  className="p-1.5 text-gray-700 hover:text-blue-600 transition-colors duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLock(element.id);
                  }}
                >
                  {element.locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
                <button 
                  className="p-1.5 text-gray-700 hover:text-blue-600 transition-colors duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateElement(element.id);
                  }}
                >
                  <Plus size={14} />
                </button>
                <button 
                  className="p-1.5 text-gray-700 hover:text-red-600 transition-colors duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteElement(element.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
            
            {/* Resize handles when selected */}
            {isSelected && !element.locked && state.ui.editorMode === "edit" && (
              <>
                {/* Resize handles at corners and edges */}
                <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-blue-600 rounded-full cursor-se-resize" 
                     onPointerDown={(e) => {
                       e.stopPropagation();
                       // Logic for resizing would go here
                     }} />
              </>
            )}
          </motion.div>
        );
      }
      
      case "image": {
        const imageElement = element as ImageElement;
        return (
          <motion.div
            key={element.id}
            style={{
              ...elementStyle,
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              borderRadius: `${imageElement.borderRadius || 0}px`,
              overflow: "hidden",
              border: isSelected ? "1px solid #3B82F6" : "1px solid transparent",
            }}
            animate={isSelected ? { 
              boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)"
            } : { 
              boxShadow: "none" 
            }}
            transition={{ duration: 0.2 }}
            onClick={(e) => handleElementSelect(e as React.MouseEvent<HTMLDivElement>, element.id)}
            onContextMenu={(e) => handleContextMenu(e as React.MouseEvent<HTMLDivElement>, element.id)}
            drag={!element.locked && state.ui.editorMode === "edit"}
            dragControls={dragControls}
            dragMomentum={false}
            dragElastic={0}
            onDragStart={(e) => handleDragStart(e as PointerEvent, element.id)}
            onDrag={(e, info) => handleDrag(e as PointerEvent, info, element.id)}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.02 }}
          >
            {imageElement.src ? (
              <img 
                src={imageElement.src} 
                alt={imageElement.alt || "Image"} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="w-1/3 h-1/3 text-gray-400" />
                <span className="text-gray-400 ml-2">Select Image</span>
              </div>
            )}
            
            {/* Show controls when selected */}
            {isSelected && state.ui.editorMode === "edit" && (
              <div className="absolute -top-9 left-0 bg-white rounded-t-md shadow-sm flex items-center">
                <button 
                  className="p-1.5 text-gray-700 hover:text-blue-600 transition-colors duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleLock(element.id);
                  }}
                >
                  {element.locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
                <button 
                  className="p-1.5 text-gray-700 hover:text-blue-600 transition-colors duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateElement(element.id);
                  }}
                >
                  <Plus size={14} />
                </button>
                <button 
                  className="p-1.5 text-gray-700 hover:text-red-600 transition-colors duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteElement(element.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </motion.div>
        );
      }
      
      // Video and audio elements would be similar to image
      // with their specific rendering requirements
      
      default:
        return null;
    }
  };

  // Get background for current section
  const getSectionBackground = () => {
    if (!activeSection?.background) return null;
    
    const { type, value, opacity = 1 } = activeSection.background;
    
    switch (type) {
      case "color":
        return (
          <div 
            className="absolute inset-0" 
            style={{ 
              backgroundColor: value,
              opacity
            }}
          />
        );
      
      case "image":
        return (
          <img 
            src={value} 
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity }}
            alt="Background"
          />
        );
      
      case "video":
        return (
          <video 
            src={value}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity }}
            autoPlay
            loop
            muted
            playsInline
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={cn("relative w-full h-full flex items-center justify-center", className)}>
      {/* Canvas */}
      <div
        ref={canvasRef}
        className={cn(
          "relative overflow-hidden",
          isDragging ? "cursor-grabbing" : "cursor-default"
        )}
        style={{
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor: "#121212", // Default background
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
        }}
        onClick={handleCanvasClick}
        onDoubleClick={state.ui.editorMode === "edit" ? handleAddTextElement : undefined}
      >
        {/* Section background */}
        {getSectionBackground()}
        
        {/* Render elements */}
        {activeSection?.elements.map(renderElement)}
        
        {/* Empty state with Progressive Disclosure */}
        {activeSection && activeSection.elements.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70">
            <p className="mb-4 text-lg">This section is empty</p>
            <div className="flex gap-3">
              <button
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md flex items-center transition-colors"
                onClick={() => addElement(activeSection.id, "text")}
              >
                <span className="mr-2">Add Text</span>
              </button>
              <button
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md flex items-center transition-colors"
                onClick={() => addElement(activeSection.id, "image")}
              >
                <span className="mr-2">Add Image</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Floating context menu (Progressive Disclosure) */}
      {showContextMenu && (
        <div
          className="fixed bg-white shadow-lg rounded-md py-1 z-50"
          style={{
            left: showContextMenu.x,
            top: showContextMenu.y,
            minWidth: "160px",
          }}
        >
          <button
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center"
            onClick={() => handleDuplicateElement(showContextMenu.elementId)}
          >
            <Plus size={14} className="mr-2" />
            Duplicate
          </button>
          <button
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center"
            onClick={() => handleToggleLock(showContextMenu.elementId)}
          >
            {activeSection?.elements.find(el => el.id === showContextMenu.elementId)?.locked ? (
              <>
                <Unlock size={14} className="mr-2" />
                Unlock
              </>
            ) : (
              <>
                <Lock size={14} className="mr-2" />
                Lock
              </>
            )}
          </button>
          <div className="my-1 border-t border-gray-200" />
          <button
            className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center"
            onClick={() => handleDeleteElement(showContextMenu.elementId)}
          >
            <Trash2 size={14} className="mr-2" />
            Delete
          </button>
        </div>
      )}
      
      {/* Add element floating button (only in edit mode) */}
      {state.ui.editorMode === "edit" && activeSection && (
        <motion.button
          className="absolute bottom-4 right-4 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            
            // Show menu with multiple element options
            // For now just add text
            addElement(activeSection.id, "text");
          }}
        >
          <Plus size={20} />
        </motion.button>
      )}
    </div>
  );
};

export default TemplateCanvas; 