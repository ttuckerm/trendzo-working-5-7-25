'use client';

import React, { useState } from 'react';
import {
  Link2,
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  ChevronRight,
  Trophy,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminUser } from '@/hooks/useAdminUser';

type AffiliateTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface AffiliateStats {
  total_referrals: number;
  this_month_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  current_tier: AffiliateTier;
  referrals_to_next_tier: number;
}

interface Referral {
  id: string;
  referred_email: string;
  referred_name: string;
  signed_up_at: string;
  converted: boolean;
  commission: number;
  status: 'pending' | 'paid';
}

const TIER_CONFIG: Record<AffiliateTier, { commission: number; threshold: number; color: string; bgColor: string }> = {
  bronze: { commission: 10, threshold: 0, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  silver: { commission: 15, threshold: 10, color: 'text-gray-300', bgColor: 'bg-gray-500/20' },
  gold: { commission: 20, threshold: 50, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  platinum: { commission: 25, threshold: 200, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  diamond: { commission: 30, threshold: 500, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
};

export default function AffiliatePage() {
  const { role, profile } = useAdminUser();
  const [copied, setCopied] = useState(false);

  const isChairman = role === 'chairman';

  // Mock data
  const stats: AffiliateStats = {
    total_referrals: 47,
    this_month_referrals: 8,
    total_earnings: 2350,
    pending_earnings: 425,
    current_tier: 'gold',
    referrals_to_next_tier: 153,
  };

  const referralCode = 'TOMMY2024';
  const referralLink = `https://cleancopy.ai/r/${referralCode}`;

  const referrals: Referral[] = [
    { id: '1', referred_email: 'john@agency.com', referred_name: 'John Smith', signed_up_at: '2024-03-15', converted: true, commission: 50, status: 'paid' },
    { id: '2', referred_email: 'sarah@creator.io', referred_name: 'Sarah Jones', signed_up_at: '2024-03-14', converted: true, commission: 50, status: 'pending' },
    { id: '3', referred_email: 'mike@studio.com', referred_name: 'Mike Chen', signed_up_at: '2024-03-12', converted: false, commission: 0, status: 'pending' },
  ];

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Chairman View
  if (isChairman) {
    return <ChairmanAffiliateView />;
  }

  // User View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Link2 className="text-blue-400" />
          Affiliate Program
        </h1>
        <p className="text-gray-400 mt-1">
          Earn commissions by referring new users to CleanCopy
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <DollarSign size={14} />
            Total Earnings
          </div>
          <div className="text-2xl font-bold text-green-400">
            ${stats.total_earnings.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <DollarSign size={14} />
            Pending
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            ${stats.pending_earnings.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Users size={14} />
            Total Referrals
          </div>
          <div className="text-2xl font-bold">{stats.total_referrals}</div>
        </div>
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <TrendingUp size={14} />
            This Month
          </div>
          <div className="text-2xl font-bold text-blue-400">{stats.this_month_referrals}</div>
        </div>
      </div>

      {/* Tier & Referral Link */}
      <div className="grid grid-cols-2 gap-6">
        {/* Current Tier */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-yellow-400" />
            Your Tier
          </h2>
          
          <div className="flex items-center gap-4 mb-6">
            <div className={cn(
              'w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold',
              TIER_CONFIG[stats.current_tier].bgColor,
              TIER_CONFIG[stats.current_tier].color
            )}>
              {stats.current_tier.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className={cn('text-xl font-bold capitalize', TIER_CONFIG[stats.current_tier].color)}>
                {stats.current_tier}
              </div>
              <div className="text-gray-400">
                {TIER_CONFIG[stats.current_tier].commission}% commission
              </div>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {stats.current_tier !== 'diamond' && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Progress to next tier</span>
                <span className="text-white">
                  {stats.total_referrals} / {TIER_CONFIG[getNextTier(stats.current_tier)].threshold}
                </span>
              </div>
              <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                <div 
                  className={cn('h-full rounded-full', TIER_CONFIG[stats.current_tier].bgColor.replace('/20', ''))}
                  style={{ 
                    width: `${(stats.total_referrals / TIER_CONFIG[getNextTier(stats.current_tier)].threshold) * 100}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {stats.referrals_to_next_tier} more referrals to reach {getNextTier(stats.current_tier)}
              </p>
            </div>
          )}

          {/* All Tiers */}
          <div className="mt-6 pt-6 border-t border-[#1a1a2e]">
            <h3 className="text-sm text-gray-400 mb-3">All Tiers</h3>
            <div className="space-y-2">
              {Object.entries(TIER_CONFIG).map(([tier, config]) => (
                <div 
                  key={tier}
                  className={cn(
                    'flex items-center justify-between p-2 rounded',
                    tier === stats.current_tier ? config.bgColor : 'bg-transparent'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {tier === stats.current_tier && <Check size={14} className={config.color} />}
                    <span className={cn('capitalize', tier === stats.current_tier && config.color)}>
                      {tier}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">{config.threshold}+ referrals</span>
                    <span className="mx-2">→</span>
                    <span className={config.color}>{config.commission}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Link2 size={18} className="text-blue-400" />
            Your Referral Link
          </h2>

          <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-400 mb-1">Share this link</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-blue-400 text-sm break-all">
                {referralLink}
              </code>
              <button
                onClick={copyLink}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  copied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 hover:bg-white/10 text-gray-400'
                )}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-400 mb-1">Your referral code</div>
            <div className="flex items-center gap-2">
              <code className="text-xl font-bold text-white">{referralCode}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-400"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-medium text-blue-400 mb-2">How it works</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Share your link with potential users</li>
              <li>• When they sign up and subscribe, you earn commission</li>
              <li>• Commission is {TIER_CONFIG[stats.current_tier].commission}% of their first month</li>
              <li>• 90-day cookie window • Monthly payouts (NET 30)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Referrals */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-6">
        <h2 className="font-semibold mb-4">Recent Referrals</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-[#1a1a2e]">
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Signed Up</th>
                <th className="pb-3 font-medium">Converted</th>
                <th className="pb-3 font-medium">Commission</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {referrals.map((ref) => (
                <tr key={ref.id} className="border-b border-[#1a1a2e] last:border-0">
                  <td className="py-3">
                    <div className="font-medium">{ref.referred_name}</div>
                    <div className="text-gray-500 text-xs">{ref.referred_email}</div>
                  </td>
                  <td className="py-3 text-gray-400">
                    {new Date(ref.signed_up_at).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    {ref.converted ? (
                      <span className="text-green-400">Yes</span>
                    ) : (
                      <span className="text-gray-500">Pending</span>
                    )}
                  </td>
                  <td className="py-3">
                    {ref.commission > 0 ? (
                      <span className="text-green-400">${ref.commission}</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="py-3">
                    <span className={cn(
                      'px-2 py-1 text-xs rounded',
                      ref.status === 'paid' 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    )}>
                      {ref.status.charAt(0).toUpperCase() + ref.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getNextTier(current: AffiliateTier): AffiliateTier {
  const tiers: AffiliateTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const currentIndex = tiers.indexOf(current);
  return tiers[Math.min(currentIndex + 1, tiers.length - 1)];
}

// Chairman View Component
function ChairmanAffiliateView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Link2 className="text-blue-400" />
          Affiliate Program
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-sm rounded">
            Admin View
          </span>
        </h1>
        <p className="text-gray-400 mt-1">
          Manage affiliate tiers, view performance, and configure payouts
        </p>
      </div>

      {/* Program Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">Total Affiliates</div>
          <div className="text-2xl font-bold">156</div>
        </div>
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">Total Referrals</div>
          <div className="text-2xl font-bold text-blue-400">892</div>
        </div>
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">This Month</div>
          <div className="text-2xl font-bold text-green-400">67</div>
        </div>
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">Commissions Paid</div>
          <div className="text-2xl font-bold text-green-400">$18.2K</div>
        </div>
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-400">$2.4K</div>
        </div>
      </div>

      {/* Tier Configuration */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Settings size={18} />
            Tier Configuration
          </h2>
          <button className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors">
            Edit Tiers
          </button>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {Object.entries(TIER_CONFIG).map(([tier, config]) => (
            <div key={tier} className={cn('rounded-xl p-4 border', config.bgColor, `border-${tier === 'bronze' ? 'orange' : tier === 'silver' ? 'gray' : tier === 'gold' ? 'yellow' : tier === 'platinum' ? 'cyan' : 'purple'}-500/30`)}>
              <div className={cn('text-lg font-bold capitalize mb-1', config.color)}>
                {tier}
              </div>
              <div className="text-2xl font-bold">{config.commission}%</div>
              <div className="text-sm text-gray-400">{config.threshold}+ referrals</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Affiliates Leaderboard */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Trophy size={18} className="text-yellow-400" />
          Top Affiliates
        </h2>

        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-[#1a1a2e]">
              <th className="pb-3 font-medium">Rank</th>
              <th className="pb-3 font-medium">Affiliate</th>
              <th className="pb-3 font-medium">Tier</th>
              <th className="pb-3 font-medium">Referrals</th>
              <th className="pb-3 font-medium">Earnings</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {[
              { rank: 1, name: 'Sarah Johnson', tier: 'diamond', referrals: 523, earnings: 8450 },
              { rank: 2, name: 'Mike Chen', tier: 'platinum', referrals: 234, earnings: 4200 },
              { rank: 3, name: 'Emily Rose', tier: 'gold', referrals: 89, earnings: 1780 },
            ].map((affiliate) => (
              <tr key={affiliate.rank} className="border-b border-[#1a1a2e] last:border-0">
                <td className="py-3">
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    affiliate.rank === 1 ? 'bg-yellow-500 text-black' :
                    affiliate.rank === 2 ? 'bg-gray-400 text-black' :
                    'bg-orange-500 text-black'
                  )}>
                    {affiliate.rank}
                  </span>
                </td>
                <td className="py-3 font-medium">{affiliate.name}</td>
                <td className="py-3">
                  <span className={cn(
                    'px-2 py-1 text-xs rounded capitalize',
                    TIER_CONFIG[affiliate.tier as AffiliateTier].bgColor,
                    TIER_CONFIG[affiliate.tier as AffiliateTier].color
                  )}>
                    {affiliate.tier}
                  </span>
                </td>
                <td className="py-3">{affiliate.referrals}</td>
                <td className="py-3 text-green-400">${affiliate.earnings.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


























































































