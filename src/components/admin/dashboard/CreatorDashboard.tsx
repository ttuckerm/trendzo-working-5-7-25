'use client';

import React from 'react';
import Link from 'next/link';
import { StatCard } from './StatCard';
import { QuickAction } from './QuickAction';
import { 
  Video, 
  TrendingUp,
  Eye,
  DollarSign,
  Upload,
  Megaphone,
  Sparkles,
  User,
  CheckCircle,
  Clock,
  Star,
} from 'lucide-react';

export function CreatorDashboard() {
  // In real implementation, fetch this data from API
  const stats = {
    totalVideos: 156,
    avgDps: 72.4,
    totalViews: 4500000,
    thisMonthEarnings: 890,
    verificationStatus: 'verified' as const,
  };

  const recentVideos = [
    { title: 'Morning Routine Hack', dps: 84.2, views: 245000, predicted: 78.5 },
    { title: 'Product Review Gone Viral', dps: 91.3, views: 890000, predicted: 82.1 },
    { title: 'Day in my Life', dps: 67.8, views: 120000, predicted: 71.2 },
    { title: 'Cooking Challenge', dps: 73.4, views: 189000, predicted: 69.8 },
  ];

  const activeCampaigns = [
    { name: 'CleanCopy Promo', type: 'platform', earnings: 450, views: 89000 },
    { name: 'Agency Summer Push', type: 'content', earnings: 320, views: 56000 },
  ];

  return (
    <div className="space-y-6">
      {/* Verification Badge */}
      {stats.verificationStatus === 'verified' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-4">
          <div className="p-2 bg-green-500/20 rounded-full">
            <CheckCircle size={24} className="text-green-400" />
          </div>
          <div>
            <div className="font-semibold text-green-400">Verified Creator</div>
            <div className="text-sm text-gray-400">You have access to all creator features and campaigns</div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={Video}
          title="Total Videos"
          value={stats.totalVideos}
          trend={{ value: 12, isPositive: true }}
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          title="Avg DPS Score"
          value={stats.avgDps}
          subtitle="Top 15% of creators"
          trend={{ value: 5.2, isPositive: true }}
          color="green"
        />
        <StatCard
          icon={Eye}
          title="Total Views"
          value={`${(stats.totalViews / 1000000).toFixed(1)}M`}
          trend={{ value: 28, isPositive: true }}
          color="blue"
        />
        <StatCard
          icon={DollarSign}
          title="This Month"
          value={`$${stats.thisMonthEarnings}`}
          subtitle="From campaigns"
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <QuickAction icon={Upload} label="Analyze Video" href="/admin/viral-studio" color="purple" />
        <QuickAction icon={Megaphone} label="Join Campaign" href="/admin/rewards/content-campaigns" color="blue" />
        <QuickAction icon={Sparkles} label="Viral Studio" href="/admin/viral-studio" color="yellow" />
        <QuickAction icon={User} label="My Profile" href="/admin/profile" color="default" />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Videos */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Video size={18} className="text-purple-400" />
              Recent Videos
            </h3>
            <Link href="/admin/my-videos" className="text-sm text-purple-400 hover:text-purple-300">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentVideos.map((video) => (
              <div key={video.title} className="flex items-center justify-between py-2 border-b border-[#1a1a2e] last:border-0">
                <div>
                  <div className="font-medium text-sm">{video.title}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Eye size={10} />
                    {(video.views / 1000).toFixed(0)}K views
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${
                    video.dps >= 80 ? 'text-green-400' :
                    video.dps >= 60 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {video.dps} DPS
                  </div>
                  <div className="text-xs text-gray-500">
                    Predicted: {video.predicted}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
          {activeCampaigns.length > 0 ? (
            <div className="space-y-3">
              {activeCampaigns.map((campaign) => (
                <div key={campaign.name} className="py-3 border-b border-[#1a1a2e] last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-sm">{campaign.name}</div>
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      campaign.type === 'platform' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {campaign.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {(campaign.views / 1000).toFixed(0)}K views
                    </span>
                    <span className="text-green-400 font-medium">
                      +${campaign.earnings}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Megaphone size={32} className="mx-auto mb-2 opacity-50" />
              <p>No active campaigns</p>
              <Link href="/admin/rewards" className="text-blue-400 text-sm hover:underline">
                Browse available campaigns
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Star size={18} className="text-yellow-400" />
          Performance Insights
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#0a0a0f] rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">+5.2</div>
            <div className="text-sm text-gray-400">DPS improvement this month</div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">Top 15%</div>
            <div className="text-sm text-gray-400">Creator ranking</div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">12</div>
            <div className="text-sm text-gray-400">Videos this month</div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">92%</div>
            <div className="text-sm text-gray-400">Prediction accuracy</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatorDashboard;


























































































