"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Film, Move, Trash, ExternalLink, Maximize, Minimize } from 'lucide-react';
import { useTemplateEditor } from '@/lib/contexts/TemplateEditorContext';
import { MediaElement } from '@/lib/types/templateEditor.types';
import { cn } from '@/lib/utils';

interface MediaElementComponentProps {
  element: MediaElement;
  isSelected: boolean;
  canvasDimensions: { width: number; height: number };
  onSelect: (e: React.MouseEvent) => void;
}

/**
 * MediaElementComponent
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Controls appear contextually on selection
 * - Emotional Design: Subtle animations and feedback for interactions
 * - Contextual Intelligence: Controls adapt based on media type
 * - Progressive Disclosure: Advanced options revealed on demand
 * - Sensory Harmony: Consistent interaction patterns with text elements
 */
const MediaElementComponent: React.FC<MediaElementComponentProps> = ({
  element,
  isSelected,
  canvasDimensions,
  onSelect
}) => {
  const { dispatch, trackInteraction } = useTemplateEditor();
  const [isFullView, setIsFullView] = useState(false);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);

  // Position style based on element position
  const positionStyle = {
    left: `${element.position.x}%`,
    top: `${element.position.y}%`,
    zIndex: element.position.z,
    transform: 'translate(-50%, -50%)',
    width: `${element.size.width}%`,
  };

  // Base style for the media element
  const mediaStyle = {
    objectFit: element.fit as 'cover' | 'contain' | 'fill',
    opacity: element.mediaSource.type === 'video' ? 1 : (element.style?.opacity || 1),
  };

  // Handle element deletion
  const deleteElement = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    dispatch({
      type: 'DELETE_ELEMENT',
      payload: {
        sectionId: element.id.split('-')[0], // Assuming sectionId is part of the element id
        elementId: element.id
      }
    });
    
    trackInteraction('delete', `media-element:${element.id}`);
  };

  // Handle toggling full view mode
  const toggleFullView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullView(!isFullView);
    trackInteraction('toggle-view', `media-element:${element.id}`);
  };

  // Open media in new tab
  const openInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(element.mediaSource.url, '_blank');
    trackInteraction('open', `media-element:${element.id}`);
  };

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
        {/* Media type indicator */}
        <div className="pl-2 pr-1 flex items-center text-gray-400">
          {element.mediaSource.type === 'image' ? (
            <Image className="w-4 h-4" />
          ) : (
            <Film className="w-4 h-4" />
          )}
        </div>
        
        <div className="w-px h-5 bg-gray-700 mx-1" />
        
        {/* Full view toggle */}
        <button 
          className="p-1.5 rounded hover:bg-gray-700 text-white"
          onClick={toggleFullView}
          aria-label={isFullView ? "Minimize view" : "Maximize view"}
        >
          {isFullView ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
        </button>
        
        {/* Open in new tab */}
        <button 
          className="p-1.5 rounded hover:bg-gray-700 text-white"
          onClick={openInNewTab}
          aria-label="Open in new tab"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
        
        <div className="w-px h-5 bg-gray-700 mx-1" />
        
        {/* Move handle */}
        <button 
          className="p-1.5 rounded hover:bg-gray-700 text-white cursor-move"
          aria-label="Move media"
        >
          <Move className="w-4 h-4" />
        </button>
        
        <div className="w-px h-5 bg-gray-700 mx-1" />
        
        {/* Delete button */}
        <button 
          className="p-1.5 rounded hover:bg-red-700 text-white"
          onClick={deleteElement}
          aria-label="Delete media"
        >
          <Trash className="w-4 h-4" />
        </button>
      </motion.div>
    );
  };

  // Determine if media is ready to show
  const mediaReady = element.mediaSource && element.mediaSource.url;

  // Render media content based on type
  const renderMedia = () => {
    if (!mediaReady) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
          <span>Media not available</span>
        </div>
      );
    }

    if (element.mediaSource.type === 'image' || element.mediaSource.type === 'gif') {
      return (
        <motion.img
          ref={mediaRef as React.RefObject<HTMLImageElement>}
          src={element.mediaSource.url}
          alt="Template media"
          className="w-full h-full rounded"
          style={mediaStyle}
          draggable={false}
          initial={{ opacity: 0 }}
          animate={{ opacity: element.style?.opacity || 1 }}
          transition={{ duration: 0.3 }}
        />
      );
    } else if (element.mediaSource.type === 'video') {
      return (
        <motion.video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={element.mediaSource.url}
          className="w-full h-full rounded"
          style={mediaStyle}
          autoPlay={isFullView}
          loop
          muted
          playsInline
          controls={isFullView}
          initial={{ opacity: 0 }}
          animate={{ opacity: element.style?.opacity || 1 }}
          transition={{ duration: 0.3 }}
        />
      );
    }

    return null;
  };

  const containerClassName = cn(
    "absolute overflow-hidden rounded",
    isSelected && "outline outline-2 outline-blue-500 outline-offset-2"
  );

  // Full view mode with overlay
  if (isFullView) {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsFullView(false)}
        >
          <div className="relative max-w-4xl max-h-screen p-4">
            <button
              className="absolute top-2 right-2 bg-gray-800 text-white p-2 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullView(false);
              }}
            >
              <Minimize className="w-5 h-5" />
            </button>
            <div className="p-1 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg">
              {renderMedia()}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Normal view
  return (
    <div
      className={containerClassName}
      style={positionStyle}
      onClick={onSelect}
    >
      {renderMedia()}
      
      {/* Toolbar - only show when selected */}
      <AnimatePresence>
        {isSelected && renderToolbar()}
      </AnimatePresence>
    </div>
  );
};

export default MediaElementComponent; 