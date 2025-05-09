"use client";

import React, { useContext, useEffect, useState, createContext, useCallback } from 'react';
import { useUsabilityTest } from '@/lib/contexts/UsabilityTestContext';

interface DragItem {
  id: string;
  type: string;
  data: any;
}

interface DragDropContextType {
  isDragging: boolean;
  draggedItem: DragItem | null;
  registerDraggable: (id: string, type: string, data: any) => void;
  unregisterDraggable: (id: string) => void;
  startDrag: (id: string) => void;
  endDrag: () => void;
  canDrop: (targetType: string) => boolean;
  getDroppedItem: () => DragItem | null;
}

const DragDropContext = createContext<DragDropContextType>({
  isDragging: false,
  draggedItem: null,
  registerDraggable: () => {},
  unregisterDraggable: () => {},
  startDrag: () => {},
  endDrag: () => {},
  canDrop: () => false,
  getDroppedItem: () => null,
});

export const useDragDrop = () => useContext(DragDropContext);

interface DragDropIntegratorProps {
  children: React.ReactNode;
}

export default function DragDropIntegrator({ children }: DragDropIntegratorProps) {
  const [draggables, setDraggables] = useState<Record<string, DragItem>>({});
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [droppedItem, setDroppedItem] = useState<DragItem | null>(null);
  
  const { trackInteraction } = useUsabilityTest();

  // Register a draggable element
  const registerDraggable = useCallback((id: string, type: string, data: any) => {
    setDraggables(prev => ({
      ...prev,
      [id]: { id, type, data }
    }));
  }, []);

  // Unregister a draggable element
  const unregisterDraggable = useCallback((id: string) => {
    setDraggables(prev => {
      const newDraggables = { ...prev };
      delete newDraggables[id];
      return newDraggables;
    });
  }, []);

  // Start dragging an item
  const startDrag = useCallback((id: string) => {
    const item = draggables[id];
    if (item) {
      setIsDragging(true);
      setDraggedItem(item);
      trackInteraction({
        type: 'drag',
        target: id,
        targetType: item.type,
        metadata: { data: item.data }
      });
    }
  }, [draggables, trackInteraction]);

  // End drag operation
  const endDrag = useCallback(() => {
    if (draggedItem) {
      trackInteraction({
        type: 'dragEnd',
        target: draggedItem.id,
        metadata: { completed: Boolean(droppedItem) }
      });
    }
    
    setIsDragging(false);
    setDraggedItem(null);
    setDroppedItem(null);
  }, [draggedItem, droppedItem, trackInteraction]);

  // Check if an item can be dropped on a target
  const canDrop = useCallback((targetType: string) => {
    if (!draggedItem) return false;
    
    // Simple compatibility check - can be expanded based on application needs
    return draggedItem.type === targetType || targetType === 'any';
  }, [draggedItem]);

  // Get the current dropped item
  const getDroppedItem = useCallback(() => {
    return droppedItem;
  }, [droppedItem]);

  // Set up event handlers for drag operations
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      if (isDragging && e.target) {
        const target = e.target as HTMLElement;
        const dropZoneId = target.getAttribute('data-dropzone-id');
        
        if (dropZoneId) {
          e.preventDefault(); // Allow drop
          trackInteraction({
            type: 'dragOver',
            target: dropZoneId,
            metadata: { draggedItemId: draggedItem?.id }
          });
        }
      }
    };

    const handleDrop = (e: DragEvent) => {
      if (isDragging && e.target) {
        const target = e.target as HTMLElement;
        const dropZoneId = target.getAttribute('data-dropzone-id');
        const dropZoneType = target.getAttribute('data-dropzone-type');
        
        if (dropZoneId && dropZoneType && draggedItem) {
          e.preventDefault();
          
          if (canDrop(dropZoneType)) {
            setDroppedItem(draggedItem);
            trackInteraction({
              type: 'drop',
              target: dropZoneId,
              targetType: dropZoneType,
              metadata: { 
                draggedItemId: draggedItem.id,
                draggedItemType: draggedItem.type,
                successful: true
              }
            });
          } else {
            trackInteraction({
              type: 'drop',
              target: dropZoneId,
              targetType: dropZoneType,
              metadata: { 
                draggedItemId: draggedItem.id,
                draggedItemType: draggedItem.type,
                successful: false,
                reason: 'incompatible-types'
              }
            });
          }
        }
      }
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [isDragging, draggedItem, canDrop, trackInteraction]);

  const contextValue = {
    isDragging,
    draggedItem,
    registerDraggable,
    unregisterDraggable,
    startDrag,
    endDrag,
    canDrop,
    getDroppedItem,
  };

  return (
    <DragDropContext.Provider value={contextValue}>
      {children}
    </DragDropContext.Provider>
  );
} 