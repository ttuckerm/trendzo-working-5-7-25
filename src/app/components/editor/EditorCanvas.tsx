"use client";

import React, { useRef, useEffect, useState } from "react";
import { useEditor } from "@/lib/contexts/EditorContext";
import { Maximize2, Minimize2, Lock, Unlock, Type, Image, Video, Music, Grid3X3 } from "lucide-react";
import { Element } from "@/lib/types/editor";
import { motion, AnimatePresence } from "framer-motion";

interface EditorCanvasProps {
  className?: string;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({ 
  className = "" 
}) => {
  const { state, dispatch, updateElement, moveElement, resizeElement, addElement, deleteElement } = useEditor();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "1:1" | "4:5">("9:16");
  const [isGridVisible, setIsGridVisible] = useState(false);
  
  // Get current active section
  const activeSection = state.template.sections.find(
    (section) => section.id === state.ui.selectedSectionId
  );

  // Handle aspect ratio change
  const handleAspectRatioChange = (ratio: "9:16" | "1:1" | "4:5") => {
    setAspectRatio(ratio);
  };

  // Get canvas dimensions based on aspect ratio
  const getCanvasDimensions = () => {
    const baseHeight = 600;
    
    switch (aspectRatio) {
      case "9:16":
        return { width: baseHeight * (9/16), height: baseHeight };
      case "1:1":
        return { width: baseHeight, height: baseHeight };
      case "4:5":
        return { width: baseHeight * (4/5), height: baseHeight };
      default:
        return { width: baseHeight * (9/16), height: baseHeight };
    }
  };

  // Handle element selection
  const handleElementSelect = (elementId: string) => {
    dispatch({ type: "SET_SELECTED_ELEMENT", payload: elementId });
  };

  // Handle canvas click (deselect elements)
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the canvas, not on an element
    if (e.currentTarget === e.target) {
      dispatch({ type: "SET_SELECTED_ELEMENT", payload: null });
    }
  };

  // Handle element drag
  const handleElementDrag = (elementId: string, newX: number, newY: number) => {
    moveElement(elementId, newX, newY);
  };

  // Handle element resize
  const handleElementResize = (elementId: string, newWidth: number, newHeight: number) => {
    resizeElement(elementId, newWidth, newHeight);
  };

  // Render an element based on its type
  const renderElement = (element: Element) => {
    const isSelected = state.ui.selectedElementId === element.id;
    
    const elementStyles: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      zIndex: isSelected ? 10 : 1,
      cursor: element.locked ? 'not-allowed' : 'move',
    };

