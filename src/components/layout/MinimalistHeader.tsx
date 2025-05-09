"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, Search, Bell, User, X } from 'lucide-react';
import { cn } from '@/lib/design-utils';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLayout } from './EnhancedLayout';
import { motion, AnimatePresence } from 'framer-motion';

interface MinimalistHeaderProps {
  className?: string;
}

export default function MinimalistHeader({ className }: MinimalistHeaderProps) {
  const { user } = useAuth();
  const { toggleNav, isNavOpen } = useLayout();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; text: string; read: boolean }[]>([]);

  // Track scroll for header appearance changes
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simulate notifications (would be replaced with real data fetch)
  useEffect(() => {
    setNotifications([
      { id: '1', text: 'New template trend detected', read: false },
      { id: '2', text: 'Weekly analytics available', read: false },
    ]);
  }, []);

  const handleSearchToggle = () => {
    setIsSearchActive(!isSearchActive);
    if (isSearchActive) {
      setSearchQuery('');
    } else {
      // Focus search input after animation completes
      setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
      }, 100);
    }
  };

  return (
    <header 
      className={cn(
        "fixed top-0 w-full z-40 transition-all duration-200",
        isScrolled 
          ? "bg-white/90 backdrop-blur-sm shadow-sm h-14" 
          : "bg-transparent h-16",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 h-full">
        {/* Left section: Logo and menu toggle */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleNav}
            className="p-1.5 rounded-full text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 transition-colors"
            aria-label={isNavOpen ? "Close navigation" : "Open navigation"}
          >
            <Menu size={20} />
          </button>
          
          <Link href="/" className="flex items-center">
            <span className="font-semibold text-lg text-primary-600">Trendzo</span>
          </Link>
        </div>

        {/* Center section: Search */}
        <AnimatePresence>
          {isSearchActive ? (
            <motion.div 
              initial={{ opacity: 0, width: '20%' }}
              animate={{ opacity: 1, width: '50%' }}
              exit={{ opacity: 0, width: '20%' }}
              className="relative hidden md:block"
            >
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates, trends..."
                className="w-full bg-neutral-100 rounded-full py-1.5 px-4 pr-10 text-sm outline-none border-2 border-transparent focus:border-primary-200 transition-colors"
              />
              <button 
                onClick={handleSearchToggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
              >
                <X size={16} />
              </button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleSearchToggle}
              className="p-1.5 rounded-full text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 transition-colors hidden md:flex"
              aria-label="Search"
            >
              <Search size={20} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Right section: Notifications and User */}
        <div className="flex items-center space-x-1">
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-1.5 rounded-full text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-primary-500 rounded-full"></span>
              )}
            </button>

            {/* Notifications dropdown */}
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-neutral-100">
                    <h3 className="text-sm font-medium">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-neutral-100">
                        {notifications.map(notification => (
                          <div 
                            key={notification.id} 
                            className={cn(
                              "p-3 text-sm transition-colors hover:bg-neutral-50",
                              !notification.read && "bg-primary-50"
                            )}
                          >
                            {notification.text}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-sm text-neutral-500 text-center">
                        No notifications
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User profile */}
          {user ? (
            <Link
              href="/profile"
              className="p-1 rounded-full hover:bg-neutral-100 transition-colors"
            >
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="User profile"
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <div className="w-7 h-7 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {user.displayName?.[0] || user.email?.[0] || 'U'}
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="p-1.5 rounded-full text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 transition-colors"
            >
              <User size={20} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
} 