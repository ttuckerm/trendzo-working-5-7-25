"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutPanelLeft, 
  PanelRight, 
  Undo, 
  Redo, 
  Save, 
  ChevronLeft, 
  Play, 
  Pause,
  Smartphone,
  Monitor,
  Eye,
  EyeOff,
  Download,
  Upload,
  FileQuestion,
  Sparkles,
  Music,
  Loader2,
  Edit
} from 'lucide-react';
import { useTemplateEditor } from '@/lib/contexts/TemplateEditorContext';
import EditorCanvas from './EditorCanvas';
import PropertiesPanel from './panels/PropertiesPanel';
import TimelinesPanel from './panels/TimelinesPanel';
import ElementsPanel from './panels/ElementsPanel';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/debug/ErrorBoundary';
import { RenderCounter } from '@/components/debug/RenderCounter';
import { useTemplateSound } from '@/lib/hooks/useTemplateSound';
import SoundAnalyticsCard from '@/components/audio/SoundAnalyticsCard';
import EditorSoundPanel from '@/components/audio/EditorSoundPanel';
import { useRouter } from 'next/navigation';
import { Sound } from '@/lib/types/audio';
import { TemplateSound } from '@/lib/types/templateEditor.types';

/**
 * Main TemplateEditor component
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Controls appear contextually
 * - Emotional Design: Micro-interactions for every action
 * - Contextual Intelligence: UI adapts based on user behavior
 * - Progressive Disclosure: Complex options progressively revealed
 * - Sensory Harmony: Coordinated visual feedback
 */

// Add these properties to the component props
interface TemplateEditorProps {
  isEmbedded?: boolean;
  returnPath?: string;
  source?: string;
}

