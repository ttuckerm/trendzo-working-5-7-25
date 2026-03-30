"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useEditor } from "@/lib/contexts/EditorContext";
import { cn } from "@/lib/utils";
import { 
  LayoutGrid, 
  Library, 
  Settings, 
  Wand2 as Magic, 
  Image as ImageIcon, 
  Type, 
  Square, 
  Video, 
  Music, 
  Sparkles,
  PanelLeftClose as PanelLeft,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import PropertyEditor from "./PropertyEditor";

/**
 * EditorSidebar Component
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Controls are organized by context and revealed when needed
 * - Emotional Design: Micro-animations for state transitions
 * - Contextual Intelligence: Panels adapt based on editor mode and selection
 * - Progressive Disclosure: Tabbed interface with expandable sections
 * - Sensory Harmony: Visual feedback coordinated with interactions
 */

interface EditorSidebarProps {
  className?: string;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ 
  className = "" 
}) => {
  // Get editor context
  const { 
    state, 
    addElement,
    selectElement
  } = useEditor();
  
  // Local state for sidebar management
  const [activeTab, setActiveTab] = useState<'elements' | 'properties' | 'library' | 'settings'>('elements');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Element categories for the elements tab
  const elementCategories = [
    {
      name: 'Text',
      type: 'text' as const,
      icon: <Type size={20} />
    },
    {
      name: 'Image',
      type: 'image' as const,
      icon: <ImageIcon size={20} />
    },
    {
      name: 'Shape',
      type: 'shape' as const,
      icon: <Square size={20} />
    },
    {
      name: 'Video',
      type: 'video' as const,
      icon: <Video size={20} />
    },
    {
      name: 'Audio',
      type: 'audio' as const,
      icon: <Music size={20} />
    },
    {
      name: 'Effects',
      type: 'effect' as const,
      icon: <Sparkles size={20} />
    }
  ];
  
  // Handle adding a new element
  const handleAddElement = (type: string) => {
    if (!state.ui.selectedSectionId) return;
    
    addElement(
      state.ui.selectedSectionId, 
      type as any
    );
  };
  
  // Placeholder assets for the library tab
  const libraryAssets = [
    {
      id: 'asset1',
      name: 'Logo',
      type: 'image',
      thumbnail: 'https://via.placeholder.com/80',
      tags: ['branding', 'logo']
    },
    {
      id: 'asset2',
      name: 'Headline Text',
      type: 'text',
      content: 'Your awesome headline here',
      tags: ['text', 'headline']
    },
    {
      id: 'asset3',
      name: 'Button',
      type: 'shape',
      thumbnail: 'https://via.placeholder.com/80',
      tags: ['ui', 'button']
    },
    {
      id: 'asset4',
      name: 'Product Showcase',
      type: 'video',
      thumbnail: 'https://via.placeholder.com/80',
      tags: ['product', 'video']
    }
  ];
  
  // Filter library assets based on search
  const filteredAssets = libraryAssets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.tags.some(tag => tag.includes(searchQuery.toLowerCase()))
  );
  
  // Toggle sidebar collapse state
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // If collapsed, just show the toggle button and icons
  if (isCollapsed) {
    return (
      <div className={cn(
        "flex flex-col h-full border-l bg-background/95 backdrop-blur w-12 transition-all duration-200",
        className
      )}>
        <div className="flex flex-col items-center py-4 space-y-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100"
            title="Expand Sidebar"
          >
            <ChevronRight size={20} />
          </motion.button>
          
          <div className="h-px w-8 bg-gray-200 my-2"></div>
          
          {/* Tab buttons - icons only */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveTab('elements');
              setIsCollapsed(false);
            }}
            className={cn(
              "p-2 rounded-md",
              activeTab === 'elements' ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"
            )}
            title="Elements"
          >
            <LayoutGrid size={20} />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveTab('properties');
              setIsCollapsed(false);
            }}
            className={cn(
              "p-2 rounded-md",
              activeTab === 'properties' ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"
            )}
            title="Properties"
          >
            <Settings size={20} />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveTab('library');
              setIsCollapsed(false);
            }}
            className={cn(
              "p-2 rounded-md",
              activeTab === 'library' ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"
            )}
            title="Library"
          >
            <Library size={20} />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveTab('settings');
              setIsCollapsed(false);
            }}
            className={cn(
              "p-2 rounded-md",
              activeTab === 'settings' ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"
            )}
            title="AI Assistant"
          >
            <Magic size={20} />
          </motion.button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "flex flex-col h-full border-l bg-background/95 backdrop-blur w-80 transition-all duration-200",
      className
    )}>
      {/* Sidebar header with tabs */}
      <div className="flex items-center justify-between border-b px-4 py-2 h-14">
        <div className="flex space-x-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('elements')}
            className={cn(
              "p-2 rounded-md text-sm font-medium",
              activeTab === 'elements' ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <LayoutGrid size={16} className="mr-1" />
            Elements
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('properties')}
            className={cn(
              "p-2 rounded-md text-sm font-medium",
              activeTab === 'properties' ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <Settings size={16} className="mr-1" />
            Properties
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('library')}
            className={cn(
              "p-2 rounded-md text-sm font-medium",
              activeTab === 'library' ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            <Library size={16} className="mr-1" />
            Library
          </motion.button>
        </div>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <PanelLeft size={18} />
        </motion.button>
      </div>
      
      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {/* Elements Tab */}
        {activeTab === 'elements' && (
          <div className="p-4">
            <h3 className="font-medium text-base mb-3">Add Elements</h3>
            
            <div className="grid grid-cols-2 gap-2">
              {elementCategories.map((category) => (
                <motion.button
                  key={category.type}
                  className="flex flex-col items-center justify-center p-3 bg-white border rounded-md hover:bg-gray-50 transition-colors"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddElement(category.type)}
                  disabled={!state.ui.selectedSectionId}
                >
                  <div className="w-10 h-10 flex items-center justify-center text-gray-600 mb-2">
                    {category.icon}
                  </div>
                  <span className="text-sm">{category.name}</span>
                </motion.button>
              ))}
            </div>
            
            {!state.ui.selectedSectionId && (
              <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
                <p>Please select a section first to add elements.</p>
              </div>
            )}
            
            <div className="mt-6">
              <h3 className="font-medium text-base mb-3">Section Elements</h3>
              
              {state.ui.selectedSectionId ? (
                <div className="space-y-2">
                  {state.template.sections.find(s => s.id === state.ui.selectedSectionId)?.elements.map((element) => (
                    <div 
                      key={element.id}
                      className={cn(
                        "p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors",
                        state.ui.selectedElementId === element.id && "border-primary bg-primary/5"
                      )}
                      onClick={() => selectElement(element.id)}
                    >
                      <div className="flex items-center">
                        {element.type === 'text' && <Type size={16} className="mr-2 text-gray-500" />}
                        {element.type === 'image' && <ImageIcon size={16} className="mr-2 text-gray-500" />}
                        {element.type === 'video' && <Video size={16} className="mr-2 text-gray-500" />}
                        {element.type === 'sticker' && <Square size={16} className="mr-2 text-gray-500" />}
                        {element.type === 'effect' && <Sparkles size={16} className="mr-2 text-gray-500" />}
                        {element.type === 'audio' && <Music size={16} className="mr-2 text-gray-500" />}
                        
                        <span className="text-sm truncate flex-1">
                          {element.type === 'text' 
                            ? (element.content as string).substring(0, 20) + (element.content.length > 20 ? '...' : '') 
                            : `${element.type.charAt(0).toUpperCase() + element.type.slice(1)} Element`}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {state.template.sections.find(s => s.id === state.ui.selectedSectionId)?.elements.length === 0 && (
                    <div className="p-3 border rounded-md text-gray-500 text-sm">
                      No elements in this section yet.
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 border rounded-md text-gray-500 text-sm">
                  Select a section to see its elements.
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <PropertyEditor />
        )}
        
        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="p-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search library..."
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {filteredAssets.map((asset) => (
                <motion.div
                  key={asset.id}
                  className="border rounded-md overflow-hidden bg-white"
                  whileHover={{ y: -2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  {asset.type === 'image' || asset.type === 'video' || asset.type === 'shape' ? (
                    <div className="h-20 bg-gray-100 flex items-center justify-center">
                      <img src={asset.thumbnail} alt={asset.name} className="max-h-full" />
                    </div>
                  ) : (
                    <div className="h-20 bg-gray-100 flex items-center justify-center p-2 text-center">
                      <span className="text-sm text-gray-700">{asset.content}</span>
                    </div>
                  )}
                  
                  <div className="p-2">
                    <div className="text-sm font-medium">{asset.name}</div>
                    <div className="flex mt-1 flex-wrap">
                      {asset.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 rounded-full px-2 py-0.5 mr-1 mb-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {filteredAssets.length === 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md text-center text-gray-500">
                No matching assets found.
              </div>
            )}
          </div>
        )}
        
        {/* Settings/AI Tab */}
        {activeTab === 'settings' && (
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Magic size={18} className="text-primary" />
              <h3 className="font-medium text-lg">AI Assistant</h3>
            </div>
            
            <div className="bg-primary/5 rounded-lg p-4 mb-4">
              <p className="text-sm mb-2">
                AI suggests improvements to your template based on engagement data and design principles.
              </p>
              
              <div className="flex justify-end">
                <motion.button
                  className="text-sm bg-primary text-white px-3 py-1.5 rounded-md"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Generate Suggestions
                </motion.button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 border rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-medium text-sm">Add attention-grabbing intro</h4>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">High impact</span>
                </div>
                <p className="text-xs text-gray-600">
                  Add a bold text entrance animation to capture immediate attention.
                </p>
              </div>
              
              <div className="p-3 border rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-medium text-sm">Optimize timing</h4>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Medium impact</span>
                </div>
                <p className="text-xs text-gray-600">
                  Adjust section duration to maintain optimal engagement.
                </p>
              </div>
              
              <div className="p-3 border rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-medium text-sm">Enhance visual contrast</h4>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Medium impact</span>
                </div>
                <p className="text-xs text-gray-600">
                  Increase contrast between text and background for better readability.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorSidebar; 