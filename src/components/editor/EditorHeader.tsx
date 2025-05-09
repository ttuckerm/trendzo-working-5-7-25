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
  ArrowLeft,
  Pencil
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useTemplateIntegration } from '@/lib/hooks/useTemplateIntegration'

export interface Campaign {
  id: string
  name: string
  status: string
}

export interface EditorHeaderProps {
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
  
  const handleBackNavigation = () => {
    // If there are unsaved changes, confirm before navigating
    if (isChanged) {
      const confirmation = window.confirm(
        "You have unsaved changes. Are you sure you want to leave the editor?"
      )
      if (!confirmation) {
        return
      }
    }
    navigateToTemplateLibrary()
  }
  
  return (
    <div className="flex flex-col w-full z-20 shadow-sm">
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackNavigation}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Back to Library</span>
            </Button>
          )}
          
          <div className="flex items-center">
            {isEditingName ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSaveName()
                }}
                className="flex items-center"
              >
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="h-8 w-48 sm:w-64 text-sm font-medium"
                  autoFocus
                  onBlur={handleSaveName}
                />
              </form>
            ) : (
              <Button 
                variant="ghost" 
                className="font-medium px-2 hover:bg-gray-100 overflow-hidden overflow-ellipsis whitespace-nowrap max-w-[200px] sm:max-w-[300px]"
                onClick={() => setIsEditingName(true)}
              >
                <span>{name || "Untitled Template"}</span>
                <Pencil className="h-3.5 w-3.5 ml-2 text-gray-500" />
              </Button>
            )}
            
            {isChanged && !isEditingName && (
              <Badge variant="outline" className="ml-2 text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                {statusIcon}
                <span className="ml-1">{statusText}</span>
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1"
                  onClick={togglePreviewMode}
                >
                  {previewMode ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Preview</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{previewMode ? "Switch to edit mode" : "Preview template"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "gap-1",
              (saveStatus === 'saving' || !isChanged) && "opacity-50"
            )}
            onClick={onSave}
            disabled={saveStatus === 'saving' || !isChanged}
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          
          <Button
            size="sm"
            variant={isChanged ? "default" : "outline"}
            className="gap-1"
            onClick={onExport}
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => setShowPublishModal(true)}
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Publish</span>
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
} 