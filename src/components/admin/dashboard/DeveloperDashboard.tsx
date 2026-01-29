'use client';

import React from 'react';
import Link from 'next/link';
import { StatCard } from './StatCard';
import { QuickAction } from './QuickAction';
import { 
  DollarSign, 
  Smartphone,
  Download,
  Star,
  TrendingUp,
  Plus,
  Megaphone,
  Link2,
  Settings,
  Eye,
  Users,
  ArrowUpRight,
} from 'lucide-react';

export function DeveloperDashboard() {
  // In real implementation, fetch this data from API
  const stats = {
    totalRevenue: 8450,
    pendingPayout: 1250,
    totalInstalls: 2340,
    avgRating: 4.6,
    affiliateTier: 'silver',
    referrals: 23,
  };

  const apps = [
    { 
      name: 'Viral Predictor Pro', 
      installs: 1245, 
      revenue: 4980, 
      rating: 4.8,
      status: 'approved',
      monthlyChange: 12,
    },
    { 
      name: 'Content Calendar', 
      installs: 890, 
      revenue: 2670, 
      rating: 4.5,
      status: 'approved',
      monthlyChange: 8,
    },
    { 
      name: 'Hashtag Generator', 
      installs: 205, 
      revenue: 800, 
      rating: 4.3,
      status: 'approved',
      monthlyChange: -3,
    },
  ];

  const activeCampaigns = [
    { name: 'Summer Install Push', budget: 2000, spent: 1200, installs: 89, status: 'active' },
    { name: 'New App Launch', budget: 500, spent: 0, installs: 0, status: 'draft' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={`$${(stats.totalRevenue / 1000).toFixed(1)}K`}
          subtitle="Your 70% after platform fee"
          trend={{ value: 15, isPositive: true }}
          color="green"
        />
        <StatCard
          icon={Download}
          title="Total Installs"
          value={stats.totalInstalls.toLocaleString()}
          trend={{ value: 23, isPositive: true }}
          color="blue"
        />
        <StatCard
          icon={Star}
          title="Avg Rating"
          value={stats.avgRating}
          subtitle="Across all apps"
          color="yellow"
        />
        <StatCard
          icon={DollarSign}
          title="Pending Payout"
          value={`$${stats.pendingPayout}`}
          subtitle="Request withdrawal"
          color="purple"
        />
      </div>

      {/* Affiliate Status */}
      <div className="bg-gradient-to-r from-gray-500/10 to-purple-500/10 border border-[#1a1a2e] rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🥈</div>
            <div>
              <div className="text-sm text-gray-400">Affiliate Tier</div>
              <div className="text-xl font-bold text-purple-400 capitalize">{stats.affiliateTier}</div>
              <div className="text-sm text-gray-500">{stats.referrals} referrals • 15% commission</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Next tier: Gold</div>
            <div className="text-sm text-gray-500">{50 - stats.referrals} more referrals needed</div>
            <div className="w-32 h-2 bg-[#1a1a2e] rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${(stats.referrals / 50) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <QuickAction icon={Plus} label="Submit New App" href="/admin/rewards/app-store/submit" color="green" />
        <QuickAction icon={Megaphone} label="Create Campaign" href="/admin/rewards/app-campaigns/create" color="blue" />
        <QuickAction icon={Link2} label="Affiliate Link" href="/admin/rewards/affiliate" color="purple" />
        <QuickAction icon={Settings} label="Settings" href="/admin/settings" color="default" />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Your Apps */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Smartphone size={18} className="text-green-400" />
              Your Apps
            </h3>
            <Link href="/admin/rewards/app-store?view=mine" className="text-sm text-green-400 hover:text-green-300">
              Manage →
            </Link>
          </div>
          <div className="space-y-3">
            {apps.map((app) => (
              <div key={app.name} className="flex items-center justify-between py-3 border-b border-[#1a1a2e] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    <Smartphone size={18} className="text-green-400" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{app.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Download size={10} />
                        {app.installs}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star size={10} className="text-yellow-400" />
                        {app.rating}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-semibold">${app.revenue}</div>
                  <div className={`text-xs flex items-center justify-end gap-1 ${
                    app.monthlyChange >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <ArrowUpRight size={10} className={app.monthlyChange < 0 ? 'rotate-90' : ''} />
                    {app.monthlyChange >= 0 ? '+' : ''}{app.monthlyChange}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* App Campaigns */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Megaphone size={18} className="text-blue-400" />
              Your Campaigns
            </h3>
            <Link href="/admin/rewards/app-campaigns" className="text-sm text-blue-400 hover:text-blue-300">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {activeCampaigns.map((campaign) => (
              <div key={campaign.name} className="py-3 border-b border-[#1a1a2e] last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">{campaign.name}</div>
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    campaign.status === 'draft' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Download size={12} />
                    {campaign.installs} installs
                  </span>
                  <span>
                    ${campaign.spent} / ${campaign.budget}
                  </span>
                </div>
                {campaign.budget > 0 && (
                  <div className="h-1.5 bg-[#1a1a2e] rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
            {activeCampaigns.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Megaphone size={32} className="mx-auto mb-2 opacity-50" />
                <p>No campaigns yet</p>
                <Link href="/admin/rewards/app-campaigns/create" className="text-blue-400 text-sm hover:underline">
                  Create your first campaign
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-green-400" />
          Revenue Breakdown
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#0a0a0f] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">${(stats.totalRevenue * 0.7).toFixed(0)}</div>
            <div className="text-sm text-gray-400">App Sales (70%)</div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">${(stats.referrals * 15).toFixed(0)}</div>
            <div className="text-sm text-gray-400">Affiliate Commissions</div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">${120}</div>
            <div className="text-sm text-gray-400">Campaign Refunds</div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">${stats.pendingPayout}</div>
            <div className="text-sm text-gray-400">Available to Withdraw</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeveloperDashboard;


























































































