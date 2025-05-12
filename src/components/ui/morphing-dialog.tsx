"use client"

import React, { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useAnimate, type Variants } from "framer-motion"

interface MorphingDialogProps {
  children: React.ReactNode
  transition?: any
}

interface MorphingDialogTriggerProps {
  children: React.ReactNode
}

interface MorphingDialogContainerProps {
  children: React.ReactNode
}

interface MorphingDialogContentProps {
  children: React.ReactNode
  className?: string
}

interface MorphingDialogCloseProps {
  children: React.ReactNode
  className?: string
  variants?: Variants
}

const MorphingDialogContext = React.createContext<{
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  triggerRect: DOMRect | null
  transition: any
}>({
  isOpen: false,
  setIsOpen: () => {},
  triggerRect: null,
  transition: {},
})

export function MorphingDialog({
  children,
  transition = { duration: 0.5, ease: "easeInOut" },
}: MorphingDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)

  return (
    <MorphingDialogContext.Provider
      value={{ isOpen, setIsOpen, triggerRect, transition }}
    >
      {children}
    </MorphingDialogContext.Provider>
  )
}

export function MorphingDialogTrigger({ children }: MorphingDialogTriggerProps) {
  const { setIsOpen, setTriggerRect } = React.useContext(MorphingDialogContext)
  const triggerRef = useRef<HTMLDivElement>(null)

  function handleClick() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setTriggerRect?.(rect)
      setIsOpen(true)
    }
  }

  return (
    <div ref={triggerRef} onClick={handleClick}>
      {children}
    </div>
  )
}

export function MorphingDialogContainer({ children }: MorphingDialogContainerProps) {
  const { isOpen, setIsOpen, triggerRect, transition } = React.useContext(
    MorphingDialogContext
  )
  const [scope, animate] = useAnimate()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      animate(
        "div",
        {
          opacity: 1,
        },
        { duration: 0.3, ease: "easeOut" }
      )
    }
  }, [isOpen, animate])

  if (!triggerRect) return null

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={scope}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/60 opacity-0"
          onClick={handleClose}
        >
          <div onClick={(e) => e.stopPropagation()}>{children}</div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function MorphingDialogContent({
  children,
  className = "",
}: MorphingDialogContentProps) {
  const { triggerRect, transition } = React.useContext(MorphingDialogContext)

  const getInitialStyles = (): any => {
    if (!triggerRect) return {}

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const scaleX = triggerRect.width / (viewportWidth * 0.85)
    const scaleY = triggerRect.height / (viewportHeight * 0.8)

    return {
      position: "fixed",
      top: `${triggerRect.top}px`,
      left: `${triggerRect.left}px`,
      width: `${triggerRect.width}px`,
      height: `${triggerRect.height}px`,
      scale: 1,
      transformOrigin: "center center",
    }
  }

  const getFinalStyles = (): any => {
    if (!triggerRect) return {}

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Calculate centered position
    const finalWidth = viewportWidth * 0.85
    const finalHeight = viewportHeight * 0.8
    const finalLeft = (viewportWidth - finalWidth) / 2
    const finalTop = (viewportHeight - finalHeight) / 2

    return {
      position: "fixed",
      top: `${finalTop}px`,
      left: `${finalLeft}px`,
      width: `${finalWidth}px`,
      height: `${finalHeight}px`,
      scale: 1,
    }
  }

  return (
    <motion.div
      className={className}
      initial={getInitialStyles()}
      animate={getFinalStyles()}
      exit={getInitialStyles()}
      transition={transition}
    >
      {children}
    </motion.div>
  )
}

export function MorphingDialogClose({
  children,
  className = "",
  variants,
}: MorphingDialogCloseProps) {
  const { setIsOpen } = React.useContext(MorphingDialogContext)

  return (
    <motion.button
      className={className}
      initial={variants?.initial}
      animate={variants?.animate}
      exit={variants?.exit}
      onClick={() => setIsOpen(false)}
    >
      {children}
    </motion.button>
  )
} 