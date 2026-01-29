'use client'

import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface NavItem {
  id: string
  icon: string
  label: string
  path: string
}

const navItems: NavItem[] = [
  { id: 'control-center', icon: '🎛️', label: 'CONTROL CENTER', path: '/admin/control-center' },
  { id: 'calibration', icon: '🔬', label: 'CALIBRATION LAB', path: '/admin/calibration' },
  { id: 'command-center', icon: '🎯', label: 'COMMAND CENTER', path: '/admin/command-center' },
  { id: 'studio', icon: '🎬', label: 'THE STUDIO', path: '/admin/studio' },
  { id: 'engine-room', icon: '⚙️', label: 'ENGINE ROOM', path: '/admin/engine-room' },
  { id: 'training-data', icon: '🧬', label: 'TRAINING DATA', path: '/admin/training-data' },
  { id: 'viral-recipe-book', icon: '📖', label: 'VIRAL RECIPE BOOK', path: '/admin/viral-recipe-book' },
  { id: 'settings', icon: '🔧', label: 'SETTINGS', path: '/admin/settings' },
  { id: 'poc-checklist', icon: '✅', label: 'POC CHECKLIST', path: '/admin/poc-checklist' },
  { id: 'integration-json', icon: '📡', label: 'INTEGRATION JSON', path: '/api/admin/integration/status' }
]

export default function MasterNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path: string) => {
    if (path === '/admin/command-center' && pathname === '/admin') return true
    // When in Operations Center, highlight Engine Room (parent context)
    if (path === '/admin/engine-room' && pathname.startsWith('/admin/operations-center')) return true
    return pathname.startsWith(path)
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <nav className="master-nav fixed left-0 top-0 h-screen w-[70px] hover:w-[260px] bg-gradient-to-b from-black/98 to-black/92 backdrop-blur-[30px] border-r border-white/[0.03] flex flex-col py-6 z-[200] transition-all duration-[400ms] cubic-bezier(0.25, 0.8, 0.25, 1) overflow-hidden group">
      {/* Logo Container */}
      <div className="logo-container px-6 mb-12 text-center">
        <div className="logo w-12 h-12 bg-gradient-to-br from-[#e50914] to-[#ff1744] rounded-xl flex items-center justify-center font-black text-xl text-white cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_24px_rgba(229,9,20,0.4)] mx-auto">
          TZ
        </div>
      </div>

      {/* Navigation Items */}
      <div className="nav-items flex-1 flex flex-col gap-1 w-full">
        {navItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            className={`nav-item flex items-center px-6 py-[18px] text-[#666] cursor-pointer transition-all duration-300 relative overflow-hidden mb-1 hover:text-white hover:bg-gradient-to-r hover:from-[rgba(229,9,20,0.15)] hover:to-transparent ${
              isActive(item.path) 
                ? 'text-white bg-gradient-to-r from-[rgba(229,9,20,0.15)] to-transparent before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-gradient-to-b before:from-[#e50914] before:to-[#ff1744] before:content-[""]' 
                : ''
            }`}
          >
            <span className="nav-icon w-[22px] h-[22px] text-lg flex items-center justify-center mr-[18px] transition-transform duration-300 group-hover:scale-110">
              {item.icon}
            </span>
            <span className="nav-label opacity-0 transform -translate-x-[10px] transition-all duration-[400ms] font-semibold whitespace-nowrap text-[15px] group-hover:opacity-100 group-hover:translate-x-0">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </nav>
  )
} 