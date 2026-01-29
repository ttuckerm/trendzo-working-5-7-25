'use client';

import React from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/admin/dashboard/StatCard';
import { QuickAction } from '@/components/admin/dashboard/QuickAction';
import { RequirePermission } from '@/lib/permissions/components';
import { RESOURCES } from '@/lib/permissions';
import {
  DollarSign,
  Building2,
  Users,
  TrendingUp,
  UserPlus,
  UserCheck,
  ToggleLeft,
  ScrollText,
  Activity,
  Code,
  Scissors,
  LucideIcon,
} from 'lucide-react';

export default function OrganizationPage() {
  // In real implementation, fetch organization stats from API
  const stats = {
    totalRevenue: 416100,
    agencies: 4,
    creators: 147,
    developers: 12,
    clippers: 89,
    avgDps: 67.8,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Organization Overview</h1>
        <p className="text-gray-400 mt-1">Manage your agencies, creators, developers, and clippers</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-6 gap-4">
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
          color="blue"
        />
        <StatCard
          icon={Users}
          title="Creators"
          value={stats.creators}
          color="purple"
        />
        <StatCard
          icon={Code}
          title="Developers"
          value={stats.developers}
          color="green"
        />
        <StatCard
          icon={Scissors}
          title="Clippers"
          value={stats.clippers}
          color="yellow"
        />
        <StatCard
          icon={TrendingUp}
          title="Avg DPS"
          value={stats.avgDps}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-5 gap-4">
        <RequirePermission resource={RESOURCES.SUB_ADMINS} action="create">
          <QuickAction 
            icon={UserCheck} 
            label="Add Sub-Admin" 
            href="/admin/organization/sub-admins/create" 
            color="purple" 
          />
        </RequirePermission>
        <RequirePermission resource={RESOURCES.AGENCIES} action="create">
          <QuickAction 
            icon={Building2} 
            label="Add Agency" 
            href="/admin/organization/agencies/create" 
            color="blue" 
          />
        </RequirePermission>
        <RequirePermission resource={RESOURCES.CREATORS} action="create">
          <QuickAction 
            icon={UserPlus} 
            label="Add Creator" 
            href="/admin/organization/creators/create" 
            color="default" 
          />
        </RequirePermission>
        <RequirePermission resource={RESOURCES.FEATURE_TOGGLES} action="read">
          <QuickAction 
            icon={ToggleLeft} 
            label="Feature Toggles" 
            href="/admin/config/feature-toggles" 
            color="yellow" 
          />
        </RequirePermission>
        <RequirePermission resource={RESOURCES.AUDIT_LOG} action="read">
          <QuickAction 
            icon={ScrollText} 
            label="Audit Log" 
            href="/admin/audit-log" 
            color="default" 
          />
        </RequirePermission>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Agency Performance Table */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 size={18} className="text-blue-400" />
              Agency Performance
            </h3>
            <Link 
              href="/admin/organization/agencies" 
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View All →
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-[#1a1a2e]">
                  <th className="pb-3 font-medium">Agency</th>
                  <th className="pb-3 font-medium">Tier</th>
                  <th className="pb-3 font-medium">Creators</th>
                  <th className="pb-3 font-medium">Avg DPS</th>
                  <th className="pb-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { id: '1', name: 'Viral Kings Agency', tier: 'pro', creators: 45, dps: 67.3, revenue: 124500 },
                  { id: '2', name: 'TikTok Pros', tier: 'growth', creators: 23, dps: 71.2, revenue: 89200 },
                  { id: '3', name: 'Content Masters', tier: 'enterprise', creators: 67, dps: 58.9, revenue: 156800 },
                  { id: '4', name: 'Social Spark', tier: 'starter', creators: 12, dps: 74.5, revenue: 45600 },
                ].map((agency) => (
                  <tr 
                    key={agency.id} 
                    className="border-b border-[#1a1a2e] last:border-0 hover:bg-white/5 cursor-pointer"
                    onClick={() => window.location.href = `/admin/organization/agencies/${agency.id}`}
                  >
                    <td className="py-3 font-medium">{agency.name}</td>
                    <td className="py-3">
                      <TierBadge tier={agency.tier} />
                    </td>
                    <td className="py-3 text-gray-400">{agency.creators}</td>
                    <td className="py-3">
                      <span className={agency.dps >= 70 ? 'text-green-400' : agency.dps >= 60 ? 'text-yellow-400' : 'text-red-400'}>
                        {agency.dps}
                      </span>
                    </td>
                    <td className="py-3 text-green-400">${(agency.revenue / 1000).toFixed(1)}K</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity size={18} className="text-green-400" />
              Recent Activity
            </h3>
            <Link 
              href="/admin/audit-log" 
              className="text-sm text-green-400 hover:text-green-300"
            >
              View All →
            </Link>
          </div>
          
          <div className="space-y-3">
            {[
              { action: 'agency.created', actor: 'Tommy', target: 'New Agency LLC', time: '5 min ago', icon: Building2, color: 'blue' as const },
              { action: 'creator.verified', actor: 'System', target: '@newcreator', time: '15 min ago', icon: UserCheck, color: 'green' as const },
              { action: 'tier.upgraded', actor: 'Viral Kings', target: 'Pro → Enterprise', time: '1 hour ago', icon: TrendingUp, color: 'purple' as const },
              { action: 'feature.enabled', actor: 'Tommy', target: 'API Access for TikTok Pros', time: '2 hours ago', icon: ToggleLeft, color: 'yellow' as const },
              { action: 'developer.joined', actor: '@devuser', target: 'ClipMaster App', time: '3 hours ago', icon: Code, color: 'green' as const },
            ].map((activity, i) => {
              const Icon = activity.icon;
              return (
                <div 
                  key={i} 
                  className="flex items-start gap-3 py-3 border-b border-[#1a1a2e] last:border-0"
                >
                  <div className={`p-2 rounded-lg ${
                    activity.color === 'blue' ? 'bg-blue-500/20' :
                    activity.color === 'green' ? 'bg-green-500/20' :
                    activity.color === 'purple' ? 'bg-purple-500/20' :
                    activity.color === 'yellow' ? 'bg-yellow-500/20' :
                    'bg-gray-500/20'
                  }`}>
                    <Icon size={14} className={
                      activity.color === 'blue' ? 'text-blue-400' :
                      activity.color === 'green' ? 'text-green-400' :
                      activity.color === 'purple' ? 'text-purple-400' :
                      activity.color === 'yellow' ? 'text-yellow-400' :
                      'text-gray-400'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="text-gray-400">{activity.actor}</span>
                      <span className="text-gray-500"> • </span>
                      <span className="font-medium">{activity.target}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {activity.action} • {activity.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Type Breakdown */}
      <div className="grid grid-cols-4 gap-6">
        <UserTypeCard
          title="Sub-Admins"
          count={2}
          icon={UserCheck}
          color="purple"
          href="/admin/organization/sub-admins"
          description="Delegated admin access"
        />
        <UserTypeCard
          title="Creators"
          count={stats.creators}
          icon={Users}
          color="blue"
          href="/admin/organization/creators"
          description={`${stats.creators - 12} in agencies, 12 independent`}
        />
        <UserTypeCard
          title="Developers"
          count={stats.developers}
          icon={Code}
          color="green"
          href="/admin/organization/developers"
          description="Building mini apps"
        />
        <UserTypeCard
          title="Clippers"
          count={stats.clippers}
          icon={Scissors}
          color="yellow"
          href="/admin/organization/clippers"
          description="Campaign participants"
        />
      </div>

      {/* Permissions Card (Chairman only) */}
      <RequirePermission resource={RESOURCES.SUB_ADMINS} action="manage">
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-5">
          <h3 className="font-semibold text-purple-400 mb-2">Chairman Permissions</h3>
          <p className="text-sm text-gray-400 mb-4">
            You have full access to all organization settings. Sub-admins can be delegated specific permissions.
          </p>
          <div className="flex gap-4">
            <Link 
              href="/admin/organization/sub-admins"
              className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
            >
              Manage Sub-Admins
            </Link>
            <Link 
              href="/admin/audit-log?filter=permissions"
              className="px-4 py-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              View Permission Changes
            </Link>
          </div>
        </div>
      </RequirePermission>
    </div>
  );
}

// Helper component for tier badges
function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    starter: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    growth: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pro: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    enterprise: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  
  return (
    <span className={`px-2 py-0.5 text-xs rounded border ${colors[tier] || colors.starter}`}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
}

// Helper component for user type cards
interface UserTypeCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  color: 'purple' | 'blue' | 'green' | 'yellow';
  href: string;
  description: string;
}

function UserTypeCard({ title, count, icon: Icon, color, href, description }: UserTypeCardProps) {
  const colorClasses = {
    purple: 'border-purple-500/30 hover:border-purple-500/50',
    blue: 'border-blue-500/30 hover:border-blue-500/50',
    green: 'border-green-500/30 hover:border-green-500/50',
    yellow: 'border-yellow-500/30 hover:border-yellow-500/50',
  };

  const iconBgClasses = {
    purple: 'bg-purple-500/20',
    blue: 'bg-blue-500/20',
    green: 'bg-green-500/20',
    yellow: 'bg-yellow-500/20',
  };

  const iconColorClasses = {
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
  };

  return (
    <Link 
      href={href}
      className={`bg-[#111118] border ${colorClasses[color]} rounded-xl p-5 transition-all hover:bg-[#151520] group`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconBgClasses[color]}`}>
          <Icon size={20} className={iconColorClasses[color]} />
        </div>
        <span className="text-2xl font-bold">{count}</span>
      </div>
      <div className="font-medium">{title}</div>
      <div className="text-xs text-gray-500 mt-1">{description}</div>
    </Link>
  );
}


























































































