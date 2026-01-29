'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Smartphone,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Download,
  DollarSign,
  TrendingUp,
  Pause,
  Play,
  ChevronDown,
  Zap,
  Target,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminUser } from '@/hooks/useAdminUser';

type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft';
type CampaignType = 'awareness' | 'performance' | 'hybrid';

interface AppCampaign {
  id: string;
  app_id: string;
  app_name: string;
  app_icon: string;
  developer_id: string;
  developer_name: string;
  campaign_type: CampaignType;
  status: CampaignStatus;
  budget: number;
  spent: number;
  platform_fee: number; // 20% of spent
  // Awareness metrics
  pay_per_1k_views?: number;
  views?: number;
  // Performance metrics
  pay_per_install?: number;
  installs?: number;
  participants: number;
  created_at: string;
}

const CAMPAIGN_TYPE_CONFIG: Record<CampaignType, { label: string; icon: any; color: string; bg: string }> = {
  awareness: { label: 'Awareness', icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  performance: { label: 'Performance', icon: Target, color: 'text-green-400', bg: 'bg-green-500/20' },
  hybrid: { label: 'Hybrid', icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/20' },
};

export default function AppCampaignsPage() {
  const router = useRouter();
  const { role } = useAdminUser();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CampaignType | 'all'>('all');

  const isChairman = role === 'chairman';
  const isDeveloper = role === 'developer';

  // Mock data
  const campaigns: AppCampaign[] = [
    {
      id: '1',
      app_id: 'app1',
      app_name: 'ClipMaster Pro',
      app_icon: '✂️',
      developer_id: 'd1',
      developer_name: 'DevStudio Inc',
      campaign_type: 'hybrid',
      status: 'active',
      budget: 5000,
      spent: 3200,
      platform_fee: 640,
      pay_per_1k_views: 2,
      views: 890000,
      pay_per_install: 5,
      installs: 280,
      participants: 24,
      created_at: '2024-03-01',
    },
    {
      id: '2',
      app_id: 'app2',
      app_name: 'Viral Tracker',
      app_icon: '📈',
      developer_id: 'd2',
      developer_name: 'Analytics Pro',
      campaign_type: 'performance',
      status: 'active',
      budget: 3000,
      spent: 1850,
      platform_fee: 370,
      pay_per_install: 8,
      installs: 215,
      participants: 18,
      created_at: '2024-03-05',
    },
    {
      id: '3',
      app_id: 'app3',
      app_name: 'Hook Generator',
      app_icon: '🎣',
      developer_id: 'd3',
      developer_name: 'AI Tools Lab',
      campaign_type: 'awareness',
      status: 'paused',
      budget: 2000,
      spent: 1200,
      platform_fee: 240,
      pay_per_1k_views: 3,
      views: 380000,
      participants: 12,
      created_at: '2024-03-10',
    },
  ];

  const filteredCampaigns = campaigns
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => typeFilter === 'all' || c.campaign_type === typeFilter)
    .filter(c => c.app_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 c.developer_name.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalFees = campaigns.reduce((sum, c) => sum + c.platform_fee, 0);
  const totalInstalls = campaigns.reduce((sum, c) => sum + (c.installs || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Smartphone className="text-green-400" />
            Mini App Campaigns
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
              Layer 3
            </span>
          </h1>
          <p className="text-gray-400 mt-1">
            {isChairman 
              ? 'Developers pay clippers to promote their apps. You earn 20% fee.'
              : 'Create campaigns to promote your mini apps and drive installs.'
            }
          </p>
        </div>
        {isDeveloper && (
          <Link
            href="/admin/rewards/app-campaigns/create"
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors font-medium"
          >
            <Plus size={18} />
            Create Campaign
          </Link>
        )}
      </div>

      {/* Chairman Stats */}
      {isChairman && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <DollarSign size={14} />
              Total Spent
            </div>
            <div className="text-2xl font-bold text-green-400">
              ${(totalSpent / 1000).toFixed(1)}K
            </div>
          </div>
          <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <DollarSign size={14} />
              Your Fee (20%)
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              ${totalFees.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Download size={14} />
              Total Installs
            </div>
            <div className="text-2xl font-bold">
              {totalInstalls.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Eye size={14} />
              Total Views
            </div>
            <div className="text-2xl font-bold">
              {(campaigns.reduce((sum, c) => sum + (c.views || 0), 0) / 1000000).toFixed(1)}M
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500/50"
          />
        </div>

        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CampaignType | 'all')}
            className="appearance-none px-4 py-2 pr-10 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white focus:outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="awareness">Awareness</option>
            <option value="performance">Performance</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | 'all')}
            className="appearance-none px-4 py-2 pr-10 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.map((campaign) => {
          const typeConfig = CAMPAIGN_TYPE_CONFIG[campaign.campaign_type];
          const TypeIcon = typeConfig.icon;
          
          return (
            <div 
              key={campaign.id}
              className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5 hover:border-green-500/30 transition-colors cursor-pointer"
              onClick={() => router.push(`/admin/rewards/app-campaigns/${campaign.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  {/* App Icon */}
                  <div className="w-14 h-14 bg-[#1a1a2e] rounded-xl flex items-center justify-center text-2xl">
                    {campaign.app_icon}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg">{campaign.app_name}</h3>
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded',
                        typeConfig.bg, typeConfig.color
                      )}>
                        <TypeIcon size={12} />
                        {typeConfig.label}
                      </span>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <p className="text-sm text-gray-400">
                      By {campaign.developer_name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {campaign.status === 'active' ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="p-2 hover:bg-green-500/20 rounded-lg text-green-400 transition-colors"
                    >
                      <Pause size={18} />
                    </button>
                  ) : campaign.status === 'paused' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="p-2 hover:bg-green-500/20 rounded-lg text-green-400 transition-colors"
                    >
                      <Play size={18} />
                    </button>
                  )}
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <MoreVertical size={18} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Budget Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Budget Progress</span>
                  <span className="text-white">
                    ${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}
                    {isChairman && (
                      <span className="text-yellow-400 ml-2">
                        (${campaign.platform_fee} fee)
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                    style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-5 gap-4">
                {/* Pay Rates */}
                <div className="bg-[#0a0a0f] rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Pay Rates</div>
                  <div className="font-semibold text-sm space-y-1">
                    {campaign.pay_per_1k_views && (
                      <div className="text-blue-400">${campaign.pay_per_1k_views}/1K views</div>
                    )}
                    {campaign.pay_per_install && (
                      <div className="text-green-400">${campaign.pay_per_install}/install</div>
                    )}
                  </div>
                </div>
                
                {/* Views */}
                <div className="bg-[#0a0a0f] rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Views</div>
                  <div className="font-semibold text-blue-400">
                    {campaign.views ? `${(campaign.views / 1000).toFixed(0)}K` : '-'}
                  </div>
                </div>
                
                {/* Installs */}
                <div className="bg-[#0a0a0f] rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Installs</div>
                  <div className="font-semibold text-green-400">
                    {campaign.installs || '-'}
                  </div>
                </div>
                
                {/* Conversion */}
                <div className="bg-[#0a0a0f] rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Conversion</div>
                  <div className="font-semibold">
                    {campaign.views && campaign.installs
                      ? `${((campaign.installs / campaign.views) * 100).toFixed(2)}%`
                      : '-'
                    }
                  </div>
                </div>
                
                {/* Participants */}
                <div className="bg-[#0a0a0f] rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Clippers</div>
                  <div className="font-semibold">{campaign.participants}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && (
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-12 text-center">
          <Smartphone size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium mb-2">No app campaigns found</h3>
          <p className="text-gray-400 mb-4">
            {isDeveloper
              ? 'Create a campaign to promote your mini app'
              : 'Developers will create campaigns here'
            }
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  const config = {
    active: { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-500' },
    paused: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-500' },
    completed: { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-500' },
    draft: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' },
  };
  const c = config[status];
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}


























































































