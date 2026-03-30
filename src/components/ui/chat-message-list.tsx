"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ className, children, ...props }, ref) => {
    const scrollRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, [children])

    return (
      <div
        className={cn(
          "flex flex-col space-y-4 p-4 overflow-y-auto h-full",
          className
        )}
        ref={scrollRef}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ChatMessageList.displayName = "ChatMessageList"

export { ChatMessageList }