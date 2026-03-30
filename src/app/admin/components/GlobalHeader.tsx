'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'

export default function GlobalHeader() {
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  // Get page title based on current path
  const getPageTitle = () => {
    switch (pathname) {
      case '/admin':
      case '/admin/command-center':
        return 'Command Center'
      case '/admin/studio':
        return 'The Studio'
      case '/admin/engine-room':
        return 'Engine Room'
      case '/admin/settings':
        return 'Settings'
      default:
        if (pathname.startsWith('/admin/studio')) return 'The Studio'
        if (pathname.startsWith('/admin/command-center')) return 'Command Center'
        if (pathname.startsWith('/admin/engine-room')) return 'Engine Room'
        if (pathname.startsWith('/admin/settings')) return 'Settings'
        return 'Admin Dashboard'
    }
  }

  return (
    <header className="global-header fixed top-0 left-[70px] right-0 h-16 bg-black/80 backdrop-blur-[20px] border-b border-white/[0.05] flex items-center justify-between px-8 z-[90]">
      {/* Header Left */}
      <div className="header-left flex items-center gap-6">
        <h1 className="page-title text-2xl font-bold">
          {getPageTitle()}
        </h1>
      </div>

      {/* Header Right */}
      <div className="header-right flex items-center gap-6">
        {/* Global Search */}
        <div className="global-search relative">
          <span className="search-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666] text-sm">
            🔍
          </span>
          <input
            type="text"
            className={`search-input bg-white/[0.05] border border-white/10 rounded-[20px] text-white text-sm transition-all duration-300 py-2 pr-4 pl-10 focus:outline-none focus:bg-white/[0.08] focus:border-[rgba(229,9,20,0.5)] ${
              searchFocused ? 'w-[400px]' : 'w-[300px]'
            }`}
            placeholder="Search videos, templates, analytics..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        {/* Notifications */}
        <div className="notifications relative cursor-pointer">
          <span className="text-lg">🔔</span>
          <span className="notification-dot absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#e50914] rounded-full animate-pulse"></span>
        </div>

        {/* User Profile */}
        <div className="user-profile flex items-center gap-3 cursor-pointer">
          <span className="text-sm font-medium">Admin User</span>
          <div className="user-avatar w-9 h-9 rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2]"></div>
        </div>
      </div>
    </header>
  )
} 