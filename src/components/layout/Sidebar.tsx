"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  ImageIcon, 
  Edit, 
  BarChart2, 
  Wand2, 
  BarChart, 
  AlertCircle, 
  Calendar, 
  Users, 
  ChevronUp, 
  Lock, 
  X, 
  Crown,
  Compass,
  Sparkles,
  MailCheck,
  BookOpen,
  Music,
  Volume2
} from 'lucide-react'
import { useSubscription, SubscriptionTier } from '@/lib/contexts/SubscriptionContext'
import { useState } from 'react'

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  requiredTier?: SubscriptionTier
  isLocked?: boolean
}

function NavItem({ href, icon, label, isActive, requiredTier, isLocked }: NavItemProps) {
  return (
    <li className="list-none">
      <Link
        href={isLocked ? '#' : href}
        className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-700 hover:bg-gray-100'
        } ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
        onClick={(e) => isLocked && e.preventDefault()}
      >
        <span className={isActive ? 'text-blue-600' : 'text-gray-500'}>
          {icon}
        </span>
        <span>{label}</span>
        {isLocked && (
          <Lock size={14} className="ml-auto text-gray-400" />
        )}
        {requiredTier === 'premium' && !isLocked && (
          <span className="ml-auto flex h-5 items-center rounded-full bg-blue-100 px-2 text-xs font-medium text-blue-700">
            Premium
          </span>
        )}
        {requiredTier === 'business' && !isLocked && (
          <span className="ml-auto flex h-5 items-center rounded-full bg-purple-100 px-2 text-xs font-medium text-purple-700">
            Business
          </span>
        )}
      </Link>
    </li>
  )
}

interface NavSectionProps {
  title: string
  children: React.ReactNode
  defaultExpanded?: boolean
}

function NavSection({ title, children, defaultExpanded = true }: NavSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase text-gray-500"
      >
        {title}
        <ChevronUp
          size={14}
          className={`transition-transform ${isExpanded ? '' : 'rotate-180'}`}
        />
      </button>
      {isExpanded && <ul className="space-y-1 list-none p-0">{children}</ul>}
    </div>
  )
}

