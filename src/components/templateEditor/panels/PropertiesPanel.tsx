"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Layers, 
  Type, 
  ImageIcon, 
  Palette, 
  Clock, 
  ChevronDown,
  Sliders,
  Edit3
} from 'lucide-react';
import { useTemplateEditor } from '@/lib/contexts/TemplateEditorContext';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { TextElement, MediaElement } from '@/lib/types/templateEditor.types';

/**
 * PropertiesPanel Component
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Properties organized by contextual relevance
 * - Emotional Design: Interactive controls with immediate visual feedback
 * - Contextual Intelligence: Controls adapt based on selection type
 * - Progressive Disclosure: Advanced options revealed progressively
 * - Sensory Harmony: Visual and interactive consistency throughout
 */
const PropertiesPanel: React.FC = () => {
  const { 
    state,
    dispatch,
    selectedSection,
    selectedElement,
    trackInteraction
  } = useTemplateEditor();
  
  const [activeTab, setActiveTab] = useState('style');
  
  // Handle section name change
  const handleSectionNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedSection) return;
    
    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        sectionId: selectedSection.id,
        updates: {
          name: e.target.value
        }
      }
    });
    
    trackInteraction('update', `section:name`);
  };
  
  // Handle section duration change
  const handleSectionDurationChange = (value: number[]) => {
    if (!selectedSection) return;
    
    const duration = value[0];
    
    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        sectionId: selectedSection.id,
        updates: {
          duration
        }
      }
    });
    
    trackInteraction('update', `section:duration:${duration}`);
  };
  
  // Handle section background color change
  const handleBackgroundColorChange = (color: string) => {
    if (!selectedSection) return;
    
    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        sectionId: selectedSection.id,
        updates: {
          background: {
            ...selectedSection.background,
            type: 'color',
            value: color
          }
        }
      }
    });
    
    trackInteraction('update', `section:background:color:${color}`);
  };
  
  // Handle text element content change
  const handleTextContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedSection || !selectedElement || selectedElement.type !== 'text') return;
    
    dispatch({
      type: 'UPDATE_ELEMENT',
      payload: {
        sectionId: selectedSection.id,
        elementId: selectedElement.id,
        updates: {
          content: e.target.value
        }
      }
    });
    
    trackInteraction('update', `element:text:content`);
  };
  
  // Handle text element font size change
  const handleFontSizeChange = (value: number[]) => {
    if (!selectedSection || !selectedElement || selectedElement.type !== 'text') return;
    
    const textElement = selectedElement as TextElement;
    const fontSize = value[0];
    
    dispatch({
      type: 'UPDATE_ELEMENT',
      payload: {
        sectionId: selectedSection.id,
        elementId: selectedElement.id,
        updates: {
          style: {
            ...textElement.style,
            fontSize
          }
        }
      }
    });
    
    trackInteraction('update', `element:text:fontSize:${fontSize}`);
  };
  
  // Handle text element color change
  const handleTextColorChange = (color: string) => {
    if (!selectedSection || !selectedElement || selectedElement.type !== 'text') return;
    
    const textElement = selectedElement as TextElement;
    
    dispatch({
      type: 'UPDATE_ELEMENT',
      payload: {
        sectionId: selectedSection.id,
        elementId: selectedElement.id,
        updates: {
          style: {
            ...textElement.style,
            color
          }
        }
      }
    });
    
    trackInteraction('update', `element:text:color:${color}`);
  };
  
  // Determine if we're showing section or element properties
  const showingElementProperties = selectedSection && selectedElement;
  const showingSectionProperties = selectedSection && !selectedElement;
  const noSelection = !selectedSection;
  
  // Text element specific controls
  const renderTextElementControls = () => {
    if (!selectedElement || selectedElement.type !== 'text') return null;
    
    const textElement = selectedElement as TextElement;
    
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Text Content</Label>
          <Input
            value={textElement.content}
            onChange={handleTextContentChange}
            className="text-sm"
          />
        </div>
        
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">
            Font Size: {textElement.style.fontSize}px
          </Label>
          <Slider
            value={[textElement.style.fontSize || 24]}
            min={8}
            max={72}
            step={1}
            onValueChange={handleFontSizeChange}
            className="my-4"
          />
        </div>
        
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Text Color</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {['#FFFFFF', '#000000', '#FF3B5C', '#00F2EA', '#FFFC00', '#FF9900'].map(color => (
              <button
                key={color}
                className={cn(
                  "w-8 h-8 rounded-full border-2",
                  textElement.style.color === color ? "border-blue-500" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleTextColorChange(color)}
              />
            ))}
            
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="h-8">
                  Custom
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3">
                <Label className="text-xs text-gray-500 mb-1.5 block">Custom Color</Label>
                <Input
                  type="color"
                  value={textElement.style.color || '#FFFFFF'}
                  onChange={(e) => handleTextColorChange(e.target.value)}
                  className="w-full h-10"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Text Alignment</Label>
          <div className="flex border rounded-md overflow-hidden">
            <button
              className={cn(
                "flex-1 py-1.5 text-sm",
                textElement.style.textAlign === 'left' 
                  ? "bg-blue-50 text-blue-600" 
                  : "bg-white text-gray-700 hover:bg-gray-50"
              )}
              onClick={() => {
                dispatch({
                  type: 'UPDATE_ELEMENT',
                  payload: {
                    sectionId: selectedSection!.id,
                    elementId: selectedElement.id,
                    updates: {
                      style: {
                        ...textElement.style,
                        textAlign: 'left'
                      }
                    }
                  }
                });
                trackInteraction('update', 'element:text:align:left');
              }}
            >
              Left
            </button>
            <button
              className={cn(
                "flex-1 py-1.5 text-sm border-l border-r",
                textElement.style.textAlign === 'center' 
                  ? "bg-blue-50 text-blue-600" 
                  : "bg-white text-gray-700 hover:bg-gray-50"
              )}
              onClick={() => {
                dispatch({
                  type: 'UPDATE_ELEMENT',
                  payload: {
                    sectionId: selectedSection!.id,
                    elementId: selectedElement.id,
                    updates: {
                      style: {
                        ...textElement.style,
                        textAlign: 'center'
                      }
                    }
                  }
                });
                trackInteraction('update', 'element:text:align:center');
              }}
            >
              Center
            </button>
            <button
              className={cn(
                "flex-1 py-1.5 text-sm",
                textElement.style.textAlign === 'right' 
                  ? "bg-blue-50 text-blue-600" 
                  : "bg-white text-gray-700 hover:bg-gray-50"
              )}
              onClick={() => {
                dispatch({
                  type: 'UPDATE_ELEMENT',
                  payload: {
                    sectionId: selectedSection!.id,
                    elementId: selectedElement.id,
                    updates: {
                      style: {
                        ...textElement.style,
                        textAlign: 'right'
                      }
                    }
                  }
                });
                trackInteraction('update', 'element:text:align:right');
              }}
            >
              Right
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Media element specific controls
  const renderMediaElementControls = () => {
    if (!selectedElement || selectedElement.type !== 'media') return null;
    
    const mediaElement = selectedElement as MediaElement;
    
    return (
      <div className="space-y-4">
        <div className="border rounded-md p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Media Source</span>
            <Button size="sm" variant="outline" className="h-7 text-xs">
              Change
            </Button>
          </div>
          
          <div className="aspect-video rounded bg-gray-200 flex items-center justify-center overflow-hidden">
            {mediaElement.mediaSource.type === 'image' ? (
              <img
                src={mediaElement.mediaSource.url}
                alt="Media element"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500">
                <ImageIcon className="w-6 h-6 mb-1" />
                <span className="text-xs">Video preview</span>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">
            Opacity: {Math.round((mediaElement.style?.opacity || 1) * 100)}%
          </Label>
          <Slider
            value={[(mediaElement.style?.opacity || 1) * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={(values) => {
              const opacity = values[0] / 100;
              
              dispatch({
                type: 'UPDATE_ELEMENT',
                payload: {
                  sectionId: selectedSection!.id,
                  elementId: selectedElement.id,
                  updates: {
                    style: {
                      ...mediaElement.style,
                      opacity
                    }
                  }
                }
              });
              
              trackInteraction('update', `element:media:opacity:${opacity}`);
            }}
            className="my-4"
          />
        </div>
        
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Object Fit</Label>
          <div className="grid grid-cols-3 gap-2">
            {['cover', 'contain', 'fill'].map(fit => (
              <button
                key={fit}
                className={cn(
                  "py-1.5 px-2 rounded border text-sm capitalize",
                  mediaElement.fit === fit
                    ? "bg-blue-50 border-blue-200 text-blue-600"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
                onClick={() => {
                  dispatch({
                    type: 'UPDATE_ELEMENT',
                    payload: {
                      sectionId: selectedSection!.id,
                      elementId: selectedElement.id,
                      updates: {
                        fit: fit as 'cover' | 'contain' | 'fill'
                      }
                    }
                  });
                  
                  trackInteraction('update', `element:media:fit:${fit}`);
                }}
              >
                {fit}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Section controls
  const renderSectionControls = () => {
    if (!selectedSection) return null;
    
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Section Name</Label>
          <Input
            value={selectedSection.name}
            onChange={handleSectionNameChange}
            className="text-sm"
          />
        </div>
        
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Section Type</Label>
          <div className="border rounded-md px-3 py-2 bg-gray-50 text-sm flex justify-between items-center">
            <span className="text-gray-700 capitalize">{selectedSection.type}</span>
            <div className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded">
              {selectedSection.type === 'intro' ? 'Opening' :
               selectedSection.type === 'hook' ? 'Attention Grab' :
               selectedSection.type === 'body' ? 'Main Content' :
               'Call to Action'}
            </div>
          </div>
        </div>
        
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">
            Duration: {selectedSection.duration}s
          </Label>
          <Slider
            value={[selectedSection.duration]}
            min={1}
            max={15}
            step={0.5}
            onValueChange={handleSectionDurationChange}
            className="my-4"
          />
        </div>
        
        <div>
          <Label className="text-xs text-gray-500 mb-1.5 block">Background</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {['#000000', '#FFFFFF', '#FF3B5C', '#00F2EA', '#FFFC00', '#FF9900'].map(color => (
              <button
                key={color}
                className={cn(
                  "w-8 h-8 rounded-full border-2",
                  selectedSection.background.type === 'color' && 
                  selectedSection.background.value === color 
                    ? "border-blue-500" 
                    : "border-transparent"
                )}
                style={{ backgroundColor: color }}
                onClick={() => handleBackgroundColorChange(color)}
              />
            ))}
            
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="h-8">
                  Custom
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3">
                <Label className="text-xs text-gray-500 mb-1.5 block">Custom Background Color</Label>
                <Input
                  type="color"
                  value={selectedSection.background.type === 'color' ? selectedSection.background.value : '#000000'}
                  onChange={(e) => handleBackgroundColorChange(e.target.value)}
                  className="w-full h-10"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    );
  };
  
  // Empty state when nothing is selected
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <Layers className="w-12 h-12 text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-700 mb-2">No Selection</h3>
      <p className="text-sm text-gray-500 mb-4">
        Select a section or element to view and edit its properties.
      </p>
    </div>
  );
  
  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <h2 className="text-lg font-semibold">Properties</h2>
        
        {/* Show what's currently selected */}
        {selectedElement && (
          <div className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md flex items-center">
            {selectedElement.type === 'text' ? (
              <Type className="w-3 h-3 mr-1" />
            ) : (
              <ImageIcon className="w-3 h-3 mr-1" />
            )}
            <span>
              {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Selected
            </span>
          </div>
        )}
        
        {showingSectionProperties && (
          <div className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md flex items-center">
            <Layers className="w-3 h-3 mr-1" />
            <span>Section: {selectedSection.name}</span>
          </div>
        )}
      </div>
      
      {/* Properties content */}
      <div className="flex-1 overflow-y-auto p-4">
        {noSelection && renderEmptyState()}
        
        {showingElementProperties && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="style" className="flex-1">
                <Palette className="w-4 h-4 mr-1.5" />
                Style
              </TabsTrigger>
              <TabsTrigger value="animation" className="flex-1">
                <Clock className="w-4 h-4 mr-1.5" />
                Animation
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex-1">
                <Sliders className="w-4 h-4 mr-1.5" />
                Advanced
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="style" className="mt-0">
              {selectedElement.type === 'text' && renderTextElementControls()}
              {selectedElement.type === 'media' && renderMediaElementControls()}
            </TabsContent>
            
            <TabsContent value="animation" className="mt-0">
              <div className="bg-amber-50 p-3 rounded-md text-center">
                <p className="text-amber-800 text-sm">
                  Animation features available in premium version.
                </p>
                <button className="text-xs text-amber-800 underline mt-1">
                  Upgrade for animations
                </button>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="mt-0">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium mb-2">Element Position</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">X Position</Label>
                    <Input type="number" value={Math.round(selectedElement.position.x)} className="text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1.5 block">Y Position</Label>
                    <Input type="number" value={Math.round(selectedElement.position.y)} className="text-sm" />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        {showingSectionProperties && (
          <Tabs value="section-props">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="section-props" className="flex-1">
                <Layers className="w-4 h-4 mr-1.5" />
                Section Properties
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="section-props" className="mt-0">
              {renderSectionControls()}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel; 