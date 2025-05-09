"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Trash, 
  Pencil, 
  Plus, 
  Undo, 
  Save, 
  Eye, 
  EyeOff, 
  Laptop, 
  Smartphone, 
  Maximize, 
  Minimize, 
  Keyboard, 
  Sparkles,
  Music,
  Volume2,
  VolumeX,
  Move,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Type,
  Clock,
  ChevronDown,
  Settings,
  Monitor,
  Play,
  X,
  Wand2,
  CheckCircle,
  AlertCircle,
  Pause,
  TrendingUp,
  BarChart2,
  Crown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Template, TemplateSection, TextOverlay, TextOverlayPosition, TextOverlayStyle } from '@/lib/types/template'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useHotkeys } from 'react-hotkeys-hook'
import { cn } from '@/lib/design-utils'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import PropertyEditor from '@/components/editor/PropertyEditor'
import InlinePlayer from '@/components/audio/InlinePlayer'
import { useAudio } from '@/lib/contexts/AudioContext'
import { Sound } from '@/lib/types/audio'
import { Badge } from '@/components/ui/badge'
import { useSubscription } from '@/lib/contexts/SubscriptionContext'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import EditorSoundPanel from '@/components/audio/EditorSoundPanel'
import AudioButton from "@/components/audio/AudioButton"
import { useToast } from "@/components/ui/toast"

// Extended TextOverlay interface with alignment property
interface ExtendedTextOverlay extends TextOverlay {
  alignment?: 'left' | 'center' | 'right';
}

// Define TemplateEditor props interface
interface TemplateEditorProps {
  template: {
    id: string;
    name: string;
    description?: string;
    sections: TemplateSection[];
    soundId?: string;
    soundTitle?: string;
    soundAuthor?: string;
    soundUrl?: string;
    // Add other template properties as needed
  };
  selectedSectionId: string | null;
  onUpdateSection?: (sectionId: string, data: Partial<TemplateSection>) => void;
  onUpdateTextOverlay?: (sectionId: string, overlayId: string, data: Partial<TextOverlay>) => void;
  onAddTextOverlay?: (sectionId: string) => void;
  onDeleteTextOverlay?: (sectionId: string, overlayId: string) => void;
  onSave: (template: any) => void;
  onGenerateAI: (sectionId: string, prompt?: string) => void;
  isSaving: boolean;
  isGeneratingAI: boolean;
  className?: string;
}

interface EditorHeaderProps {
  previewMode: boolean;
  setPreviewMode: (mode: boolean) => void;
  previewDevice: 'mobile' | 'desktop';
  setPreviewDevice: (device: 'mobile' | 'desktop') => void;
  undoHistory: Array<{action: string; data: any}>;
  onUndo: () => void;
  onSave: () => void;
  isSaving: boolean;
  isGeneratingAI: boolean;
  fullScreen: boolean;
  setFullScreen: (fullScreen: boolean) => void;
  onGenerateAI: () => void;
}

