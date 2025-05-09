// Adapted from shadcn/ui toast component: https://ui.shadcn.com/docs/components/toast

import { useState, useEffect, createElement } from "react"

export type ToastVariant = "default" | "destructive"

export interface ToastProps {
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = useState<
    Array<ToastProps & { id: number; visible: boolean }>
  >([])

  const toast = ({ title, description, variant = "default", duration = 3000 }: ToastProps) => {
    const id = toastCount++
    
    // Add the toast to the array
    setToasts((toasts) => [
      ...toasts,
      { id, title, description, variant, duration, visible: true }
    ])
    
    // Remove it after the duration
    setTimeout(() => {
      setToasts((toasts) =>
        toasts.map((t) => (t.id === id ? { ...t, visible: false } : t))
      )
      
      // Actually remove from state after animation
      setTimeout(() => {
        setToasts((toasts) => toasts.filter((t) => t.id !== id))
      }, 500)
    }, duration)
  }

  useEffect(() => {
    // Render toasts
    if (typeof document !== "undefined" && toasts.length > 0) {
      let toastContainer = document.getElementById("toast-container")
      
      if (!toastContainer) {
        toastContainer = document.createElement("div")
        toastContainer.id = "toast-container"
        toastContainer.className = "fixed top-4 right-4 z-50 flex flex-col gap-2"
        document.body.appendChild(toastContainer)
      }
      
      // Clear container and render toasts
      toastContainer.innerHTML = ""
      
      toasts.forEach((toast) => {
        const toastEl = document.createElement("div")
        toastEl.className = `
          p-4 rounded-lg shadow-md transition-all duration-300 
          ${toast.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} 
          ${toast.variant === "destructive" ? "bg-red-600 text-white" : "bg-white text-gray-900 border border-gray-200"}
        `
        
        if (toast.title) {
          const titleEl = document.createElement("div")
          titleEl.className = "font-medium text-sm"
          titleEl.textContent = toast.title
          toastEl.appendChild(titleEl)
        }
        
        if (toast.description) {
          const descEl = document.createElement("div")
          descEl.className = "text-xs mt-1"
          descEl.textContent = toast.description
          toastEl.appendChild(descEl)
        }
        
        toastContainer.appendChild(toastEl)
      })
    }
    
    // Cleanup
    return () => {
      if (typeof document !== "undefined") {
        const toastContainer = document.getElementById("toast-container")
        if (toastContainer && toasts.length === 0) {
          document.body.removeChild(toastContainer)
        }
      }
    }
  }, [toasts])

  return { toast }
} 