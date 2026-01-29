"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Copy, ArrowUp, ArrowDown, Edit, Pencil, ChevronRight, ChevronDown, Clock, Eye, EyeOff } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TemplateSection } from '@/lib/types/template'
import { cn } from '@/lib/utils'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'

interface TemplateSidebarProps {
  sections: TemplateSection[]
  selectedSectionId: string | null
  onSectionSelect: (section: TemplateSection) => void
  onAddSection: () => void
  onDeleteSection: (sectionId: string) => void
  onMoveSection?: (sectionId: string, direction: 'up' | 'down') => void
  onDuplicateSection?: (sectionId: string) => void
  onRenameSection?: (sectionId: string, newName: string) => void
  onUpdateSection?: (sectionId: string, data: { title?: string; duration?: number; isActive?: boolean }) => void
  className?: string
}

export default function TemplateSidebar({
  sections,
  selectedSectionId,
  onSectionSelect,
  onAddSection,
  onDeleteSection,
  onMoveSection,
  onDuplicateSection,
  onRenameSection,
  onUpdateSection,
  className = ''
}: TemplateSidebarProps) {
  const [renamingSectionId, setRenamingSectionId] = useState<string | null>(null)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [expandedSettings, setExpandedSettings] = useState<{[key: string]: boolean}>({})
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order)
  
  // Calculate total duration
  const totalDuration = sections.reduce((sum, section) => sum + section.duration, 0)
  
  // Focus input when renaming starts
  useEffect(() => {
    if (renamingSectionId && inputRef.current) {
      inputRef.current.focus()
    }
  }, [renamingSectionId])
  
  // Handler for starting the rename process
  const handleStartRenaming = (sectionId: string, currentTitle: string) => {
    setRenamingSectionId(sectionId)
    setNewSectionTitle(currentTitle)
  }
  
  // Handler for saving the renamed section
  const handleFinishRenaming = (sectionId: string) => {
    if (newSectionTitle.trim() && onRenameSection) {
      onRenameSection(sectionId, newSectionTitle.trim())
    }
    setRenamingSectionId(null)
    setNewSectionTitle('')
  }
  
  const handleKeyDown = (e: React.KeyboardEvent, sectionId: string) => {
    if (e.key === 'Enter') {
      handleFinishRenaming(sectionId)
    } else if (e.key === 'Escape') {
      setRenamingSectionId(null)
      setNewSectionTitle('')
    }
  }
  
  const toggleSectionSettings = (sectionId: string) => {
    setExpandedSettings(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }
  
  const handleToggleVisibility = (sectionId: string, isActive: boolean) => {
    if (onUpdateSection) {
      onUpdateSection(sectionId, { isActive })
    }
  }
  
  return (
    <div className={cn('flex flex-col h-full border-r', className)}>
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium">Sections</h2>
        <p className="text-sm text-muted-foreground">
          Total Duration: {totalDuration} seconds
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {sortedSections.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>No sections yet.</p>
              <p>Add a section to get started.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedSections.map((section, index) => (
                <ContextMenu key={section.id}>
                  <ContextMenuTrigger>
                    <div 
                      className={cn(
                        'group flex items-center justify-between p-2 rounded-md cursor-pointer',
                        selectedSectionId === section.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      )}
                      onClick={() => onSectionSelect(section)}
                    >
                      {renamingSectionId === section.id ? (
                        <div className="flex-1 pr-2">
                          <Input
                            ref={inputRef}
                            value={newSectionTitle}
                            onChange={(e) => setNewSectionTitle(e.target.value)}
                            onBlur={() => handleFinishRenaming(section.id)}
                            onKeyDown={(e) => handleKeyDown(e, section.id)}
                            autoFocus
                            className={cn(
                              'w-full p-1 text-sm rounded border',
                              selectedSectionId === section.id 
                                ? 'bg-primary-foreground text-primary border-primary-foreground/20' 
                                : 'bg-background border-input'
                            )}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-1 items-center overflow-hidden">
                          <span className="truncate">{section.name}</span>
                          <span className={cn(
                            'ml-2 text-xs rounded-full px-1.5 py-0.5',
                            selectedSectionId === section.id
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-muted-foreground/20 text-muted-foreground'
                          )}>
                            {section.duration}s
                          </span>
                        </div>
                      )}
                      
                      {!renamingSectionId && selectedSectionId === section.id && (
                        <div className={cn(
                          'flex items-center gap-1',
                          selectedSectionId === section.id
                            ? 'text-primary-foreground'
                            : 'text-muted-foreground'
                        )}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartRenaming(section.id, section.name)
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span className="sr-only">Rename</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </ContextMenuTrigger>
                  
                  <ContextMenuContent className="w-48">
                    {onMoveSection && section.order > 0 && (
                      <ContextMenuItem onClick={() => onMoveSection(section.id, 'up')}>
                        <ArrowUp className="mr-2 h-4 w-4" />
                        Move Up
                      </ContextMenuItem>
                    )}
                    
                    {onMoveSection && section.order < sections.length - 1 && (
                      <ContextMenuItem onClick={() => onMoveSection(section.id, 'down')}>
                        <ArrowDown className="mr-2 h-4 w-4" />
                        Move Down
                      </ContextMenuItem>
                    )}
                    
                    {onDuplicateSection && (
                      <ContextMenuItem onClick={() => onDuplicateSection(section.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </ContextMenuItem>
                    )}
                    
                    {onRenameSection && (
                      <ContextMenuItem onClick={() => handleStartRenaming(section.id, section.name)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Rename
                      </ContextMenuItem>
                    )}
                    
                    <ContextMenuItem 
                      onClick={() => onDeleteSection(section.id)}
                      className="text-red-600 focus:text-red-600 focus:bg-red-100"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <Button 
          onClick={onAddSection}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </div>
    </div>
  )
} 