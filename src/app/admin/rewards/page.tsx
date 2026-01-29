'use client';

import React from 'react';
import Link from 'next/link';
import {
  Gift,
  DollarSign,
  Megaphone,
  Film,
  Smartphone,
  Store,
  Link2,
  Users,
  TrendingUp,
  Eye,
  Download,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatCard } from '@/components/admin/dashboard/StatCard';

export default function RewardsOverviewPage() {
  // Mock data
  const stats = {
    totalRevenue: 444800,
    miniAppRevenue: 22000,
    campaignFees: 6800,
    activeClippers: 89,
    pendingPayouts: 12500,
  };

  const layers = {
    platform: {
      active: 3,
      total_spent: 19000,
      signups: 370,
      views: 2400000,
    },
    content: {
      active: 3,
      total_spent: 4200,
      your_fee: 840,
      views: 890000,
    },
    miniapp: {
      active: 3,
      total_spent: 3800,
      your_fee: 760,
      installs: 1250,
    },
  };

  const topApps = [
    { id: '1', name: 'ClipMaster Pro', icon: '✂️', installs: 450, revenue: 8550, hasActiveCampaign: true },
    { id: '2', name: 'Viral Tracker', icon: '📈', installs: 320, revenue: 6080, hasActiveCampaign: false },
    { id: '3', name: 'Hook Generator', icon: '🎣', installs: 280, revenue: 5320, hasActiveCampaign: true },
    { id: '4', name: 'Caption AI', icon: '💬', installs: 200, revenue: 3800, hasActiveCampaign: false },
    { id: '5', name: 'Trend Finder', icon: '🔍', installs: 150, revenue: 2850, hasActiveCampaign: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Gift className="text-purple-400" />
          Rewards Ecosystem
        </h1>
        <p className="text-gray-400 mt-1">
          Manage campaigns, mini apps, affiliate program, and payouts
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={`$${(stats.totalRevenue / 1000).toFixed(1)}K/mo`}
          color="green"
        />
        <StatCard
          icon={Smartphone}
          title="Mini App Revenue"
          value={`$${(stats.miniAppRevenue / 1000).toFixed(1)}K`}
          subtitle="30% platform cut"
          color="blue"
        />
        <StatCard
          icon={Film}
          title="Campaign Fees"
          value={`$${(stats.campaignFees / 1000).toFixed(1)}K`}
          subtitle="20% platform cut"
          color="purple"
        />
        <StatCard
          icon={Users}
          title="Active Clippers"
          value={stats.activeClippers}
          color="yellow"
        />
        <StatCard
          icon={DollarSign}
          title="Pending Payouts"
          value={`$${(stats.pendingPayouts / 1000).toFixed(1)}K`}
          color="red"
        />
      </div>

      {/* Three-Layer Ecosystem */}
      <div className="bg-gradient-to-r from-yellow-500/5 via-blue-500/5 to-green-500/5 border border-[#1a1a2e] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-center mb-6">
          🔄 The Three-Layer Rewards Ecosystem
        </h2>
        
        <div className="grid grid-cols-3 gap-6">
          {/* Layer 1: Platform Campaigns */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="text-yellow-400" size={20} />
              <span className="font-semibold text-yellow-400">Layer 1: Platform</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              You fund campaigns to promote CleanCopy. Pay clippers for views + signups.
            </p>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Active Campaigns</span>
                <span className="font-semibold">{layers.platform.active}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Spent</span>
                <span className="font-semibold text-yellow-400">
                  ${(layers.platform.total_spent / 1000).toFixed(1)}K
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Signups Generated</span>
                <span className="font-semibold text-green-400">{layers.platform.signups}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Views</span>
                <span className="font-semibold">{(layers.platform.views / 1000000).toFixed(1)}M</span>
              </div>
            </div>

            <div className="pt-4 border-t border-yellow-500/20 text-center">
              <div className="text-xs text-gray-500 mb-2">Your Investment</div>
              <div className="text-2xl font-bold text-yellow-400">
                ${(layers.platform.total_spent / 1000).toFixed(1)}K
              </div>
              <div className="text-xs text-green-400 mt-1">
                {layers.platform.signups} new users → LTV $50+/user
              </div>
            </div>

            <Link 
              href="/admin/rewards/platform-campaigns"
              className="mt-4 block w-full py-2 text-center bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              Manage Campaigns →
            </Link>
          </div>

          {/* Layer 2: Content Campaigns */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Film className="text-blue-400" size={20} />
              <span className="font-semibold text-blue-400">Layer 2: Content</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Agencies/Creators pay clippers to distribute their content. You take 20%.
            </p>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Active Campaigns</span>
                <span className="font-semibold">{layers.content.active}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Spent</span>
                <span className="font-semibold text-blue-400">
                  ${(layers.content.total_spent / 1000).toFixed(1)}K
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Your Fee (20%)</span>
                <span className="font-semibold text-green-400">
                  ${(layers.content.your_fee).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Views</span>
                <span className="font-semibold">{(layers.content.views / 1000).toFixed(0)}K</span>
              </div>
            </div>

            <div className="pt-4 border-t border-blue-500/20 text-center">
              <div className="text-xs text-gray-500 mb-2">Your Revenue (20% fee)</div>
              <div className="text-2xl font-bold text-green-400">
                ${layers.content.your_fee.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                From ${(layers.content.total_spent / 1000).toFixed(1)}K campaign spend
              </div>
            </div>

            <Link 
              href="/admin/rewards/content-campaigns"
              className="mt-4 block w-full py-2 text-center bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              Manage Campaigns →
            </Link>
          </div>

          {/* Layer 3: Mini App Campaigns */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="text-green-400" size={20} />
              <span className="font-semibold text-green-400">Layer 3: Mini Apps</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Developers pay for app promotion. Pay per views/installs. You take 20%.
            </p>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Active Campaigns</span>
                <span className="font-semibold">{layers.miniapp.active}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Spent</span>
                <span className="font-semibold text-green-400">
                  ${(layers.miniapp.total_spent / 1000).toFixed(1)}K
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Your Fee (20%)</span>
                <span className="font-semibold text-green-400">
                  ${layers.miniapp.your_fee.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">App Installs</span>
                <span className="font-semibold">{layers.miniapp.installs.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-green-500/20 text-center">
              <div className="text-xs text-gray-500 mb-2">Your Revenue (20% fee)</div>
              <div className="text-2xl font-bold text-green-400">
                ${layers.miniapp.your_fee.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                + 30% of ${(stats.miniAppRevenue / 1000).toFixed(0)}K app subscriptions
              </div>
            </div>

            <Link 
              href="/admin/rewards/app-campaigns"
              className="mt-4 block w-full py-2 text-center bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
            >
              Manage Campaigns →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Mini App Marketplace + Revenue Stack */}
      <div className="grid grid-cols-3 gap-6">
        {/* Mini App Marketplace Preview */}
        <div className="col-span-2 bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Store size={18} className="text-green-400" />
              Mini App Marketplace
            </h3>
            <Link 
              href="/admin/rewards/app-store"
              className="text-sm text-green-400 hover:text-green-300"
            >
              View All Apps →
            </Link>
          </div>

          <div className="space-y-3">
            {topApps.map((app, i) => (
              <div 
                key={app.id}
                className="flex items-center justify-between py-3 border-b border-[#1a1a2e] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 w-5">{i + 1}</span>
                  <div className="w-10 h-10 bg-[#1a1a2e] rounded-lg flex items-center justify-center text-xl">
                    {app.icon}
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {app.name}
                      {app.hasActiveCampaign && (
                        <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                          Campaign
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {app.installs.toLocaleString()} installs
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-semibold">
                    ${(app.revenue).toLocaleString()}/mo
                  </div>
                  <div className="text-xs text-gray-500">
                    You earn ${((app.revenue * 0.3).toFixed(0))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Stack Widget */}
        <div className="bg-gradient-to-b from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-5">
          <h3 className="font-semibold mb-4 text-center">Revenue Stack</h3>
          
          <div className="space-y-4">
            {/* Subscription Revenue */}
            <div className="bg-[#0a0a0f] rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <DollarSign size={14} />
                Agency Subscriptions
              </div>
              <div className="text-xl font-bold text-green-400">
                ${((stats.totalRevenue - stats.miniAppRevenue - stats.campaignFees) / 1000).toFixed(0)}K/mo
              </div>
            </div>

            {/* Mini App Revenue */}
            <div className="bg-[#0a0a0f] rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <Smartphone size={14} />
                Mini App Revenue (30%)
              </div>
              <div className="text-xl font-bold text-blue-400">
                ${(stats.miniAppRevenue * 0.3 / 1000).toFixed(1)}K/mo
              </div>
            </div>

            {/* Campaign Fees */}
            <div className="bg-[#0a0a0f] rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <Megaphone size={14} />
                Campaign Fees (20%)
              </div>
              <div className="text-xl font-bold text-yellow-400">
                ${(stats.campaignFees / 1000).toFixed(1)}K/mo
              </div>
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-purple-500/30">
              <div className="text-sm text-gray-400 mb-1 text-center">Total Monthly</div>
              <div className="text-3xl font-bold text-center bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                ${(stats.totalRevenue / 1000).toFixed(0)}K
              </div>
            </div>
          </div>

          <Link 
            href="/admin/rewards/payouts"
            className="mt-4 block w-full py-2 text-center bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
          >
            View All Payouts →
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-4 gap-4">
        <Link
          href="/admin/rewards/platform-campaigns/create"
          className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl hover:bg-yellow-500/20 transition-colors group"
        >
          <span className="text-yellow-400 font-medium">Create Platform Campaign</span>
          <ArrowRight size={18} className="text-yellow-400 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/admin/rewards/app-store"
          className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl hover:bg-green-500/20 transition-colors group"
        >
          <span className="text-green-400 font-medium">Browse Mini Apps</span>
          <ArrowRight size={18} className="text-green-400 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/admin/rewards/affiliate"
          className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-colors group"
        >
          <span className="text-blue-400 font-medium">Affiliate Program</span>
          <ArrowRight size={18} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/admin/rewards/payouts"
          className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl hover:bg-purple-500/20 transition-colors group"
        >
          <span className="text-purple-400 font-medium">Process Payouts ({12})</span>
          <ArrowRight size={18} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}


























































































