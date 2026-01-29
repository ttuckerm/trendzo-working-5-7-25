"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Type, Image, Video, Sticker, PlusCircle, Search, ChevronDown, X } from 'lucide-react';
import { useTemplateEditor } from '@/lib/contexts/TemplateEditorContext';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * Elements Panel Component
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Elements organized by contextual relevance
 * - Emotional Design: Engaging hover/drag interactions
 * - Contextual Intelligence: Recent/suggested elements based on usage
 * - Progressive Disclosure: Categories expand/collapse as needed
 * - Sensory Harmony: Consistent feedback across interactions
 */
const ElementsPanel: React.FC = () => {
  const { state, selectedSection, addTextElement, trackInteraction } = useTemplateEditor();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'text': true,
    'media': true,
    'stickers': false,
    'effects': false
  });
  
  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
    trackInteraction('toggle', `category:${category}`);
  };
  
  // Handle element drag start
  const handleDragStart = (e: React.DragEvent, elementType: string) => {
    e.dataTransfer.setData('element-type', elementType);
    trackInteraction('drag', `start:${elementType}`);
  };
  
  // Add an element directly to the canvas (alternative to drag & drop)
  const addElement = (elementType: string) => {
    if (!selectedSection) return;
    
    if (elementType === 'text') {
      addTextElement(selectedSection.id, 'New Text', { x: 50, y: 50 });
      trackInteraction('add', 'text-element');
    }
    
    // Other element types would be handled here
  };
  
  // Filter elements based on search
  const filterElements = (items: any[], query: string) => {
    if (!query) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  };
  
  // Text elements data
  const textElements = [
    { id: 'title', name: 'Title', preview: 'Aa', style: 'font-bold text-lg' },
    { id: 'subtitle', name: 'Subtitle', preview: 'Aa', style: 'font-medium' },
    { id: 'body', name: 'Body Text', preview: 'Aa', style: 'font-normal text-sm' },
    { id: 'caption', name: 'Caption', preview: 'Aa', style: 'italic text-xs' }
  ];
  
  // Media elements data
  const mediaElements = [
    { id: 'image', name: 'Image', icon: <Image className="w-5 h-5" /> },
    { id: 'video', name: 'Video', icon: <Video className="w-5 h-5" /> }
  ];
  
  // Sticker elements data
  const stickerElements = [
    { id: 'emoji', name: 'Emoji', preview: '😊' },
    { id: 'shape', name: 'Shape', preview: '⭐' }
  ];
  
  // Effects elements data
  const effectsElements = [
    { id: 'filter', name: 'Filter', preview: 'Filter' },
    { id: 'transition', name: 'Transition', preview: 'Transition' }
  ];
  
  // Filtered elements based on search
  const filteredTextElements = filterElements(textElements, searchQuery);
  const filteredMediaElements = filterElements(mediaElements, searchQuery);
  const filteredStickerElements = filterElements(stickerElements, searchQuery);
  const filteredEffectsElements = filterElements(effectsElements, searchQuery);
  
  // Render category header
  const renderCategoryHeader = (title: string, category: string, count: number) => (
    <div 
      className="flex items-center justify-between py-2 px-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
      onClick={() => toggleCategory(category)}
    >
      <div className="flex items-center">
        <ChevronDown 
          className={cn(
            "w-4 h-4 mr-2 text-gray-500 transition-transform duration-200",
            !expandedCategories[category] && "transform -rotate-90"
          )} 
        />
        <h3 className="font-medium text-sm text-gray-700">{title}</h3>
      </div>
      <span className="text-xs text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
        {count}
      </span>
    </div>
  );
  
  // Render text elements
  const renderTextElements = () => (
    <div className="mb-2">
      {renderCategoryHeader('Text', 'text', filteredTextElements.length)}
      
      {expandedCategories['text'] && (
        <div className="p-2 grid grid-cols-2 gap-2">
          {filteredTextElements.map(element => (
            <motion.div
              key={element.id}
              className="border rounded-md p-2 bg-white hover:bg-blue-50 hover:border-blue-300 cursor-grab flex flex-col items-center justify-center text-center transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              draggable
              onDragStart={(e) => handleDragStart(e, 'text')}
              onClick={() => addElement('text')}
            >
              <span className={cn("text-gray-800 mb-1", element.style)}>
                {element.preview}
              </span>
              <span className="text-xs text-gray-500">{element.name}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
  
  // Render media elements
  const renderMediaElements = () => (
    <div className="mb-2">
      {renderCategoryHeader('Media', 'media', filteredMediaElements.length)}
      
      {expandedCategories['media'] && (
        <div className="p-2 grid grid-cols-2 gap-2">
          {filteredMediaElements.map(element => (
            <motion.div
              key={element.id}
              className="border rounded-md p-2 bg-white hover:bg-blue-50 hover:border-blue-300 cursor-grab flex flex-col items-center justify-center text-center transition-colors h-20"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              draggable
              onDragStart={(e) => handleDragStart(e, element.id)}
              onClick={() => addElement(element.id)}
            >
              <div className="bg-gray-100 rounded w-10 h-10 flex items-center justify-center mb-1">
                {element.icon}
              </div>
              <span className="text-xs text-gray-500">{element.name}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
  
  // Render sticker elements
  const renderStickerElements = () => (
    <div className="mb-2">
      {renderCategoryHeader('Stickers', 'stickers', filteredStickerElements.length)}
      
      {expandedCategories['stickers'] && (
        <div className="p-2 grid grid-cols-3 gap-2">
          {filteredStickerElements.map(element => (
            <motion.div
              key={element.id}
              className="border rounded-md p-2 bg-white hover:bg-blue-50 hover:border-blue-300 cursor-grab flex flex-col items-center justify-center text-center transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              draggable
              onDragStart={(e) => handleDragStart(e, element.id)}
              onClick={() => addElement(element.id)}
            >
              <span className="text-xl mb-1">{element.preview}</span>
              <span className="text-xs text-gray-500">{element.name}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
  
  // Render effects elements
  const renderEffectsElements = () => (
    <div>
      {renderCategoryHeader('Effects', 'effects', filteredEffectsElements.length)}
      
      {expandedCategories['effects'] && (
        <div className="p-2 grid grid-cols-2 gap-2">
          {filteredEffectsElements.map(element => (
            <motion.div
              key={element.id}
              className="border rounded-md p-2 bg-white hover:bg-blue-50 hover:border-blue-300 cursor-grab flex flex-col items-center justify-center text-center transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              draggable
              onDragStart={(e) => handleDragStart(e, element.id)}
              onClick={() => addElement(element.id)}
            >
              <span className="text-xs text-gray-500">{element.preview}</span>
              <span className="text-xs text-gray-500">{element.name}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
  
  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="p-4 border-b bg-white">
        <h2 className="text-lg font-semibold mb-3">Elements</h2>
        
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search elements..."
            className="pl-9 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Elements list */}
      <div className="flex-1 overflow-y-auto">
        {/* Quick add button - visible when section is selected */}
        {selectedSection && (
          <div className="p-4">
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => addElement('text')}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              <span>Add Text Element</span>
            </Button>
          </div>
        )}
        
        {/* Element categories */}
        {renderTextElements()}
        {renderMediaElements()}
        {renderStickerElements()}
        {renderEffectsElements()}
      </div>
      
      {/* Premium features badge - an example of progressive disclosure */}
      {state.ui.userExpertiseLevel !== 'beginner' && (
        <div className="p-3 bg-amber-50 border-t border-amber-200 text-center">
          <span className="text-xs text-amber-800 font-medium">Premium elements available</span>
          <button className="text-xs text-amber-800 underline block w-full mt-1">
            Upgrade for more
          </button>
        </div>
      )}
    </div>
  );
};

export default ElementsPanel; 