// Enhanced EditorHeader component with improved UX and animations
const EditorHeader = ({
  previewMode,
  setPreviewMode,
  previewDevice,
  setPreviewDevice,
  undoHistory,
  onUndo,
  onSave,
  isSaving,
  isGeneratingAI,
  fullScreen,
  setFullScreen,
  onGenerateAI
}: EditorHeaderProps) => {
  // State for showing/hiding advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  // Handle save with confirmation animation
  const handleSave = () => {
    onSave();
    setShowSaveConfirmation(true);
    
    // Hide confirmation after 2 seconds
    setTimeout(() => {
      setShowSaveConfirmation(false);
    }, 2000);
  };
  
  // Easter egg - give tactile feedback for undo if supported
  const handleUndo = () => {
    if ('vibrate' in navigator && undoHistory.length) {
      navigator.vibrate(10);
    }
    onUndo();
  };
  
  return (
    <div className="relative">
      <motion.div 
        className="border-b bg-white/95 backdrop-blur-sm px-4 py-2 flex items-center justify-between flex-wrap gap-2 sticky top-0 z-10"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            whileTap={!prefersReducedMotion ? { scale: 0.95 } : undefined}
          >
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-gray-500 hover:text-gray-700 transition-colors",
                !undoHistory.length && "opacity-50 pointer-events-none"
              )}
              onClick={handleUndo}
              disabled={!undoHistory.length || isSaving}
            >
              <Undo className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline-block">Undo</span>
              {undoHistory.length > 0 && (
                <span className="ml-1 text-xs text-gray-400">({undoHistory.length})</span>
              )}
            </Button>
          </motion.div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center">
            <motion.div
              whileTap={!prefersReducedMotion ? { scale: 0.95 } : undefined}
            >
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 gap-1.5 transition-colors duration-200",
                  previewMode 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline-block">
                  {previewMode ? "Edit Mode" : "Preview"}
                </span>
              </Button>
            </motion.div>
            
            <AnimatePresence>
              {previewMode && (
                <motion.div 
                  className="ml-2 flex border rounded-md overflow-hidden shadow-sm"
                  initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                  animate={{ opacity: 1, width: 'auto', marginLeft: 8 }}
                  exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 rounded-none border-r",
                      previewDevice === 'mobile' 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'bg-white text-gray-600 hover:text-gray-900'
                    )}
                    onClick={() => setPreviewDevice('mobile')}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 rounded-none",
                      previewDevice === 'desktop' 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'bg-white text-gray-600 hover:text-gray-900'
                    )}
                    onClick={() => setPreviewDevice('desktop')}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <motion.div
            whileTap={!prefersReducedMotion ? { scale: 0.9 } : undefined}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              onClick={() => setFullScreen(!fullScreen)}
              aria-label={fullScreen ? "Exit full screen" : "Enter full screen"}
            >
              {fullScreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
          
          <motion.div
            whileTap={!prefersReducedMotion ? { scale: 0.95 } : undefined}
          >
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline-block">
                {showAdvanced ? "Less" : "More"}
              </span>
              <ChevronDown className={cn(
                "h-3 w-3 ml-1 transition-transform duration-200",
                showAdvanced && "transform rotate-180"
              )} />
            </Button>
          </motion.div>
        </div>
        
        <AnimatePresence>
          {showAdvanced && (
            <motion.div 
              className="flex items-center gap-2 w-full sm:w-auto"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0, overflow: 'hidden' }}
              transition={{ duration: 0.2 }}
            >
              {/* Advanced editor options with enhanced styling */}
              <Select defaultValue="high">
                <SelectTrigger className="h-8 text-xs w-[140px] bg-white border-gray-200">
                  <SelectValue placeholder="Quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Quality (Fast)</SelectItem>
                  <SelectItem value="medium">Medium Quality</SelectItem>
                  <SelectItem value="high">High Quality (Slow)</SelectItem>
                </SelectContent>
              </Select>
              
              <Input 
                type="text" 
                placeholder="Tags" 
                className="h-8 w-[150px] text-xs border-gray-200"
              />
              
              <Separator orientation="vertical" className="h-6" />
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex items-center gap-2 ml-auto">
          {onGenerateAI && (
            <motion.div 
              whileTap={!prefersReducedMotion ? { scale: 0.95 } : undefined}
              whileHover={!prefersReducedMotion ? { scale: 1.03 } : undefined}
            >
              <Button
                variant="outline"
                size="sm" 
                onClick={onGenerateAI}
                disabled={isGeneratingAI || isSaving}
                className={cn(
                  "h-8 gap-1.5 text-indigo-600 border-indigo-200 transition-all duration-200",
                  "hover:border-indigo-300 hover:bg-indigo-50 shadow-sm",
                  isGeneratingAI && "opacity-80"
                )}
              >
                <Wand2 className="h-4 w-4" />
                <span>{isGeneratingAI ? "Generating" : "Enhance with AI"}</span>
                {isGeneratingAI && (
                  <motion.span 
                    className="ml-1 h-3.5 w-3.5 rounded-full border-2 border-t-transparent border-indigo-600"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </Button>
            </motion.div>
          )}
          
          <motion.div 
            whileTap={!prefersReducedMotion ? { scale: 0.95 } : undefined}
            whileHover={!prefersReducedMotion ? { scale: 1.03 } : undefined}
          >
            <Button
              size="sm" 
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "h-8 gap-1.5 shadow-sm relative transition-all duration-200",
                isSaving && "opacity-80"
              )}
            >
              <AnimatePresence mode="wait">
                {isSaving ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.span 
                      className="h-3.5 w-3.5 rounded-full border-2 border-t-transparent border-current"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="normal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Save confirmation toast */}
      <AnimatePresence>
        {showSaveConfirmation && !isSaving && (
          <motion.div 
            className="absolute top-[calc(100%+8px)] right-4 bg-green-50 border border-green-200 text-green-700 rounded-md py-2 px-3 shadow-sm flex items-center gap-2 text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CheckCircle className="h-4 w-4 text-green-500" />
            Template saved successfully
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Define PreviewCanvas props interface
interface PreviewCanvasProps {
  selectedSection: TemplateSection;
  selectedOverlayId: string | null;
  previewDevice: 'mobile' | 'desktop';
  previewMode: boolean;
  handleOverlaySelect: (id: string) => void;
  onAddTextOverlay: (sectionId: string) => void;
  onDeleteTextOverlay: (sectionId: string, overlayId: string) => void;
  setShowPropertyEditor: (show: boolean) => void;
  setSelectedOverlayId: (id: string | null) => void;
  recordHistory: (action: string, data: any) => void;
}

// Preview Canvas
const PreviewCanvas = ({ 
  selectedSection, 
  selectedOverlayId, 
  previewDevice, 
  previewMode,
  handleOverlaySelect, 
  onAddTextOverlay, 
  onDeleteTextOverlay,
  setShowPropertyEditor,
  setSelectedOverlayId,
  recordHistory
}: PreviewCanvasProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringOverlay, setIsHoveringOverlay] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [overlayBeingDeleted, setOverlayBeingDeleted] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  
  // Reference to the canvas container
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Handle drag start on overlay
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    if (previewMode) return; // Don't allow drag in preview mode
    
    e.stopPropagation();
    setIsDragging(true);
    handleOverlaySelect(id);
    setSelectedOverlayId(id);
    setShowPropertyEditor(true);
    
    // Provide haptic feedback if supported
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
    
    const overlay = selectedSection.textOverlays.find(o => o.id === id);
    if (overlay) {
      e.dataTransfer.setData('text/plain', JSON.stringify({ id, position: overlay.position }));
    }
    
    // Set drag image to be transparent
    const dragImg = new Image();
    dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1px transparent GIF
    e.dataTransfer.setDragImage(dragImg, 0, 0);
  };
  
  // Handle drop event to reposition overlay
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { id } = data;
      
      // Calculate new position based on drop coordinates relative to canvas
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        const newPosition = `${Math.max(0, Math.min(95, x))}% ${Math.max(0, Math.min(95, y))}%`;
        
        // Record history before making changes
        const overlay = selectedSection.textOverlays.find(o => o.id === id);
        if (overlay) {
          recordHistory('move-overlay', { 
            sectionId: selectedSection.id, 
            overlayId: id, 
            oldPosition: overlay.position, 
            newPosition 
          });
        }
        
        // Update position directly in the current section
        // Note: The actual update to textOverlays should happen in the parent component
        // Here we just record the change for history
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };
  
  // Handle delete overlay with animation
  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOverlayBeingDeleted(id);
    
    // Provide haptic feedback for deletion
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 10, 40]);
    }
    
    // Short delay for animation before actual deletion
    setTimeout(() => {
      onDeleteTextOverlay(selectedSection.id, id);
      setOverlayBeingDeleted(null);
      
      // If we were deleting the selected overlay, clear selection
      if (selectedOverlayId === id) {
        setSelectedOverlayId(null);
        setShowPropertyEditor(false);
      }
    }, 300);
  };
  
  // Handle adding a new overlay with animation
  const handleAddOverlay = () => {
    // Provide feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
    
    onAddTextOverlay(selectedSection.id);
  };
  
  return (
    <div 
      className={cn(
        "relative mt-4 mx-auto bg-gray-900 overflow-hidden transition-all duration-300 flex items-center justify-center",
        previewDevice === 'mobile' ? "w-[375px] h-[667px] rounded-[32px]" : "w-full max-w-4xl h-[600px] rounded-lg",
        previewMode ? "shadow-2xl" : "shadow-md"
      )}
      ref={canvasRef}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Video or Image background */}
      <div className="absolute inset-0 bg-black">
        {selectedSection.videoUrl ? (
          <video 
            src={selectedSection.videoUrl} 
            className="w-full h-full object-cover"
            autoPlay 
            loop 
            muted 
          />
        ) : selectedSection.imageUrl ? (
          <img 
            src={selectedSection.imageUrl} 
            alt="Template background" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50">
            <p className="text-center">No media selected<br />Upload a video or image</p>
          </div>
        )}
      </div>
      
      {/* Text overlays with enhanced animations */}
      {selectedSection.textOverlays?.map((overlay) => {
        // Ensure position exists or use a default
        const position = overlay.position || '50% 50%';
        
        // Calculate default style values
        const isSelected = selectedOverlayId === overlay.id;
        const isBeingDeleted = overlayBeingDeleted === overlay.id;
        const isHovered = isHoveringOverlay === overlay.id;
        
        // Determine text style based on overlay style
        let fontSize = '18px';  // Default for subtitle
        let fontWeight = 'normal';
        let fontStyle = 'normal';
        
        if (overlay.style === 'headline') {
          fontSize = '32px';
          fontWeight = 'bold';
        } else if (overlay.style === 'caption') {
          fontSize = '24px';
        } else if (overlay.style === 'quote') {
          fontStyle = 'italic';
        }
        
        return (
          <motion.div
            key={overlay.id}
            className={cn(
              "absolute p-4 cursor-move transition-all",
              isSelected && !previewMode ? "ring-2 ring-primary ring-offset-2 ring-offset-black" : "",
              isBeingDeleted ? "scale-0 opacity-0" : "",
              !previewMode && "hover:ring-2 hover:ring-white/70"
            )}
            style={{ 
              top: 0, 
              left: 0, 
              transform: `translate(${position})`,
              maxWidth: '80%',
              fontSize: typeof overlay.fontSize === 'number' ? `${overlay.fontSize}px` : 
                overlay.style === 'headline' ? '32px' : 
                overlay.style === 'caption' ? '24px' : '16px',
              fontWeight: overlay.style === 'headline' ? 'bold' : 'normal',
              fontStyle: overlay.style === 'quote' ? 'italic' : 'normal',
              color: overlay.color || 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              textAlign: (overlay as ExtendedTextOverlay).alignment || 'center',
              padding: isSelected && !previewMode ? '1rem' : 'none',
              zIndex: isSelected ? 10 : 1,
            }}
            onClick={(e) => {
              if (!previewMode) {
                e.stopPropagation();
                handleOverlaySelect(overlay.id);
                setShowPropertyEditor(true);
              }
            }}
            onMouseEnter={() => setIsHoveringOverlay(overlay.id)}
            onMouseLeave={() => setIsHoveringOverlay(null)}
            initial={false}
            animate={{
              scale: isBeingDeleted ? 0 : isSelected && !previewMode ? 1.05 : 1,
              opacity: isBeingDeleted ? 0 : 1,
              boxShadow: isSelected && !previewMode ? '0 0 0 2px rgba(255,255,255,0.8)' : 'none',
              transition: { duration: 0.2 }
            }}
          >
            <div 
              className="h-full w-full"
              draggable={!previewMode}
              onDragStart={!previewMode ? (e) => handleDragStart(e, overlay.id) : undefined}
              onDragEnd={() => setIsDragging(false)}
            >
              <div className="relative">
                <p 
                  className={cn(
                    "select-none break-words transition-all duration-200",
                    isDragging && isSelected ? "opacity-50" : "opacity-100"
                  )}
                >
                  {overlay.text || 'Add text here'}
                </p>
                
                {isSelected && !previewMode && (
                  <motion.div 
                    className="absolute -top-10 right-0 flex gap-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white"
                      onClick={(e) => handleDeleteClick(e, overlay.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-full bg-white text-black border-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPropertyEditor(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
      
      {/* Add overlay button - visible only in edit mode */}
      {!previewMode && (
        <motion.button
          className="absolute bottom-4 right-4 bg-primary text-white rounded-full p-3 shadow-lg hover:bg-primary/90 transition-colors"
          onClick={handleAddOverlay}
          whileHover={!prefersReducedMotion ? { scale: 1.1 } : undefined}
          whileTap={!prefersReducedMotion ? { scale: 0.95 } : undefined}
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      )}
      
      {/* Preview mode indicator */}
      {previewMode && (
        <motion.div
          className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Eye className="h-3.5 w-3.5" />
          Preview Mode
        </motion.div>
      )}
      
      {/* Empty state guidance - show when no overlays */}
      {selectedSection.textOverlays?.length === 0 && !previewMode && (
        <motion.div 
          className="absolute inset-0 flex items-center justify-center text-white/80 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center bg-black/40 px-6 py-4 rounded-lg backdrop-blur-sm">
            <Plus className="h-8 w-8 mx-auto mb-2 opacity-60" />
            <p className="text-lg font-medium">Add Text Overlay</p>
            <p className="text-sm text-white/60 mt-1">
              Click the + button to add text to your template
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Add this new component for audio controls
interface AudioControlsProps {
  template: {
    id: string;
    name: string;
    soundId?: string;
    soundTitle?: string;
    soundAuthor?: string;
    soundUrl?: string;
  };
  isPremium?: boolean;
  onUpdateTemplate?: (updates: any) => void;
}

const AudioControls: React.FC<AudioControlsProps> = ({ 
  template, 
  isPremium = false,
  onUpdateTemplate
}) => {
  const { play, toggle, isPlaying, currentSound } = useAudio();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSoundBrowser, setShowSoundBrowser] = useState(false);
  const [predictedEngagement, setPredictedEngagement] = useState<number | null>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [showTrendingSounds, setShowTrendingSounds] = useState(false);
  const [trendingSoundSuggestions, setTrendingSoundSuggestions] = useState<Sound[]>([]);
  
  // Track if this template's sound is currently selected in the player
  const isCurrentSound = currentSound?.id === template.soundId;
  const soundActive = isCurrentSound && isPlaying;
  
  // If template has no sound info, show add sound UI
  const hasSound = template.soundId && template.soundUrl;

  // Fetch trending sounds when component mounts or when premium status changes
  useEffect(() => {
    const fetchTrendingSounds = async () => {
      try {
        // This would typically be an API call
        // For demo purposes, we'll use mock data
        const mockTrendingSounds: Sound[] = [
          {
            id: 'trending-1',
            title: 'Viral Beat 2023',
            artist: 'TrendMaker',
            url: 'https://example.com/sounds/viral-beat.mp3',
            duration: 28,
            metadata: {
              trend: 'rising',
              growth: 42,
              category: 'Music',
              predictedEngagement: 28
            }
          },
          {
            id: 'trending-2',
            title: 'Summer Lofi Groove',
            artist: 'ChillBeats',
            url: 'https://example.com/sounds/lofi-groove.mp3',
            duration: 32,
            metadata: {
              trend: 'stable',
              growth: 15,
              category: 'Music',
              predictedEngagement: 24
            }
          },
          {
            id: 'trending-3',
            title: 'Corporate Success',
            artist: 'BusinessAudio',
            url: 'https://example.com/sounds/corporate.mp3',
            duration: 22,
            metadata: {
              trend: 'rising',
              growth: 38,
              category: 'Business',
              predictedEngagement: 19
            }
          }
        ];
        
        setTrendingSoundSuggestions(mockTrendingSounds);
      } catch (error) {
        console.error('Error fetching trending sounds:', error);
      }
    };
    
    fetchTrendingSounds();
  }, [isPremium]);
  
  // Predict engagement for the current sound and template combination
  const predictEngagement = useCallback(async () => {
    if (!template.soundId || !template.soundUrl || !isPremium) return;
    
    try {
      setIsLoadingPrediction(true);
      
      // This would typically be an API call to a machine learning endpoint
      // For demo purposes, we'll simulate a response with a random value
      await new Promise(resolve => setTimeout(resolve, 1200));
      const randomPrediction = 18 + Math.floor(Math.random() * 14); // 18-32%
      
      setPredictedEngagement(randomPrediction);
    } catch (error) {
      console.error('Error predicting engagement:', error);
    } finally {
      setIsLoadingPrediction(false);
    }
  }, [template.soundId, template.soundUrl, isPremium]);
  
  // Run prediction when sound changes (if premium)
  useEffect(() => {
    if (hasSound && isPremium) {
      predictEngagement();
    } else {
      setPredictedEngagement(null);
    }
  }, [hasSound, isPremium, predictEngagement]);
  
  const handlePlaySound = () => {
    if (!template.soundId || !template.soundUrl) return;
    
    // Create a Sound object from template data
    const sound: Sound = {
      id: template.soundId,
      title: template.soundTitle || 'Template Sound',
      artist: template.soundAuthor || 'Unknown Artist',
      url: template.soundUrl,
      // Set a default duration if not available
      duration: 30
    };
    
    // Play the sound in the global audio player
    toggle(sound);
  };
  
  const handleSelectSound = (sound: Sound) => {
    if (!onUpdateTemplate) return;
    
    onUpdateTemplate({
      soundId: sound.id,
      soundTitle: sound.title,
      soundAuthor: sound.artist || sound.authorName,
      soundUrl: sound.url || sound.playUrl
    });
    
    setShowSoundBrowser(false);
    
    // If premium, show a success message
    if (isPremium) {
      toast({
        title: "Sound Selected",
        description: `Engagement prediction: ${sound.metadata?.predictedEngagement || '20'}% based on template content`,
        duration: 3000,
      });
    }
  };
  
  const handleRemoveSound = () => {
    if (!onUpdateTemplate) return;
    
    onUpdateTemplate({
      soundId: undefined,
      soundTitle: undefined,
      soundAuthor: undefined,
      soundUrl: undefined
    });
    
    setPredictedEngagement(null);
  };
  
  // Sound browser modal with premium features
  const renderSoundBrowser = () => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Select Sound for Template</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full" 
            onClick={() => setShowSoundBrowser(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {isPremium && (
          <div className="border-b">
            <Tabs defaultValue="trending">
              <div className="px-4 pt-2">
                <TabsList>
                  <TabsTrigger value="trending">Trending</TabsTrigger>
                  <TabsTrigger value="recommended">Recommended</TabsTrigger>
                  <TabsTrigger value="all">All Sounds</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="trending" className="px-4 py-2">
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Sounds trending on the platform right now</span>
                </div>
              </TabsContent>
              
              <TabsContent value="recommended" className="px-4 py-2">
                <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>AI-recommended sounds for this template</span>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isPremium ? (
              // Show trending sounds with engagement predictions for premium
              trendingSoundSuggestions.map((sound) => (
                <div 
                  key={sound.id} 
                  className="border rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => handleSelectSound(sound)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Music className="h-5 w-5 text-primary/80" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm truncate">{sound.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{sound.artist}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs mt-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1">
                      <TrendingUp className={`h-3.5 w-3.5 ${sound.metadata?.trend === 'rising' ? 'text-green-500' : 'text-blue-500'}`} />
                      <span>{sound.metadata?.growth || 0}% growth</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart2 className="h-3.5 w-3.5 text-primary" />
                      <span>{sound.metadata?.predictedEngagement || 20}% engagement</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Basic sound selection for free tier
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i} 
                  className="border rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => handleSelectSound({
                    id: `sample-sound-${i}`,
                    title: `Sample Sound ${i}`,
                    artist: 'Sample Artist',
                    url: 'https://example.com/sound.mp3',
                    duration: 30
                  })}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Music className="h-5 w-5 text-primary/80" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Sample Sound {i}</h4>
                      <p className="text-xs text-muted-foreground">Sample Artist</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {!isPremium && (
          <div className="border-t p-4 bg-amber-50/50">
            <div className="flex items-start gap-3">
              <Crown className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Upgrade to Premium</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Unlock AI-powered sound recommendations with engagement predictions
                </p>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                  <Crown className="h-3.5 w-3.5 mr-1.5" />
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
  // Empty state - no sound selected
  if (!hasSound) {
    return (
      <div className="bg-muted/30 border border-border rounded-md p-3 overflow-hidden">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Template Sound</h3>
          {isPremium && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs border-amber-200 ml-auto">
              <Crown className="h-3 w-3 mr-1 text-amber-500" />
              Premium
            </Badge>
          )}
        </div>
        <div className="mt-3 flex flex-col items-center justify-center py-3 px-4 border border-dashed rounded-md border-muted-foreground/20 bg-muted/20">
          <p className="text-sm text-muted-foreground mb-2">No sound selected for this template</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSoundBrowser(true)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Sound
          </Button>
          {showSoundBrowser && renderSoundBrowser()}
        </div>
        
        {isPremium && (
          <div className="mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span>Adding a trending sound can increase engagement by 15-35%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Premium features include engagement predictions</span>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Sound is selected
  return (
    <motion.div 
      className="bg-muted/30 border border-border rounded-md overflow-hidden"
      initial={{ height: 'auto' }}
      animate={{ height: isExpanded ? 'auto' : '56px' }}
      transition={{ duration: 0.3 }}
    >
      {/* Header - always visible */}
      <div 
        className="p-3 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-primary" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium truncate">{template.soundTitle || 'Template Sound'}</h3>
            {!isExpanded && (
              <p className="text-xs text-muted-foreground truncate">{template.soundAuthor || 'Unknown Artist'}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center">
          {isPremium && predictedEngagement && !isExpanded && (
            <div className="mr-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded flex items-center">
              <BarChart2 className="h-3 w-3 mr-0.5" />
              {predictedEngagement}%
            </div>
          )}
          
          <Button
            variant={soundActive ? "default" : "outline"}
            size="sm"
            className={`h-8 w-8 p-0 rounded-full ${soundActive ? 'bg-primary text-primary-foreground' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handlePlaySound();
            }}
          >
            {soundActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full ml-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>
      
      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-3 pb-3"
          >
            {template.soundUrl && (
              <InlinePlayer
                sound={{
                  id: template.soundId!,
                  title: template.soundTitle || 'Template Sound',
                  artist: template.soundAuthor,
                  url: template.soundUrl,
                  duration: 30
                }}
                size="sm"
                showTitle={true}
                showArtist={true}
                className="mb-3"
              />
            )}
            
            {isPremium && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Predicted Engagement</span>
                  {isLoadingPrediction ? (
                    <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
                  ) : (
                    <span className="font-medium text-green-600">{predictedEngagement}%</span>
                  )}
                </div>
                
                {predictedEngagement && (
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${predictedEngagement}%` }}
                    ></div>
                  </div>
                )}
                
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs p-0 h-auto mt-1 text-muted-foreground"
                  onClick={() => setShowTrendingSounds(!showTrendingSounds)}
                >
                  {showTrendingSounds ? 'Hide trending alternatives' : 'Show trending alternatives'}
                </Button>
                
                {showTrendingSounds && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-muted-foreground">Alternative sounds with higher engagement:</p>
                    {trendingSoundSuggestions.slice(0, 2).map((sound) => (
                      <div 
                        key={sound.id}
                        className="flex items-center justify-between text-xs p-1.5 border border-border/50 rounded hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleSelectSound(sound)}
                      >
                        <div className="flex items-center gap-2">
                          <Music className="h-3.5 w-3.5 text-primary" />
                          <span className="font-medium">{sound.title}</span>
                        </div>
                        <div className="bg-green-100 text-green-800 px-1.5 rounded">
                          {sound.metadata?.predictedEngagement || 20}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-between items-center mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSoundBrowser(true);
                }}
                className="gap-1.5"
              >
                <Music className="h-3.5 w-3.5" />
                Change Sound
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSound();
                }}
                className="hover:text-destructive gap-1.5"
              >
                <Trash className="h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {showSoundBrowser && renderSoundBrowser()}
    </motion.div>
  );
};

const TemplateEditor = ({ 
  template, 
  selectedSectionId, 
  onUpdateSection, 
  onUpdateTextOverlay, 
  onAddTextOverlay, 
  onDeleteTextOverlay,
  onSave, 
  onGenerateAI,
  isSaving,
  isGeneratingAI,
  className = ''
}: TemplateEditorProps) => {
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [showPropertyEditor, setShowPropertyEditor] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [fullScreen, setFullScreen] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showSoundPanel, setShowSoundPanel] = useState(false);
  
  // Undo/redo history management
  const [undoHistory, setUndoHistory] = useState<Array<{action: string; data: any}>>([]);
  const [redoHistory, setRedoHistory] = useState<Array<{action: string; data: any}>>([]);
  
  // Get subscription info to determine premium features
  const { canAccess, isPremium } = useSubscription();
  
  // Find the currently selected section
  const selectedSection = selectedSectionId 
    ? template.sections.find(section => section.id === selectedSectionId) 
    : null;
    
  // If selectedSectionId is provided but no matching section is found, show an error
  const sectionNotFound = selectedSectionId && !selectedSection;
  
  // Reset overlay selection when section changes
  useEffect(() => {
    setSelectedOverlayId(null);
    setShowPropertyEditor(true);
  }, [selectedSectionId]);
  
  // Record actions in history for undo/redo
  const recordHistory = (action: string, payload: any) => {
    setUndoHistory(prev => [...prev, { action, data: payload }]);
    // Clear redo history when a new action is performed
    setRedoHistory([]);
  };
  
  // Undo the last action
  const handleUndo = () => {
    if (undoHistory.length === 0) return;
    
    const lastAction = undoHistory[undoHistory.length - 1];
    setUndoHistory(prev => prev.slice(0, -1));
    setRedoHistory(prev => [...prev, lastAction]);
    
    // Process undo based on action type
    // This would actually revert the changes made
    console.log('Undo action:', lastAction);
  };
  
  // Redo the last undone action
  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    
    const nextAction = redoHistory[redoHistory.length - 1];
    setRedoHistory(prev => prev.slice(0, -1));
    setUndoHistory(prev => [...prev, nextAction]);
    
    // Process redo based on action type
    // This would actually apply the undone changes
    console.log('Redo action:', nextAction);
  };
  
  // Register keyboard shortcuts
  useHotkeys('mod+z', handleUndo, { enableOnFormTags: false });
  useHotkeys('mod+shift+z', handleRedo, { enableOnFormTags: false });
  useHotkeys('mod+s', () => onSave(template), { enableOnFormTags: false });
  
  // Handle window focus/blur events for handling unsaved changes warnings
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only prompt if there are unsaved changes
      if (undoHistory.length > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [undoHistory]);
  
  // Select a text overlay
  const handleOverlaySelect = (overlayId: string) => {
    setSelectedOverlayId(overlayId);
    setShowPropertyEditor(true);
    recordHistory('select_overlay', { id: overlayId, prevId: selectedOverlayId });
  };
  
  // Add a new text overlay
  const handleAddTextOverlay = (sectionId: string) => {
    if (onAddTextOverlay) {
      onAddTextOverlay(sectionId);
      recordHistory('add_overlay', { sectionId });
    }
  };
  
  // Delete a text overlay
  const handleDeleteTextOverlay = (sectionId: string, overlayId: string) => {
    if (onDeleteTextOverlay) {
      // Store the overlay data before deletion for undo
      const section = template.sections.find(s => s.id === sectionId);
      const overlay = section?.textOverlays.find(o => o.id === overlayId);
      
      onDeleteTextOverlay(sectionId, overlayId);
      
      if (overlay) {
        recordHistory('delete_overlay', { sectionId, overlayId, overlay });
      }
      
      // If we're deleting the selected overlay, clear selection
      if (selectedOverlayId === overlayId) {
        setSelectedOverlayId(null);
        setShowPropertyEditor(false);
      }
    }
  };
  
  // Handle text changes in modifiable overlays
  const handleModifiedTextChange = (id: string, text: string) => {
    if (selectedSection && onUpdateTextOverlay) {
      const overlay = selectedSection.textOverlays.find(o => o.id === id);
      if (overlay) {
        onUpdateTextOverlay(selectedSection.id, id, { text });
        recordHistory('update_text', { id, prevText: overlay.text, newText: text });
      }
    }
  };
  
  // Handle alignment changes in modifiable overlays
  const handleModifiedAlignmentChange = (id: string, alignment: 'left' | 'center' | 'right') => {
    if (selectedSection && onUpdateTextOverlay) {
      const overlay = selectedSection.textOverlays.find(o => o.id === id);
      if (overlay) {
        onUpdateTextOverlay(selectedSection.id, id, { alignment } as any);
        recordHistory('update_alignment', { id, prevAlignment: (overlay as any).alignment, newAlignment: alignment });
      }
    }
  };
  
  // Handle style changes in modifiable overlays
  const handleModifiedStyleChange = (id: string, property: string, value: string | number) => {
    if (selectedSection && onUpdateTextOverlay) {
      const overlay = selectedSection.textOverlays.find(o => o.id === id);
      if (overlay) {
        onUpdateTextOverlay(selectedSection.id, id, { [property]: value } as any);
        recordHistory('update_style', { id, property, prevValue: (overlay as any)[property], newValue: value });
      }
    }
  };
  
  // Handle AI generation for content
  const handleGenerateAI = () => {
    if (onGenerateAI && selectedSectionId) {
      onGenerateAI(selectedSectionId, 'Enhance this section');
    }
  };
  
  // Handle position changes in modifiable overlays
  const handleModifiedPositionChange = (id: string, position: string) => {
    if (selectedSection && onUpdateTextOverlay) {
      const overlay = selectedSection.textOverlays.find(o => o.id === id);
      if (overlay && ['top', 'middle', 'bottom'].includes(position)) {
        onUpdateTextOverlay(selectedSection.id, id, { position: position as TextOverlayPosition });
        recordHistory('update_position', { id, prevPosition: overlay.position, newPosition: position });
      }
    }
  };
  
  // Generic handler for overlay property changes
  const handleModifiedOverlayChange = (id: string, property: string, value: any) => {
    if (selectedSection && onUpdateTextOverlay) {
      const overlay = selectedSection.textOverlays.find(o => o.id === id);
      if (overlay) {
        onUpdateTextOverlay(selectedSection.id, id, { [property]: value } as any);
        recordHistory('update_property', { id, property, prevValue: (overlay as any)[property], newValue: value });
      }
    }
  };
  
  // Handle updates for template sound
  const handleUpdateTemplateSound = useCallback((updates: any) => {
    if (onUpdateSection && selectedSectionId) {
      onUpdateSection(selectedSectionId, updates);
      toast({
        title: "Sound updated",
        description: "Template sound has been updated successfully",
      });
    }
  }, [onUpdateSection, selectedSectionId]);
  
  // If section not found, show error
  if (sectionNotFound) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-medium">Section not found</h3>
          <p className="text-muted-foreground mt-2">The section you're trying to edit doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("template-editor h-full flex flex-col", className, fullScreen && "fixed inset-0 z-50 bg-white")}>
      <EditorHeader 
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        previewDevice={previewDevice}
        setPreviewDevice={setPreviewDevice}
        undoHistory={undoHistory}
        onUndo={handleUndo}
        onSave={() => onSave(template)}
        isSaving={isSaving}
        isGeneratingAI={isGeneratingAI}
        fullScreen={fullScreen}
        setFullScreen={setFullScreen}
        onGenerateAI={handleGenerateAI}
      />
      
      <div className="relative flex-1 overflow-hidden">
        {/* Main editor interface */}
        <div className="flex h-full">
          {/* Left toolbar */}
          <div className="w-12 bg-muted/20 border-r flex flex-col items-center py-4 space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={cn(
                    "rounded-md transition-colors",
                    !previewMode && "bg-primary/10 text-primary"
                  )}
                  onClick={() => setPreviewMode(false)}
                >
                  <Pencil className="h-5 w-5" />
                  <span className="sr-only">Edit Mode</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Mode</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={cn(
                    "rounded-md transition-colors",
                    previewMode && "bg-primary/10 text-primary"
                  )}
                  onClick={() => setPreviewMode(true)}
                >
                  <Eye className="h-5 w-5" />
                  <span className="sr-only">Preview Mode</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Preview Mode</TooltipContent>
            </Tooltip>
            
            <Separator className="w-8" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={cn(
                    "rounded-md transition-colors",
                    showPropertyEditor && "bg-primary/10 text-primary"
                  )}
                  onClick={() => setShowPropertyEditor(prev => !prev)}
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Properties Panel</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Properties Panel</TooltipContent>
            </Tooltip>
            
            {/* Sound button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={cn(
                    "rounded-md transition-colors",
                    showSoundPanel && "bg-primary/10 text-primary"
                  )}
                  onClick={() => setShowSoundPanel(prev => !prev)}
                >
                  <Music className="h-5 w-5" />
                  <span className="sr-only">Sound Panel</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sound Panel</TooltipContent>
            </Tooltip>
            
            <Separator className="w-8" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="rounded-md transition-colors"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI}
                >
                  <Sparkles className="h-5 w-5" />
                  <span className="sr-only">Generate with AI</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Generate with AI</TooltipContent>
            </Tooltip>
          </div>
          
          {/* Preview canvas */}
          <div className="flex-1 relative bg-black overflow-hidden">
            <PreviewCanvas 
              selectedSection={selectedSection}
              selectedOverlayId={selectedOverlayId}
              previewDevice={previewDevice}
              previewMode={previewMode}
              handleOverlaySelect={handleOverlaySelect}
              onAddTextOverlay={handleAddTextOverlay}
              onDeleteTextOverlay={handleDeleteTextOverlay}
              setShowPropertyEditor={setShowPropertyEditor}
              setSelectedOverlayId={setSelectedOverlayId}
              recordHistory={recordHistory}
            />
          </div>
          
          {/* Properties panel */}
          {showPropertyEditor && (
            <div className="w-72 border-l bg-white overflow-y-auto">
              <PropertyEditor
                selectedSection={selectedSection}
                selectedOverlayId={selectedOverlayId}
                onTextChange={handleModifiedTextChange}
                onAlignmentChange={handleModifiedAlignmentChange}
                onStyleChange={handleModifiedStyleChange}
                onPositionChange={handleModifiedPositionChange}
                onOverlayChange={handleModifiedOverlayChange}
              />
            </div>
          )}
          
          {/* Sound panel */}
          {showSoundPanel && (
            <div className="w-80 border-l bg-white overflow-y-auto">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center">
                    <Music className="h-5 w-5 mr-2 text-primary" />
                    Sound Controls
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setShowSoundPanel(false)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </div>
              <EditorSoundPanel
                templateId={template.id}
                mode="full"
                isPremium={isPremium}
                onUpgradeClick={() => window.location.href = '/pricing'}
              />
            </div>
          )}
        </div>
        
        {/* Timeline panel at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-white border-t flex items-center px-4">
          <AudioControls
            template={template}
            isPremium={isPremium}
            onUpdateTemplate={(updates) => {
              recordHistory('UPDATE_TEMPLATE', { previous: template, updates });
              onSave({ ...template, ...updates });
            }}
          />
        </div>
        
        {/* Floating audio button in the bottom right corner */}
        <AudioButton 
          position="bottom-right" 
          showTrendingBadge={isPremium}
          useCustomPanel={true}
          onCustomPanelToggle={() => setShowSoundPanel(prev => !prev)}
        />
      </div>
    </div>
  );
};

export default TemplateEditor 