    // Base wrapper for all elements
    const ElementWrapper = ({ children }: { children: React.ReactNode }) => (
      <motion.div
        style={elementStyles}
        onClick={(e) => {
          e.stopPropagation();
          handleElementSelect(element.id);
        }}
        whileHover={{ 
          boxShadow: element.locked ? 'none' : '0 0 0 1px rgba(59, 130, 246, 0.5)',
        }}
        animate={isSelected ? { 
          boxShadow: '0 0 0 2px rgba(59, 130, 246, 1)'
        } : {}}
        dragConstraints={canvasRef}
        drag={!element.locked && isSelected}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          if (!element.locked && isSelected) {
            handleElementDrag(
              element.id, 
              element.x + info.offset.x, 
              element.y + info.offset.y
            );
          }
        }}
      >
        {children}
        
        {/* Resize handles (only shown when selected and unlocked) */}
        {isSelected && !element.locked && (
          <>
            {/* Corners */}
            <div 
              className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full -top-1.5 -left-1.5 cursor-nwse-resize" 
              onMouseDown={(e) => {
                // Handle resize logic here
                e.stopPropagation();
              }}
            />
            <div 
              className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full -top-1.5 -right-1.5 cursor-nesw-resize" 
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            />
            <div 
              className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full -bottom-1.5 -left-1.5 cursor-nesw-resize" 
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            />
            <div 
              className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full -bottom-1.5 -right-1.5 cursor-nwse-resize" 
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            />

            {/* Edges */}
            <div 
              className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize" 
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            />
            <div 
              className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize" 
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            />
            <div 
              className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full -top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize" 
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            />
            <div 
              className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full -bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize" 
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            />
          </>
        )}
        
        {/* Lock/unlock button (only shown when selected) */}
        {isSelected && (
          <button
            className="absolute -top-8 right-0 p-1 bg-white rounded-md shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              updateElement(element.id, { ...element, locked: !element.locked });
            }}
          >
            {element.locked ? (
              <Lock size={16} className="text-red-500" />
            ) : (
              <Unlock size={16} className="text-green-500" />
            )}
          </button>
        )}
        
        {/* Delete button (only shown when selected) */}
        {isSelected && (
          <button
            className="absolute -top-8 left-0 p-1 bg-white rounded-md shadow-sm text-red-500 font-bold"
            onClick={(e) => {
              e.stopPropagation();
              deleteElement(element.id);
            }}
          >
            ×
          </button>
        )}
      </motion.div>
    );

    switch (element.type) {
      case "text":
        return (
          <ElementWrapper key={element.id}>
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: element.backgroundColor || 'transparent',
                color: element.color || '#000',
                fontSize: `${element.fontSize || 16}px`,
                fontWeight: element.fontWeight || 'normal',
                fontFamily: element.fontFamily || 'sans-serif',
                textAlign: (element.textAlign as any) || 'left',
                overflow: 'hidden',
                padding: '8px',
                border: isSelected ? '1px dashed rgba(59, 130, 246, 0.5)' : 'none',
              }}
              contentEditable={isSelected && !element.locked}
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                updateElement(element.id, {
                  ...element,
                  content: e.currentTarget.textContent || ''
                });
              }}
            >
              {element.content}
            </div>
          </ElementWrapper>
        );
        
      case "image":
        return (
          <ElementWrapper key={element.id}>
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isSelected ? '1px dashed rgba(59, 130, 246, 0.5)' : 'none',
                backgroundImage: element.src ? `url(${element.src})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!element.src && (
                <div className="text-gray-400 flex flex-col items-center">
                  <Image size={24} />
                  <span className="text-xs mt-1">No Image</span>
                </div>
              )}
            </div>
          </ElementWrapper>
        );
        
      case "video":
        return (
          <ElementWrapper key={element.id}>
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isSelected ? '1px dashed rgba(59, 130, 246, 0.5)' : 'none',
              }}
            >
              {element.src ? (
                <video
                  src={element.src}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  controls={isSelected}
                  muted
                  loop
                />
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <Video size={24} />
                  <span className="text-xs mt-1">No Video</span>
                </div>
              )}
            </div>
          </ElementWrapper>
        );
        
      case "audio":
        return (
          <ElementWrapper key={element.id}>
            <div
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isSelected ? '1px dashed rgba(59, 130, 246, 0.5)' : 'none',
                padding: '8px',
              }}
            >
              {element.src ? (
                <audio
                  src={element.src}
                  style={{ width: '100%' }}
                  controls
                  muted={!isSelected}
                />
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <Music size={24} />
                  <span className="text-xs mt-1">No Audio</span>
                </div>
              )}
            </div>
          </ElementWrapper>
        );
        
      default:
        return null;
    }
  };

  const canvasDimensions = getCanvasDimensions();

  return (
    <div className={`flex-1 bg-gray-100 flex flex-col ${className}`}>
      <div className="px-4 py-2 border-b flex justify-between items-center bg-white">
        <div className="flex items-center space-x-2">
          {/* Aspect ratio toggles */}
          <div className="flex space-x-1">
            <button
              className={`px-2 py-1 text-xs rounded ${
                aspectRatio === "9:16" ? "bg-blue-100 text-blue-600" : "bg-gray-100"
              }`}
              onClick={() => handleAspectRatioChange("9:16")}
            >
              9:16
            </button>
            <button
              className={`px-2 py-1 text-xs rounded ${
                aspectRatio === "1:1" ? "bg-blue-100 text-blue-600" : "bg-gray-100"
              }`}
              onClick={() => handleAspectRatioChange("1:1")}
            >
              1:1
            </button>
            <button
              className={`px-2 py-1 text-xs rounded ${
                aspectRatio === "4:5" ? "bg-blue-100 text-blue-600" : "bg-gray-100"
              }`}
              onClick={() => handleAspectRatioChange("4:5")}
            >
              4:5
            </button>
          </div>
          
          {/* Grid toggle */}
          <button
            className={`p-1 rounded ${
              isGridVisible ? "bg-blue-100 text-blue-600" : "bg-gray-100"
            }`}
            onClick={() => setIsGridVisible(!isGridVisible)}
            title="Toggle Grid"
          >
            <Grid3X3 size={16} />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded p-1">
            <button
              className="p-1 hover:bg-gray-200 rounded"
              onClick={() => setScale(Math.max(0.5, scale - 0.1))}
              title="Zoom Out"
            >
              <Minimize2 size={14} />
            </button>
            <span className="text-xs font-medium px-1">
              {Math.round(scale * 100)}%
            </span>
            <button
              className="p-1 hover:bg-gray-200 rounded"
              onClick={() => setScale(Math.min(2, scale + 0.1))}
              title="Zoom In"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto flex items-center justify-center p-8">
        <div
          style={{
            transform: `scale(${scale})`,
            width: `${canvasDimensions.width}px`,
            height: `${canvasDimensions.height}px`,
            transition: "width 0.3s, height 0.3s",
          }}
          className="relative bg-white shadow-lg"
        >
          {/* Canvas background */}
          <div
            ref={canvasRef}
            className="absolute inset-0"
            onClick={handleCanvasClick}
          >
            {/* Grid overlay */}
            {isGridVisible && (
              <div 
                className="absolute inset-0" 
                style={{
                  backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                  pointerEvents: 'none',
                }}
              />
            )}
            
            {/* Section label */}
            {!activeSection && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                No section selected. Select or create a section to start editing.
              </div>
            )}
            
            {/* Empty section state */}
            {activeSection && (!activeSection.elements || activeSection.elements.length === 0) && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                This section is empty. Add elements using the toolbox.
              </div>
            )}
            
            {/* Elements */}
            {activeSection && activeSection.elements && activeSection.elements.map((element, index) => {
              // Add a guard for undefined or null elements before attempting to render
              if (!element) {
                // Log an error to the console for easier debugging if this case is hit.
                // This helps identify issues with data integrity in the elements array.
                console.error(`EditorCanvas: Attempted to render an undefined or null element at index ${index} in section ${activeSection.id}. Skipping element.`);
                return null; // Skip rendering this problematic element
              }
              return renderElement(element);
            })}
          </div>
        </div>
      </div>
      
      {/* Element toolbox */}
      {activeSection && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex bg-white rounded-full shadow-lg p-1 space-x-1">
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
            title="Add Text"
            onClick={() => {
              addElement("text", {
                x: canvasDimensions.width / 2 - 100,
                y: canvasDimensions.height / 2 - 25,
                width: 200,
                height: 50,
                content: "Double click to edit text",
                color: "#000000",
                fontSize: 16,
                fontWeight: "normal",
                fontFamily: "sans-serif",
                textAlign: "center",
                backgroundColor: "transparent",
                locked: false,
              });
            }}
          >
            <Type size={20} />
          </button>
          
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
            title="Add Image"
            onClick={() => {
              addElement("image", {
                x: canvasDimensions.width / 2 - 100,
                y: canvasDimensions.height / 2 - 100,
                width: 200,
                height: 200,
                src: "",
                alt: "Image",
                locked: false,
              });
            }}
          >
            <Image size={20} />
          </button>
          
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
            title="Add Video"
            onClick={() => {
              addElement("video", {
                x: canvasDimensions.width / 2 - 150,
                y: canvasDimensions.height / 2 - 100,
                width: 300,
                height: 200,
                src: "",
                muted: true,
                loop: true,
                locked: false,
              });
            }}
          >
            <Video size={20} />
          </button>
          
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
            title="Add Audio"
            onClick={() => {
              addElement("audio", {
                x: canvasDimensions.width / 2 - 150,
                y: canvasDimensions.height / 2 - 25,
                width: 300,
                height: 50,
                src: "",
                volume: 1,
                locked: false,
              });
            }}
          >
            <Music size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default EditorCanvas; 