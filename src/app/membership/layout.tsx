"use client"

import React, { useState } from 'react'
import type { ReactNode } from 'react'
import MemberNavigation from './components/MemberNavigation'
import MembershipGlobalHeader from './components/MembershipGlobalHeader'
import MembershipUserProfileBlock from './components/MembershipUserProfileBlock'
import { ThemeProvider } from '@/contexts/ThemeContext'

export default function MembershipLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isEnabled = process.env.NEXT_PUBLIC_MEMBER_UI_ADMIN_PARITY !== 'false'

  return (
    <ThemeProvider>
      <div
        className="app-container flex h-screen text-white overflow-hidden relative"
        style={{
          background: `
            radial-gradient(ellipse at 20% 0%, rgba(155, 89, 182, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, rgba(0, 217, 255, 0.06) 0%, transparent 50%),
            #0a0a0a
          `,
        }}
      >
        {/* Chrome decorative orbs for ambient glass effect */}
        <div
          className="fixed top-20 right-20 w-32 h-32 rounded-full opacity-20 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, #E8E8E8 0%, #A0A0A0 50%, #C8C8C8 100%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="fixed bottom-32 left-10 w-24 h-24 rounded-full opacity-15 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, #9B59B6 0%, #6C3483 100%)',
            filter: 'blur(50px)',
          }}
        />

        {/* Optional feature flag gate */}
        {!isEnabled ? (
          <div className="m-auto text-center p-10">
            <h2 className="text-xl font-semibold">Membership UI is disabled</h2>
            <p className="text-zinc-400 mt-2">Set NEXT_PUBLIC_MEMBER_UI_ADMIN_PARITY=true to enable</p>
          </div>
        ) : null}

        {/* Left rail: member nav (two items only) */}
        <MemberNavigation />

        {/* Global header with membership profile block */}
        <MembershipGlobalHeader ProfileBlock={<MembershipUserProfileBlock />} />

        {/* Main content */}
        <main className="main-content ml-[70px] w-[calc(100%-70px)] mt-16 h-[calc(100vh-64px)] overflow-y-auto relative">
          {isEnabled ? children : null}
        </main>
      </div>
    </ThemeProvider>
  )
}


