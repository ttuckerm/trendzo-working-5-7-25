'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface NavItem {
  id: string
  icon: string
  label: string
  path: string
}

const navItems: NavItem[] = [
  { id: 'studio', icon: '🎬', label: 'THE STUDIO', path: '/membership/studio' },
  { id: 'viral-recipe-book', icon: '📖', label: 'VIRAL RECIPE BOOK', path: '/membership/viral-recipe-book' }
]

export default function MemberNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path: string) => pathname.startsWith(path)

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <nav
      className="master-nav fixed left-0 top-0 h-screen w-[70px] hover:w-[260px] flex flex-col py-6 z-[200] transition-all duration-[400ms] cubic-bezier(0.25, 0.8, 0.25, 1) overflow-hidden group"
      style={{
        background: 'rgba(26, 26, 26, 0.9)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Logo Container */}
      <div className="logo-container px-6 mb-12 text-center">
        <div
          className="logo w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white cursor-pointer transition-all duration-300 hover:scale-105 mx-auto"
          style={{
            background: 'linear-gradient(135deg, #FF4757, #9B59B6)',
            boxShadow: '0 8px 24px rgba(255, 71, 87, 0.3)',
          }}
        >
          TZ
        </div>
      </div>

      {/* Navigation Items */}
      <div className="nav-items flex-1 flex flex-col gap-1 w-full">
        {navItems.map((item) => {
          const active = isActive(item.path)
          return (
            <div
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className="nav-item flex items-center px-6 py-[18px] cursor-pointer transition-all duration-300 relative overflow-hidden mb-1"
              style={{
                color: active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                background: active
                  ? 'linear-gradient(90deg, rgba(155, 89, 182, 0.15), transparent)'
                  : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.color = '#FFFFFF'
                  e.currentTarget.style.background = 'linear-gradient(90deg, rgba(155, 89, 182, 0.1), transparent)'
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {/* Active indicator - glowing vertical bar */}
              {active && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px]"
                  style={{
                    background: 'linear-gradient(180deg, #FF4757, #9B59B6)',
                    boxShadow: '0 0 12px rgba(155, 89, 182, 0.6)',
                  }}
                />
              )}
              <span className="nav-icon w-[22px] h-[22px] text-lg flex items-center justify-center mr-[18px] transition-transform duration-300 group-hover:scale-110">
                {item.icon}
              </span>
              <span className="nav-label opacity-0 transform -translate-x-[10px] transition-all duration-[400ms] font-semibold whitespace-nowrap text-[15px] group-hover:opacity-100 group-hover:translate-x-0">
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </nav>
  )
}





