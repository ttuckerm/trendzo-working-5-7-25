"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplateEditor } from '@/lib/contexts/TemplateEditorContext';
import { Position, Size, TextElement, MediaElement, TemplateElement } from '@/lib/types/templateEditor.types';
import TextElementComponent from './elements/TextElementComponent';
import MediaElementComponent from './elements/MediaElementComponent';
import { ChevronDown, Plus, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * EditorCanvas component
 * 
 * The main canvas where template sections and elements are displayed and edited.
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Controls appear contextually on selection/hover
 * - Emotional Design: Micro-animations for all interactions
 * - Contextual Intelligence: Tools adapt based on selected element type
 * - Progressive Disclosure: Options revealed contextually
 * - Sensory Harmony: Coordinated animations and visual feedback
 */
const EditorCanvas: React.FC = () => {
  const {
    state,
    selectedSection,
    selectedElement,
    selectElement,
    addTextElement,
    trackInteraction
  } = useTemplateEditor();
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showDropIndicator, setShowDropIndicator] = useState(false);
  
  // Elements for the current section
  const elements = selectedSection?.elements || [];
  
  // Handle canvas resize
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const updateDimensions = () => {
      if (canvasRef.current) {
        const { width, height } = canvasRef.current.getBoundingClientRect();
        setCanvasDimensions({ width, height });
      }
    };
    
    // Initial dimensions
    updateDimensions();
    
    // Update on resize
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(canvasRef.current);
    
    return () => {
      if (canvasRef.current) {
        resizeObserver.unobserve(canvasRef.current);
      }
    };
  }, [selectedSection]);
  
  // Handle element selection
  const handleElementClick = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (selectedSection) {
      selectElement(selectedSection.id, elementId);
      trackInteraction('select', `element:${elementId}`);
    }
  };
  
  // Handle canvas click (deselect elements)
  const handleCanvasClick = () => {
    if (selectedElement && selectedSection) {
      // Deselect element but keep section selected
      selectElement(selectedSection.id, '');
      trackInteraction('deselect', 'element');
    }
  };
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
    
    setIsDragging(true);
    trackInteraction('drag', 'start');
  };
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setShowDropIndicator(true);
  };
  
  // Handle drag leave
  const handleDragLeave = () => {
    setShowDropIndicator(false);
  };
  
  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setShowDropIndicator(false);
    setIsDragging(false);
    
    if (!selectedSection || !canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Calculate position in percentage
    const x = ((e.clientX - canvasRect.left) / canvasRect.width) * 100;
    const y = ((e.clientY - canvasRect.top) / canvasRect.height) * 100;
    
    const dataType = e.dataTransfer.getData('element-type');
    
    // Handle different element types
    if (dataType === 'text') {
      addTextElement(selectedSection.id, 'New Text', { x, y });
      trackInteraction('drop', 'text-element');
    }
    
    // Other element types would be handled here
  };
  
  // Render elements based on their type
  const renderElement = (element: TemplateElement, index: number) => {
    const isSelected = selectedElement?.id === element.id;
    
    switch (element.type) {
      case 'text':
        return (
          <TextElementComponent
            key={element.id}
            element={element as TextElement}
            isSelected={isSelected}
            canvasDimensions={canvasDimensions}
            onSelect={(e) => handleElementClick(element.id, e)}
          />
        );
      case 'media':
        return (
          <MediaElementComponent
            key={element.id}
            element={element as MediaElement}
            isSelected={isSelected}
            canvasDimensions={canvasDimensions}
            onSelect={(e) => handleElementClick(element.id, e)}
          />
        );
      default:
        return null;
    }
  };
  
  // Background style based on section
  const backgroundStyle = selectedSection ? {
    backgroundColor: selectedSection.background.type === 'color' 
      ? selectedSection.background.value 
      : 'black',
    backgroundImage: selectedSection.background.type === 'image' || selectedSection.background.type === 'video'
      ? `url(${selectedSection.background.value})`
      : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: selectedSection.background.opacity
  } : {
    backgroundColor: 'black'
  };
  
  // Return placeholder if no section selected
  if (!selectedSection) {
    return (
      <div className="flex items-center justify-center w-full h-full rounded-lg bg-gray-900 text-white text-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <svg className="w-16 h-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-white">No Section Selected</h3>
          <p className="text-sm text-gray-400 max-w-md">
            Select a section from the timeline below or create a new section to start editing your template.
          </p>
        </div>
      </div>
    );
  }
  
  // Mobile frame dimensions (9:16 aspect ratio for TikTok)
  const frameStyle = state.ui.device === 'mobile' 
    ? { maxWidth: '320px', maxHeight: '570px', width: '100%', height: '100%' } 
    : { width: '100%', height: '100%' };
  
  return (
    <div className="relative flex items-center justify-center w-full h-full p-4 bg-gray-900 overflow-hidden">
      {/* Mobile or desktop device frame */}
      <motion.div 
        className="relative overflow-hidden bg-black rounded-lg shadow-xl"
        style={frameStyle}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Canvas for editing */}
        <div
          ref={canvasRef}
          className={cn(
            "relative w-full h-full overflow-hidden transition-colors duration-300",
            showDropIndicator && "ring-2 ring-blue-500 ring-opacity-70",
            state.ui.mode === 'edit' && "cursor-default"
          )}
          onClick={handleCanvasClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Background layer */}
          <div className="absolute inset-0 z-0" style={backgroundStyle} />
          
          {/* Elements layer */}
          <div className="absolute inset-0 z-10">
            {elements.map(renderElement)}
          </div>
          
          {/* Drop indicator overlay */}
          <AnimatePresence>
            {showDropIndicator && (
              <motion.div
                className="absolute inset-0 z-20 border-2 border-dashed border-blue-500 bg-blue-500 bg-opacity-10 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-blue-500 text-white px-3 py-2 rounded-md shadow-lg font-medium">
                  Drop here to add element
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Section name and type overlay */}
          <div className="absolute top-3 left-3 z-30">
            <motion.div
              className="bg-black bg-opacity-60 rounded-md px-3 py-1.5 text-white text-xs font-medium flex items-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <span className="mr-1.5">{selectedSection.name}</span>
              <span className="text-blue-400 text-xs">({selectedSection.type})</span>
              <ChevronDown className="w-3 h-3 ml-1.5 text-gray-400" />
            </motion.div>
          </div>
          
          {/* Edit/Preview mode indicator */}
          <motion.div
            className="absolute bottom-3 right-3 z-30"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <div className="bg-black bg-opacity-60 rounded-full w-8 h-8 flex items-center justify-center">
              {state.ui.mode === 'edit' ? (
                <Eye className="w-4 h-4 text-white" />
              ) : (
                <EyeOff className="w-4 h-4 text-white" />
              )}
            </div>
          </motion.div>
          
          {/* Add element button - only visible in edit mode */}
          {state.ui.mode === 'edit' && (
            <motion.button
              className="absolute bottom-3 left-3 z-30 bg-blue-500 hover:bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              onClick={() => {
                if (selectedSection) {
                  addTextElement(selectedSection.id, 'New Text', { x: 50, y: 50 });
                  trackInteraction('add', 'text-element');
                }
              }}
            >
              <Plus className="w-5 h-5 text-white" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EditorCanvas; 