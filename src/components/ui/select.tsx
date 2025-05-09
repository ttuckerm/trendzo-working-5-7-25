"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

interface SelectProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}

const SelectContext = React.createContext<{
  value: string;
  setValue: (value: string) => void;
}>({
  value: "",
  setValue: () => {},
});

export function Select({
  children,
  value: controlledValue,
  onValueChange,
  defaultValue = "",
}: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue
  
  const setValue = React.useCallback((newValue: string) => {
    setUncontrolledValue(newValue)
    onValueChange?.(newValue)
  }, [onValueChange])
  
  return (
    <SelectContext.Provider value={{ value, setValue }}>
      <div className="relative">
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
  const [open, setOpen] = React.useState(false)
  
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
      
      {open && <SelectDropdown />}
    </>
  )
}

function SelectDropdown() {
  const context = React.useContext(SelectContext)
  const [items, setItems] = React.useState<{ value: string; children: React.ReactNode }[]>([])
  
  // This is a simplified implementation
  // In a real component, we would use React.Children and clone elements with proper props
  
  React.useEffect(() => {
    const itemsFromDOM = document.querySelectorAll('[data-select-item]')
    const newItems = Array.from(itemsFromDOM).map(item => ({
      value: item.getAttribute('data-value') || '',
      children: item.textContent
    }))
    setItems(newItems)
  }, [])
  
  return (
    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white p-1 text-base shadow-lg sm:text-sm">
      <div className="space-y-1">
        {items.map((item, index) => (
          <div
            key={`${item.value}-${index}`}
            className={`relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none ${
              context.value === item.value ? "bg-gray-100 font-medium" : "hover:bg-gray-100"
            }`}
            onClick={() => context.setValue(item.value)}
          >
            {item.children}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext)
  const [label, setLabel] = React.useState("")
  
  React.useEffect(() => {
    // Find the label by looking up the value in the DOM
    const item = document.querySelector(`[data-value="${value}"]`)
    setLabel(item?.textContent || placeholder || "")
  }, [value, placeholder])
  
  return <span className="text-sm">{value ? label : placeholder}</span>
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
}

export function SelectItem({ value, children }: SelectItemProps) {
  return (
    <div data-select-item data-value={value}>
      {children}
    </div>
  )
}

export function SelectContent({ children }: { children?: React.ReactNode }) {
  return <div style={{ display: 'none' }}>{children}</div>
} 