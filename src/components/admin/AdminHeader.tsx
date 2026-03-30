'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Bell, ChevronRight, Settings, LogOut, User } from 'lucide-react';
import { useAdminUserWithDevFallback } from '@/hooks/useAdminUser';
import { getBreadcrumbs, getCurrentSection } from './navigation-config';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ROLE_COLORS: Record<string, string> = {
  chairman: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  sub_admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  agency: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  developer: 'bg-green-500/20 text-green-400 border-green-500/30',
  creator: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  clipper: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const ROLE_LABELS: Record<string, string> = {
  chairman: 'Chairman',
  sub_admin: 'Sub Admin',
  agency: 'Agency',
  developer: 'Developer',
  creator: 'Creator',
  clipper: 'Clipper',
};

export function AdminHeader() {
  const pathname = usePathname();
  const { profile, role, isLoading } = useAdminUserWithDevFallback();
  const [notificationCount, setNotificationCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false);

  const breadcrumbs = getBreadcrumbs(pathname);
  const currentSection = getCurrentSection(pathname);

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Get page title
  const getPageTitle = () => {
    if (breadcrumbs.length > 0) {
      return breadcrumbs[breadcrumbs.length - 1].label;
    }
    
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return 'Dashboard';
    
    const lastSegment = segments[segments.length - 1];
    return lastSegment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <header className="h-16 bg-[#0a0a0f] border-b border-[#1a1a2e] flex items-center justify-between px-6">
      {/* Left Side - Breadcrumbs & Title */}
      <div className="flex items-center gap-4">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-sm">
            <Link 
              href="/admin/dashboard" 
              className="text-gray-500 hover:text-white transition-colors"
            >
              Admin
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                <ChevronRight size={14} className="text-gray-600" />
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-white font-medium">{crumb.label}</span>
                ) : (
                  <Link 
                    href={crumb.href}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        
        {breadcrumbs.length === 0 && (
          <h1 className="text-xl font-semibold text-white">
            {getPageTitle()}
          </h1>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Search Button */}
        <button 
          className="flex items-center gap-2 px-3 py-2 bg-[#111118] border border-[#1a1a2e] rounded-lg text-gray-400 hover:text-white hover:border-[#2a2a3e] transition-colors"
          onClick={() => setShowSearch(true)}
        >
          <Search size={16} />
          <span className="text-sm hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-[#1a1a2e] rounded text-xs text-gray-500">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors">
          <Bell size={20} className="text-gray-400" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-red-500 rounded-full text-[10px] text-white font-medium">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-[#1a1a2e]">
          {/* Role Badge */}
          {role && (
            <span className={cn(
              'px-2 py-1 text-xs font-medium rounded-full border',
              ROLE_COLORS[role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
            )}>
              {ROLE_LABELS[role] || role}
            </span>
          )}

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium shadow-lg shadow-purple-500/20">
                  {profile?.display_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-[#111118] border-[#1a1a2e] text-white"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {profile?.display_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {profile?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#1a1a2e]" />
              <DropdownMenuItem className="cursor-pointer focus:bg-white/5">
                <User size={16} className="mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-white/5">
                <Settings size={16} className="mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1a1a2e]" />
              <DropdownMenuItem className="cursor-pointer focus:bg-white/5 text-red-400 focus:text-red-400">
                <LogOut size={16} className="mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search Modal - simplified, can be replaced with full implementation */}
      {showSearch && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]"
          onClick={() => setShowSearch(false)}
        >
          <div 
            className="w-full max-w-2xl bg-[#111118] border border-[#1a1a2e] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a2e]">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search pages, actions, and more..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
                autoFocus
              />
              <kbd className="px-2 py-1 bg-[#1a1a2e] rounded text-xs text-gray-500">
                ESC
              </kbd>
            </div>
            <div className="p-4 text-gray-500 text-sm">
              Start typing to search...
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default AdminHeader;