const TemplateEditorContent: React.FC<TemplateEditorProps> = ({ 
  isEmbedded = false, 
  returnPath = '/dashboard-view/template-library',
  source = 'dashboard'
}) => {
  const {
    state,
    dispatch,
    undo,
    redo,
    togglePlayback,
    canUndo,
    canRedo,
    trackInteraction,
    selectedSection,
    selectedElement
  } = useTemplateEditor();
  
  const router = useRouter();
  
  // Use useRef to persist panel state without causing re-renders
  const panelStateRef = useRef({
    leftPanelOpen: true,
    rightPanelOpen: true,
    timelinePanelOpen: true
  });
  
  // useState without initial re-render for panel states
  const [panelState, setPanelState] = useState(panelStateRef.current);
  
  // Optimized toggle functions that update ref and state together
  const toggleLeftPanel = useCallback(() => {
    const newState = !panelStateRef.current.leftPanelOpen;
    panelStateRef.current.leftPanelOpen = newState;
    setPanelState(prev => ({ ...prev, leftPanelOpen: newState }));
    trackInteraction('toggle', `panel:left:${newState ? 'open' : 'close'}`);
  }, [trackInteraction]);
  
  const toggleRightPanel = useCallback(() => {
    const newState = !panelStateRef.current.rightPanelOpen;
    panelStateRef.current.rightPanelOpen = newState;
    setPanelState(prev => ({ ...prev, rightPanelOpen: newState }));
    trackInteraction('toggle', `panel:right:${newState ? 'open' : 'close'}`);
  }, [trackInteraction]);
  
  const toggleTimelinePanel = useCallback(() => {
    const newState = !panelStateRef.current.timelinePanelOpen;
    panelStateRef.current.timelinePanelOpen = newState;
    setPanelState(prev => ({ ...prev, timelinePanelOpen: newState }));
    trackInteraction('toggle', `panel:timeline:${newState ? 'open' : 'close'}`);
  }, [trackInteraction]);
  
  // Optimized toggle functions
  const toggleEditMode = useCallback(() => {
    dispatch({
      type: 'SET_EDITOR_MODE',
      payload: state.ui.mode === 'edit' ? 'preview' : 'edit'
    });
    trackInteraction('mode', state.ui.mode === 'edit' ? 'preview' : 'edit');
    
    // Show toast with mode change
    toast(state.ui.mode === 'edit' ? 'Preview mode activated' : 'Edit mode activated', {
      position: 'bottom-center',
      icon: state.ui.mode === 'edit' ? '👁️' : '✏️',
      duration: 2000
    });
  }, [dispatch, state.ui.mode, trackInteraction]);
  
  // Toggle device view
  const toggleDeviceView = useCallback(() => {
    dispatch({
      type: 'SET_DEVICE_VIEW',
      payload: state.ui.device === 'mobile' ? 'desktop' : 'mobile'
    });
    trackInteraction('device', state.ui.device === 'mobile' ? 'desktop' : 'mobile');
  }, [dispatch, state.ui.device, trackInteraction]);
  
  // Save template with debounce to prevent excessive renders
  const saveTemplate = useCallback(() => {
    dispatch({ type: 'SET_SAVING', payload: true });
    trackInteraction('save', 'template');
    
    // Simulate saving delay
    setTimeout(() => {
      dispatch({ type: 'SET_SAVING', payload: false });
      toast.success('Template saved successfully', {
        position: 'bottom-center',
        icon: '💾',
        duration: 3000
      });
    }, 1000);
  }, [dispatch, trackInteraction]);
  
  // Export template with debounce
  const exportTemplate = useCallback(() => {
    dispatch({ type: 'SET_EXPORTING', payload: true });
    trackInteraction('export', 'template');
    
    // Simulate export delay
    setTimeout(() => {
      dispatch({ type: 'SET_EXPORTING', payload: false });
      toast.success('Template exported successfully', {
        position: 'bottom-center',
        icon: '📤',
        duration: 3000,
        description: 'Your template is ready to use in TikTok'
      });
    }, 2000);
  }, [dispatch, trackInteraction]);
  
  // Check if either panel should be auto-closed on narrow screens - optimized with ResizeObserver
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // On mobile, close both panels if both are open
        if (panelStateRef.current.leftPanelOpen && panelStateRef.current.rightPanelOpen) {
          panelStateRef.current.rightPanelOpen = false;
          setPanelState(prev => ({ ...prev, rightPanelOpen: false }));
        }
      }
    };
    
    // Use ResizeObserver instead of window event if available
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(document.body);
      return () => resizeObserver.disconnect();
    } else {
      // Fallback to window resize with throttling
      let timeoutId: NodeJS.Timeout | null = null;
      const throttledResize = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(handleResize, 200);
      };
      
      window.addEventListener('resize', throttledResize);
      handleResize(); // Initial check
      return () => {
        window.removeEventListener('resize', throttledResize);
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
  }, []); // Empty dependency array as we use refs for state
  
  // Progressive disclosure based on user expertise
  const showAdvancedOptions = state.ui.userExpertiseLevel !== 'beginner';
  
  // Timeline height based on open state - memoized to prevent recalculation
  const timelineHeight = useMemo(() => 
    panelState.timelinePanelOpen ? 'h-32' : 'h-10', 
    [panelState.timelinePanelOpen]
  );
  
  // Update sound state initialization with proper type handling
  const [currentSound, setCurrentSound] = useState<Sound | null>(() => {
    if (state.template.sound) {
      // Ensure all required fields are provided with fallbacks
      return {
        id: state.template.sound.id || 'default-id',
        title: state.template.sound.name || 'Template Sound',
        artist: state.template.sound.artist || 'Unknown Artist', // Non-optional in Sound type
        url: state.template.sound.url || '', 
        duration: state.template.sound.duration || 0
      };
    }
    return null;
  });
  
  // Add sound selection handler
  const handleSoundChange = (sound: Sound | null) => {
    // If read-only mode is enabled, don't allow changes
    if (state.ui.mode === 'preview') return;
    
    setCurrentSound(sound);
    
    // Update template data with sound info
    if (sound) {
      dispatch({
        type: 'UPDATE_TEMPLATE',
        payload: {
          ...state.template,
          sound: {
            id: sound.id,
            name: sound.title,
            artist: sound.artist,
            url: sound.url,
            duration: sound.duration
          } as TemplateSound
        }
      });
    } else {
      dispatch({
        type: 'UPDATE_TEMPLATE',
        payload: {
          ...state.template,
          sound: undefined
        }
      });
    }
  };
  
  return (
    <div className={`h-full w-full flex flex-col bg-gray-50 overflow-hidden ${isEmbedded ? 'embedded-editor' : ''}`}>
      {/* Render counter in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <RenderCounter componentName="TemplateEditor" />
      )}
    
      {/* Header toolbar - conditionally rendered if not embedded */}
      {!isEmbedded && (
        <header className="bg-white border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Use returnPath if provided, otherwise default to history.back()
                if (returnPath) {
                  router.push(returnPath);
                } else {
                  window.history.back();
                }
                trackInteraction('navigation', 'back');
              }}
              className="mr-2"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline-block">Back</span>
            </Button>
            
            <h1 className="text-lg font-medium truncate">
              {state.template.name || 'Untitled Template'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              {/* Undo/Redo */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={undo}
                    disabled={!canUndo}
                    className={cn(!canUndo && "opacity-50")}
                  >
                    <Undo className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Undo</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={redo}
                    disabled={!canRedo}
                    className={cn(!canRedo && "opacity-50")}
                  >
                    <Redo className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Redo</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleEditMode}
                  >
                    {state.ui.mode === 'edit' ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{state.ui.mode === 'edit' ? 'Preview Mode' : 'Edit Mode'}</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleDeviceView}
                  >
                    {state.ui.device === 'mobile' ? (
                      <Monitor className="w-4 h-4" />
                    ) : (
                      <Smartphone className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Device View</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Premium features - progressively disclosed based on expertise */}
              {showAdvancedOptions && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="icon"
                      disabled={true}
                      onClick={() => {}}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Premium feature: Get AI Suggestions (Coming Soon!)</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={saveTemplate}
                    disabled={state.ui.isSaving}
                  >
                    <Save className={cn("w-4 h-4", state.ui.isSaving && "animate-pulse")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save Template</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={exportTemplate}
                    disabled={state.ui.isExporting}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Download className={cn("w-4 h-4 mr-1", state.ui.isExporting && "animate-pulse")} />
                    <span>Export</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export for TikTok</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSoundChange(currentSound ? null : {
                      id: 'new-sound',
                      title: 'New Sound',
                      artist: 'Unknown Artist', // Non-optional in Sound type
                      url: '',
                      duration: 0
                    })}
                    className={currentSound ? 'bg-indigo-50 text-indigo-600' : ''}
                  >
                    <Music className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sound settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </header>
      )}
      
      {/* If embedded, add a title at the top */}
      {isEmbedded && (
        <div className="bg-white border-b px-4 py-3 flex items-center">
          <h1 className="text-lg font-medium truncate">
            {state.template.name || 'Untitled Template'}
          </h1>
        </div>
      )}
      
      {/* Main content area with left panel, canvas, and right panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLeftPanel}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border rounded-r-md border-l-0 p-1.5 h-auto"
        >
          <LayoutPanelLeft className="w-4 h-4" />
        </Button>
        
        {/* Left panel (Elements) */}
        <motion.div
          className="bg-white border-r w-64 overflow-y-auto"
          initial={{ x: panelState.leftPanelOpen ? 0 : -256 }}
          animate={{ x: panelState.leftPanelOpen ? 0 : -256 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ErrorBoundary componentName="ElementsPanel">
            <ElementsPanel />
          </ErrorBoundary>
        </motion.div>
        
        {/* Main editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 overflow-hidden">
            <ErrorBoundary componentName="EditorCanvas">
              <EditorCanvas />
            </ErrorBoundary>
          </div>
          
          {/* Timeline panel */}
          <motion.div
            className={cn(
              "bg-white border-t overflow-hidden transition-all",
              timelineHeight
            )}
            initial={{ height: panelState.timelinePanelOpen ? 128 : 40 }}
            animate={{ height: panelState.timelinePanelOpen ? 128 : 40 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Timeline header */}
            <div className="px-4 py-2 flex items-center justify-between border-b bg-gray-50">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTimelinePanel}
                  className="mr-2 h-6 w-6 p-0"
                >
                  {panelState.timelinePanelOpen ? (
                    <ChevronLeft className="w-4 h-4 transform rotate-90" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 transform -rotate-90" />
                  )}
                </Button>
                <h3 className="text-sm font-medium">Timeline</h3>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayback}
                  className="h-6 w-6 p-0"
                >
                  {state.ui.isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                
                <span className="text-sm text-gray-500">
                  {Math.floor(state.ui.currentTime)}s
                </span>
              </div>
            </div>
            
            {/* Timeline content - only show when open */}
            {panelState.timelinePanelOpen && (
              <div className="p-2 h-[calc(100%-40px)]">
                <ErrorBoundary componentName="TimelinePanel">
                  <TimelinesPanel />
                </ErrorBoundary>
              </div>
            )}
          </motion.div>
        </div>
        
        {/* Right panel (Properties) */}
        <motion.div
          className="bg-white border-l w-72 overflow-y-hidden"
          initial={{ x: panelState.rightPanelOpen ? 0 : 288 }}
          animate={{ x: panelState.rightPanelOpen ? 0 : 288 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Sound panel */}
          {currentSound && (
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Music className="w-5 h-5 mr-2 text-indigo-500" />
                Sound Settings
              </h3>
              
              {/* Sound Panel Component */}
              <EditorSoundPanel
                templateId={state.template.id || 'new-template'}
                mode="full"
                isPremium={true}
              />
              
              {/* Sound-Template Analytics Card (if a sound is selected) */}
              {currentSound && currentSound.id && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Sound Analytics</h4>
                  <SoundAnalyticsCard 
                    sound={currentSound}
                    size="sm"
                    title="Sound Performance"
                    description="Metrics for this sound"
                    trendPercentage={12.5}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Properties panel */}
          <ErrorBoundary componentName="PropertiesPanel">
            <PropertiesPanel />
          </ErrorBoundary>
        </motion.div>
        
        {/* Right panel toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleRightPanel}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border rounded-l-md border-r-0 p-1.5 h-auto"
        >
          <PanelRight className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Empty state overlay - shown when no section is selected */}
      {!selectedSection && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-8 max-w-lg text-center">
            <FileQuestion className="w-16 h-16 mx-auto text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Section Selected</h2>
            <p className="text-gray-600 mb-6">
              Please select a section from the timeline or create a new section to start editing your template.
            </p>
            <Button
              onClick={() => {
                // Create a default section
                dispatch({
                  type: 'ADD_SECTION',
                  payload: {
                    name: 'Intro',
                    type: 'intro',
                    startTime: 0,
                    duration: 3,
                    elements: [],
                    background: {
                      type: 'color',
                      value: '#000000',
                      opacity: 1
                    },
                    transition: {
                      type: 'fade',
                      duration: 0.5
                    }
                  }
                });
                trackInteraction('create', 'section:intro');
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Create New Section
            </Button>
          </div>
        </div>
      )}
      
      {/* Conditional footer if embedded */}
      {isEmbedded && (
        <div className="bg-white border-t p-3 flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              router.push(returnPath);
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Templates
          </Button>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={saveTemplate}
              disabled={state.ui.isSaving}
            >
              {state.ui.isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={toggleEditMode}
            >
              {state.ui.mode === 'edit' ? (
                <>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Add a fallback component in case the editor crashes
const EditorErrorFallback = () => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <FileQuestion className="w-16 h-16 mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Template Editor Error</h2>
        <p className="text-gray-600 mb-6">
          We encountered an issue with the template editor. This could be due to a complex template 
          or a temporary technical issue.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            Refresh Editor
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

// Wrap the main component with error boundary
const TemplateEditor: React.FC<TemplateEditorProps> = ({ 
  isEmbedded = false, 
  returnPath = '/dashboard-view/template-library',
  source = 'dashboard'
}) => {
  return (
    <ErrorBoundary 
      componentName="TemplateEditor"
      fallback={<EditorErrorFallback />}
    >
      <TemplateEditorContent 
        isEmbedded={isEmbedded}
        returnPath={returnPath}
        source={source}
      />
    </ErrorBoundary>
  );
};

export default TemplateEditor; 