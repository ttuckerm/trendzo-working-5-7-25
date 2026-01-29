"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const chatBubbleVariants = cva(
  "flex gap-2 max-w-[70%]",
  {
    variants: {
      variant: {
        received: "self-start",
        sent: "self-end flex-row-reverse",
      },
    },
    defaultVariants: {
      variant: "received",
    },
  }
)

const chatBubbleMessageVariants = cva(
  "rounded-lg px-3 py-2 text-sm break-words",
  {
    variants: {
      variant: {
        received: "bg-muted text-foreground",
        sent: "bg-primary text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "received",
    },
  }
)

interface ChatBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleVariants> {}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      className={cn(chatBubbleVariants({ variant }), className)}
      ref={ref}
      {...props}
    />
  )
)
ChatBubble.displayName = "ChatBubble"

interface ChatBubbleAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  fallback?: React.ReactNode
}

const ChatBubbleAvatar = React.forwardRef<HTMLDivElement, ChatBubbleAvatarProps>(
  ({ className, src, fallback, ...props }, ref) => (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted",
        className
      )}
      ref={ref}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div className="text-xs font-medium text-muted-foreground">
          {fallback}
        </div>
      )}
    </div>
  )
)
ChatBubbleAvatar.displayName = "ChatBubbleAvatar"

interface ChatBubbleMessageProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleMessageVariants> {
  isLoading?: boolean
}

const ChatBubbleMessage = React.forwardRef<HTMLDivElement, ChatBubbleMessageProps>(
  ({ className, variant, isLoading, children, ...props }, ref) => (
    <div
      className={cn(chatBubbleMessageVariants({ variant }), className)}
      ref={ref}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="h-1 w-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-1 w-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-1 w-1 bg-current rounded-full animate-bounce"></div>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  )
)
ChatBubbleMessage.displayName = "ChatBubbleMessage"

export { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage }