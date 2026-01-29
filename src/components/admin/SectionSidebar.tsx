'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NavSection, NavPage } from './navigation-config';
import { useHasPermission } from '@/lib/permissions/hooks';
import { useAdminUser } from '@/hooks/useAdminUser';

interface SectionSidebarProps {
  section: NavSection;
  isOpen: boolean;
  onClose?: () => void;
  badgeCounts?: {
    errorCount?: number;
    pendingCount?: number;
    payoutCount?: number;
  };
}

export function SectionSidebar({ 
  section, 
  isOpen, 
  onClose,
  badgeCounts = {},
}: SectionSidebarProps) {
  const pathname = usePathname();
  const { role } = useAdminUser();

  if (!isOpen || !section.children) {
    return null;
  }

  // Filter pages based on role
  const filteredPages = section.children.filter(page => {
    if (page.roles && role && !page.roles.includes(role)) {
      return false;
    }
    return true;
  });

  return (
    <div 
      className={cn(
        'w-[200px] h-full bg-[#111118] border-r border-[#1a1a2e] py-4 transition-all duration-200',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onMouseLeave={onClose}
    >
      {/* Section Header */}
      <div className="px-4 mb-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <section.icon size={16} className="text-purple-400" />
          {section.label}
        </h2>
      </div>

      {/* Section Pages */}
      <nav className="px-2 space-y-0.5">
        {filteredPages.map((page) => {
          const isActive = pathname === page.href || 
            (page.href !== section.href && pathname.startsWith(page.href + '/'));
          const PageIcon = page.icon;

          // Get badge value
          let badgeValue: number | undefined;
          if (page.badge === 'errorCount') badgeValue = badgeCounts.errorCount;
          if (page.badge === 'pendingCount') badgeValue = badgeCounts.pendingCount;
          if (page.badge === 'payoutCount') badgeValue = badgeCounts.payoutCount;

          return (
            <Link
              key={page.href}
              href={page.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                'hover:bg-white/5',
                isActive && 'bg-purple-500/20 text-purple-400 font-medium',
                !isActive && 'text-gray-400 hover:text-white'
              )}
            >
              {PageIcon && (
                <PageIcon 
                  size={16} 
                  className={cn(
                    isActive ? 'text-purple-400' : 'text-gray-500'
                  )} 
                />
              )}
              <span className="flex-1 truncate">{page.label}</span>
              {badgeValue !== undefined && badgeValue > 0 && (
                <span className={cn(
                  'px-2 py-0.5 text-xs rounded-full font-medium',
                  page.badge === 'errorCount' && 'bg-red-500/20 text-red-400',
                  page.badge === 'pendingCount' && 'bg-yellow-500/20 text-yellow-400',
                  page.badge === 'payoutCount' && 'bg-green-500/20 text-green-400'
                )}>
                  {badgeValue > 99 ? '99+' : badgeValue}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Section Quick Actions (optional) */}
      {section.id === 'control-center' && (
        <div className="mt-6 px-4 pt-4 border-t border-[#1a1a2e]">
          <p className="text-xs text-gray-500 mb-2">Quick Actions</p>
          <button className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            Run Health Check
          </button>
          <button className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            Clear Cache
          </button>
        </div>
      )}
    </div>
  );
}

export default SectionSidebar;


























































































