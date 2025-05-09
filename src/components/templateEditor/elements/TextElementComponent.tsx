"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { Pencil, Move, Type, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useTemplateEditor } from '@/lib/contexts/TemplateEditorContext';
import { TextElement } from '@/lib/types/templateEditor.types';
import { cn } from '@/lib/utils';

interface TextElementComponentProps {
  element: TextElement;
  isSelected: boolean;
  canvasDimensions: { width: number; height: number };
  onSelect: (e: React.MouseEvent) => void;
}

/**
 * TextElementComponent
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Editing controls appear only when text is selected
 * - Emotional Design: Subtle animations for interactions
 * - Contextual Intelligence: Different edit modes based on context
 * - Progressive Disclosure: Additional options revealed on selection
 * - Sensory Harmony: Consistent animation patterns across interactions
 */
const TextElementComponent: React.FC<TextElementComponentProps> = ({
  element,
  isSelected,
  canvasDimensions,
  onSelect
}) => {
  const { dispatch, trackInteraction } = useTemplateEditor();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(element.content);
  const textRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // For drag interactions
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Calculate position from percentage to pixels
  const positionStyle = {
    left: `${element.position.x}%`,
    top: `${element.position.y}%`,
    zIndex: element.position.z,
    transform: 'translate(-50%, -50%)',
    width: `${element.size.width}%`,
  };
  
  // Element's style based on its configuration
  const textStyle = {
    fontFamily: element.style.fontFamily || 'Inter',
    fontSize: `${element.style.fontSize || 24}px`,
    fontWeight: element.style.fontWeight || 'normal',
    color: element.style.color || '#FFFFFF',
    textAlign: element.style.textAlign || 'center',
    opacity: element.style.opacity || 1,
    textShadow: element.style.shadow 
      ? `${element.style.shadow.offsetX}px ${element.style.shadow.offsetY}px ${element.style.shadow.blur}px ${element.style.shadow.color}`
      : 'none',
    lineHeight: element.style.lineHeight ? `${element.style.lineHeight}` : '1.2',
    letterSpacing: element.style.letterSpacing ? `${element.style.letterSpacing}px` : 'normal'
  };
  
  // Handle text element update
  const updateElement = (updates: Partial<TextElement>) => {
    dispatch({
      type: 'UPDATE_ELEMENT',
      payload: {
        sectionId: element.id.split('-')[0], // Assuming sectionId is part of the element id
        elementId: element.id,
        updates
      }
    });
  };
  
  // Enter edit mode
  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    trackInteraction('edit', `text-element:${element.id}`);
  };
  
  // Save changes and exit edit mode
  const saveChanges = () => {
    if (editedText !== element.content) {
      updateElement({ content: editedText });
      trackInteraction('save', `text-element:${element.id}`);
    }
    setIsEditing(false);
  };
  
  // Change text alignment
  const changeAlignment = (alignment: 'left' | 'center' | 'right') => {
    updateElement({
      style: {
        ...element.style,
        textAlign: alignment
      }
    });
    trackInteraction('align', `text:${alignment}`);
  };
  
  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);
  
  // Render toolbar for selected element
  const renderToolbar = () => {
    return (
      <motion.div
        className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 rounded-md shadow-lg flex items-center space-x-1 p-1 z-50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
      >
        <button 
          className="p-1.5 rounded hover:bg-gray-700 text-white"
          onClick={startEditing}
          aria-label="Edit text"
        >
          <Pencil className="w-4 h-4" />
        </button>
        
        <div className="w-px h-5 bg-gray-700 mx-1" />
        
        <button 
          className={cn(
            "p-1.5 rounded hover:bg-gray-700 text-white",
            element.style.textAlign === 'left' && "bg-gray-700"
          )}
          onClick={() => changeAlignment('left')}
          aria-label="Align left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        
        <button 
          className={cn(
            "p-1.5 rounded hover:bg-gray-700 text-white",
            element.style.textAlign === 'center' && "bg-gray-700"
          )}
          onClick={() => changeAlignment('center')}
          aria-label="Align center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        
        <button 
          className={cn(
            "p-1.5 rounded hover:bg-gray-700 text-white",
            element.style.textAlign === 'right' && "bg-gray-700"
          )}
          onClick={() => changeAlignment('right')}
          aria-label="Align right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        
        <div className="w-px h-5 bg-gray-700 mx-1" />
        
        <button 
          className="p-1.5 rounded hover:bg-gray-700 text-white cursor-move"
          aria-label="Move text"
        >
          <Move className="w-4 h-4" />
        </button>
      </motion.div>
    );
  };
  
  return (
    <div
      className={cn(
        "absolute",
        isSelected && "outline outline-2 outline-blue-500 outline-offset-2"
      )}
      style={positionStyle}
      onClick={onSelect}
    >
      {/* Text content or editor */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="w-full h-full bg-transparent text-white resize-none outline-none border-none p-0"
          style={textStyle}
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onBlur={saveChanges}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.shiftKey === false) {
              e.preventDefault();
              saveChanges();
            }
          }}
        />
      ) : (
        <motion.div
          ref={textRef}
          className="w-full cursor-pointer"
          style={textStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: isSelected ? 1 : 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {element.content}
        </motion.div>
      )}
      
      {/* Toolbar - only show when selected and not editing */}
      <AnimatePresence>
        {isSelected && !isEditing && renderToolbar()}
      </AnimatePresence>
    </div>
  );
};

export default TextElementComponent; 