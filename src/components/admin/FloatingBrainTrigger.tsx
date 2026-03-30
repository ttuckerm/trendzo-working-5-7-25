"use client"

import { useGlobalBrain } from "@/contexts/GlobalBrainContext"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"

export function FloatingBrainTrigger() {
  const { isOpen, toggleChat } = useGlobalBrain()

  if (isOpen) return null

  return (
    <div className="fixed bottom-6 right-6 z-40 group">
      <Button
        onClick={toggleChat}
        size="lg"
        className="h-16 w-16 rounded-full shadow-lg transition-all duration-300 hover:scale-110 bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-xl flex items-center justify-center"
      >
        <MessageSquare className="h-8 w-8 text-white" />
      </Button>
    </div>
  )
}