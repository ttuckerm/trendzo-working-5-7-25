"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

interface DragItem {
  id: string;
  type: string;
  data: any;
}

interface UseDragDropOptions {
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: (success: boolean) => void;
  onDrop?: (item: DragItem, target: HTMLElement) => void;
}

/**
 * A custom hook that provides drag and drop functionality
 * for components throughout the application
 */
export function useDragDrop(options: UseDragDropOptions = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const [currentItem, setCurrentItem] = useState<DragItem | null>(null);
  const dragItemRef = useRef<DragItem | null>(null);
  
  // Start dragging an item
  const startDrag = useCallback((item: DragItem) => {
    setIsDragging(true);
    setCurrentItem(item);
    dragItemRef.current = item;
    
    if (options.onDragStart) {
      options.onDragStart(item);
    }
    
    // Add global dragging class to the body for styling
    document.body.classList.add('dragging');
    
    return item;
  }, [options]);
  
  // End dragging operation
  const endDrag = useCallback((success: boolean = false) => {
    setIsDragging(false);
    setCurrentItem(null);
    
    if (options.onDragEnd) {
      options.onDragEnd(success);
    }
    
    // Remove global dragging class
    document.body.classList.remove('dragging');
    dragItemRef.current = null;
  }, [options]);
  
  // Register an element as draggable
  const makeDraggable = useCallback((
    id: string, 
    type: string, 
    data: any
  ) => {
    return {
      draggable: true,
      'data-drag-id': id,
      'data-drag-type': type,
      onDragStart: (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({ id, type, data }));
        
        // If the dragged element has an image, use it as drag image
        const target = e.currentTarget as HTMLElement;
        const img = target.querySelector('img');
        if (img) {
          e.dataTransfer.setDragImage(img, 0, 0);
        }
        
        startDrag({ id, type, data });
      },
      onDragEnd: () => endDrag(),
    };
  }, [startDrag, endDrag]);
  
  // Register an element as a drop zone
  const makeDroppable = useCallback((
    acceptTypes: string[] = [], 
    onItemDropped?: (item: DragItem) => void
  ) => {
    return {
      'data-drop-zone': true,
      'data-accept-types': acceptTypes.join(','),
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        
        // Check if we can accept this type
        if (dragItemRef.current && acceptTypes.includes(dragItemRef.current.type)) {
          e.dataTransfer.dropEffect = 'move';
          e.currentTarget.classList.add('drop-target-active');
        } else {
          e.dataTransfer.dropEffect = 'none';
        }
      },
      onDragLeave: (e: React.DragEvent) => {
        e.currentTarget.classList.remove('drop-target-active');
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drop-target-active');
        
        try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'));
          const droppedItem = { id: data.id, type: data.type, data: data.data };
          
          // Check if we accept this type
          if (acceptTypes.includes(droppedItem.type)) {
            if (onItemDropped) {
              onItemDropped(droppedItem);
            }
            
            if (options.onDrop) {
              options.onDrop(droppedItem, e.currentTarget as HTMLElement);
            }
            
            endDrag(true);
          }
        } catch (error) {
          console.error('Error processing drop:', error);
        }
      }
    };
  }, [endDrag, options]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('dragging');
    };
  }, []);
  
  return {
    isDragging,
    currentItem,
    startDrag,
    endDrag,
    makeDraggable,
    makeDroppable
  };
} 