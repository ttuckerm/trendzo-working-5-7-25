"use client"

import React, { useState, useEffect, createContext, useContext } from 'react';
import { cn } from '@/lib/design-utils';
import { usePathname } from 'next/navigation';
import MinimalistHeader from './MinimalistHeader';
import MinimalistSidebar from './MinimalistSidebar';
import { UserFlowProvider } from '@/lib/contexts/UserFlowContext';

// Types for user behavior tracking
type UserBehavior = {
  pageVisits: Record<string, number>;
  lastActiveSection: string;
  preferredViewMode: 'expanded' | 'compact';
  interactionFrequency: Record<string, number>;
  lastVisit: Date;
};

// Layout context to manage the adaptive layout behavior
type LayoutContextType = {
  isNavOpen: boolean;
  toggleNav: () => void;
  closeNav: () => void;
  userBehavior: UserBehavior;
  incrementInteraction: (section: string) => void;
  updateLastActiveSection: (section: string) => void;
  setViewMode: (mode: 'expanded' | 'compact') => void;
};

const defaultUserBehavior: UserBehavior = {
  pageVisits: {},
  lastActiveSection: 'dashboard',
  preferredViewMode: 'expanded',
  interactionFrequency: {},
  lastVisit: new Date(),
};

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

export interface EnhancedLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function EnhancedLayout({ 
  children,
  className 
}: EnhancedLayoutProps) {
  const pathname = usePathname();
  
  // State for responsive sidebar toggle
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  // State to store and track user behavior for adaptive UI
  const [userBehavior, setUserBehavior] = useState<UserBehavior>(() => {
    // Try to load persisted behavior from localStorage if on client
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trendzo_user_behavior');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...parsed,
            lastVisit: new Date(parsed.lastVisit),
          };
        } catch (e) {
          console.error('Failed to parse saved user behavior:', e);
        }
      }
    }
    return defaultUserBehavior;
  });

  // Update page visit count whenever pathname changes
  useEffect(() => {
    if (!pathname) return;
    
    setUserBehavior(prev => {
      const pageVisits = {
        ...prev.pageVisits,
        [pathname]: (prev.pageVisits[pathname] || 0) + 1,
      };
      
      // Update the last visit timestamp
      return {
        ...prev,
        pageVisits,
        lastVisit: new Date(),
      };
    });

    // Close the nav on mobile when navigating
    if (window.innerWidth < 1024) {
      setIsNavOpen(false);
    }
  }, [pathname]);

  // Save user behavior to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('trendzo_user_behavior', JSON.stringify(userBehavior));
  }, [userBehavior]);

  // Context value with methods to update user behavior
  const layoutContextValue: LayoutContextType = {
    isNavOpen,
    toggleNav: () => setIsNavOpen(prev => !prev),
    closeNav: () => setIsNavOpen(false),
    userBehavior,
    incrementInteraction: (section: string) => {
      setUserBehavior(prev => ({
        ...prev,
        interactionFrequency: {
          ...prev.interactionFrequency,
          [section]: (prev.interactionFrequency[section] || 0) + 1,
        },
      }));
    },
    updateLastActiveSection: (section: string) => {
      setUserBehavior(prev => ({
        ...prev,
        lastActiveSection: section,
      }));
    },
    setViewMode: (mode: 'expanded' | 'compact') => {
      setUserBehavior(prev => ({
        ...prev,
        preferredViewMode: mode,
      }));
    },
  };

  return (
    <LayoutContext.Provider value={layoutContextValue}>
      <UserFlowProvider>
        <div className="relative flex min-h-screen flex-col bg-neutral-50">
          <MinimalistHeader />
          
          <div className="flex flex-1">
            <MinimalistSidebar />
            
            <main className={cn(
              "flex-1 transition-all duration-200",
              isNavOpen ? "lg:ml-64" : "lg:ml-20",
              className
            )}>
              <div className="container mx-auto px-4 py-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </UserFlowProvider>
    </LayoutContext.Provider>
  );
} 