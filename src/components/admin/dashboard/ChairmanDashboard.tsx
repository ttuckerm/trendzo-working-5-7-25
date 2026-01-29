'use client';

import React from 'react';
import Link from 'next/link';
import { StatCard } from './StatCard';
import { QuickAction } from './QuickAction';
import { 
  DollarSign, 
  Building2, 
  Users, 
  Video, 
  TrendingUp,
  UserPlus,
  ToggleLeft,
  ScrollText,
  Megaphone,
  Film,
  Smartphone,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

export function ChairmanDashboard() {
  // In real implementation, fetch this data from API
  const stats = {
    totalRevenue: 416100,
    agencies: 4,
    creators: 147,
    videos: 4470,
    avgDps: 67.8,
  };

  const layerStats = {
    platform: { active: 3, spent: 19000, signups: 370 },
    content: { active: 3, spent: 4200, fee: 840 },
    miniapp: { active: 3, spent: 3800, fee: 760 },
  };

  const pendingPayouts = 12;
  const pendingApprovals = 5;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={`$${(stats.totalRevenue / 1000).toFixed(1)}K`}
          trend={{ value: 12.3, isPositive: true }}
          color="green"
        />
        <StatCard
          icon={Building2}
          title="Agencies"
          value={stats.agencies}
          trend={{ value: 1, isPositive: true }}
          color="blue"
        />
        <StatCard
          icon={Users}
          title="Creators"
          value={stats.creators}
          trend={{ value: 23, isPositive: true }}
          color="purple"
        />
        <StatCard
          icon={Video}
          title="Videos Analyzed"
          value={stats.videos.toLocaleString()}
          trend={{ value: 156, isPositive: true }}
          color="default"
        />
        <StatCard
          icon={TrendingUp}
          title="Avg Platform DPS"
          value={stats.avgDps}
          trend={{ value: 2.3, isPositive: true }}
          color="green"
        />
      </div>

      {/* Alerts Row */}
      {(pendingPayouts > 0 || pendingApprovals > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {pendingPayouts > 0 && (
            <Link href="/admin/rewards/payouts" className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-4 hover:bg-yellow-500/20 transition-colors">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Clock size={24} className="text-yellow-400" />
              </div>
              <div>
                <div className="text-yellow-400 font-semibold">{pendingPayouts} Pending Payouts</div>
                <div className="text-sm text-gray-400">Total: $3,450 awaiting processing</div>
              </div>
            </Link>
          )}
          {pendingApprovals > 0 && (
            <Link href="/admin/organization/creators?status=pending" className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center gap-4 hover:bg-blue-500/20 transition-colors">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <AlertTriangle size={24} className="text-blue-400" />
              </div>
              <div>
                <div className="text-blue-400 font-semibold">{pendingApprovals} Pending Approvals</div>
                <div className="text-sm text-gray-400">Creators awaiting verification</div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <QuickAction icon={UserPlus} label="Add Sub-Admin" href="/admin/organization/sub-admins/create" color="purple" />
        <QuickAction icon={Building2} label="Add Agency" href="/admin/organization/agencies/create" color="blue" />
        <QuickAction icon={ToggleLeft} label="Feature Toggles" href="/admin/config/feature-toggles" color="yellow" />
        <QuickAction icon={ScrollText} label="View Audit Log" href="/admin/audit-log" color="default" />
      </div>

      {/* Three-Layer Ecosystem */}
      <div className="bg-gradient-to-r from-yellow-500/5 via-blue-500/5 to-green-500/5 border border-[#1a1a2e] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-center mb-6">
          🔄 The Three-Layer Rewards Ecosystem
        </h2>
        
        <div className="grid grid-cols-3 gap-6">
          {/* Layer 1: Platform */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="text-yellow-400" size={20} />
              <span className="font-semibold text-yellow-400">Layer 1: Platform</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">You fund campaigns to promote CleanCopy</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Active</span>
                <span className="font-semibold">{layerStats.platform.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Spent</span>
                <span className="font-semibold text-yellow-400">${(layerStats.platform.spent / 1000).toFixed(1)}K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Signups</span>
                <span className="font-semibold text-green-400">{layerStats.platform.signups}</span>
              </div>
            </div>
            <Link 
              href="/admin/rewards/platform-campaigns"
              className="mt-4 block w-full py-2 text-center bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              Manage →
            </Link>
          </div>

          {/* Layer 2: Content */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Film className="text-blue-400" size={20} />
              <span className="font-semibold text-blue-400">Layer 2: Content</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">Agencies/Creators pay clippers to distribute content</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Active</span>
                <span className="font-semibold">{layerStats.content.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Spent</span>
                <span className="font-semibold text-blue-400">${(layerStats.content.spent / 1000).toFixed(1)}K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Your Fee (20%)</span>
                <span className="font-semibold text-green-400">${(layerStats.content.fee / 1000).toFixed(1)}K</span>
              </div>
            </div>
            <Link 
              href="/admin/rewards/content-campaigns"
              className="mt-4 block w-full py-2 text-center bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              Manage →
            </Link>
          </div>

          {/* Layer 3: Mini Apps */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="text-green-400" size={20} />
              <span className="font-semibold text-green-400">Layer 3: Mini Apps</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">Developers pay for app promotion</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Active</span>
                <span className="font-semibold">{layerStats.miniapp.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Spent</span>
                <span className="font-semibold text-green-400">${(layerStats.miniapp.spent / 1000).toFixed(1)}K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Your Fee (20%)</span>
                <span className="font-semibold text-green-400">${(layerStats.miniapp.fee / 1000).toFixed(1)}K</span>
              </div>
            </div>
            <Link 
              href="/admin/rewards/app-campaigns"
              className="mt-4 block w-full py-2 text-center bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
            >
              Manage →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Agency Performance + Recent Activity */}
      <div className="grid grid-cols-2 gap-6">
        {/* Agency Performance */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 size={18} className="text-purple-400" />
              Agency Performance
            </h3>
            <Link href="/admin/organization/agencies" className="text-sm text-purple-400 hover:text-purple-300">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Viral Kings Agency', tier: 'pro', creators: 45, dps: 67.3, revenue: 124500 },
              { name: 'TikTok Pros', tier: 'growth', creators: 23, dps: 71.2, revenue: 89200 },
              { name: 'Content Masters', tier: 'enterprise', creators: 67, dps: 58.9, revenue: 156800 },
              { name: 'Social Spark', tier: 'starter', creators: 12, dps: 74.5, revenue: 45600 },
            ].map((agency) => (
              <div key={agency.name} className="flex items-center justify-between py-2 border-b border-[#1a1a2e] last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    agency.tier === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
                    agency.tier === 'pro' ? 'bg-yellow-500/20 text-yellow-400' :
                    agency.tier === 'growth' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {agency.tier.charAt(0).toUpperCase() + agency.tier.slice(1)}
                  </span>
                  <div>
                    <div className="font-medium text-sm">{agency.name}</div>
                    <div className="text-xs text-gray-500">{agency.creators} creators</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-semibold">{agency.dps} DPS</div>
                  <div className="text-xs text-gray-500">${(agency.revenue / 1000).toFixed(1)}K</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity size={18} className="text-green-400" />
              Recent Activity
            </h3>
            <Link href="/admin/audit-log" className="text-sm text-green-400 hover:text-green-300">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { action: 'feature_toggle', actor: 'Tommy', target: 'Viral Kings Agency', time: '2 min ago' },
              { action: 'impersonation', actor: 'Alex Chen', target: '@sarahj', time: '15 min ago' },
              { action: 'tier_change', actor: 'Maria Garcia', target: 'TikTok Pros', time: '1 hour ago' },
              { action: 'creator_verified', actor: 'System', target: '@newcreator', time: '2 hours ago' },
              { action: 'api_key_generated', actor: 'Content Masters', target: 'API Key #7', time: '3 hours ago' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#1a1a2e] last:border-0">
                <div>
                  <span className={`text-sm ${
                    activity.action === 'feature_toggle' ? 'text-yellow-400' :
                    activity.action === 'impersonation' ? 'text-purple-400' :
                    activity.action === 'tier_change' ? 'text-blue-400' :
                    activity.action === 'creator_verified' ? 'text-green-400' :
                    'text-gray-400'
                  }`}>
                    {activity.action.replace('_', ' ')}
                  </span>
                  <span className="text-gray-400 text-sm"> by {activity.actor}</span>
                  <span className="text-gray-500 text-sm"> → {activity.target}</span>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health (from Control Center) */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity size={18} className="text-cyan-400" />
            System Health
          </h3>
          <Link href="/admin/control-center" className="text-sm text-cyan-400 hover:text-cyan-300">
            Control Center →
          </Link>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Prediction Accuracy', value: '8.8 DPS error', status: 'green' },
            { label: 'API Response', value: '245ms avg', status: 'green' },
            { label: 'ML Models', value: '5/5 active', status: 'green' },
            { label: 'Webhooks', value: '98.5% delivery', status: 'yellow' },
            { label: 'Database', value: '99.9%', status: 'green' },
          ].map((item) => (
            <div key={item.label} className="bg-[#0a0a0f] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  item.status === 'green' ? 'bg-green-500' :
                  item.status === 'yellow' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <span className="text-xs text-gray-400">{item.label}</span>
              </div>
              <div className="font-semibold text-sm">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChairmanDashboard;


























































































