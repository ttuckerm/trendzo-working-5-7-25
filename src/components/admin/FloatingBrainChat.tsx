"use client"

import { useState, FormEvent, useEffect } from "react"
import { Send, Bot, Paperclip, Mic, CornerDownLeft, X, Brain, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble"
import { ChatInput } from "@/components/ui/chat-input"
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from "@/components/ui/expandable-chat"
import { ChatMessageList } from "@/components/ui/chat-message-list"
import { useGlobalBrain } from "@/contexts/GlobalBrainContext"
import { ScreenContextService } from "@/lib/services/ScreenContextService"

export function FloatingBrainChat() {
  const {
    messages,
    isLoading,
    error,
    isOpen,
    currentContext,
    sendMessage,
    clearMessages,
    closeChat,
    updateScreenContext
  } = useGlobalBrain()

  const [input, setInput] = useState("")
  const [isMaximized, setIsMaximized] = useState(false)

  // Initialize screen context service
  useEffect(() => {
    const contextService = ScreenContextService.getInstance()
    
    // Start auto-capturing screen context
    contextService.startAutoCapture()
    
    // Subscribe to context changes
    const unsubscribe = contextService.subscribe((context) => {
      updateScreenContext({
        route: context.route,
        pageName: context.pageName,
        visibleData: context.visibleData,
        activeElements: context.activeElements
      })
    })

    return unsubscribe
  }, [updateScreenContext])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    sendMessage(input)
    setInput("")
  }

  const handleAttachFile = () => {
    // Future: implement file attachment
    console.log("File attachment not yet implemented")
  }

  const handleMicrophoneClick = () => {
    // Future: implement voice input
    console.log("Voice input not yet implemented")
  }

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized)
  }

  if (!isOpen) return null

  return (
    <div className={`fixed z-50 transition-all duration-300 ${
      isMaximized 
        ? 'inset-4 max-w-none max-h-none' 
        : 'bottom-4 right-4 w-96 h-[600px]'
    }`}>
      <ExpandableChat
        size={isMaximized ? "full" : "lg"}
        position="custom"
        icon={<Brain className="h-6 w-6" />}
        className="h-full w-full shadow-2xl border-2 border-blue-200"
      >
        <ExpandableChatHeader className="flex justify-between items-center px-4 py-3 bg-gray-100 text-gray-800 border-b">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold">AI Brain ✨</h1>
              <p className="text-xs text-gray-500">
                {currentContext ? `On: ${currentContext.pageName}` : 'Ready to assist'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMaximize}
              className="text-gray-600 hover:bg-gray-200"
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeChat}
              className="text-gray-600 hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </ExpandableChatHeader>

        <ExpandableChatBody className="flex-1 overflow-hidden">
          <ChatMessageList className="h-full">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <Brain className="h-12 w-12 text-blue-400 mb-4" />
                <p className="text-center text-sm">
                  I'm your AI Brain assistant. I can see what's on your screen and help with:
                </p>
                <ul className="text-xs mt-2 space-y-1 text-gray-400">
                  <li>• Pipeline operations</li>
                  <li>• Data analysis</li>
                  <li>• System management</li>
                  <li>• Context-aware assistance</li>
                </ul>
              </div>
            ) : (
              messages.map((message, index) => (
                <ChatBubble
                  key={`${message.role}-${index}`}
                  variant={message.role === "user" ? "sent" : "received"}
                >
                  <ChatBubbleAvatar
                    className="h-8 w-8 shrink-0"
                    src={
                      message.role === "user"
                        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&crop=faces&fit=crop"
                        : undefined
                    }
                    fallback={message.role === "user" ? "U" : <Brain className="h-4 w-4" />}
                  />
                  <ChatBubbleMessage
                    variant={message.role === "user" ? "sent" : "received"}
                  >
                    {message.text}
                    <div className="text-xs opacity-60 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </ChatBubbleMessage>
                </ChatBubble>
              ))
            )}

            {isLoading && (
              <ChatBubble variant="received">
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0"
                  fallback={<Brain className="h-4 w-4" />}
                />
                <ChatBubbleMessage isLoading />
              </ChatBubble>
            )}

            {error && (
              <ChatBubble variant="received">
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0"
                  fallback={<Brain className="h-4 w-4" />}
                />
                <ChatBubbleMessage variant="received">
                  <div className="text-red-600">
                    Error: {error}
                  </div>
                </ChatBubbleMessage>
              </ChatBubble>
            )}
          </ChatMessageList>
        </ExpandableChatBody>

        <ExpandableChatFooter className="p-3 border-t">
          <form
            onSubmit={handleSubmit}
            className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
          >
            <ChatInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about what you see or type a command..."
              className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
            />
            <div className="flex items-center p-3 pt-0 justify-between">
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={handleAttachFile}
                  disabled
                  title="File attachment (coming soon)"
                >
                  <Paperclip className="size-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={handleMicrophoneClick}
                  disabled
                  title="Voice input (coming soon)"
                >
                  <Mic className="size-4" />
                </Button>

                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={clearMessages}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <Button 
                type="submit" 
                size="sm" 
                className="ml-auto gap-1.5"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? "Thinking..." : "Send"}
                <CornerDownLeft className="size-3.5" />
              </Button>
            </div>
          </form>
        </ExpandableChatFooter>
      </ExpandableChat>
    </div>
  )
}