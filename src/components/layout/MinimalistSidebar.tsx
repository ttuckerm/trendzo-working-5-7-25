"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, BarChart3, Bookmark, Settings, HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/design-utils';
import { useLayout } from './EnhancedLayout';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  priority: number;
}

interface MinimalistSidebarProps {
  className?: string;
}

export default function MinimalistSidebar({ className }: MinimalistSidebarProps) {
  const pathname = usePathname();
  const { isNavOpen, toggleNav, userBehavior } = useLayout();
  
  // Define all possible navigation items
  const allNavItems: NavItem[] = [
    { 
      label: 'Home', 
      href: '/', 
      icon: <Home size={20} />, 
      priority: 10 
    },
    { 
      label: 'Explore', 
      href: '/explore', 
      icon: <Compass size={20} />, 
      priority: 8 
    },
    { 
      label: 'Analytics', 
      href: '/analytics', 
      icon: <BarChart3 size={20} />, 
      priority: 6 
    },
    { 
      label: 'Saved', 
      href: '/saved', 
      icon: <Bookmark size={20} />, 
      priority: 4 
    },
    { 
      label: 'Settings', 
      href: '/settings', 
      icon: <Settings size={20} />, 
      priority: 2 
    },
    { 
      label: 'Help', 
      href: '/help', 
      icon: <HelpCircle size={20} />, 
      priority: 1 
    },
  ];

  // Calculate dynamic priorities based on user behavior
  const navItems = [...allNavItems].sort((a, b) => {
    // Base priority
    let aPriority = a.priority;
    let bPriority = b.priority;
    
    // Adjust based on visit frequency
    const aVisits = userBehavior.pageVisits[a.href] || 0;
    const bVisits = userBehavior.pageVisits[b.href] || 0;
    
    aPriority += aVisits * 0.5; // Weight for visits
    bPriority += bVisits * 0.5;
    
    // Adjust based on interaction frequency instead of recency
    const aInteractions = userBehavior.interactionFrequency[a.href] || 0;
    const bInteractions = userBehavior.interactionFrequency[b.href] || 0;
    
    aPriority += aInteractions * 0.3; // Weight for interactions
    bPriority += bInteractions * 0.3;
    
    // If the last active section matches the nav item, give it a boost
    if (a.href.includes(userBehavior.lastActiveSection)) {
      aPriority += 5;
    }
    
    if (b.href.includes(userBehavior.lastActiveSection)) {
      bPriority += 5;
    }
    
    return bPriority - aPriority; // Higher priority comes first
  });

  // Only show navigation items based on screen size and priority
  const visibleNavItems = navItems.slice(0, 6); // Show top 6 items

  // Animation variants
  const sidebarVariants = {
    hidden: { 
      x: "-100%",
      opacity: 0.5,
    },
    visible: { 
      x: 0,
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      } 
    }
  };

  // Only render if nav is open (for mobile) or always for desktop
  return (
    <>
      {/* Backdrop for mobile - only visible when nav is open */}
      <AnimatePresence>
        {isNavOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleNav}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - always rendered on desktop, only when open on mobile */}
      <AnimatePresence>
        {(isNavOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
          <motion.aside
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={cn(
              "fixed left-0 top-0 bottom-0 w-64 bg-white z-50 pt-16 shadow-md lg:shadow-none",
              "flex flex-col",
              !isNavOpen && "lg:translate-x-0 lg:opacity-100",
              className
            )}
          >
            <div className="flex justify-end px-4 lg:hidden">
              <button 
                onClick={toggleNav}
                className="p-1.5 rounded-full text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 mt-4">
              <ul className="space-y-1">
                {visibleNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-lg group transition-colors",
                          isActive 
                            ? "bg-primary-50 text-primary-700" 
                            : "text-neutral-600 hover:bg-neutral-100"
                        )}
                        onClick={() => {
                          if (window.innerWidth < 1024) {
                            toggleNav();
                          }
                        }}
                      >
                        <span className={cn(
                          "transition-colors", 
                          isActive ? "text-primary-600" : "text-neutral-500 group-hover:text-neutral-700"
                        )}>
                          {item.icon}
                        </span>
                        <span className="text-sm font-medium">{item.label}</span>
                        
                        {/* Display visit count for frequently visited pages (for context) */}
                        {userBehavior.pageVisits[item.href] > 3 && (
                          <span className="ml-auto text-xs text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">
                            {userBehavior.pageVisits[item.href]}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Recently visited section - show based on visit data */}
              {Object.keys(userBehavior.pageVisits).length > 3 && (
                <div className="mt-8 px-4">
                  <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">
                    Recently Visited
                  </h3>
                  <ul className="space-y-1">
                    {Object.entries(userBehavior.pageVisits)
                      .sort(([, visitsA], [, visitsB]) => (visitsB as number) - (visitsA as number)) // Sort by most visits
                      .slice(0, 3) // Top 3 most visited
                      .map(([path]) => {
                        const navItem = allNavItems.find(item => item.href === path);
                        if (!navItem) return null;
                        
                        return (
                          <li key={`recent-${path}`}>
                            <Link
                              href={path}
                              className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                            >
                              <span className="text-neutral-400">{navItem.icon}</span>
                              <span>{navItem.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
            </nav>

            {/* Footer */}
            <div className="mt-auto p-4 border-t border-neutral-100">
              <div className="flex items-center justify-between text-sm text-neutral-500">
                <span>Trendzo</span>
                <span>v1.0</span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
} 