'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Bell, ChevronDown } from 'lucide-react';

export default function NetflixHeader() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-48 z-30 flex h-16 items-center justify-between px-6 bg-black bg-opacity-90 text-white">
      {/* Left Side - Navigation Arrows */}
      <div className="flex items-center gap-4">
        <button className="text-white/70 hover:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="text-white/70 hover:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Middle - Search */}
      <div className="flex items-center">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-white/70" />
          </div>
          <input
            type="search"
            className="bg-black/30 border border-white/20 text-white text-sm rounded-md block w-full pl-10 p-2.5 placeholder-white/50 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search..."
          />
        </div>
      </div>

      {/* Right Side - Notifications and Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-1 text-white/80 hover:text-white">
          <Bell size={20} />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-600"></span>
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 hover:text-white focus:outline-none"
          >
            <div className="h-8 w-8 rounded overflow-hidden">
              <Image
                src="/images/avatar.jpg"
                alt="Profile"
                width={32}
                height={32}
                className="h-full w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="h-full w-full flex items-center justify-center bg-red-600 text-white text-sm font-bold">S</div>';
                  }
                }}
              />
            </div>
            <div className="text-sm">
              <span>Samantha G.</span>
              <span className="block text-xs text-white/60">@Samantha</span>
            </div>
            <ChevronDown size={16} className="text-white/80" />
          </button>

          {/* Profile Dropdown */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-black border border-gray-700 rounded shadow-lg py-1 z-50">
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-white/80 hover:bg-gray-800"
              >
                Account
              </Link>
              <Link
                href="/help"
                className="block px-4 py-2 text-sm text-white/80 hover:bg-gray-800"
              >
                Help Center
              </Link>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-gray-800"
              >
                Sign out of Netflix
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 