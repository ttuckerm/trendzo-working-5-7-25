'use client';

import React from 'react';
import Link from 'next/link';
import { StatCard } from './StatCard';
import { QuickAction } from './QuickAction';
import { 
  DollarSign, 
  Eye,
  Scissors,
  TrendingUp,
  Megaphone,
  Link2,
  Wallet,
  User,
  ArrowUpRight,
  Clock,
  Video,
} from 'lucide-react';
import { AFFILIATE_TIER_CONFIG } from '@/types/admin';

export function ClipperDashboard() {
  // In real implementation, fetch this data from API
  const stats = {
    totalEarnings: 2450,
    pendingEarnings: 380,
    totalViews: 890000,
    totalClips: 67,
    ambassadorTier: 'silver' as const,
    referrals: 15,
  };

  const tierConfig = AFFILIATE_TIER_CONFIG[stats.ambassadorTier];
  const nextTier = 'gold';
  const nextTierConfig = AFFILIATE_TIER_CONFIG[nextTier];

  const activeCampaigns = [
    { 
      name: 'CleanCopy Summer Push', 
      type: 'platform', 
      earnings: 180, 
      views: 45000,
      payRate: '$2/1K views',
    },
    { 
      name: 'Viral Agency Content', 
      type: 'content', 
      earnings: 120, 
      views: 30000,
      payRate: '$4/1K views',
    },
    { 
      name: 'Predictor Pro Launch', 
      type: 'miniapp', 
      earnings: 80, 
      views: 0,
      installs: 8,
      payRate: '$10/install',
    },
  ];

  const recentClips = [
    { title: 'Hook compilation #viral', platform: 'TikTok', views: 45000, earnings: 90 },
    { title: 'Best moments edit', platform: 'Instagram', views: 23000, earnings: 46 },
    { title: 'Trending sound remix', platform: 'TikTok', views: 67000, earnings: 134 },
  ];

  return (
    <div className="space-y-6">
      {/* Ambassador Tier Banner */}
      <div className="bg-gradient-to-r from-gray-500/10 via-purple-500/10 to-gray-500/10 border border-[#1a1a2e] rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{tierConfig.emoji}</div>
            <div>
              <div className="text-sm text-gray-400">Ambassador Tier</div>
              <div className="text-2xl font-bold" style={{ color: tierConfig.color }}>
                {tierConfig.label}
              </div>
              <div className="text-sm text-gray-500">
                {stats.referrals} referrals • {tierConfig.commissionRate}% commission
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">
              Next: {nextTierConfig.emoji} {nextTierConfig.label}
            </div>
            <div className="text-sm text-gray-500 mb-2">
              {nextTierConfig.minReferrals - stats.referrals} more referrals needed
            </div>
            <div className="w-40 h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all"
                style={{ 
                  width: `${(stats.referrals / nextTierConfig.minReferrals) * 100}%`,
                  backgroundColor: tierConfig.color,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          title="Total Earnings"
          value={`$${stats.totalEarnings.toLocaleString()}`}
          trend={{ value: 23, isPositive: true }}
          color="green"
        />
        <StatCard
          icon={Wallet}
          title="Pending"
          value={`$${stats.pendingEarnings}`}
          subtitle="Available to withdraw"
          color="yellow"
        />
        <StatCard
          icon={Eye}
          title="Total Views"
          value={`${(stats.totalViews / 1000).toFixed(0)}K`}
          trend={{ value: 45, isPositive: true }}
          color="blue"
        />
        <StatCard
          icon={Scissors}
          title="Clips Submitted"
          value={stats.totalClips}
          trend={{ value: 8, isPositive: true }}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <QuickAction icon={Megaphone} label="Browse Campaigns" href="/admin/rewards" color="blue" />
        <QuickAction icon={Video} label="Submit Clip" href="/admin/rewards/submit-clip" color="purple" />
        <QuickAction icon={Link2} label="My Referral Link" href="/admin/rewards/affiliate" color="green" />
        <QuickAction icon={Wallet} label="Withdraw" href="/admin/rewards/payouts" color="yellow" />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Active Campaigns */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Megaphone size={18} className="text-blue-400" />
              Your Campaigns
            </h3>
            <Link href="/admin/rewards" className="text-sm text-blue-400 hover:text-blue-300">
              Find More →
            </Link>
          </div>
          <div className="space-y-3">
            {activeCampaigns.map((campaign) => (
              <div key={campaign.name} className="py-3 border-b border-[#1a1a2e] last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-sm">{campaign.name}</div>
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    campaign.type === 'platform' ? 'bg-yellow-500/20 text-yellow-400' :
                    campaign.type === 'content' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {campaign.type}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    {campaign.type === 'miniapp' 
                      ? `${campaign.installs} installs`
                      : `${(campaign.views / 1000).toFixed(0)}K views`
                    }
                    <span className="text-gray-600 ml-2">{campaign.payRate}</span>
                  </span>
                  <span className="text-green-400 font-medium">
                    +${campaign.earnings}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Clips */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Scissors size={18} className="text-purple-400" />
              Recent Clips
            </h3>
            <Link href="/admin/my-clips" className="text-sm text-purple-400 hover:text-purple-300">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentClips.map((clip) => (
              <div key={clip.title} className="flex items-center justify-between py-2 border-b border-[#1a1a2e] last:border-0">
                <div>
                  <div className="font-medium text-sm">{clip.title}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{clip.platform}</span>
                    <span>•</span>
                    <Eye size={10} />
                    {(clip.views / 1000).toFixed(0)}K
                  </div>
                </div>
                <div className="text-green-400 font-semibold">
                  +${clip.earnings}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-green-400" />
          Earnings Breakdown
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#0a0a0f] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">$1,200</div>
            <div className="text-sm text-gray-400">Platform Campaigns</div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">$850</div>
            <div className="text-sm text-gray-400">Content Campaigns</div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">$280</div>
            <div className="text-sm text-gray-400">App Campaigns</div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">$120</div>
            <div className="text-sm text-gray-400">Referral Bonuses</div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-[#1a1a2e] rounded-xl p-5">
        <h3 className="font-semibold mb-3">💡 Tips to Earn More</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-gray-400">Focus on platform campaigns for consistent pay</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-gray-400">Share your referral link to unlock Gold tier (20% commission)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-gray-400">Mini app campaigns often have higher per-action payouts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClipperDashboard;


























































































