'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

interface NavItem {
  id: string
  icon: React.ReactNode
  label: string
  path: string
  featureFlag?: string
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    label: 'DASHBOARD',
    path: '/admin/dashboard',
  },
  {
    id: 'control-center',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M9 21V13h6v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'CONTROL CENTER',
    path: '/admin/control-center',
  },
  {
    id: 'studio',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="12" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8.5 6h7M7.2 8l3.5 8M16.8 8l-3.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    label: 'THE STUDIO',
    path: '/admin/studio',
  },
  {
    id: 'operations',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    label: 'OPERATIONS',
    path: '/admin/operations',
  },
  {
    id: 'canvas',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 3c2.5 0 4.5 4.03 4.5 9s-2 9-4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M19.5 15.5l2 2-4 1 1-4 1 1z" fill="currentColor"/>
      </svg>
    ),
    label: 'CANVAS',
    path: '/admin/canvas',
  },
  {
    id: 'hub',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    label: 'HUB',
    path: '/admin/hub',
  },
  {
    id: 'ecom',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M3 6h18" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'ECOM FORECAST',
    path: '/admin/ecom',
    featureFlag: 'NEXT_PUBLIC_FEATURE_ECOM_FORECAST',
  },
]

export default function MasterNavigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/admin/control-center' && pathname === '/admin') return true
    return pathname.startsWith(path)
  }

  return (
    <nav className="master-nav fixed left-0 top-0 h-screen w-[70px] hover:w-[260px] bg-gradient-to-b from-black/98 to-black/92 backdrop-blur-[30px] border-r border-white/[0.03] flex flex-col py-6 z-[200] transition-[width] duration-[400ms] ease-[cubic-bezier(0.25,0.8,0.25,1)] overflow-hidden group">
      {/* Logo Container */}
      <div className="logo-container px-6 mb-12 text-center">
        <div className="logo w-12 h-12 bg-gradient-to-br from-[#e50914] to-[#ff1744] rounded-xl flex items-center justify-center font-black text-xl text-white cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_24px_rgba(229,9,20,0.4)] mx-auto">
          TZ
        </div>
      </div>

      {/* Navigation Items — plain <a> tags bypass the Next.js router entirely.
          The router gets stuck after Studio's internal redirect to /admin/upload-test.
          Plain links guarantee the browser handles every navigation natively. */}
      <div className="nav-items flex-1 flex flex-col gap-1 w-full">
        {navItems.filter((item) => {
          if (!item.featureFlag) return true
          if (item.featureFlag === 'NEXT_PUBLIC_FEATURE_ECOM_FORECAST') {
            const v = (process.env.NEXT_PUBLIC_FEATURE_ECOM_FORECAST ?? '').toLowerCase()
            return ['1', 'true', 'yes', 'on'].includes(v)
          }
          return true
        }).map((item) => (
          <a
            key={item.id}
            href={item.path}
            className={`nav-item flex items-center px-6 py-[18px] text-white/50 cursor-pointer transition-colors duration-200 relative overflow-hidden mb-1 hover:text-white hover:bg-gradient-to-r hover:from-[rgba(229,9,20,0.15)] hover:to-transparent no-underline ${
              isActive(item.path) 
                ? 'text-white bg-gradient-to-r from-[rgba(229,9,20,0.15)] to-transparent before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-gradient-to-b before:from-[#e50914] before:to-[#ff1744] before:content-[""]' 
                : ''
            }`}
          >
            <span className="nav-icon w-[22px] h-[22px] flex items-center justify-center mr-[18px] flex-shrink-0">
              {item.icon}
            </span>
            <span className="nav-label opacity-0 transform -translate-x-[10px] transition-all duration-[400ms] font-semibold whitespace-nowrap text-[15px] group-hover:opacity-100 group-hover:translate-x-0">
              {item.label}
            </span>
          </a>
        ))}
      </div>
    </nav>
  )
}
