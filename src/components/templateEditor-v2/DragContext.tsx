"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ElementItem } from './data/elementsData';

interface DragState {
  isDragging: boolean;
  draggedElement: ElementItem | null;
  dropTarget: string | null;
}

interface DragContextType {
  state: DragState;
  startDrag: (element: ElementItem) => void;
  endDrag: () => void;
  setDropTarget: (targetId: string | null) => void;
  handleDrop: (sectionId: string, x: number, y: number) => void;
  calculateDropPosition: (e: React.DragEvent, canvasElement: HTMLElement) => { x: number, y: number };
}

const defaultDragState: DragState = {
  isDragging: false,
  draggedElement: null,
  dropTarget: null
};

const DragContext = createContext<DragContextType | undefined>(undefined);

export const DragDropProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DragState>(defaultDragState);
  
  // Start a drag operation with an element
  const startDrag = useCallback((element: ElementItem) => {
    setState(prev => ({
      ...prev,
      isDragging: true,
      draggedElement: element
    }));
    
    // Add a class to the body for styling during drag
    document.body.classList.add('dragging');
    
    // Trigger haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50); // Short vibration for drag start
    }
  }, []);
  
  // End a drag operation
  const endDrag = useCallback(() => {
    setState(defaultDragState);
    
    // Remove the dragging class
    document.body.classList.remove('dragging');
  }, []);
  
  // Set the current drop target
  const setDropTarget = useCallback((targetId: string | null) => {
    setState(prev => ({
      ...prev,
      dropTarget: targetId
    }));
    
    // Trigger haptic feedback if entering a valid drop target
    if (targetId && navigator.vibrate) {
      navigator.vibrate(25); // Very short vibration for drop zone entry
    }
  }, []);
  
  // Calculate drop position relative to canvas with zoom adjustment
  const calculateDropPosition = useCallback((e: React.DragEvent, canvasElement: HTMLElement) => {
    const rect = canvasElement.getBoundingClientRect();
    const zoom = parseFloat(canvasElement.getAttribute('data-zoom') || '1');
    
    // Calculate position relative to canvas with zoom adjustment
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    return { x, y };
  }, []);
  
  // Handle drop event
  const handleDrop = useCallback((sectionId: string, x: number, y: number) => {
    // This would typically integrate with the main TemplateEditorContext
    // to add the element to the template
    console.log('Dropped element', state.draggedElement, 'at', x, y, 'in section', sectionId);
    
    // End the drag operation
    endDrag();
    
    // Trigger success haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 20, 80]); // Pattern for successful drop
    }
  }, [state.draggedElement, endDrag]);
  
  const contextValue: DragContextType = {
    state,
    startDrag,
    endDrag,
    setDropTarget,
    handleDrop,
    calculateDropPosition
  };
  
  return (
    <DragContext.Provider value={contextValue}>
      {children}
    </DragContext.Provider>
  );
};

// Custom hook to use the drag context
export const useDragDrop = (): DragContextType => {
  const context = useContext(DragContext);
  
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  
  return context;
};

export default DragContext; 