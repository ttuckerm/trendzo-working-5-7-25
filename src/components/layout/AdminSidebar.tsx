"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

// Import Lucide icons individually instead of using barrel imports
import { TrendingUp } from 'lucide-react'
import { LayoutDashboard } from 'lucide-react'
import { Image } from 'lucide-react'
import { Edit } from 'lucide-react'
import { BarChart2 } from 'lucide-react'
import { Wand2 } from 'lucide-react'
import { BarChart } from 'lucide-react'
import { AlertCircle } from 'lucide-react'
import { Calendar } from 'lucide-react'
import { Users } from 'lucide-react'
import { ChevronUp } from 'lucide-react'
import { Lock } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { ChevronLeft } from 'lucide-react'
import { Crown } from 'lucide-react'
import { Brain } from 'lucide-react'
import { Settings } from 'lucide-react'
import { FileText } from 'lucide-react'
import { Lightbulb } from 'lucide-react'
import { User } from 'lucide-react'
import { Activity } from 'lucide-react'
import { ServerCog } from 'lucide-react'

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  isLocked?: boolean
  badge?: string
  badgeColor?: string
  isCollapsed?: boolean
}

function NavItem({ 
  href, 
  icon, 
  label, 
  isActive, 
  isLocked, 
  badge, 
  badgeColor = "bg-blue-100 text-blue-700",
  isCollapsed 
}: NavItemProps) {
  return (
    <li>
      <Link
        href={isLocked ? '#' : href}
        className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-700 hover:bg-gray-100'
        } ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
        onClick={(e) => isLocked && e.preventDefault()}
        title={isCollapsed ? label : undefined}
      >
        <span className={isActive ? 'text-blue-600' : 'text-gray-500'}>
          {icon}
        </span>
        {!isCollapsed && (
          <>
            <span>{label}</span>
            {isLocked && (
              <Lock size={14} className="ml-auto text-gray-400" />
            )}
            {badge && !isLocked && (
              <span className={`ml-auto flex h-5 items-center rounded-full ${badgeColor} px-2 text-xs font-medium`}>
                {badge}
              </span>
            )}
          </>
        )}
      </Link>
    </li>
  )
}

interface NavSectionProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
  isCollapsed?: boolean
}

function NavSection({ 
  title, 
  children, 
  defaultExpanded = true,
  isCollapsed = false
}: NavSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // If sidebar is collapsed, always show content regardless of expanded state
  const shouldShowContent = isCollapsed || isExpanded;

  return (
    <div className="mb-4">
      {!isCollapsed && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium uppercase text-gray-500"
        >
          {title}
          <ChevronUp
            size={14}
            className={`transition-transform ${isExpanded ? '' : 'rotate-180'}`}
          />
        </button>
      )}
      {shouldShowContent && <ul className="space-y-1 mt-1">{children}</ul>}
    </div>
  )
}

