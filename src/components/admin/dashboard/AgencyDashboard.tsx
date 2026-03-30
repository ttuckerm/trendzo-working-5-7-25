'use client';

import React from 'react';
import Link from 'next/link';
import { StatCard } from './StatCard';
import { QuickAction } from './QuickAction';
import { 
  Users, 
  Video, 
  TrendingUp,
  DollarSign,
  UserPlus,
  Film,
  BarChart3,
  Settings,
  Zap,
  Eye,
  Clock,
} from 'lucide-react';

export function AgencyDashboard() {
  // In real implementation, fetch this data from API
  const stats = {
    creators: 45,
    videosThisMonth: 234,
    avgDps: 67.8,
    earnings: 12450,
  };

  const usage = {
    videosUsed: 234,
    videosLimit: 500,
    apiCalls: 8500,
    apiLimit: 10000,
    storageUsed: 12.4,
    storageLimit: 20,
  };

  const topCreators = [
    { name: '@viralqueen', dps: 82.3, videos: 45, earnings: 2340 },
    { name: '@tiktokpro', dps: 78.1, videos: 38, earnings: 1890 },
    { name: '@contentking', dps: 74.5, videos: 52, earnings: 2100 },
    { name: '@socialspark', dps: 71.2, videos: 29, earnings: 1450 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          title="Total Creators"
          value={stats.creators}
          trend={{ value: 5, isPositive: true }}
          color="purple"
        />
        <StatCard
          icon={Video}
          title="Videos This Month"
          value={stats.videosThisMonth}
          subtitle={`${usage.videosLimit - usage.videosUsed} remaining`}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          title="Avg Creator DPS"
          value={stats.avgDps}
          trend={{ value: 3.2, isPositive: true }}
          color="green"
        />
        <StatCard
          icon={DollarSign}
          title="This Month Earnings"
          value={`$${(stats.earnings / 1000).toFixed(1)}K`}
          subtitle="From content campaigns"
          color="green"
        />
      </div>

      {/* Usage Meters */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-400" />
          Usage This Period
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Videos Analyzed</span>
              <span className="text-white">{usage.videosUsed} / {usage.videosLimit}</span>
            </div>
            <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(usage.videosUsed / usage.videosLimit) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">API Calls</span>
              <span className="text-white">{(usage.apiCalls / 1000).toFixed(1)}K / {(usage.apiLimit / 1000)}K</span>
            </div>
            <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${(usage.apiCalls / usage.apiLimit) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Storage</span>
              <span className="text-white">{usage.storageUsed}GB / {usage.storageLimit}GB</span>
            </div>
            <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${(usage.storageUsed / usage.storageLimit) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <QuickAction icon={UserPlus} label="Add Creator" href="/admin/organization/creators/create" color="purple" />
        <QuickAction icon={Film} label="Create Campaign" href="/admin/rewards/content-campaigns/create" color="blue" />
        <QuickAction icon={Zap} label="Viral Studio" href="/admin/viral-studio" color="yellow" />
        <QuickAction icon={Settings} label="Agency Settings" href="/admin/settings" color="default" />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top Creators */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users size={18} className="text-purple-400" />
              Top Creators
            </h3>
            <Link href="/admin/organization/creators" className="text-sm text-purple-400 hover:text-purple-300">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {topCreators.map((creator, i) => (
              <div key={creator.name} className="flex items-center justify-between py-2 border-b border-[#1a1a2e] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm w-4">{i + 1}</span>
                  <div>
                    <div className="font-medium text-sm">{creator.name}</div>
                    <div className="text-xs text-gray-500">{creator.videos} videos</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-semibold">{creator.dps} DPS</div>
                  <div className="text-xs text-gray-500">${creator.earnings.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Film size={18} className="text-blue-400" />
              Your Campaigns
            </h3>
            <Link href="/admin/rewards/content-campaigns" className="text-sm text-blue-400 hover:text-blue-300">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Summer Viral Challenge', status: 'active', views: 245000, budget: 5000, spent: 3200 },
              { name: 'Product Launch Push', status: 'active', views: 89000, budget: 2000, spent: 1100 },
              { name: 'Brand Awareness Q4', status: 'paused', views: 0, budget: 10000, spent: 0 },
            ].map((campaign) => (
              <div key={campaign.name} className="py-2 border-b border-[#1a1a2e] last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-sm">{campaign.name}</div>
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    campaign.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Eye size={12} />
                    {(campaign.views / 1000).toFixed(0)}K views
                  </span>
                  <span className="text-gray-400">
                    ${campaign.spent} / ${campaign.budget}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Clock size={18} className="text-gray-400" />
          Recent Activity
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { text: '@viralqueen analyzed video', time: '5 min ago' },
            { text: 'New creator joined: @newstar', time: '1 hour ago' },
            { text: 'Campaign "Summer Challenge" reached 200K views', time: '2 hours ago' },
            { text: '@tiktokpro hit 80+ DPS milestone', time: '3 hours ago' },
            { text: 'Payout of $450 processed', time: '5 hours ago' },
            { text: 'API key generated', time: '1 day ago' },
          ].map((activity, i) => (
            <div key={i} className="text-sm">
              <div className="text-gray-300">{activity.text}</div>
              <div className="text-xs text-gray-500">{activity.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AgencyDashboard;


























































































