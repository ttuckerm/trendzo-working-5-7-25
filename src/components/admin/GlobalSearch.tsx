'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Building2,
  Users,
  Code,
  Scissors,
  Megaphone,
  Smartphone,
  Settings,
  ToggleLeft,
  ScrollText,
  Key,
  ArrowRight,
  Command,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminUser } from '@/hooks/useAdminUser';

interface SearchResult {
  id: string;
  type: 'agency' | 'creator' | 'developer' | 'clipper' | 'campaign' | 'app' | 'page';
  title: string;
  subtitle?: string;
  href: string;
  icon: any;
}

interface QuickAction {
  id: string;
  title: string;
  href: string;
  icon: any;
  shortcut?: string;
}

export function GlobalSearch() {
  const router = useRouter();
  const { role } = useAdminUser();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick actions based on role
  const quickActions: QuickAction[] = [
    ...(role === 'chairman' ? [
      { id: 'create-agency', title: 'Create Agency', href: '/admin/organization/agencies/create', icon: Building2, shortcut: 'A' },
      { id: 'feature-toggles', title: 'Feature Toggles', href: '/admin/config/feature-toggles', icon: ToggleLeft, shortcut: 'F' },
      { id: 'audit-log', title: 'View Audit Log', href: '/admin/audit-log', icon: ScrollText, shortcut: 'L' },
    ] : []),
    { id: 'api-keys', title: 'API Keys', href: '/admin/integrations/api', icon: Key },
  ];

  // Mock search results - in real implementation, this would call an API
  const searchResults: SearchResult[] = query.length > 0 ? [
    { id: 'a1', type: 'agency', title: 'Viral Kings Agency', subtitle: 'Pro tier • 45 creators', href: '/admin/organization/agencies/1', icon: Building2 },
    { id: 'a2', type: 'agency', title: 'TikTok Pros', subtitle: 'Growth tier • 23 creators', href: '/admin/organization/agencies/2', icon: Building2 },
    { id: 'c1', type: 'creator', title: 'Sarah Johnson', subtitle: '@sarahj • Viral Kings Agency', href: '/admin/organization/creators/1', icon: Users },
    { id: 'c2', type: 'creator', title: 'Mike Chen', subtitle: '@mikec • TikTok Pros', href: '/admin/organization/creators/2', icon: Users },
    { id: 'd1', type: 'developer', title: 'DevStudio Inc', subtitle: '3 apps • $8.5K/mo', href: '/admin/organization/developers/1', icon: Code },
    { id: 'camp1', type: 'campaign', title: 'CleanCopy Launch Promo', subtitle: 'Platform Campaign • Active', href: '/admin/rewards/platform-campaigns/1', icon: Megaphone },
    { id: 'app1', type: 'app', title: 'ClipMaster Pro', subtitle: 'Mini App • 450 installs', href: '/admin/rewards/app-store/1', icon: Smartphone },
  ].filter(r => 
    r.title.toLowerCase().includes(query.toLowerCase()) ||
    r.subtitle?.toLowerCase().includes(query.toLowerCase())
  ) : [];

  // Settings pages
  const settingsPages: SearchResult[] = query.length > 0 ? [
    { id: 'p1', type: 'page', title: 'Feature Toggles', href: '/admin/config/feature-toggles', icon: ToggleLeft },
    { id: 'p2', type: 'page', title: 'Tier Management', href: '/admin/config/tiers', icon: Settings },
    { id: 'p3', type: 'page', title: 'API Management', href: '/admin/integrations/api', icon: Key },
  ].filter(p => p.title.toLowerCase().includes(query.toLowerCase())) : [];

  const allResults = [...searchResults, ...settingsPages];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = query.length > 0 ? allResults.length : quickActions.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const items = query.length > 0 ? allResults : quickActions;
      if (items[selectedIndex]) {
        router.push(items[selectedIndex].href);
        setIsOpen(false);
        setQuery('');
      }
    }
  }, [query, allResults, quickActions, selectedIndex, router]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative max-w-2xl mx-auto mt-[10vh]">
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl overflow-hidden shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 border-b border-[#1a1a2e]">
            <Search size={20} className="text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search agencies, creators, campaigns, settings..."
              className="flex-1 py-4 bg-transparent text-white placeholder:text-gray-500 focus:outline-none"
            />
            <kbd className="px-2 py-1 bg-[#1a1a2e] rounded text-xs text-gray-500">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {query.length === 0 ? (
              // Quick Actions
              <div className="p-2">
                <div className="px-3 py-2 text-xs text-gray-500 uppercase">
                  Quick Actions
                </div>
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => {
                        router.push(action.href);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
                        selectedIndex === index ? 'bg-purple-500/20 text-purple-400' : 'text-gray-300 hover:bg-white/5'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span>{action.title}</span>
                      </div>
                      {action.shortcut && (
                        <kbd className="px-2 py-0.5 bg-[#1a1a2e] rounded text-xs text-gray-500">
                          {action.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : allResults.length > 0 ? (
              // Search Results
              <div className="p-2">
                {/* Entities */}
                {searchResults.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs text-gray-500 uppercase">
                      Results
                    </div>
                    {searchResults.map((result, index) => {
                      const Icon = result.icon;
                      return (
                        <button
                          key={result.id}
                          onClick={() => {
                            router.push(result.href);
                            setIsOpen(false);
                            setQuery('');
                          }}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
                            selectedIndex === index ? 'bg-purple-500/20 text-purple-400' : 'text-gray-300 hover:bg-white/5'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#1a1a2e] flex items-center justify-center">
                              <Icon size={16} />
                            </div>
                            <div className="text-left">
                              <div className="font-medium">{result.title}</div>
                              {result.subtitle && (
                                <div className="text-xs text-gray-500">{result.subtitle}</div>
                              )}
                            </div>
                          </div>
                          <ArrowRight size={16} className="text-gray-600" />
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Settings Pages */}
                {settingsPages.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs text-gray-500 uppercase mt-2">
                      Settings
                    </div>
                    {settingsPages.map((page, index) => {
                      const Icon = page.icon;
                      const adjustedIndex = searchResults.length + index;
                      return (
                        <button
                          key={page.id}
                          onClick={() => {
                            router.push(page.href);
                            setIsOpen(false);
                            setQuery('');
                          }}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
                            selectedIndex === adjustedIndex ? 'bg-purple-500/20 text-purple-400' : 'text-gray-300 hover:bg-white/5'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={18} />
                            <span>{page.title}</span>
                          </div>
                          <ArrowRight size={16} className="text-gray-600" />
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            ) : (
              // No Results
              <div className="p-8 text-center">
                <Search size={32} className="mx-auto text-gray-600 mb-2" />
                <p className="text-gray-400">No results found for "{query}"</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-[#1a1a2e] text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#1a1a2e] rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-[#1a1a2e] rounded">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#1a1a2e] rounded">↵</kbd>
                to select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Command size={12} />
              <kbd className="px-1.5 py-0.5 bg-[#1a1a2e] rounded">K</kbd>
              to search
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export a hook to trigger search from elsewhere
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
}


























































































