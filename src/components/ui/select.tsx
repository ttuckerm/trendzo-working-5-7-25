"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

interface SelectContextValue {
  value: string;
  setValue: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue>({
  value: "",
  setValue: () => {},
  open: false,
  setOpen: () => {},
});

interface SelectProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}

export function Select({
  children,
  value: controlledValue,
  onValueChange,
  defaultValue = "",
}: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const [open, setOpen] = React.useState(false)

  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue

  const setValue = React.useCallback((newValue: string) => {
    setUncontrolledValue(newValue)
    onValueChange?.(newValue)
    setOpen(false) // Close dropdown when value is selected
  }, [onValueChange])

  // Close dropdown when clicking outside
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <SelectContext.Provider value={{ value, setValue, open, setOpen }}>
      <div ref={containerRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps {
  className?: string
  children?: React.ReactNode
}

export function SelectTrigger({ className, children }: SelectTriggerProps) {
  const { open, setOpen } = React.useContext(SelectContext)

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex h-9 w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}
    >
      {children}
      <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  )
}

interface SelectContentProps {
  children?: React.ReactNode
  className?: string
}

export function SelectContent({ children, className }: SelectContentProps) {
  const { open } = React.useContext(SelectContext)

  if (!open) return null

  return (
    <div className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-700 bg-zinc-800 p-1 text-base shadow-lg sm:text-sm ${className || ""}`}>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function SelectItem({ value, children, className }: SelectItemProps) {
  const { value: selectedValue, setValue } = React.useContext(SelectContext)
  const isSelected = selectedValue === value

  return (
    <div
      className={`relative flex cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none text-white hover:bg-zinc-700 ${
        isSelected ? "bg-zinc-700 font-medium" : ""
      } ${className || ""}`}
      onClick={() => setValue(value)}
    >
      {children}
    </div>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext)

  // We need to get the label from the selected item
  // For now, just show the value or placeholder
  return <span className="text-sm text-white truncate">{value || placeholder}</span>
}
