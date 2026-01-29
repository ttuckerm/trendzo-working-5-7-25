'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  Users,
  Video,
  TrendingUp,
  DollarSign,
  Settings,
  ToggleLeft,
  Activity,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Mail,
  Calendar,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'creators' | 'campaigns' | 'features' | 'settings' | 'activity';

export default function AgencyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Mock data - replace with API
  const agency = {
    id: id as string,
    name: 'Viral Kings Agency',
    tier: 'pro' as const,
    owner_email: 'alex@viralkings.com',
    owner_name: 'Alex Johnson',
    creator_count: 45,
    video_count: 1234,
    avg_dps: 67.3,
    monthly_revenue: 124500,
    total_revenue: 890000,
    created_at: '2024-01-15',
    status: 'active' as const,
    website: 'https://viralkings.com',
    white_label: {
      enabled: true,
      domain: 'app.viralkings.com',
      logo_url: '/logos/viralkings.png',
    },
    quota_usage: {
      creators: { used: 45, limit: 50 },
      videos_monthly: { used: 890, limit: 1000 },
      api_calls: { used: 45000, limit: 100000 },
      storage_gb: { used: 12.5, limit: 50 },
    },
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'creators', label: 'Creators', icon: Users, count: agency.creator_count },
    { id: 'campaigns', label: 'Campaigns', icon: TrendingUp, count: 3 },
    { id: 'features', label: 'Feature Toggles', icon: ToggleLeft },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'activity', label: 'Activity Log', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="mt-1 p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{agency.name}</h1>
              <TierBadge tier={agency.tier} />
              <StatusBadge status={agency.status} />
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Mail size={14} />
                {agency.owner_email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                Joined {new Date(agency.created_at).toLocaleDateString()}
              </span>
              {agency.website && (
                <a 
                  href={agency.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                >
                  <Globe size={14} />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-300">
            <Eye size={16} />
            Impersonate
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-300">
            <Edit size={16} />
            Edit
          </button>
          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            <MoreVertical size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-4">
        <StatMini icon={Users} label="Creators" value={agency.creator_count} />
        <StatMini icon={Video} label="Videos" value={agency.video_count.toLocaleString()} />
        <StatMini icon={TrendingUp} label="Avg DPS" value={agency.avg_dps} color="green" />
        <StatMini icon={DollarSign} label="Monthly" value={`$${(agency.monthly_revenue / 1000).toFixed(1)}K`} color="green" />
        <StatMini icon={DollarSign} label="All Time" value={`$${(agency.total_revenue / 1000).toFixed(0)}K`} color="blue" />
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1a1a2e]">
        <nav className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon size={16} />
                {tab.label}
                {tab.count !== undefined && (
                  <span className="px-1.5 py-0.5 bg-white/10 rounded text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && <OverviewTab agency={agency} />}
        {activeTab === 'creators' && <CreatorsTab agencyId={agency.id} />}
        {activeTab === 'campaigns' && <CampaignsTab agencyId={agency.id} />}
        {activeTab === 'features' && <FeaturesTab agencyId={agency.id} tier={agency.tier} />}
        {activeTab === 'settings' && <SettingsTab agency={agency} />}
        {activeTab === 'activity' && <ActivityTab agencyId={agency.id} />}
      </div>
    </div>
  );
}

// Tab Components
function OverviewTab({ agency }: { agency: any }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Quota Usage */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <h3 className="font-semibold mb-4">Quota Usage</h3>
        <div className="space-y-4">
          {Object.entries(agency.quota_usage).map(([key, value]: [string, any]) => {
            const percentage = (value.used / value.limit) * 100;
            const isWarning = percentage >= 80;
            const isCritical = percentage >= 95;
            
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                  <span className={cn(
                    isCritical ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-gray-300'
                  )}>
                    {value.used.toLocaleString()} / {value.limit.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      'h-full rounded-full transition-all',
                      isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* White Label Status */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <h3 className="font-semibold mb-4">White Label</h3>
        {agency.white_label.enabled ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status</span>
              <span className="flex items-center gap-2 text-green-400">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Domain</span>
              <a 
                href={`https://${agency.white_label.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                {agency.white_label.domain}
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Globe size={32} className="mx-auto text-gray-600 mb-2" />
            <p className="text-gray-400 text-sm mb-3">White label not configured</p>
            <Link
              href={`/admin/organization/agencies/${agency.id}/white-label`}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Set up white label →
            </Link>
          </div>
        )}
      </div>

      {/* Recent Videos Performance */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5 col-span-2">
        <h3 className="font-semibold mb-4">Recent Video Performance</h3>
        <div className="h-48 flex items-center justify-center text-gray-500">
          [DPS Performance Chart - Use Recharts]
        </div>
      </div>
    </div>
  );
}

function CreatorsTab({ agencyId }: { agencyId: string }) {
  const creators = [
    { id: '1', handle: '@sarahj', name: 'Sarah Johnson', videos: 45, avg_dps: 72.3, followers: 125000, verified: true },
    { id: '2', handle: '@mikec', name: 'Mike Chen', videos: 38, avg_dps: 68.9, followers: 89000, verified: true },
    { id: '3', handle: '@emilyr', name: 'Emily Rose', videos: 52, avg_dps: 74.1, followers: 210000, verified: true },
    { id: '4', handle: '@newcreator', name: 'New Creator', videos: 5, avg_dps: 45.2, followers: 5000, verified: false },
  ];

  return (
    <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-[#1a1a2e] bg-[#0a0a0f]">
            <th className="px-6 py-4 font-medium">Creator</th>
            <th className="px-6 py-4 font-medium">Videos</th>
            <th className="px-6 py-4 font-medium">Avg DPS</th>
            <th className="px-6 py-4 font-medium">Followers</th>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {creators.map((creator) => (
            <tr 
              key={creator.id}
              className="border-b border-[#1a1a2e] last:border-0 hover:bg-white/5 cursor-pointer"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                    {creator.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{creator.name}</div>
                    <div className="text-sm text-gray-500">{creator.handle}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-gray-300">{creator.videos}</td>
              <td className="px-6 py-4">
                <span className={cn(
                  creator.avg_dps >= 70 ? 'text-green-400' :
                  creator.avg_dps >= 60 ? 'text-yellow-400' :
                  'text-red-400'
                )}>
                  {creator.avg_dps}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-300">
                {(creator.followers / 1000).toFixed(1)}K
              </td>
              <td className="px-6 py-4">
                {creator.verified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                    Pending
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                <button className="p-2 hover:bg-white/10 rounded-lg">
                  <MoreVertical size={16} className="text-gray-400" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CampaignsTab({ agencyId }: { agencyId: string }) {
  return (
    <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-8 text-center">
      <TrendingUp size={48} className="mx-auto text-gray-600 mb-4" />
      <h3 className="text-lg font-medium mb-2">Content Campaigns</h3>
      <p className="text-gray-400 mb-4">This agency's content distribution campaigns</p>
      <Link
        href={`/admin/rewards/content-campaigns?agency=${agencyId}`}
        className="text-blue-400 hover:text-blue-300"
      >
        View Campaigns →
      </Link>
    </div>
  );
}

function FeaturesTab({ agencyId, tier }: { agencyId: string; tier: string }) {
  const features = [
    { id: 'dps_calculator', name: 'DPS Calculator', enabled: true, tier_required: 'starter' },
    { id: 'bulk_analysis', name: 'Bulk Analysis', enabled: true, tier_required: 'growth' },
    { id: 'pattern_extraction', name: 'Pattern Extraction', enabled: true, tier_required: 'growth' },
    { id: 'api_access', name: 'API Access', enabled: true, tier_required: 'pro' },
    { id: 'white_label', name: 'White Label', enabled: true, tier_required: 'pro' },
    { id: 'content_campaigns', name: 'Content Campaigns', enabled: false, tier_required: 'pro' },
    { id: 'custom_models', name: 'Custom Models', enabled: false, tier_required: 'enterprise' },
    { id: 'webhooks', name: 'Webhooks', enabled: true, tier_required: 'pro' },
  ];

  return (
    <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Feature Toggles</h3>
        <span className="text-sm text-gray-400">
          Tier: <span className="text-yellow-400 capitalize">{tier}</span>
        </span>
      </div>
      
      <div className="space-y-3">
        {features.map((feature) => (
          <div 
            key={feature.id}
            className="flex items-center justify-between py-3 border-b border-[#1a1a2e] last:border-0"
          >
            <div>
              <div className="font-medium">{feature.name}</div>
              <div className="text-xs text-gray-500 capitalize">
                Requires {feature.tier_required} tier
              </div>
            </div>
            <button
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                feature.enabled ? 'bg-green-500' : 'bg-gray-600'
              )}
            >
              <div className={cn(
                'absolute top-1 w-4 h-4 bg-white rounded-full transition-all',
                feature.enabled ? 'left-7' : 'left-1'
              )} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab({ agency }: { agency: any }) {
  return (
    <div className="space-y-6">
      {/* Danger Zone */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
        <h3 className="font-semibold text-red-400 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-400 mb-4">
          These actions are irreversible. Please proceed with caution.
        </p>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors text-sm">
            Suspend Agency
          </button>
          <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm">
            Delete Agency
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityTab({ agencyId }: { agencyId: string }) {
  return (
    <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
      <p className="text-gray-400 text-center py-8">
        Activity log for this agency. 
        <Link href={`/admin/audit-log?agency=${agencyId}`} className="text-blue-400 ml-1">
          View full log →
        </Link>
      </p>
    </div>
  );
}

// Helper components
function StatMini({ icon: Icon, label, value, color = 'default' }: any) {
  const colors = {
    default: 'text-white',
    green: 'text-green-400',
    blue: 'text-blue-400',
  };
  
  return (
    <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
        <Icon size={14} />
        {label}
      </div>
      <div className={cn('text-xl font-bold', colors[color])}>
        {value}
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    starter: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    growth: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pro: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    enterprise: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };
  
  return (
    <span className={`px-2 py-1 text-xs rounded border ${colors[tier] || colors.starter}`}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    suspended: 'bg-red-500/20 text-red-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
  };
  
  return (
    <span className={`px-2 py-1 text-xs rounded ${colors[status] || colors.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}


























































































