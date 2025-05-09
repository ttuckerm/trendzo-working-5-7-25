"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Save, 
  Upload, 
  ExternalLink, 
  Clock, 
  CheckCircle,
  Settings,
  Eye,
  EyeOff,
  Undo,
  Redo,
  HelpCircle,
  Maximize2,
  Minimize2,
  Keyboard,
  Sparkles,
  ArrowLeft
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/design-utils'
import { useTemplateIntegration } from '@/lib/hooks/useTemplateIntegration'

interface Campaign {
  id: string
  name: string
  status: string
}

interface EditorHeaderProps {
  name: string
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error'
  isPublished: boolean
  publishing: boolean
  campaignMode: boolean
  campaign?: Campaign | null
  isChanged: boolean
  showPublishModal: boolean
  setShowPublishModal: (show: boolean) => void
  showExportModal: boolean
  setShowExportModal: (show: boolean) => void
  setCampaignMode: (mode: boolean) => void
  onNameChange?: (name: string) => void
  onSave?: () => void
  onPublish?: () => void
  onExport?: () => void
  // New props
  previewMode?: boolean
  togglePreviewMode?: () => void
  isFullscreen?: boolean
  toggleFullscreen?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  generateAI?: () => void
  isGeneratingAI?: boolean
  previewDevice: 'mobile' | 'desktop'
  setPreviewDevice: (device: 'mobile' | 'desktop') => void
  undoHistory: Array<{action: string; data: any}>
  showBackButton?: boolean
  hasPendingChanges?: boolean
}

