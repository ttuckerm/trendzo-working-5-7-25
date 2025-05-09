"use client";

import React from 'react';
import { motion, Reorder } from 'framer-motion';
import { 
  Layers, 
  Clock, 
  Trash2, 
  PlusCircle,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Play,
  Pause
} from 'lucide-react';
import { useTemplateEditor } from '@/lib/contexts/TemplateEditorContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Section } from '@/lib/types/templateEditor.types';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';

/**
 * TimelinesPanel Component
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Clean timeline representation with minimal visual noise
 * - Emotional Design: Interactive draggable sections with immediate visual feedback
 * - Contextual Intelligence: Timeline displays relevant info based on template structure
 * - Progressive Disclosure: Actions revealed on hover/context menus
 * - Sensory Harmony: Visual consistency with other panels
 */
const TimelinesPanel: React.FC = () => {
  const { 
    state, 
    dispatch, 
    selectedSection, 
    setSelectedSection, 
    setSelectedElement,
    isPlaying,
    togglePlayback,
    trackInteraction
  } = useTemplateEditor();
  
  // Function to handle section selection
  const handleSelectSection = (section: Section) => {
    setSelectedSection(section);
    setSelectedElement(null);
    trackInteraction('select', `section:${section.id}`);
  };
  
  // Function to handle section reordering
  const handleReorderSections = (reorderedSections: Section[]) => {
    dispatch({
      type: 'REORDER_SECTIONS',
      payload: { sections: reorderedSections }
    });
    
    trackInteraction('reorder', 'sections');
  };
  
  // Function to add a new section
  const handleAddSection = (type: Section['type']) => {
    const newSectionId = `section-${Date.now()}`;
    
    dispatch({
      type: 'ADD_SECTION',
      payload: {
        section: {
          id: newSectionId,
          name: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
          type,
          duration: 5,
          background: {
            type: 'color',
            value: '#000000'
          },
          elements: []
        }
      }
    });
    
    trackInteraction('add', `section:${type}`);
  };
  
  // Function to delete a section
  const handleDeleteSection = (sectionId: string) => {
    // Don't allow deleting the last section
    if (state.template.sections.length <= 1) {
      return;
    }
    
    dispatch({
      type: 'DELETE_SECTION',
      payload: { sectionId }
    });
    
    // If we deleted the selected section, select the first available one
    if (selectedSection?.id === sectionId) {
      if (state.template.sections.length > 0) {
        const nextSection = state.template.sections.find(s => s.id !== sectionId) || state.template.sections[0];
        setSelectedSection(nextSection);
      } else {
        setSelectedSection(null);
      }
    }
    
    trackInteraction('delete', `section:${sectionId}`);
  };
  
  // Function to duplicate a section
  const handleDuplicateSection = (section: Section) => {
    const newSectionId = `section-${Date.now()}`;
    
    dispatch({
      type: 'ADD_SECTION',
      payload: {
        section: {
          ...JSON.parse(JSON.stringify(section)), // Deep copy
          id: newSectionId,
          name: `${section.name} (Copy)`,
          elements: section.elements.map(el => ({
            ...el,
            id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }))
        },
        afterSectionId: section.id
      }
    });
    
    trackInteraction('duplicate', `section:${section.id}`);
  };
  
  // Calculate total template duration
  const totalDuration = state.template.sections.reduce((total, section) => total + section.duration, 0);
  
  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold mr-4">Timeline</h2>
          <div className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {totalDuration}s
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-8 h-8 p-0" 
                onClick={togglePlayback}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isPlaying ? 'Pause Preview' : 'Play Preview'}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                onClick={() => handleAddSection('body')}
                className="h-8 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200"
              >
                <PlusCircle size={14} className="mr-1.5" />
                Add Section
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add a new section to your template</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {/* Timeline sections */}
      <div className="flex-1 overflow-y-auto">
        <Reorder.Group
          axis="y"
          values={state.template.sections}
          onReorder={handleReorderSections}
          className="space-y-2 p-3"
        >
          {state.template.sections.map(section => (
            <ContextMenu key={section.id}>
              <ContextMenuTrigger>
                <Reorder.Item
                  value={section}
                  className={cn(
                    "flex items-center border rounded-md p-3 select-none",
                    selectedSection?.id === section.id 
                      ? "bg-blue-50 border-blue-200" 
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => handleSelectSection(section)}
                >
                  <div className="mr-2 cursor-grab text-gray-400 hover:text-gray-600">
                    <GripVertical size={16} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <h3 className="font-medium text-sm truncate">{section.name}</h3>
                      <span className={cn(
                        "ml-2 px-1.5 py-0.5 text-xs rounded",
                        section.type === 'intro' ? "bg-purple-100 text-purple-800" :
                        section.type === 'hook' ? "bg-pink-100 text-pink-800" :
                        section.type === 'body' ? "bg-blue-100 text-blue-800" :
                        "bg-amber-100 text-amber-800"
                      )}>
                        {section.type}
                      </span>
                    </div>
                    
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Clock size={12} className="mr-1" /> {section.duration}s
                      <span className="mx-2">•</span>
                      <Layers size={12} className="mr-1" /> {section.elements.length} elements
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent section selection
                            handleDuplicateSection(section);
                          }}
                        >
                          <PlusCircle size={14} className="text-gray-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Duplicate Section</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {state.template.sections.length > 1 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent section selection
                              handleDeleteSection(section.id);
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Section</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </Reorder.Item>
              </ContextMenuTrigger>
              
              <ContextMenuContent>
                <ContextMenuItem onClick={() => handleSelectSection(section)}>
                  Edit Section
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleDuplicateSection(section)}>
                  Duplicate Section
                </ContextMenuItem>
                {state.template.sections.length > 1 && (
                  <ContextMenuItem 
                    className="text-red-600"
                    onClick={() => handleDeleteSection(section.id)}
                  >
                    Delete Section
                  </ContextMenuItem>
                )}
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </Reorder.Group>
        
        {/* Empty state */}
        {state.template.sections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Layers className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Sections Yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Start by adding your first section to create your template.
            </p>
            <div className="flex space-x-2">
              <Button 
                size="sm"
                variant="outline" 
                onClick={() => handleAddSection('intro')}
              >
                Add Intro
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => handleAddSection('hook')}
              >
                Add Hook
              </Button>
              <Button 
                size="sm" 
                variant="default"
                onClick={() => handleAddSection('body')}
              >
                Add Main Section
              </Button>
            </div>
          </div>
        )}
        
        {/* Section type quick-add buttons */}
        {state.template.sections.length > 0 && (
          <div className="flex justify-center space-x-2 py-4 border-t mt-2">
            <div className="text-xs text-gray-500 flex items-center mr-2">
              Quick Add:
            </div>
            <Button 
              size="sm"
              variant="outline" 
              className="h-7 text-xs"
              onClick={() => handleAddSection('intro')}
            >
              Intro
            </Button>
            <Button 
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => handleAddSection('hook')}
            >
              Hook
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="h-7 text-xs"
              onClick={() => handleAddSection('body')}
            >
              Body
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="h-7 text-xs"
              onClick={() => handleAddSection('cta')}
            >
              CTA
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelinesPanel; 