'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Store,
  Plus,
  Search,
  Filter,
  Star,
  Download,
  DollarSign,
  ChevronDown,
  Megaphone,
  Check,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminUser } from '@/hooks/useAdminUser';

type AppCategory = 'all' | 'analytics' | 'editing' | 'automation' | 'ai' | 'other';
type AppStatus = 'approved' | 'pending' | 'rejected';

interface MiniApp {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  category: AppCategory;
  developer_id: string;
  developer_name: string;
  price_monthly: number;
  rating: number;
  review_count: number;
  install_count: number;
  monthly_revenue: number;
  has_active_campaign: boolean;
  status: AppStatus;
  featured: boolean;
  created_at: string;
}

export default function AppStorePage() {
  const router = useRouter();
  const { role } = useAdminUser();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AppCategory>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'price'>('popular');
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  const isChairman = role === 'chairman';
  const isDeveloper = role === 'developer';

  // Mock data
  const apps: MiniApp[] = [
    {
      id: '1',
      name: 'ClipMaster Pro',
      tagline: 'AI-powered clip extraction from long-form content',
      icon: '✂️',
      category: 'editing',
      developer_id: 'd1',
      developer_name: 'DevStudio Inc',
      price_monthly: 19,
      rating: 4.8,
      review_count: 124,
      install_count: 450,
      monthly_revenue: 8550,
      has_active_campaign: true,
      status: 'approved',
      featured: true,
      created_at: '2024-01-15',
    },
    {
      id: '2',
      name: 'Viral Tracker',
      tagline: 'Track trending sounds and hashtags in real-time',
      icon: '📈',
      category: 'analytics',
      developer_id: 'd2',
      developer_name: 'Analytics Pro',
      price_monthly: 29,
      rating: 4.6,
      review_count: 89,
      install_count: 320,
      monthly_revenue: 9280,
      has_active_campaign: false,
      status: 'approved',
      featured: true,
      created_at: '2024-02-01',
    },
    {
      id: '3',
      name: 'Hook Generator',
      tagline: 'Generate viral hooks using AI',
      icon: '🎣',
      category: 'ai',
      developer_id: 'd3',
      developer_name: 'AI Tools Lab',
      price_monthly: 15,
      rating: 4.5,
      review_count: 67,
      install_count: 280,
      monthly_revenue: 4200,
      has_active_campaign: true,
      status: 'approved',
      featured: false,
      created_at: '2024-02-10',
    },
    {
      id: '4',
      name: 'Caption AI',
      tagline: 'Auto-generate engaging captions',
      icon: '💬',
      category: 'ai',
      developer_id: 'd4',
      developer_name: 'Caption Co',
      price_monthly: 12,
      rating: 4.3,
      review_count: 45,
      install_count: 200,
      monthly_revenue: 2400,
      has_active_campaign: false,
      status: 'approved',
      featured: false,
      created_at: '2024-02-20',
    },
    {
      id: '5',
      name: 'Auto Poster',
      tagline: 'Schedule and auto-post to multiple platforms',
      icon: '🤖',
      category: 'automation',
      developer_id: 'd5',
      developer_name: 'Automation Inc',
      price_monthly: 25,
      rating: 0,
      review_count: 0,
      install_count: 0,
      monthly_revenue: 0,
      has_active_campaign: false,
      status: 'pending',
      featured: false,
      created_at: '2024-03-15',
    },
  ];

  const filteredApps = apps
    .filter(a => showPendingOnly ? a.status === 'pending' : a.status === 'approved')
    .filter(a => categoryFilter === 'all' || a.category === categoryFilter)
    .filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 a.tagline.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular': return b.install_count - a.install_count;
        case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'rating': return b.rating - a.rating;
        case 'price': return a.price_monthly - b.price_monthly;
        default: return 0;
      }
    });

  const pendingCount = apps.filter(a => a.status === 'pending').length;
  const featuredApps = apps.filter(a => a.featured && a.status === 'approved');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Store className="text-green-400" />
            Mini App Store
          </h1>
          <p className="text-gray-400 mt-1">
            {isChairman && `${apps.filter(a => a.status === 'approved').length} apps • $${(apps.reduce((sum, a) => sum + a.monthly_revenue, 0) * 0.3 / 1000).toFixed(1)}K/mo platform revenue`}
            {isDeveloper && 'Build and publish mini apps. You keep 70% of revenue.'}
            {!isChairman && !isDeveloper && 'Discover tools to enhance your content creation'}
          </p>
        </div>
        {isDeveloper && (
          <Link
            href="/admin/rewards/app-store/submit"
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors font-medium"
          >
            <Plus size={18} />
            Submit App
          </Link>
        )}
      </div>

      {/* Chairman: Pending Approval Alert */}
      {isChairman && pendingCount > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="text-yellow-400" size={20} />
            <span className="text-yellow-400">
              {pendingCount} app{pendingCount > 1 ? 's' : ''} pending approval
            </span>
          </div>
          <button
            onClick={() => setShowPendingOnly(true)}
            className="text-sm text-yellow-400 hover:text-yellow-300 font-medium"
          >
            Review Now →
          </button>
        </div>
      )}

      {/* Featured Apps */}
      {!showPendingOnly && featuredApps.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Star size={18} className="text-yellow-400 fill-yellow-400" />
            Featured Apps
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {featuredApps.map((app) => (
              <div 
                key={app.id}
                className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-5 cursor-pointer hover:border-yellow-500/50 transition-colors"
                onClick={() => router.push(`/admin/rewards/app-store/${app.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-[#1a1a2e] rounded-xl flex items-center justify-center text-3xl">
                    {app.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{app.name}</h3>
                      {app.has_active_campaign && (
                        <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded flex items-center gap-1">
                          <Megaphone size={10} />
                          Campaign
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{app.tagline}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-sm">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        {app.rating}
                      </span>
                      <span className="text-sm text-gray-400">
                        {app.install_count} installs
                      </span>
                      <span className="text-sm text-green-400 font-medium">
                        ${app.price_monthly}/mo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500/50"
          />
        </div>

        {isChairman && (
          <button
            onClick={() => setShowPendingOnly(!showPendingOnly)}
            className={cn(
              'px-4 py-2 rounded-lg border transition-colors',
              showPendingOnly
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                : 'bg-[#111118] border-[#1a1a2e] text-gray-400 hover:border-[#2a2a3e]'
            )}
          >
            {showPendingOnly ? 'Show All' : `Pending (${pendingCount})`}
          </button>
        )}

        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as AppCategory)}
            className="appearance-none px-4 py-2 pr-10 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="analytics">Analytics</option>
            <option value="editing">Editing</option>
            <option value="automation">Automation</option>
            <option value="ai">AI Tools</option>
            <option value="other">Other</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none px-4 py-2 pr-10 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white focus:outline-none cursor-pointer"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="rating">Top Rated</option>
            <option value="price">Lowest Price</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filteredApps.map((app) => (
          <div 
            key={app.id}
            className={cn(
              'bg-[#111118] border rounded-xl p-5 cursor-pointer transition-colors',
              app.status === 'pending' 
                ? 'border-yellow-500/30 hover:border-yellow-500/50'
                : 'border-[#1a1a2e] hover:border-green-500/30'
            )}
            onClick={() => router.push(`/admin/rewards/app-store/${app.id}`)}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 bg-[#1a1a2e] rounded-xl flex items-center justify-center text-2xl">
                {app.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{app.name}</h3>
                  {app.has_active_campaign && (
                    <Megaphone size={14} className="text-green-400 shrink-0" />
                  )}
                </div>
                <p className="text-sm text-gray-400 truncate">{app.tagline}</p>
                <p className="text-xs text-gray-500 mt-1">by {app.developer_name}</p>
              </div>
            </div>

            {app.status === 'pending' ? (
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                  Pending Review
                </span>
                {isChairman && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); /* reject */ }}
                      className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30"
                    >
                      Reject
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); /* approve */ }}
                      className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-sm">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    {app.rating || 'New'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {app.install_count} installs
                  </span>
                </div>
                <span className="text-green-400 font-semibold">
                  ${app.price_monthly}/mo
                </span>
              </div>
            )}

            {/* Chairman: Revenue Info */}
            {isChairman && app.status === 'approved' && (
              <div className="mt-3 pt-3 border-t border-[#1a1a2e] flex justify-between text-sm">
                <span className="text-gray-400">Monthly Revenue</span>
                <span className="text-green-400">
                  ${app.monthly_revenue.toLocaleString()} 
                  <span className="text-gray-500 ml-1">(you: ${(app.monthly_revenue * 0.3).toFixed(0)})</span>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredApps.length === 0 && (
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-12 text-center">
          <Store size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium mb-2">No apps found</h3>
          <p className="text-gray-400">
            {showPendingOnly ? 'No apps pending approval' : 'Try adjusting your filters'}
          </p>
        </div>
      )}
    </div>
  );
}


























































