export default function EditorHeader({
  name,
  saveStatus,
  isPublished,
  publishing,
  campaignMode,
  campaign,
  isChanged,
  showPublishModal,
  setShowPublishModal,
  showExportModal,
  setShowExportModal,
  setCampaignMode,
  onNameChange,
  onSave,
  onPublish,
  onExport,
  // New props with defaults
  previewMode = false,
  togglePreviewMode = () => {},
  isFullscreen = false,
  toggleFullscreen = () => {},
  canUndo = false,
  canRedo = false,
  onUndo = () => {},
  onRedo = () => {},
  generateAI = () => {},
  isGeneratingAI = false,
  previewDevice,
  setPreviewDevice,
  undoHistory,
  showBackButton = true,
  hasPendingChanges = false
}: EditorHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState(name)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [showAdvancedTools, setShowAdvancedTools] = useState(false)
  const { navigateToTemplateLibrary } = useTemplateIntegration()
  
  // Update tempName when name prop changes
  useEffect(() => {
    setTempName(name)
  }, [name])
  
  const handleSaveName = () => {
    if (onNameChange && tempName.trim() !== '') {
      onNameChange(tempName)
    } else {
      setTempName(name) // Reset to original if empty
    }
    setIsEditingName(false)
  }
  
  // Register keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if the user is typing in an input field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }

      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (onSave && isChanged && saveStatus !== 'saving') {
          onSave()
        }
      }
      
      // Ctrl/Cmd + Z to undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (onUndo && canUndo) {
          onUndo()
        }
      }
      
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y to redo
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault()
        if (onRedo && canRedo) {
          onRedo()
        }
      }
      
      // P to toggle preview mode
      if (e.key === 'p') {
        e.preventDefault()
        togglePreviewMode()
      }
      
      // F to toggle fullscreen
      if (e.key === 'f') {
        e.preventDefault()
        toggleFullscreen()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onSave, onUndo, onRedo, canUndo, canRedo, isChanged, saveStatus, togglePreviewMode, toggleFullscreen])
  
  // Save status text and color
  const getSaveStatusDetails = () => {
    switch (saveStatus) {
      case 'saved':
        return { text: 'Saved', icon: <CheckCircle className="h-4 w-4 text-green-500" /> }
      case 'saving':
        return { text: 'Saving...', icon: <Clock className="h-4 w-4 text-yellow-500 animate-pulse" /> }
      case 'error':
        return { text: 'Error saving', icon: <Clock className="h-4 w-4 text-red-500" /> }
      case 'unsaved':
        return { text: 'Unsaved changes', icon: <Clock className="h-4 w-4 text-yellow-500" /> }
      default:
        return { text: '', icon: null }
    }
  }
  
  const { text: statusText, icon: statusIcon } = getSaveStatusDetails()
  
  // Keyboard shortcuts reference
  const keyboardShortcuts = [
    { key: 'Ctrl/⌘ + S', desc: 'Save template' },
    { key: 'Ctrl/⌘ + Z', desc: 'Undo change' },
    { key: 'Ctrl/⌘ + Shift + Z', desc: 'Redo change' },
    { key: 'P', desc: 'Toggle preview mode' },
    { key: 'F', desc: 'Toggle fullscreen' },
    { key: 'Esc', desc: 'Exit edit mode / Close popups' },
  ]
  
  // Handle back navigation with unsaved changes warning
  const handleBackNavigation = () => {
    if (hasPendingChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigateToTemplateLibrary()
      }
    } else {
      navigateToTemplateLibrary()
    }
  }
  
  return (
    <motion.header 
      className="border-b px-4 py-3 bg-white sticky top-0 z-30"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Left side - Title and status badges */}
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 mr-2"
              onClick={handleBackNavigation}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline-block">Back</span>
            </Button>
          )}
          
          {isEditingName ? (
            <motion.div 
              className="flex items-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveName()
                  } else if (e.key === 'Escape') {
                    setTempName(name)
                    setIsEditingName(false)
                  }
                }}
                onBlur={handleSaveName}
                autoFocus
                className="w-60"
              />
            </motion.div>
          ) : (
            <motion.h1 
              className="text-xl font-semibold cursor-pointer hover:text-primary transition-colors group flex items-center"
              onClick={() => {
                setTempName(name)
                setIsEditingName(true)
              }}
              title="Click to edit name"
              whileHover={{ x: 2 }}
            >
              {name || "Untitled Template"}
              <motion.span 
                className="ml-2 opacity-0 group-hover:opacity-100 text-xs text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
              >
                Edit
              </motion.span>
            </motion.h1>
          )}
          
          <AnimatePresence>
            {isPublished && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Badge variant="outline" className="font-normal text-green-600 border-green-600 bg-green-50">
                  Published
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {campaignMode && campaign && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Badge variant="outline" className="font-normal">
                  Campaign: {campaign.name}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Center - Editing tools */}
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            {/* Undo Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="h-8 w-8 p-0"
                >
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex flex-col text-xs">
                  <span>Undo (Ctrl+Z)</span>
                </div>
              </TooltipContent>
            </Tooltip>
            
            {/* Redo Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="h-8 w-8 p-0"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex flex-col text-xs">
                  <span>Redo (Ctrl+Shift+Z)</span>
                </div>
              </TooltipContent>
            </Tooltip>
            
            <Separator orientation="vertical" className="mx-2 h-5" />
            
            {/* Preview Mode Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={previewMode ? "secondary" : "ghost"} 
                  size="sm"
                  onClick={togglePreviewMode}
                  className={cn(
                    "h-8 px-2 text-xs",
                    previewMode && "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:text-blue-800"
                  )}
                >
                  {previewMode ? (
                    <Eye className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 mr-1" />
                  )}
                  {previewMode ? "Exit Preview" : "Preview"}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex flex-col text-xs">
                  <span>Toggle preview mode (P)</span>
                </div>
              </TooltipContent>
            </Tooltip>
            
            {/* Fullscreen Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={toggleFullscreen}
                  className="h-8 w-8 p-0"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex flex-col text-xs">
                  <span>Toggle fullscreen (F)</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Right side - Actions and status */}
        <div className="flex items-center space-x-2">
          {/* Save status indicator with animation */}
          <AnimatePresence mode="wait">
            {statusText && (
              <motion.div 
                key={statusText}
                className="flex items-center text-sm mr-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                {statusIcon}
                <span className="ml-1">{statusText}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <TooltipProvider>
            {/* AI Generation Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={generateAI}
                  disabled={isGeneratingAI}
                  className={cn(
                    "h-8 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800",
                    isGeneratingAI && "opacity-70"
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Generate
                  {isGeneratingAI && (
                    <motion.div
                      className="ml-1 h-3 w-3 rounded-full border-2 border-t-transparent border-purple-700"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generate content with AI</p>
              </TooltipContent>
            </Tooltip>
          
            {/* Save button with animation */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button 
                    variant={isChanged ? "default" : "outline"}
                    size="sm"
                    onClick={onSave}
                    disabled={saveStatus === 'saved' || saveStatus === 'saving' || !isChanged}
                    className="h-8"
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Save
                    {saveStatus === 'saving' && (
                      <motion.div
                        className="ml-1 h-3 w-3 rounded-full border-2 border-t-transparent border-current"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col text-xs">
                  <span>Save your template (Ctrl+S)</span>
                  <span className="text-gray-500 text-[10px]">Last saved: {new Date().toLocaleTimeString()}</span>
                </div>
              </TooltipContent>
            </Tooltip>
            
            {/* Export button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowExportModal(true)}
                  className="h-8"
                >
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export template for use</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Publish button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isPublished ? "outline" : "default"}
                  size="sm"
                  onClick={() => setShowPublishModal(true)}
                  disabled={publishing}
                  className="h-8"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  {isPublished ? "Manage" : "Publish"}
                  {publishing && (
                    <motion.div
                      className="ml-1 h-3 w-3 rounded-full border-2 border-t-transparent border-current"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPublished ? "Manage publishing settings" : "Publish your template"}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Advanced tools popover */}
            <Popover open={showAdvancedTools} onOpenChange={setShowAdvancedTools}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={cn(
                    "h-8 w-8 transition-all",
                    showAdvancedTools && "bg-gray-100"
                  )}
                >
                  <Settings className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    showAdvancedTools && "rotate-90"
                  )} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="end">
                <div className="space-y-1">
                  <h3 className="font-medium text-sm">Advanced Tools</h3>
                  <Separator className="my-2" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start h-8 text-xs" 
                    onClick={() => setCampaignMode(!campaignMode)}
                  >
                    {campaignMode ? "Exit Campaign Mode" : "Enter Campaign Mode"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start h-8 text-xs"
                    onClick={() => setShowKeyboardShortcuts(true)}
                  >
                    <Keyboard className="h-3.5 w-3.5 mr-1.5" />
                    Keyboard Shortcuts
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start h-8 text-xs"
                  >
                    <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                    Help & Documentation
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Keyboard shortcuts dialog */}
      {showKeyboardShortcuts && (
        <motion.div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowKeyboardShortcuts(false)}
        >
          <motion.div 
            className="bg-white rounded-lg shadow-xl w-80 p-4"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Keyboard Shortcuts</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 rounded-full" 
                onClick={() => setShowKeyboardShortcuts(false)}
              >
                <span className="sr-only">Close</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {keyboardShortcuts.map((shortcut, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-sm">{shortcut.desc}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {shortcut.key}
                  </Badge>
                </div>
              ))}
            </div>
            <Button 
              className="w-full mt-4" 
              size="sm" 
              onClick={() => setShowKeyboardShortcuts(false)}
            >
              Close
            </Button>
          </motion.div>
        </motion.div>
      )}
    </motion.header>
  )
} 