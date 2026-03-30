"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Maximize,
  Minimize,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layout,
  Eye,
  RotateCcw,
  Sparkles,
  Trash2,
  Save,
  Palette,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Edit3,
  Plus,
  Undo,
  EyeOff,
  X,
  Move,
  Maximize2,
  Minimize2,
  PlusCircle
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Template, TemplateSection, TextOverlay, TextOverlayPosition, TextOverlayStyle } from '@/lib/types/template'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useHotkeys } from 'react-hotkeys-hook'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { useComponentIntegration } from '@/lib/contexts/ComponentIntegrationContext'
import { useUsabilityTest } from '@/lib/contexts/UsabilityTestContext'
import { useRouter } from 'next/navigation'
import { ElementTransition } from '@/components/ui/PageTransition'

// Extended interface for text overlay with alignment
interface ExtendedTextOverlay extends TextOverlay {
  alignment?: 'left' | 'center' | 'right';
}

// Props for the EnhancedTemplateEditor component
interface EnhancedTemplateEditorProps {
  selectedTemplate?: {
    id: string;
    name: string;
    sections: TemplateSection[];
  } | null;
  selectedTemplateId?: string;
  selectedSection?: TemplateSection | null;
  onUpdateTextOverlay?: (sectionId: string, textOverlay: TextOverlay) => void;
  onAddTextOverlay?: (sectionId: string) => void;
  onDeleteTextOverlay?: (sectionId: string, textOverlayId: string) => void;
  onUpdateSection?: (sectionId: string, data: Partial<TemplateSection>) => void;
  onAIEnhance?: (prompt: string) => void;
  onSave?: () => void;
  onExitEditor?: () => void;
  className?: string;
}