export default function Sidebar({ 
  isOpen, 
  setIsOpen 
}: { 
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void 
}) {
  const pathname = usePathname()
  const { tier, canAccess } = useSubscription()
  
  const planColors = {
    free: 'bg-gray-100 text-gray-800 border-gray-200',
    premium: 'bg-blue-100 text-blue-800 border-blue-200',
    business: 'bg-purple-100 text-purple-800 border-purple-200',
  }

  const planLabel = {
    free: 'Free Plan',
    premium: 'Premium Plan',
    business: 'Business Plan',
  }

  const upgradeBtnColors = {
    free: 'bg-blue-600 hover:bg-blue-700 text-white',
    premium: 'bg-purple-600 hover:bg-purple-700 text-white',
    business: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
  }

  const upgradeLabel = {
    free: 'Upgrade to Premium',
    premium: 'Upgrade to Business',
    business: 'Highest Tier',
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-800 bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header with Close Button */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <Link href="/dashboard-view" className="flex items-center">
            <Image 
              src="/images/logos/trendzo-full-logo.svg" 
              alt="Trendzo Logo" 
              width={140} 
              height={40} 
              className="h-8 w-auto"
            />
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Current Plan Card */}
          <div className={`mb-6 rounded-lg border p-4 ${planColors[tier]}`}>
            <div className="mb-2 flex items-center gap-2">
              <Crown 
                size={16} 
                className={tier === 'free' ? 'text-gray-500' : tier === 'premium' ? 'text-blue-600' : 'text-purple-600'} 
              />
              <span className="font-medium">{planLabel[tier]}</span>
            </div>
            {tier !== 'business' && (
              <button
                className={`mt-2 w-full rounded-md px-3 py-1.5 text-sm font-medium ${upgradeBtnColors[tier]}`}
              >
                {upgradeLabel[tier]}
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-6">
            {/* Main Section */}
            <NavSection title="Main">
              <NavItem
                href="/dashboard-view"
                icon={<LayoutDashboard size={18} />}
                label="Dashboard"
                isActive={pathname === '/dashboard-view' || pathname === '/dashboard'}
              />
              <NavItem
                href="/dashboard-view/template-library"
                icon={<ImageIcon size={18} />}
                label="Template Library"
                isActive={pathname === '/template-library' || pathname.startsWith('/template-library/') || 
                         pathname === '/dashboard-view/template-library' || pathname.startsWith('/dashboard-view/template-library/') ||
                         pathname === '/(dashboard)/template-library' || pathname.startsWith('/(dashboard)/template-library/')}
              />
              <NavItem
                href="/dashboard-view/template-editor"
                icon={<Edit size={18} />}
                label="Template Editor"
                isActive={pathname === '/editor' || pathname === '/dashboard-view/template-editor' || pathname.startsWith('/dashboard-view/template-editor/')}
              />
              <NavItem
                href="/dashboard-view/video-analyzer"
                icon={<Compass size={18} />}
                label="Video Analyzer Tools"
                isActive={pathname === '/dashboard-view/video-analyzer' || pathname === '/dashboard/video-analyzer' || 
                         pathname.startsWith('/dashboard-view/video-analyzer/') || pathname.startsWith('/dashboard/video-analyzer/')}
              />
              <NavItem
                href="/documentation"
                icon={<BookOpen size={18} />}
                label="Documentation"
                isActive={pathname === '/documentation' || pathname.startsWith('/documentation/')}
              />
            </NavSection>

            {/* Analytics Section */}
            <NavSection title="Analytics">
              <NavItem
                href="/dashboard-view/analytics/trend-insights"
                icon={<BarChart2 size={18} />}
                label="Trend Insights"
                isActive={pathname === '/analytics/trend-insights' || pathname === '/dashboard-view/analytics/trend-insights'}
              />
              <NavItem
                href="/dashboard-view/sound-trends"
                icon={<Volume2 size={18} />}
                label="Sound Trends"
                isActive={pathname === '/sound-trends' || pathname === '/dashboard-view/sound-trends'}
              />
              <NavItem
                href="/dashboard-view/analytics/performance"
                icon={<BarChart size={18} />}
                label="Performance Metrics"
                isActive={pathname === '/dashboard-view/analytics/performance'}
                requiredTier="premium"
                isLocked={!canAccess('premium')}
              />
              <NavItem
                href="/dashboard-view/analytics/advanced-insights"
                icon={<Sparkles size={18} />}
                label="Advanced Insights"
                isActive={pathname === '/analytics/advanced-insights' || pathname === '/dashboard-view/analytics/advanced-insights'}
                requiredTier="business"
                isLocked={!canAccess('business')}
              />
            </NavSection>

            {/* Premium Features */}
            <NavSection title="Premium Features">
              <NavItem
                href="/analytics"
                icon={<BarChart2 size={18} />}
                label="Performance Analytics"
                isActive={pathname === '/analytics' || pathname === '/(dashboard)/analytics'}
                requiredTier="premium"
                isLocked={false}
              />
              <NavItem
                href="/dashboard-view/analytics/newsletter"
                icon={<MailCheck size={18} />}
                label="Newsletter Analytics"
                isActive={pathname.includes('/analytics/newsletter')}
                requiredTier="premium"
                isLocked={!canAccess('premium')}
              />
              <NavItem
                href="/dashboard-view/analytics/remix-stats"
                icon={<BarChart size={18} />}
                label="Remix Analytics"
                isActive={pathname.includes('/analytics/remix-stats')}
                requiredTier="premium"
                isLocked={!canAccess('premium')}
              />
              <NavItem
                href="/dashboard-view/remix"
                icon={<Sparkles size={18} />}
                label="Template Remix"
                isActive={pathname.includes('/remix') || pathname.includes('/dashboard-view/remix')}
                requiredTier="premium"
                isLocked={!canAccess('premium')}
              />
            </NavSection>

            {/* Business Features */}
            <NavSection title="Business Features">
              <NavItem
                href="/dashboard-view/trend-predictions-dashboard"
                icon={<BarChart size={18} />}
                label="Trend Prediction"
                isActive={pathname === '/dashboard-view/trend-predictions-dashboard' || pathname.startsWith('/dashboard-view/trend-predictions-dashboard')}
                requiredTier="business"
                isLocked={false}
              />
              <NavItem
                href="/ai-scripts"
                icon={<AlertCircle size={18} />}
                label="AI Script Generator"
                isActive={pathname === '/ai-scripts'}
                requiredTier="business"
                isLocked={!canAccess('business')}
              />
              <NavItem
                href="/calendar"
                icon={<Calendar size={18} />}
                label="Content Calendar"
                isActive={pathname === '/calendar'}
                requiredTier="business"
                isLocked={!canAccess('business')}
              />
              <NavItem
                href="/marketplace"
                icon={<Users size={18} />}
                label="Creator Marketplace"
                isActive={pathname === '/marketplace'}
                requiredTier="business"
                isLocked={!canAccess('business')}
              />
            </NavSection>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="text-xs text-gray-500">
            <p>© 2023 Trendzo</p>
            <p className="mt-1">Making content creation easier</p>
          </div>
        </div>
      </aside>
    </>
  )
} 