"use client"

import { Brain, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGlobalBrain } from "@/contexts/GlobalBrainContext"

export function BrainQuickAccess() {
  const { openChat, messages } = useGlobalBrain()

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Floating AI Brain</h3>
            <p className="text-sm text-gray-600">
              Access your AI assistant from anywhere in the admin panel
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {messages.length > 0 && (
            <div className="text-xs text-gray-500">
              {messages.length} message{messages.length !== 1 ? 's' : ''} in chat
            </div>
          )}
          <Button onClick={openChat} className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Open Floating Chat</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        <p>
          💡 The floating brain maintains conversation history across all admin pages 
          and understands what you're currently viewing for contextual assistance.
        </p>
      </div>
    </div>
  )
}