import React from 'react';
import { ElementItem as ElementItemType } from '../data/elementsData';
import { useDragDrop } from '../hooks/useDragDrop';
import { Lock } from 'lucide-react';
import { useTemplateEditor } from '../TemplateEditorContext';
import DynamicLucideIcon from '../DynamicLucideIcon';

interface ElementItemProps {
  element: ElementItemType;
  isLocked?: boolean;
}

export const ElementItem: React.FC<ElementItemProps> = ({ element, isLocked = false }) => {
  const { startDrag } = useDragDrop();
  const { selectElement } = useTemplateEditor();
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (isLocked) {
      e.preventDefault();
      return;
    }
    
    // Store element data in dataTransfer
    e.dataTransfer.setData('application/json', JSON.stringify(element));
    
    // Set drag image if needed
    // e.dataTransfer.setDragImage(...)
    
    // Notify context of drag
    startDrag(element, e);
  };
  
  // Handle element click - selects the element
  const handleClick = () => {
    if (!isLocked) {
      selectElement(element.id);
    }
  };
  
  return (
    <div
      className={`
        group relative p-2 rounded border border-gray-200 
        hover:border-blue-400 transition-colors cursor-grab
        ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}
      `}
      draggable={!isLocked}
      onDragStart={handleDragStart}
      onClick={handleClick}
      data-testid="element-item"
      data-element-id={element.id}
      data-element-type={element.type}
    >
      {/* Element Icon */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 flex items-center justify-center text-blue-600">
          <DynamicLucideIcon name={element.icon} size={20} />
        </div>
        <span className="text-sm font-medium truncate">{element.name}</span>
      </div>
      
      {/* Premium Lock Icon */}
      {isLocked && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-1 rounded-full">
            <Lock size={16} className="text-blue-500" />
          </div>
          <span className="text-xs text-gray-600 absolute bottom-1 right-1">Premium</span>
        </div>
      )}
      
      {/* Invisible handle/grip that appears on hover - part of "Invisible Interface" principle */}
      <div className="
        absolute top-1 right-1 opacity-0 group-hover:opacity-100 
        transition-opacity duration-200 ease-in-out
      ">
        <div className="w-3 h-3 rounded-full bg-blue-400" />
      </div>
    </div>
  );
}; 