"use client"

import * as React from "react"

interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export function Popover({ 
  children, 
  open: controlledOpen, 
  onOpenChange 
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  
  const setOpen = React.useCallback((open: boolean) => {
    setUncontrolledOpen(open)
    onOpenChange?.(open)
  }, [onOpenChange])

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

interface PopoverTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

export function PopoverTrigger({ 
  asChild = false, 
  children 
}: PopoverTriggerProps) {
  const { open, setOpen } = React.useContext(PopoverContext)
  
  return (
    <div onClick={() => setOpen(!open)} className="inline-block cursor-pointer">
      {children}
    </div>
  )
}

interface PopoverContentProps {
  align?: "start" | "center" | "end"
  className?: string
  children: React.ReactNode
}

export function PopoverContent({ 
  align = "center", 
  className,
  children
}: PopoverContentProps) {
  const { open } = React.useContext(PopoverContext)
  
  if (!open) return null
  
  return (
    <div 
      className={`absolute z-50 w-72 rounded-md border bg-white p-4 shadow-md ${
        align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"
      } ${className || ""}`}
    >
      {children}
    </div>
  )
} 