export default function EnhancedTemplateEditor({
  selectedTemplate,
  selectedTemplateId,
  selectedSection,
  onUpdateTextOverlay,
  onAddTextOverlay,
  onDeleteTextOverlay,
  onUpdateSection,
  onAIEnhance,
  onSave,
  onExitEditor,
  className = ''
}: EnhancedTemplateEditorProps) {
  // Active tab state
  const [activeTab, setActiveTab] = useState<'content' | 'style'>('content')
  
  // Editor mode state
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit')
  
  // Preview mode state
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // State for undo history
  const [history, setHistory] = useState<Array<{ action: string; data: any }>>([])
  
  // State for currently edited overlay
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null)
  
  // Router for navigation
  const router = useRouter()
  
  // Component integration context
  const { 
    getComponentState, 
    setComponentState, 
    navigateBetweenComponents 
  } = useComponentIntegration()
  
  // Usability testing context
  const { trackInteraction } = useUsabilityTest()
  
  // Canvas ref for rendering
  const canvasRef = useRef<HTMLDivElement>(null)
  
  // Get the selected section object
  const selectedSectionObject = selectedSection 
    ? selectedTemplate?.sections.find(s => s.id === selectedSection.id) 
    : null
    
  // Load saved editor state
  useEffect(() => {
    // Restore active tab
    const savedTab = getComponentState<'content' | 'style'>('templateEditor', 'activeTab')
    if (savedTab) {
      setActiveTab(savedTab)
    }
    
    // Restore editor mode
    const savedEditorMode = getComponentState<'edit' | 'preview'>('templateEditor', 'editorMode')
    if (savedEditorMode) {
      setEditorMode(savedEditorMode)
    }
    
    // Restore selected overlay
    const savedOverlay = getComponentState<string>('templateEditor', 'selectedOverlay')
    if (savedOverlay) {
      setSelectedOverlay(savedOverlay)
    }
  }, [getComponentState])
  
  // Save editor state when it changes
  useEffect(() => {
    setComponentState('templateEditor', 'activeTab', activeTab)
  }, [activeTab, setComponentState])
  
  useEffect(() => {
    setComponentState('templateEditor', 'editorMode', editorMode)
  }, [editorMode, setComponentState])
  
  useEffect(() => {
    if (selectedOverlay) {
      setComponentState('templateEditor', 'selectedOverlay', selectedOverlay)
    }
  }, [selectedOverlay, setComponentState])
  
  // Track history for undo functionality
  const recordHistory = (action: string, payload: any) => {
    setHistory(prev => {
      // Limit history to last 20 actions
      const newHistory = [...prev]
      if (newHistory.length >= 20) {
        newHistory.shift()
      }
      return [...newHistory, { action, data: payload }]
    })
    
    // Also save history to component state for persistence
    setComponentState('templateEditor', 'history', [...history, { action, data: payload }])
  }
  
  // Exit editor with seamless transition back to template library
  const handleExitEditor = useCallback(() => {
    // Track exit interaction
    trackInteraction({
      type: 'navigation',
      target: 'template-library',
      targetType: 'page'
    })
    
    // If onExitEditor prop is provided, use it
    if (onExitEditor) {
      onExitEditor()
    } else {
      // Otherwise use component integration to navigate back
      navigateBetweenComponents(
        '/editor',
        '/templates',
        {
          preserveState: true,
          transition: 'zoom',
          direction: 'right'
        }
      )
    }
  }, [onExitEditor, trackInteraction, navigateBetweenComponents])
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }
  
  // Handle overlay selection
  const handleOverlaySelect = (overlayId: string) => {
    setSelectedOverlay(overlayId)
    setActiveTab('content') // Switch to content tab when selecting overlay
  }
  
  // Handle updating overlay text
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedSectionObject || !selectedOverlay) return
    
    const newValue = e.target.value
    onUpdateTextOverlay?.(selectedSectionObject.id, { ...selectedSectionObject, text: newValue })
    recordHistory('UPDATE_TEXT', { sectionId: selectedSectionObject.id, overlayId: selectedOverlay, text: newValue })
  }
  
  // Handle updating overlay position
  const handlePositionChange = (position: TextOverlayPosition) => {
    if (!selectedSectionObject || !selectedOverlay) return
    
    onUpdateTextOverlay?.(selectedSectionObject.id, { ...selectedSectionObject, position })
    recordHistory('UPDATE_POSITION', { sectionId: selectedSectionObject.id, overlayId: selectedOverlay, position })
  }
  
  // Handle updating overlay style
  const handleStyleChange = (style: TextOverlayStyle | { [key: string]: any }) => {
    if (!selectedOverlay || !selectedSectionObject?.id) return;
    
    // Clone the current overlay data to update it
    const updatedOverlay = { ...selectedSectionObject } as ExtendedTextOverlay;
    updatedOverlay.style = style;
    
    // Pass the update to the parent
    onUpdateTextOverlay?.(selectedSectionObject.id, updatedOverlay as TextOverlay);
  };
  
  // Handle updating overlay alignment
  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    if (!selectedSectionObject || !selectedOverlay) return;
    
    // Create a custom style object that includes alignment
    const currentOverlay = selectedSectionObject.textOverlays.find(o => o.id === selectedOverlay);
    if (!currentOverlay) return;
    
    // Create a new style object with the alignment
    const newStyle = {
      color: 'white',
      fontSize: '1rem',
      fontWeight: 'normal',
      textAlign: alignment
    };
    
    // Update the overlay
    onUpdateTextOverlay?.(selectedSectionObject.id, { 
      ...selectedSectionObject,
      textOverlays: selectedSectionObject.textOverlays.map(o =>
        o.id === selectedOverlay ? { ...o, style: newStyle as any } : o
      )
    });
    
    recordHistory('UPDATE_ALIGNMENT', { sectionId: selectedSectionObject.id, overlayId: selectedOverlay, alignment });
  };
  
  // Get currently selected overlay data
  const getSelectedOverlayData = () => {
    if (!selectedSectionObject || !selectedOverlay) return null
    
    return selectedSectionObject.textOverlays.find(o => o.id === selectedOverlay)
  }
  
  // Handle overlay property updates
  const handleOverlayChange = (property: string, value: any) => {
    if (!selectedOverlay || !selectedSectionObject) return;
    
    const updatedOverlay = { ...selectedSectionObject } as ExtendedTextOverlay;
    updatedOverlay[property] = value;
    
    // Pass the update to the parent
    onUpdateTextOverlay?.(selectedSectionObject.id, updatedOverlay as TextOverlay);
  };
  
  // No template selected message
  if (!selectedTemplate) {
    return (
      <div className={`flex flex-col items-center justify-center h-80 ${className}`}>
        <div className="text-center p-8">
          <Layout className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-800 mb-2">No Template Selected</h3>
          <p className="text-neutral-500 mb-4">
            Please select a template to start editing
          </p>
        </div>
      </div>
    )
  }
  
  // No section selected message
  if (!selectedSection) {
    return (
      <div className={`flex flex-col items-center justify-center h-80 ${className}`}>
        <div className="text-center p-8">
          <Layout className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-800 mb-2">No Section Selected</h3>
          <p className="text-neutral-500 mb-4">
            Please select a section from your template to edit
          </p>
          <Button 
            onClick={() => onAddTextOverlay?.(selectedTemplate.sections[0]?.id || '')}
            disabled={!selectedTemplate.sections.length}
          >
            Add Text to First Section
          </Button>
        </div>
      </div>
    )
  }
  
  // Enhanced editor header with better navigation
  const renderEditorHeader = () => {
    return (
      <div className="flex items-center justify-between bg-white border-b border-neutral-200 p-3 h-16">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExitEditor}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          <div className="ml-2">
            <h1 className="text-lg font-medium text-neutral-800 truncate max-w-md">
              {selectedTemplate?.name || 'Untitled Template'}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditorMode(editorMode === 'edit' ? 'preview' : 'edit')}
          >
            {editorMode === 'edit' ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
          </Button>
          
          <div className="flex border rounded overflow-hidden">
            <Button
              variant={editorMode === 'preview' && previewMode === 'mobile' ? 'subtle' : 'ghost'}
              size="sm"
              onClick={() => {
                setEditorMode('preview');
                setPreviewMode('mobile');
              }}
              className="px-3 py-1 h-8"
            >
              Mobile
            </Button>
            <Button
              variant={editorMode === 'preview' && previewMode === 'desktop' ? 'subtle' : 'ghost'}
              size="sm"
              onClick={() => {
                setEditorMode('preview');
                setPreviewMode('desktop');
              }}
              className="px-3 py-1 h-8"
            >
              Desktop
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (history.length > 0) {
                // Undo last action
              }
            }}
            disabled={history.length === 0}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Undo
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSave && onSave()}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
    )
  }
  
  // Main editor UI
  return (
    <div className={`bg-neutral-50 h-screen flex flex-col ${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {renderEditorHeader()}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Preview Canvas */}
        <div className={`flex-1 ${editorMode === 'preview' ? 'w-full' : ''}`}>
          <div 
            className={`overflow-hidden bg-neutral-100 rounded-lg border border-neutral-200 mx-auto
              ${previewMode === 'mobile' ? 'max-w-sm' : 'max-w-full'}`}
          >
            {/* Section preview */}
            <div
              ref={canvasRef}
              className="relative"
              style={{
                aspectRatio: '9/16', // Use fixed aspect ratio
                backgroundImage: selectedSectionObject?.imageUrl ? `url(${selectedSectionObject.imageUrl})` : undefined,
                backgroundColor: selectedSectionObject?.backgroundColor || '#f0f0f0',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Text overlays */}
              {selectedSectionObject.textOverlays.map((overlay) => {
                // Cast to extended overlay and provide default alignment
                const extOverlay = overlay as ExtendedTextOverlay;
                const alignment = extOverlay.alignment || 'center';
                
                // Determine position classes
                let positionClass = 'justify-center ';
                if (overlay.position === 'top') positionClass += 'items-start pt-8';
                else if (overlay.position === 'bottom') positionClass += 'items-end pb-8';
                else positionClass += 'items-center';
                
                // Determine style classes
                let styleClass = '';
                if (overlay.style === 'headline') styleClass = 'text-2xl font-bold';
                else if (overlay.style === 'caption') styleClass = 'text-base';
                else if (overlay.style === 'quote') styleClass = 'text-lg italic';
                
                // Determine text alignment
                let textAlignClass = 'text-center';
                if (alignment === 'left') textAlignClass = 'text-left';
                else if (alignment === 'right') textAlignClass = 'text-right';
                
                return (
                  <div
                    key={overlay.id}
                    className={`absolute inset-0 flex ${positionClass} pointer-events-none`}
                    style={{ zIndex: selectedOverlay === overlay.id ? 2 : 1 }}
                  >
                    <div 
                      className={`${styleClass} ${textAlignClass} px-6 max-w-[80%]`}
                      style={{ 
                        color: overlay.color || '#fff',
                        fontSize: overlay.fontSize ? `${overlay.fontSize}px` : undefined,
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                      }}
                    >
                      {overlay.text}
                    </div>
                    
                    {/* Edit controls - only show when not in preview and overlay is selected */}
                    {!previewMode && editorMode === 'edit' && selectedOverlay === overlay.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-auto"
                      >
                        <div className="bg-black bg-opacity-50 p-2 rounded-md flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-white"
                            onClick={() => onDeleteTextOverlay?.(selectedSectionObject.id, overlay.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-white"
                            onClick={() => setSelectedOverlay(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
              
              {/* Add overlay button */}
              {editorMode === 'edit' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute bottom-4 right-4 bg-white/80 hover:bg-white"
                  onClick={() => onAddTextOverlay?.(selectedSectionObject.id)}
                >
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Add Text
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Properties editor (slides in and out based on state) */}
        <AnimatePresence>
          {editorMode === 'edit' && selectedOverlay && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '300px', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border rounded-lg overflow-hidden"
            >
              <Tabs defaultValue="content" value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="w-full">
                  <TabsTrigger value="content" className="flex-1">Content</TabsTrigger>
                  <TabsTrigger value="style" className="flex-1">Style</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Text Content</label>
                    <textarea
                      value={getSelectedOverlayData()?.text || ''}
                      onChange={(e) => handleTextChange(e)}
                      className="w-full min-h-[100px] p-2 border border-neutral-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter your text here..."
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="text-alignment">Text Alignment</Label>
                    </div>
                    <Select 
                      value={getSelectedOverlayData()?.style?.textAlign || 'center'} 
                      onValueChange={(value) => handleAlignmentChange(value as 'left' | 'center' | 'right')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select alignment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="style" className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Text Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentStyle = getSelectedOverlayData()?.style || {};
                          const newStyle = typeof currentStyle === 'object' 
                            ? { ...currentStyle, fontWeight: 'bold' } 
                            : { fontWeight: 'bold' };
                          handleStyleChange(newStyle);
                        }}
                      >
                        Bold
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentStyle = getSelectedOverlayData()?.style || {};
                          const newStyle = typeof currentStyle === 'object' 
                            ? { ...currentStyle, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' } 
                            : { textShadow: '1px 1px 2px rgba(0,0,0,0.5)' };
                          handleStyleChange(newStyle);
                        }}
                      >
                        Shadow
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="text-color">Text Color</Label>
                    </div>
                    <Select 
                      value={getSelectedOverlayData()?.style?.color || '#FFFFFF'} 
                      onValueChange={(value) => {
                        const currentStyle = getSelectedOverlayData()?.style || {};
                        const newStyle = typeof currentStyle === 'object' 
                          ? { ...currentStyle, color: value } 
                          : { color: value };
                        handleStyleChange(newStyle);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="#FFFFFF">White</SelectItem>
                        <SelectItem value="#000000">Black</SelectItem>
                        <SelectItem value="#FF0000">Red</SelectItem>
                        <SelectItem value="#00FF00">Green</SelectItem>
                        <SelectItem value="#0000FF">Blue</SelectItem>
                        <SelectItem value="#FFFF00">Yellow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 