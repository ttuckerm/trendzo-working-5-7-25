import { useState, useRef, useCallback } from 'react';
import { ElementItem } from '../data/elementsData';

interface DragState {
  isDragging: boolean;
  draggedElement: ElementItem | null;
  dragStartX: number;
  dragStartY: number;
}

interface DropResult {
  element: ElementItem;
  x: number;
  y: number;
}

interface UseDragDropOptions {
  onDrop?: (result: DropResult) => void;
  snapToGrid?: boolean;
  gridSize?: number;
  enableHaptics?: boolean;
}

export function useDragDrop({
  onDrop,
  snapToGrid = false,
  gridSize = 10,
  enableHaptics = true
}: UseDragDropOptions = {}) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedElement: null,
    dragStartX: 0,
    dragStartY: 0
  });
  
  // Ref to track current drop target
  const dropTargetRef = useRef<HTMLElement | null>(null);
  
  // Initialize endDrag as a ref to avoid circular dependency
  const endDragRef = useRef<() => void>(() => {});
  
  // Define endDrag function
  const endDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedElement: null,
      dragStartX: 0,
      dragStartY: 0
    });
    document.body.classList.remove('dragging');
    if (dropTargetRef.current) {
      dropTargetRef.current.classList.remove('drop-active');
      dropTargetRef.current = null;
    }
  }, []); // No complex dependencies for endDrag usually
  
  // Update the ref with the actual function
  endDragRef.current = endDrag;
  
  // Start dragging an element
  const startDrag = useCallback((
    element: ElementItem, 
    event?: React.DragEvent<HTMLElement>
  ) => {
    // Set drag data for browsers that require it if event is available
    if (event && event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify(element));
      
      // Store drag start position
      setDragState({
        isDragging: true,
        draggedElement: element,
        dragStartX: event.clientX,
        dragStartY: event.clientY
      });
    } else {
      // If no event, just set the element as being dragged
      setDragState({
        isDragging: true,
        draggedElement: element,
        dragStartX: 0,
        dragStartY: 0
      });
    }
    
    // Add a class to the body for global styling during drag
    document.body.classList.add('dragging');
    
    // Trigger haptic feedback if available and enabled
    if (enableHaptics && navigator.vibrate) {
      navigator.vibrate(50); // Short vibration
    }
  }, [enableHaptics]);
  
  // Handle drag over a drop target
  const handleDragOver = useCallback((
    event: React.DragEvent<HTMLElement>,
    isValidTarget: boolean = true
  ) => {
    // Prevent default to allow drop
    event.preventDefault();
    
    if (isValidTarget) {
      // Set dropEffect to copy to indicate a valid drop target
      event.dataTransfer.dropEffect = 'copy';
      
      // Track current drop target
      dropTargetRef.current = event.currentTarget;
      
      // Add visual indicator
      event.currentTarget.classList.add('drop-active');
    } else {
      // Not a valid target, indicate with no-drop effect
      event.dataTransfer.dropEffect = 'none';
    }
  }, []);
  
  // Handle drag leave
  const handleDragLeave = useCallback((event: React.DragEvent<HTMLElement>) => {
    // Remove visual indicator
    event.currentTarget.classList.remove('drop-active');
    
    // Clear drop target ref if this is the current target
    if (dropTargetRef.current === event.currentTarget) {
      dropTargetRef.current = null;
    }
  }, []);
  
  // Handle drop of an element
  const handleDrop = useCallback((
    event: React.DragEvent<HTMLElement>,
    canvasElement: HTMLElement
  ) => {
    event.preventDefault();
    if (dropTargetRef.current) {
        dropTargetRef.current.classList.remove('drop-active');
    }
    
    let elementData: ElementItem | null = null;
    try {
      const rawData = event.dataTransfer.getData('application/json');
      if (rawData) {
        elementData = JSON.parse(rawData);
      }
    } catch (e) {
      console.error("Error parsing dragged element data from dataTransfer:", e);
      endDragRef.current();
      return;
    }

    if (!elementData) {
        console.error("No element data found in dataTransfer.");
        endDragRef.current();
        return;
    }
    
    const canvasRect = canvasElement.getBoundingClientRect();
    let x = event.clientX - canvasRect.left;
    let y = event.clientY - canvasRect.top;
    
    const zoomLevel = parseFloat(canvasElement.getAttribute('data-zoom') || '1');
    x = x / zoomLevel;
    y = y / zoomLevel;
    
    if (snapToGrid && gridSize) {
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }
    
    if (onDrop) {
      onDrop({ element: elementData, x, y });
      
      if (enableHaptics && navigator.vibrate) {
        navigator.vibrate([50, 20, 80]);
      }
    }
    
    endDragRef.current(); // Reset drag state regardless of successful drop processing by consumer
  }, [onDrop, snapToGrid, gridSize, enableHaptics]);
  
  return {
    isDragging: dragState.isDragging,
    draggedElement: dragState.draggedElement,
    startDrag,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    endDrag
  };
} 