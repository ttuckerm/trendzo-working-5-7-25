import React from 'react'

interface ViralStudioLayoutProps {
  children: React.ReactNode
}

/**
 * Full-screen layout for Viral Studio workflow
 * Bypasses normal admin layout constraints to provide immersive experience
 */
export default function ViralStudioLayout({ children }: ViralStudioLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Full-screen content */}
      {children}
    </div>
  )
}