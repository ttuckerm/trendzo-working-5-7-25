"use client"

import * as React from "react"

interface DropdownMenuProps {
  children: React.ReactNode
}

const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

export function DropdownMenuTrigger({ 
  asChild = false, 
  children 
}: DropdownMenuTriggerProps) {
  const { open, setOpen } = React.useContext(DropdownMenuContext)
  
  return (
    <div onClick={() => setOpen(!open)} className="cursor-pointer">
      {children}
    </div>
  )
}

interface DropdownMenuContentProps {
  align?: "start" | "end" | "center"
  children: React.ReactNode
  className?: string
}

export function DropdownMenuContent({ 
  align = "center", 
  children,
  className,
}: DropdownMenuContentProps) {
  const { open } = React.useContext(DropdownMenuContext)
  
  if (!open) return null
  
  return (
    <div 
      className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-md ${
        align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0"
      } ${className || ""}`}
    >
      {children}
    </div>
  )
}

interface DropdownMenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean
}

export function DropdownMenuItem({
  className,
  inset,
  children,
  ...props
}: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownMenuContext)
  
  return (
    <button
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 ${
        inset ? "pl-8" : ""
      } ${className || ""}`}
      onClick={(e) => {
        props.onClick?.(e)
        setOpen(false)
      }}
      {...props}
    >
      {children}
    </button>
  )
} 