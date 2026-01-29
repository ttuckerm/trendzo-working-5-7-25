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
      {/* Simple navigation back to admin */}
      <div className="absolute top-4 left-4 z-50">
        <a 
          href="/admin/viral-recipe-book" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 
                     rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20
                     text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Admin
        </a>
      </div>
      
      {/* Full-screen content */}
      {children}
    </div>
  )
}