'use client'

import React, { useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

// Mirrors Admin GlobalHeader visual style, but uses the existing membership profile block
export default function MembershipGlobalHeader({ ProfileBlock }: { ProfileBlock: ReactNode }) {
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const getPageTitle = () => {
    if (pathname.startsWith('/membership/viral-recipe-book')) return 'Viral Recipe Book'
    if (pathname.startsWith('/membership/studio')) return 'The Studio'
    return 'Dashboard'
  }

  const pageTitle = getPageTitle()
  const isStudio = pageTitle === 'The Studio'

  return (
    <header
      className="global-header fixed top-0 left-[70px] right-0 h-16 flex items-center justify-between px-8 z-[90]"
      style={{
        background: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="header-left flex items-center gap-6">
        <h1
          className="page-title text-2xl font-black"
          style={isStudio ? {
            background: 'linear-gradient(135deg, #FF4757, #9B59B6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          } : undefined}
        >
          {pageTitle}
        </h1>
      </div>

      <div className="header-right flex items-center gap-6">
        <div className="global-search relative">
          <span className="search-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgba(255,255,255,0.4)] text-sm">🔍</span>
          <input
            type="text"
            className={`search-input text-white text-sm transition-all duration-300 py-2.5 pr-4 pl-10 focus:outline-none ${
              searchFocused ? 'w-[400px]' : 'w-[300px]'
            }`}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              background: 'rgba(255, 255, 255, 0.05)',
              border: searchFocused ? '1px solid rgba(155, 89, 182, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              boxShadow: searchFocused ? '0 0 20px rgba(155, 89, 182, 0.2)' : 'none',
            }}
            placeholder="Search videos, templates, analytics..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        {/* Existing membership user profile block injected here */}
        <div>{ProfileBlock}</div>
      </div>
    </header>
  )
}





