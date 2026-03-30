"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const expandableChatVariants = cva(
  "flex flex-col bg-background border rounded-lg shadow-lg",
  {
    variants: {
      size: {
        sm: "w-80 h-96",
        md: "w-96 h-[500px]",
        lg: "w-[400px] h-[600px]",
        full: "w-full h-full",
      },
      position: {
        "bottom-right": "fixed bottom-4 right-4",
        "bottom-left": "fixed bottom-4 left-4",
        "top-right": "fixed top-4 right-4",
        "top-left": "fixed top-4 left-4",
        custom: "",
      },
    },
    defaultVariants: {
      size: "md",
      position: "bottom-right",
    },
  }
)

interface ExpandableChatProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof expandableChatVariants> {
  icon?: React.ReactNode
}

const ExpandableChat = React.forwardRef<HTMLDivElement, ExpandableChatProps>(
  ({ className, size, position, icon, children, ...props }, ref) => (
    <div
      className={cn(expandableChatVariants({ size, position }), className)}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  )
)
ExpandableChat.displayName = "ExpandableChat"

interface ExpandableChatHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const ExpandableChatHeader = React.forwardRef<HTMLDivElement, ExpandableChatHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      className={cn(
        "flex items-center justify-between p-4 border-b bg-muted/50",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  )
)
ExpandableChatHeader.displayName = "ExpandableChatHeader"

interface ExpandableChatBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

const ExpandableChatBody = React.forwardRef<HTMLDivElement, ExpandableChatBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div
      className={cn("flex-1 overflow-hidden", className)}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  )
)
ExpandableChatBody.displayName = "ExpandableChatBody"

interface ExpandableChatFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const ExpandableChatFooter = React.forwardRef<HTMLDivElement, ExpandableChatFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      className={cn("border-t bg-background", className)}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  )
)
ExpandableChatFooter.displayName = "ExpandableChatFooter"

export {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
}