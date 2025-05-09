"use client";

/**
 * UI Compatibility Layer
 * 
 * This file provides simplified versions of UI components that might be causing issues
 * in the application. These are basic implementations that can be used as fallbacks
 * when the original components are not properly loading.
 */

import React, { forwardRef, ReactNode, useState, useEffect, useContext, useRef, createContext } from 'react';

// Basic utility for classnames
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

// ==================== BADGE ====================
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive";
}

export function Badge({ 
  className, 
  variant = "default", 
  ...props 
}: BadgeProps) {
  const variantStyles = {
    default: "bg-blue-100 text-blue-800 border-blue-200",
    secondary: "bg-gray-100 text-gray-800 border-gray-200",
    outline: "bg-transparent border-gray-200 text-gray-800",
    destructive: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", 
        variantStyles[variant],
        className
      )} 
      {...props} 
    />
  );
}

// ==================== BUTTON ====================
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
      outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      ghost: "text-gray-700 hover:bg-gray-100",
      link: "text-blue-600 underline-offset-4 hover:underline"
    };
    
    const sizeStyles = {
      default: "h-10 px-4 py-2",
      sm: "h-9 px-3 text-sm",
      lg: "h-11 px-8",
      icon: "h-10 w-10 p-2"
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
          "disabled:opacity-50 disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// ==================== CARD ====================
export const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm", className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      className={cn("p-6 pt-0", className)} 
      {...props} 
    />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

// ==================== LABEL ====================
export const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

// ==================== INPUT ====================
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400",
        "placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

// ==================== TEXTAREA ====================
export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400",
        "placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

// ==================== DIALOG (Simplified) ====================
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {children}
      </div>
    </div>
  );
}

export function DialogTrigger({ asChild, children, ...props }: { asChild?: boolean; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <>{children}</>;
}

export function DialogContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function DialogHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-xl font-semibold", className)} {...props}>
      {children}
    </h2>
  );
}

export function DialogDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-gray-500 mt-1", className)} {...props}>
      {children}
    </p>
  );
}

export function DialogFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex justify-end gap-2 mt-6", className)} {...props}>
      {children}
    </div>
  );
}

// ==================== TOOLTIP (Simplified) ====================
export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ asChild, children, ...props }: { asChild?: boolean; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <>{children}</>;
}

export function TooltipContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <></>;
}

// ==================== SELECT (Simplified) ====================
export function Select({
  value,
  onValueChange,
  children,
  ...props
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
} & Omit<React.HTMLAttributes<HTMLSelectElement>, 'onChange'>) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm appearance-none"
      {...props}
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
    </div>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span>{placeholder}</span>;
}

export function SelectContent({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function SelectItem({ value, children, ...props }: { value: string; children: ReactNode } & React.OptionHTMLAttributes<HTMLOptionElement>) {
  return <option value={value} {...props}>{children}</option>;
}

// ==================== SWITCH (Simplified) ====================
interface SwitchProps extends React.HTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ 
  checked = false, 
  onCheckedChange, 
  disabled = false, 
  className,
  ...props 
}: SwitchProps) {
  const [isChecked, setIsChecked] = React.useState(checked);
  
  React.useEffect(() => {
    setIsChecked(checked);
  }, [checked]);
  
  const handleClick = () => {
    if (disabled) return;
    
    const newValue = !isChecked;
    setIsChecked(newValue);
    onCheckedChange?.(newValue);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      data-state={isChecked ? "checked" : "unchecked"}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        isChecked ? "bg-blue-600" : "bg-gray-200",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span 
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
          isChecked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

// ==================== TABS ====================
interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

export const TabsContext = React.createContext<TabsContextValue>({
  value: "",
  onValueChange: () => {}
});

export function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("useTabsContext must be used within a Tabs provider");
  }
  return context;
}

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

export function Tabs({ defaultValue, value, onValueChange, children }: TabsProps) {
  const [tabValue, setTabValue] = useState(value || defaultValue || "");
  
  useEffect(() => {
    if (value !== undefined) {
      setTabValue(value);
    }
  }, [value]);
  
  const handleValueChange = (newValue: string) => {
    setTabValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };
  
  return (
    <TabsContext.Provider value={{ value: tabValue, onValueChange: handleValueChange }}>
      <div className="space-y-2">
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ 
  className, 
  children, 
  value, 
  ...props 
}: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabsContext();
  const isSelected = selectedValue === value;
  
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      data-state={isSelected ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ 
  className, 
  children, 
  value, 
  ...props 
}: TabsContentProps) {
  const { value: selectedValue } = useTabsContext();
  const isSelected = selectedValue === value;
  
  if (!isSelected) return null;
  
  return (
    <div
      role="tabpanel"
      data-state={isSelected ? "active" : "inactive"}
      className={cn(
        "mt-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ==================== SLIDER ====================
interface SliderProps {
  defaultValue?: number[];
  value?: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (values: number[]) => void;
  className?: string;
}

export function Slider({
  className,
  defaultValue = [0],
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  ...props
}: SliderProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'>) {
  const [values, setValues] = useState<number[]>(value || defaultValue);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (value !== undefined) {
      setValues(value);
    }
  }, [value]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const pos = ((event.clientX - rect.left) / rect.width);
    const newValue = min + pos * (max - min);
    const steppedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));
    
    const newValues = [clampedValue];
    setValues(newValues);
    onValueChange?.(newValues);
  };
  
  const percentage = ((values[0] - min) / (max - min)) * 100;
  
  return (
    <div
      ref={sliderRef}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      onPointerDown={handlePointerDown}
      {...props}
    >
      <div className="relative w-full h-2 rounded-full bg-gray-200">
        <div
          className="absolute h-full bg-blue-600 rounded-full"
          style={{ width: `${percentage}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-600 shadow cursor-pointer"
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
} 