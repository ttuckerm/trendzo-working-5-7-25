"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useTemplateEditor } from "./TemplateEditorContext";
import { useDragDrop } from "./hooks/useDragDrop";
import { motion } from "framer-motion";
import { 
  Maximize2, 
  Minimize2, 
  Lock, 
  Unlock, 
  Type, 
  Image, 
  Video, 
  Music, 
  Grid3X3,
  Square as IconSquare,
  Mic
} from "lucide-react";
import { Element as TemplateElementType, ActionType, Element, ElementType } from "./types";
import { CanvasControls } from "./CanvasControls";
import { VideoPreview } from "./VideoPreview";

type ResizingHandleType = 
  | "top-left" | "top-right" | "bottom-left" | "bottom-right"
  | "top" | "bottom" | "left" | "right";

interface ResizingState {
  isResizing: boolean;
  element: TemplateElementType | null;
  handleType: ResizingHandleType | null;
  initialMouseX: number;
  initialMouseY: number;
  initialElementX: number;
  initialElementY: number;
  initialWidth: number;
  initialHeight: number;
}

interface EditorCanvasProps {
  // Add props as needed
}

export const EditorCanvas: React.FC<EditorCanvasProps> = () => {
  const { 
    state, 
    updateElement, 
    moveElement, 
    resizeElement, 
    selectElement,
    deleteElement,
    addElement,
    dispatch
  } = useTemplateEditor();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isVoiceCommandActive, setIsVoiceCommandActive] = useState(false);
  const [voiceCommandText, setVoiceCommandText] = useState("");
  const [voiceRecognition, setVoiceRecognition] = useState<any>(null);
  
  const [resizingState, setResizingState] = useState<ResizingState>({
    isResizing: false,
    element: null,
    handleType: null,
    initialMouseX: 0,
    initialMouseY: 0,
    initialElementX: 0,
    initialElementY: 0,
    initialWidth: 0,
    initialHeight: 0,
  });
  
  // Get current active section
  const activeSection = state.template.sections.find(
    (section) => section.id === state.ui.selectedSectionId
  );
  
  // Get canvas dimensions based on aspect ratio
  const getCanvasDimensions = () => {
    const baseHeight = 600;
    
    switch (state.template.aspectRatio) {
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
  
  // Initialize useDragDrop with the onDrop callback
  const { 
    handleDragOver: dndDragOver,
    handleDragLeave: dndDragLeave,
    handleDrop: dndHandleDrop,
    isDragging
  } = useDragDrop({
    onDrop: ({ element: droppedElement, x, y }) => {
      if (state.ui.selectedSectionId && droppedElement) {
        // Convert string type to ElementType
        const elementType = droppedElement.type as ElementType;
        
        // Add the element at the dropped position
        addElement(state.ui.selectedSectionId, elementType);
        
        // If the new element was added, find it and update its position
        const section = state.template.sections.find(s => s.id === state.ui.selectedSectionId);
        if (section && section.elements.length > 0) {
          // Assume the last element added is the one we just created
          const newElement = section.elements[section.elements.length - 1];
          
          // Update its position
          moveElement(state.ui.selectedSectionId, newElement.id, x, y);
          
          // Select the new element
          selectElement(newElement.id);
        }
        
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }
        
        const audio = new Audio("/sounds/drop-sound.mp3");
        audio.volume = 0.2;
        audio.play().catch(() => {});
      }
    },
    snapToGrid: state.ui.snapToGrid,
    gridSize: state.ui.gridSize,
    enableHaptics: true
  });
  
  // Keep existing local drag over/leave for styling, but call the hook's versions
  const localHandleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    dndDragOver(e, true);
    if (!isDragOver) setIsDragOver(true);
  }, [dndDragOver, isDragOver]);

  const localHandleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    dndDragLeave(e);
    if (canvasRef.current && !canvasRef.current.contains(e.relatedTarget as Node)) {
        setIsDragOver(false);
    }
  }, [dndDragLeave]);

  // The main onDrop for the canvas div will now use the hook's drop handler
  const localHandleOnDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (canvasRef.current) {
      dndHandleDrop(e, canvasRef.current);
    }
    setIsDragOver(false);
  }, [dndHandleDrop]);
  
  // Handle clicking on an element
  const handleElementClick = useCallback((elementId: string) => {
    selectElement(elementId);
  }, [selectElement]);
  
  const MIN_ELEMENT_SIZE = 20; // Minimum width/height for an element

  const handleResizeStart = useCallback((
    e: React.MouseEvent<HTMLDivElement>, 
    element: TemplateElementType, 
    handleType: ResizingHandleType
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (element.locked) return;

    setResizingState({
      isResizing: true,
      element: element,
      handleType: handleType,
      initialMouseX: e.clientX,
      initialMouseY: e.clientY,
      initialElementX: element.x,
      initialElementY: element.y,
      initialWidth: element.width,
      initialHeight: element.height,
    });
  }, []);

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!resizingState.isResizing || !resizingState.element || !resizingState.handleType) return;

      const dx = e.clientX - resizingState.initialMouseX;
      const dy = e.clientY - resizingState.initialMouseY;

      let newX = resizingState.initialElementX;
      let newY = resizingState.initialElementY;
      let newWidth = resizingState.initialWidth;
      let newHeight = resizingState.initialHeight;

      switch (resizingState.handleType) {
        case "top-left":
          newWidth = Math.max(MIN_ELEMENT_SIZE, resizingState.initialWidth - dx);
          newHeight = Math.max(MIN_ELEMENT_SIZE, resizingState.initialHeight - dy);
          newX = resizingState.initialElementX + resizingState.initialWidth - newWidth;
          newY = resizingState.initialElementY + resizingState.initialHeight - newHeight;
          break;
        case "top-right":
          newWidth = Math.max(MIN_ELEMENT_SIZE, resizingState.initialWidth + dx);
          newHeight = Math.max(MIN_ELEMENT_SIZE, resizingState.initialHeight - dy);
          newY = resizingState.initialElementY + resizingState.initialHeight - newHeight;
          break;
        case "bottom-left":
          newWidth = Math.max(MIN_ELEMENT_SIZE, resizingState.initialWidth - dx);
          newHeight = Math.max(MIN_ELEMENT_SIZE, resizingState.initialHeight + dy);
          newX = resizingState.initialElementX + resizingState.initialWidth - newWidth;
          break;
        case "bottom-right":
          newWidth = Math.max(MIN_ELEMENT_SIZE, resizingState.initialWidth + dx);
          newHeight = Math.max(MIN_ELEMENT_SIZE, resizingState.initialHeight + dy);
          break;
        case "top":
          newHeight = Math.max(MIN_ELEMENT_SIZE, resizingState.initialHeight - dy);
          newY = resizingState.initialElementY + resizingState.initialHeight - newHeight;
          break;
        case "bottom":
          newHeight = Math.max(MIN_ELEMENT_SIZE, resizingState.initialHeight + dy);
          break;
        case "left":
          newWidth = Math.max(MIN_ELEMENT_SIZE, resizingState.initialWidth - dx);
          newX = resizingState.initialElementX + resizingState.initialWidth - newWidth;
          break;
        case "right":
          newWidth = Math.max(MIN_ELEMENT_SIZE, resizingState.initialWidth + dx);
          break;
      }
      
      // Use dispatch for updateElement from context
      if (activeSection && resizingState.element) {
         dispatch({
           type: ActionType.UPDATE_ELEMENT,
           payload: {
             sectionId: activeSection.id,
             elementId: resizingState.element.id,
             updates: { x: newX, y: newY, width: newWidth, height: newHeight },
           },
         });
      }
    };

    const handleResizeEnd = () => {
      if (resizingState.isResizing && resizingState.element && state.ui.selectedSectionId) {
        resizeElement(
          state.ui.selectedSectionId,
          resizingState.element.id,
          Math.max(MIN_ELEMENT_SIZE, resizingState.element.width),
          Math.max(MIN_ELEMENT_SIZE, resizingState.element.height)
        );

        // If position changed during resize, update it
        if (
          resizingState.element.x !== resizingState.initialElementX ||
          resizingState.element.y !== resizingState.initialElementY
        ) {
          moveElement(
            state.ui.selectedSectionId,
            resizingState.element.id,
            resizingState.element.x,
            resizingState.element.y
          );
        }
      }

      setResizingState({
        isResizing: false,
        element: null,
        handleType: null,
        initialMouseX: 0,
        initialMouseY: 0,
        initialElementX: 0,
        initialElementY: 0,
        initialWidth: 0,
        initialHeight: 0,
      });
    };

    // Check viewport size and set mobile view state
    const checkViewportSize = () => {
      const mobileBreakpoint = 768; // Common breakpoint for mobile devices
      const isMobile = window.innerWidth < mobileBreakpoint;
      setIsMobileView(isMobile);
    };

    // Run the check initially and on window resize
    checkViewportSize();
    window.addEventListener('resize', checkViewportSize);

    if (resizingState.isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      window.removeEventListener('resize', checkViewportSize);
    };
  }, [resizingState, state.ui.selectedSectionId, moveElement, resizeElement]);
  
  // Toggle voice command mode
  const toggleVoiceCommand = () => {
    if (isVoiceCommandActive) {
      // Stop listening
      if (voiceRecognition) {
        voiceRecognition.stop();
      }
      setIsVoiceCommandActive(false);
    } else {
      // Start listening
      try {
        // Use browser's SpeechRecognition API if available
        const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          
          recognition.onresult = (event: any) => {
            const command = event.results[0][0].transcript;
            setVoiceCommandText(command);
            processVoiceCommand(command);
          };
          
          recognition.onend = () => {
            setIsVoiceCommandActive(false);
          };
          
          recognition.start();
          setVoiceRecognition(recognition);
          setIsVoiceCommandActive(true);
        } else {
          console.error("Speech recognition not supported in this browser");
        }
      } catch (error) {
        console.error("Error initializing speech recognition:", error);
      }
    }
  };

  // Process voice commands
  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    // Basic commands for testing
    if (lowerCommand.includes("add text")) {
      // Extract the text content after "add text"
      const textContent = command.slice(command.indexOf("add text") + 8).trim();
      if (state.ui.selectedSectionId) {
        addElement(state.ui.selectedSectionId, "text");
        
        // Find the newly added element and update its content
        const section = state.template.sections.find(s => s.id === state.ui.selectedSectionId);
        if (section && section.elements.length > 0) {
          const newElement = section.elements[section.elements.length - 1];
          updateElement(state.ui.selectedSectionId, newElement.id, {
            content: textContent || "New Text"
          });
          selectElement(newElement.id);
        }
      }
    } else if (lowerCommand.includes("center") || lowerCommand.includes("align center")) {
      // Center the selected element if any
      if (state.ui.selectedElementId && state.ui.selectedSectionId) {
        const element = activeSection?.elements.find(e => e.id === state.ui.selectedElementId);
        if (element) {
          const { width } = getCanvasDimensions();
          const newX = (width - element.width) / 2;
          moveElement(state.ui.selectedSectionId, element.id, newX, element.y);
        }
      }
    } else if (lowerCommand.includes("delete") || lowerCommand.includes("remove")) {
      // Delete the selected element if any
      if (state.ui.selectedElementId && state.ui.selectedSectionId) {
        deleteElement(state.ui.selectedSectionId, state.ui.selectedElementId);
      }
    }
    
    // Clear the command text after processing
    setTimeout(() => {
      setVoiceCommandText("");
    }, 3000);
  };
  
  // Render an element based on its type
  const renderElement = (element: TemplateElementType) => {
    if (element.hidden) return null;

    const isSelected = state.ui.selectedElementId === element.id;
    
    const elementStyles: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
      opacity: element.opacity !== undefined ? element.opacity : 1,
      zIndex: element.zIndex || 1,
      border: isSelected ? '2px solid #3b82f6' : '1px dashed rgba(0, 0, 0, 0.2)',
      cursor: element.locked ? 'not-allowed' : 'move',
      boxSizing: 'border-box',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      borderRadius: '2px',
      transition: 'border 0.2s ease',
    };
    
    // Additional style based on element type
    if (element.type === 'text') {
      Object.assign(elementStyles, {
        color: element.color || '#000000',
        fontFamily: element.fontFamily || 'sans-serif',
        fontSize: `${element.fontSize || 16}px`,
        fontWeight: element.fontWeight || 'normal',
        textAlign: (element.textAlign as any) || 'left',
        padding: '8px',
        overflow: 'hidden',
        userSelect: 'none',
        backgroundColor: element.backgroundColor || 'transparent',
      });
    } else if (element.type === 'image') {
      Object.assign(elementStyles, {
        backgroundImage: element.src ? `url(${element.src})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#f0f0f0',
      });
    } else if (element.type === 'shape') {
      Object.assign(elementStyles, {
        backgroundColor: element.backgroundColor || '#3b82f6',
        borderRadius: element.borderRadius ? `${element.borderRadius}px` : '0',
      });
    }
    
    // For video elements, we use the VideoPreview component
    if (element.type === 'video') {
      return (
        <div
          key={element.id}
          data-testid={`element-${element.id}`}
          style={elementStyles}
          onClick={(e) => {
            e.stopPropagation();
            handleElementClick(element.id);
          }}
          className={isSelected ? 'selected' : ''}
        >
          <VideoPreview 
            src={element.src || ''} 
            isSelected={isSelected}
            autoplay={isSelected}
            loop={true}
            muted={true}
            controls={false}
            startTime={element.startTime}
            endTime={element.endTime}
          />
          {isSelected && renderSelectionHandles(element)}
        </div>
      );
    }
    
    // Default content based on element type
    let content: React.ReactNode = null;
    
    switch (element.type) {
      case 'text':
        content = element.content || 'Text Element';
        break;
      case 'image':
        content = !element.src && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <Image size={24} />
          </div>
        );
        break;
      case 'shape':
        // No content needed for shapes
        break;
      case 'audio':
        content = (
          <div className="flex items-center justify-center h-full text-gray-400">
            <Music size={24} />
          </div>
        );
        break;
      default:
        content = (
          <div className="flex items-center justify-center h-full text-gray-400">
            <IconSquare size={24} />
          </div>
        );
    }
    
    return (
      <div
        key={element.id}
        data-testid={`element-${element.id}`}
        style={elementStyles}
        onClick={(e) => {
          e.stopPropagation();
          handleElementClick(element.id);
        }}
        className={isSelected ? 'selected' : ''}
      >
        {content}
        {isSelected && renderSelectionHandles(element)}
      </div>
    );
  };
  
  // Render selection handles for resizing
  const renderSelectionHandles = (element: TemplateElementType) => {
    if (element.locked) return null;
    
    const handleSize = 8;
    const handleOffset = -handleSize / 2;
    
    const handleStyle: React.CSSProperties = {
      position: 'absolute',
      width: `${handleSize}px`,
      height: `${handleSize}px`,
      backgroundColor: '#3b82f6',
      borderRadius: '50%',
      border: '1px solid white',
      zIndex: 10,
    };
    
    // Positions for all 8 handles
    const handles = [
      { position: 'top-left', style: { top: handleOffset, left: handleOffset } },
      { position: 'top', style: { top: handleOffset, left: '50%', transform: 'translateX(-50%)' } },
      { position: 'top-right', style: { top: handleOffset, right: handleOffset } },
      { position: 'right', style: { top: '50%', right: handleOffset, transform: 'translateY(-50%)' } },
      { position: 'bottom-right', style: { bottom: handleOffset, right: handleOffset } },
      { position: 'bottom', style: { bottom: handleOffset, left: '50%', transform: 'translateX(-50%)' } },
      { position: 'bottom-left', style: { bottom: handleOffset, left: handleOffset } },
      { position: 'left', style: { top: '50%', left: handleOffset, transform: 'translateY(-50%)' } }
    ];
    
    return (
      <>
        {handles.map(handle => (
          <div
            key={`handle-${handle.position}`}
            data-testid={`handle-${handle.position}`}
            style={{ ...handleStyle, ...handle.style, cursor: `${handle.position}-resize` }}
            onMouseDown={(e) => handleResizeStart(e, element, handle.position as ResizingHandleType)}
            onClick={(e) => e.stopPropagation()}
          />
        ))}
      </>
    );
  };
  
  const canvasDimensions = getCanvasDimensions();
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4 relative overflow-hidden" data-testid="editor-canvas-container">
      {/* Canvas Controls positioned absolutely or relative to this container */}
      <CanvasControls />

      {/* Voice Command Button */}
      <button
        className="absolute top-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-md z-10"
        onClick={toggleVoiceCommand}
        data-testid="voice-command-button"
      >
        <Mic size={20} />
      </button>
      
      {/* Voice Command Interface */}
      {isVoiceCommandActive && (
        <div className="absolute top-16 right-4 bg-white p-4 rounded-md shadow-lg z-20" data-testid="voice-command-interface">
          <div className="text-sm font-medium mb-2">Listening for commands...</div>
          <div className="text-xs text-gray-500">
            Try saying: "add text hello world", "center"
          </div>
          <button
            className="mt-2 bg-red-500 text-white px-2 py-1 rounded text-xs"
            onClick={() => setIsVoiceCommandActive(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Grid Background */}
      {state.ui.showGrid && (
        <div 
          className="absolute inset-0 z-0"
          style={{
            width: canvasDimensions.width * (state.ui.zoom || 1),
            height: canvasDimensions.height * (state.ui.zoom || 1),
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: `${(state.ui.gridSize || 10) * (state.ui.zoom || 1)}px ${(state.ui.gridSize || 10) * (state.ui.zoom || 1)}px`,
            transformOrigin: 'center center',
            margin: 'auto',
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${state.ui.zoom || 1})`,
          }}
        />
      )}

      {/* Main Canvas Area */}
      <div
        ref={canvasRef}
        className={`bg-white shadow-lg relative ${isMobileView ? 'mobile-view' : ''}`}
        data-testid="canvas-container"
        style={{
          width: canvasDimensions.width,
          height: canvasDimensions.height,
          transform: `scale(${state.ui.zoom || 1})`,
          transformOrigin: 'center', // Or top left depending on desired zoom behavior
          border: isDragOver ? '2px dashed #3b82f6' : '1px solid #ccc',
          transition: 'border-color 0.2s ease-in-out',
          overflow: 'hidden' // Ensure elements are clipped to canvas bounds
        }}
        onDragOver={localHandleDragOver}
        onDragEnter={localHandleDragOver}
        onDragLeave={localHandleDragLeave}
        onDrop={localHandleOnDrop}
      >
        {activeSection && activeSection.elements.map(renderElement)}
      </div>
    </div>
  );
};

export default EditorCanvas; 