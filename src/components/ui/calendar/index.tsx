"use client"

import * as React from "react"
import { format } from "date-fns"

export interface CalendarProps {
  mode?: "single" | "range" | "multiple"
  selected?: Date | Date[] | undefined
  onSelect?: (date: Date | undefined) => void
  disabled?: boolean
  initialFocus?: boolean
  className?: string
}

export function Calendar({
  mode = "single",
  selected,
  onSelect,
  disabled = false,
  initialFocus = false,
  className,
}: CalendarProps) {
  // This is a simplified placeholder component
  // In a real implementation, this would be a full calendar
  
  // For single mode
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && onSelect) {
      onSelect(new Date(e.target.value));
    }
  };
  
  const dateValue = selected instanceof Date 
    ? format(selected, "yyyy-MM-dd") 
    : "";
  
  return (
    <div className={`calendar-wrapper ${className || ""}`}>
      <input
        type="date"
        value={dateValue}
        onChange={handleDateChange}
        disabled={disabled}
        className="p-2 border rounded-md w-full"
        autoFocus={initialFocus}
      />
      <div className="text-xs text-gray-500 mt-1">
        This is a simplified calendar for development.
      </div>
    </div>
  );
} 