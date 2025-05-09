"use client"

import Link from 'next/link'
import { useState } from 'react'
import { Bell } from 'lucide-react'
import { TrendingUp } from 'lucide-react'
import { User } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { LogOut } from 'lucide-react'
import { Settings } from 'lucide-react'
import { Menu } from 'lucide-react'
import { X } from 'lucide-react'
import { Shield } from 'lucide-react'
import { Brain } from 'lucide-react'
import { LayoutDashboard } from 'lucide-react'
import { FileText } from 'lucide-react'
import { Lightbulb } from 'lucide-react'
import { BarChart2 } from 'lucide-react'
import { Activity } from 'lucide-react'
import { ServerCog } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

export default function AdminHeader({ toggleSidebar }: { toggleSidebar?: () => void }) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, signOut, isAdmin } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Left side - Logo and Menu Button */}
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="mr-4 rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link href="/admin" className="flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Trendzo</span>
        </Link>
        <div className="ml-3 flex items-center">
          <span className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-600">
            Admin Mode
          </span>
        </div>
      </div>

      {/* Middle - Navigation (Desktop only) */}
      <nav className="hidden mx-4 flex-1 md:flex items-center justify-center space-x-6">
        <Link href="/admin" className="text-gray-700 hover:text-blue-600 transition-colors">
          <span className="flex items-center">
            <LayoutDashboard size={16} className="mr-1" />
            Dashboard
          </span>
        </Link>
        <Link href="/admin/templates" className="text-gray-700 hover:text-blue-600 transition-colors">
          <span className="flex items-center">
            <FileText size={16} className="mr-1" />
            Template Management
          </span>
        </Link>
        <Link href="/admin/insights" className="text-gray-700 hover:text-blue-600 transition-colors">
          <span className="flex items-center">
            <Lightbulb size={16} className="mr-1" />
            Expert Insights
          </span>
        </Link>
        <Link href="/admin/analytics" className="text-gray-700 hover:text-blue-600 transition-colors">
          <span className="flex items-center">
            <BarChart2 size={16} className="mr-1" />
            Analytics
          </span>
        </Link>
        <Link href="/admin/ai-brain" className="text-gray-700 hover:text-blue-600 transition-colors">
          <span className="flex items-center">
            <Brain size={16} className="mr-1" />
            AI Brain
          </span>
        </Link>
        <Link href="/admin/etl-dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
          ETL Dashboard
        </Link>
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 font-semibold">
          Back to App
        </Link>
      </nav>

      {/* Right side - Notifications and User */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden rounded-md p-2 text-gray-500 hover:bg-gray-100"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Notification Bell */}
        <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100">
          <Bell size={20} />
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            2
          </span>
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={toggleUserMenu}
            className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium hover:bg-gray-100"
          >
            <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User avatar" className="h-full w-full object-cover" />
              ) : (
                <Shield className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="hidden md:block">
              <span className="block text-sm font-medium text-gray-900">
                {user?.displayName || user?.email || 'Admin User'}
              </span>
              <span className="inline-block rounded-full px-2 py-0.5 text-xs bg-red-100 text-red-600">
                Administrator
              </span>
            </div>
            <ChevronDown size={16} className="text-gray-500" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg z-50">
              <div className="border-b border-gray-200 px-4 py-2 md:hidden">
                <p className="font-medium text-gray-900">{user?.displayName || user?.email || 'Admin User'}</p>
                <p className="inline-block rounded-full px-2 py-0.5 text-xs bg-red-100 text-red-600">
                  Administrator
                </p>
              </div>
              <Link href="/profile" className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <User size={16} className="mr-2" />
                Profile
              </Link>
              <Link href="/settings" className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Settings size={16} className="mr-2" />
                Settings
              </Link>
              <Link href="/dashboard" className="flex w-full items-center px-4 py-2 text-sm text-blue-600 hover:bg-gray-100">
                <TrendingUp size={16} className="mr-2" />
                User Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut size={16} className="mr-2" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 md:hidden bg-white border-b border-gray-200 shadow-md z-40">
          <nav className="flex flex-col p-4 space-y-4">
            <Link 
              href="/admin" 
              className="text-gray-700 hover:text-blue-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center">
                <LayoutDashboard size={16} className="mr-1" />
                Dashboard
              </span>
            </Link>
            <Link 
              href="/admin/templates" 
              className="text-gray-700 hover:text-blue-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center">
                <FileText size={16} className="mr-1" />
                Template Management
              </span>
            </Link>
            <Link 
              href="/admin/insights" 
              className="text-gray-700 hover:text-blue-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center">
                <Lightbulb size={16} className="mr-1" />
                Expert Insights
              </span>
            </Link>
            <Link 
              href="/admin/analytics" 
              className="text-gray-700 hover:text-blue-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center">
                <BarChart2 size={16} className="mr-1" />
                Analytics
              </span>
            </Link>
            <Link 
              href="/admin/users" 
              className="text-gray-700 hover:text-blue-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center">
                <User size={16} className="mr-1" />
                User Management
              </span>
            </Link>
            <Link 
              href="/admin/system" 
              className="text-gray-700 hover:text-blue-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center">
                <Activity size={16} className="mr-1" />
                System Health
              </span>
            </Link>
            <Link 
              href="/admin/api" 
              className="text-gray-700 hover:text-blue-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center">
                <ServerCog size={16} className="mr-1" />
                API Management
              </span>
            </Link>
            <Link 
              href="/admin/template-analyzer" 
              className="text-gray-700 hover:text-blue-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Template Analyzer
            </Link>
            <Link 
              href="/admin/newsletter" 
              className="text-gray-700 hover:text-blue-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Newsletter
            </Link>
            <Link 
              href="/admin/ai-brain" 
              className="text-gray-700 hover:text-blue-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center">
                <Brain size={16} className="mr-1" />
                AI Brain
              </span>
            </Link>
            <Link 
              href="/admin/etl-dashboard" 
              className="text-gray-700 hover:text-blue-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              ETL Dashboard
            </Link>
            <Link 
              href="/admin/settings" 
              className="text-gray-700 hover:text-blue-600 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center">
                <Settings size={16} className="mr-1" />
                Settings
              </span>
            </Link>
            <Link 
              href="/dashboard" 
              className="text-blue-600 hover:text-blue-800 font-semibold py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Back to App
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
} 