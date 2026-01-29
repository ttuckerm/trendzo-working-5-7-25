'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useFilteredNavigation } from '@/lib/permissions/hooks';
import { ADMIN_NAVIGATION, getCurrentSection, NavSection } from './navigation-config';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface IconSidebarProps {
  onSectionHover?: (section: NavSection | null) => void;
  onSectionSelect?: (section: NavSection) => void;
}

export function IconSidebar({ onSectionHover, onSectionSelect }: IconSidebarProps) {
  const pathname = usePathname();
  const filteredNav = useFilteredNavigation(ADMIN_NAVIGATION);
  const currentSection = getCurrentSection(pathname);
  const [pythonStatus, setPythonStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  // Check Python service status
  useEffect(() => {
    async function checkPythonService() {
      try {
        const response = await fetch('/api/python/health', { 
          method: 'GET',
          cache: 'no-store',
        });
        setPythonStatus(response.ok ? 'online' : 'offline');
      } catch {
        setPythonStatus('offline');
      }
    }

    checkPythonService();
    const interval = setInterval(checkPythonService, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-[60px] h-full bg-[#0a0a0f] border-r border-[#1a1a2e] flex flex-col items-center py-4">
      {/* Logo */}
      <Link href="/admin/dashboard" className="mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-shadow">
          CC
        </div>
      </Link>

      {/* Navigation Icons */}
      <TooltipProvider delayDuration={0}>
        <nav className="flex flex-col gap-1 flex-1">
          {filteredNav.map((section) => {
            const Icon = section.icon;
            const isActive = currentSection?.id === section.id;

            return (
              <Tooltip key={section.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={section.href}
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
                      'hover:bg-white/10',
                      isActive && 'bg-white/10 text-white shadow-lg shadow-purple-500/10',
                      !isActive && 'text-gray-500 hover:text-white'
                    )}
                    onMouseEnter={() => onSectionHover?.(section)}
                    onMouseLeave={() => onSectionHover?.(null)}
                    onClick={() => onSectionSelect?.(section)}
                  >
                    <Icon size={20} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent 
                  side="right" 
                  className="bg-[#1a1a2e] border-[#2a2a3e] text-white"
                >
                  {section.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </TooltipProvider>

      {/* Python Service Status */}
      <div className="mt-auto pt-4 border-t border-[#1a1a2e]">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                <div className="relative">
                  <div 
                    className={cn(
                      'w-3 h-3 rounded-full transition-colors',
                      pythonStatus === 'online' && 'bg-green-500',
                      pythonStatus === 'offline' && 'bg-red-500',
                      pythonStatus === 'checking' && 'bg-yellow-500'
                    )} 
                  />
                  {pythonStatus === 'online' && (
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="right" 
              className="bg-[#1a1a2e] border-[#2a2a3e] text-white"
            >
              <div className="flex items-center gap-2">
                <span>Python Service:</span>
                <span className={cn(
                  'font-medium',
                  pythonStatus === 'online' && 'text-green-400',
                  pythonStatus === 'offline' && 'text-red-400',
                  pythonStatus === 'checking' && 'text-yellow-400'
                )}>
                  {pythonStatus === 'online' && 'Online'}
                  {pythonStatus === 'offline' && 'Offline'}
                  {pythonStatus === 'checking' && 'Checking...'}
                </span>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export default IconSidebar;


























































































