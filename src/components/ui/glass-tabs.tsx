'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { glassTokens } from '@/lib/design-system/glass-config';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface GlassTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const GlassTabs: React.FC<GlassTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <div className={cn('relative', className)}>
      {/* Scrollable container */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2">
        {tabs.map(tab => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg',
                'transition-colors duration-200',
                isActive
                  ? 'text-white'
                  : 'text-[rgba(255,255,255,0.5)] hover:text-[rgba(255,255,255,0.8)]'
              )}
            >
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </span>

              {/* Active background */}
              {isActive && (
                <motion.div
                  layoutId="activeTabBackground"
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  transition={glassTokens.spring.snappy}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active indicator line */}
      <div className="relative h-0.5 bg-[rgba(255,255,255,0.05)] rounded-full mt-1">
        {/* The indicator position would be calculated based on active tab */}
        {/* For simplicity, we use layoutId on the background instead */}
      </div>
    </div>
  );
};

export default GlassTabs;
