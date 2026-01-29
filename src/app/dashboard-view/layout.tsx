"use client"

import React, { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar' // Use the working sidebar
import Header from '@/components/layout/Header' // Assuming a Header component exists
import "../globals.css" // Global CSS
import "./global.css" // Dashboard-specific CSS
import { ThemeProvider } from '@/contexts/ThemeContext' // Import the provider

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-neutral-950">
        {/* Use the functional Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Main content */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* Site header */}
          <Header setIsSidebarOpen={setSidebarOpen} />

          <main>
            <div className="mx-auto w-full max-w-9xl px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
} 