export default function AdminSidebar({ 
  isOpen, 
  setIsOpen 
}: { 
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void 
}) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Store collapsed state in localStorage
  useEffect(() => {
    const storedCollapsedState = localStorage.getItem('sidebarCollapsed');
    if (storedCollapsedState) {
      setIsCollapsed(storedCollapsedState === 'true');
    }
  }, []);

  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-500 bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex ${isCollapsed ? 'w-16' : 'w-64'} flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header with Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            {!isCollapsed && <span className="text-lg font-bold text-gray-800">Trendzo</span>}
          </Link>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Free Plan Card */}
          <div className={`mb-4 rounded-lg bg-gray-100 border border-gray-200 ${isCollapsed ? 'p-2' : 'p-4'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2 mb-2'}`}>
              <Crown size={isCollapsed ? 18 : 16} className="text-gray-500" />
              {!isCollapsed && <span className="font-medium text-gray-800">Free Plan</span>}
            </div>
            {!isCollapsed && (
              <button className="mt-2 w-full rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition">
                Upgrade to Premium
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-6">
            {/* Main Section */}
            <NavSection title="MAIN" isCollapsed={isCollapsed}>
              <NavItem
                href="/dashboard"
                icon={<LayoutDashboard size={18} />}
                label="Dashboard"
                isActive={pathname === '/dashboard'}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/template-library"
                icon={<Image size={18} />}
                label="Template Library"
                isActive={pathname === '/template-library' || pathname.startsWith('/template-library/')}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/editor"
                icon={<Edit size={18} />}
                label="Template Editor"
                isActive={pathname === '/editor'}
                isCollapsed={isCollapsed}
              />
            </NavSection>

            {/* Premium Features */}
            <NavSection title="PREMIUM FEATURES" isCollapsed={isCollapsed}>
              <NavItem
                href="/analytics"
                icon={<BarChart2 size={18} />}
                label="Performance Analytics"
                isActive={pathname === '/analytics'}
                isLocked={false}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/remix"
                icon={<Wand2 size={18} />}
                label="Template Remix"
                isActive={pathname === '/remix'}
                isLocked={true}
                isCollapsed={isCollapsed}
              />
            </NavSection>

            {/* Business Features */}
            <NavSection title="BUSINESS FEATURES" isCollapsed={isCollapsed}>
              <NavItem
                href="/dashboard-view/trend-predictions-dashboard"
                icon={<BarChart size={18} />}
                label="Trend Prediction"
                isActive={pathname === '/dashboard-view/trend-predictions-dashboard' || pathname.startsWith('/dashboard-view/trend-predictions-dashboard/')}
                isLocked={false}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/ai-scripts"
                icon={<AlertCircle size={18} />}
                label="AI Script Generator"
                isActive={pathname === '/ai-scripts'}
                isLocked={true}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/calendar"
                icon={<Calendar size={18} />}
                label="Content Calendar"
                isActive={pathname === '/calendar'}
                isLocked={true}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/marketplace"
                icon={<Users size={18} />}
                label="Creator Marketplace"
                isActive={pathname === '/marketplace'}
                isLocked={true}
                isCollapsed={isCollapsed}
              />
            </NavSection>

            {/* Admin Section - Add AI Brain here */}
            <NavSection title="ADMIN TOOLS" isCollapsed={isCollapsed}>
              <NavItem
                href="/admin/dashboard"
                icon={<LayoutDashboard size={18} />}
                label="Dashboard"
                isActive={pathname === '/admin/dashboard' || pathname === '/admin'}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/admin/templates"
                icon={<FileText size={18} />}
                label="Template Management"
                isActive={pathname === '/admin/templates' || pathname.startsWith('/admin/templates/')}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/admin/insights"
                icon={<Lightbulb size={18} />}
                label="Expert Insights"
                isActive={pathname === '/admin/insights' || pathname.startsWith('/admin/insights/')}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/admin/analytics"
                icon={<BarChart2 size={18} />}
                label="Analytics"
                isActive={pathname === '/admin/analytics' || pathname.startsWith('/admin/analytics/')}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/admin/users"
                icon={<User size={18} />}
                label="User Management"
                isActive={pathname === '/admin/users' || pathname.startsWith('/admin/users/')}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/admin/system"
                icon={<Activity size={18} />}
                label="System Health"
                isActive={pathname === '/admin/system' || pathname.startsWith('/admin/system/')}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/admin/api"
                icon={<ServerCog size={18} />}
                label="API Management"
                isActive={pathname === '/admin/api' || pathname.startsWith('/admin/api/')}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/admin/etl-dashboard"
                icon={<BarChart2 size={18} />}
                label="ETL Dashboard"
                isActive={pathname === '/admin/etl-dashboard' || pathname.startsWith('/admin/etl-dashboard/')}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/admin/newsletter"
                icon={<AlertCircle size={18} />}
                label="Newsletter"
                isActive={pathname === '/admin/newsletter' || pathname.startsWith('/admin/newsletter/')}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/admin/ai-brain"
                icon={<Brain size={18} />}
                label="AI Brain Interface"
                isActive={pathname === '/admin/ai-brain' || pathname.startsWith('/admin/ai-brain/')}
                isCollapsed={isCollapsed}
              />
              <NavItem
                href="/admin/settings"
                icon={<Settings size={18} />}
                label="Settings"
                isActive={pathname === '/admin/settings' || pathname.startsWith('/admin/settings/')}
                isCollapsed={isCollapsed}
              />
            </NavSection>
          </nav>
        </div>

        {/* Sidebar Footer - Collapse Toggle */}
        <div className="border-t border-gray-200 p-2">
          <button 
            onClick={toggleCollapsed}
            className="flex w-full items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
          
          {!isCollapsed && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              <p>© 2023 Trendzo</p>
              <p className="mt-1">Making content creation easier</p>
            </div>
          )}
        </div>
      </aside>
    </>
  )
} 