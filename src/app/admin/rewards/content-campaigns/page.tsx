'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Film,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Users,
  DollarSign,
  TrendingUp,
  Pause,
  Play,
  ChevronDown,
  ExternalLink,
  Scissors,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminUser } from '@/hooks/useAdminUser';

type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft';

interface ContentCampaign {
  id: string;
  name: string;
  owner_type: 'agency' | 'creator';
  owner_id: string;
  owner_name: string;
  source_video_url: string;
  source_dps: number;
  status: CampaignStatus;
  budget: number;
  spent: number;
  platform_fee: number; // 20% of spent
  pay_per_1k_views: number;
  views: number;
  clip_count: number;
  participants: number;
  created_at: string;
}

export default function ContentCampaignsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAdminUser();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [ownerFilter, setOwnerFilter] = useState(searchParams.get('agency') || 'all');

  const isChairman = role === 'chairman';

  // Mock data
  const campaigns: ContentCampaign[] = [
    {
      id: '1',
      name: 'Viral Money Tips Distribution',
      owner_type: 'agency',
      owner_id: '1',
      owner_name: 'Viral Kings Agency',
      source_video_url: 'https://youtube.com/watch?v=abc123',
      source_dps: 78.5,
      status: 'active',
      budget: 2000,
      spent: 1400,
      platform_fee: 280,
      pay_per_1k_views: 3,
      views: 420000,
      clip_count: 15,
      participants: 12,
      created_at: '2024-03-10',
    },
    {
      id: '2',
      name: 'Fitness Transformation Clips',
      owner_type: 'creator',
      owner_id: '5',
      owner_name: '@fitnessguru',
      source_video_url: 'https://youtube.com/watch?v=def456',
      source_dps: 82.1,
      status: 'active',
      budget: 1500,
      spent: 890,
      platform_fee: 178,
      pay_per_1k_views: 4,
      views: 210000,
      clip_count: 8,
      participants: 6,
      created_at: '2024-03-12',
    },
    {
      id: '3',
      name: 'Tech Review Highlights',
      owner_type: 'agency',
      owner_id: '2',
      owner_name: 'TikTok Pros',
      source_video_url: 'https://youtube.com/watch?v=ghi789',
      source_dps: 71.3,
      status: 'paused',
      budget: 3000,
      spent: 1910,
      platform_fee: 382,
      pay_per_1k_views: 3.5,
      views: 520000,
      clip_count: 22,
      participants: 18,
      created_at: '2024-03-05',
    },
  ];

  const filteredCampaigns = campaigns
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => ownerFilter === 'all' || c.owner_id === ownerFilter)
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 c.owner_name.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalFees = campaigns.reduce((sum, c) => sum + c.platform_fee, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Film className="text-blue-400" />
            Content Campaigns
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">
              Layer 2
            </span>
          </h1>
          <p className="text-gray-400 mt-1">
            {isChairman 
              ? 'Agencies & creators pay clippers to distribute content. You earn 20% fee.'
              : 'Create campaigns to have clippers distribute your content.'
            }
          </p>
        </div>
        {(role === 'agency' || role === 'creator') && (
          <Link
            href="/admin/rewards/content-campaigns/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors font-medium"
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
            <div className="text-2xl font-bold text-blue-400">
              ${(totalSpent / 1000).toFixed(1)}K
            </div>
          </div>
          <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <DollarSign size={14} />
              Your Fee (20%)
            </div>
            <div className="text-2xl font-bold text-green-400">
              ${totalFees.toLocaleString()}
            </div>
          </div>
          <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Eye size={14} />
              Total Views
            </div>
            <div className="text-2xl font-bold">
              {(campaigns.reduce((sum, c) => sum + c.views, 0) / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Scissors size={14} />
              Total Clips
            </div>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.clip_count, 0)}
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
            className="w-full pl-10 pr-4 py-2 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        
        {isChairman && (
          <div className="relative">
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Owners</option>
              <option value="1">Viral Kings Agency</option>
              <option value="2">TikTok Pros</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        )}

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
        {filteredCampaigns.map((campaign) => (
          <div 
            key={campaign.id}
            className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5 hover:border-blue-500/30 transition-colors cursor-pointer"
            onClick={() => router.push(`/admin/rewards/content-campaigns/${campaign.id}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg">{campaign.name}</h3>
                  <StatusBadge status={campaign.status} />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>By {campaign.owner_name}</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp size={14} className="text-green-400" />
                    Source DPS: {campaign.source_dps}
                  </span>
                  <a 
                    href={campaign.source_video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={14} />
                    Source Video
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {campaign.status === 'active' ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); }}
                    className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors"
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
                    <span className="text-green-400 ml-2">
                      (${campaign.platform_fee} fee)
                    </span>
                  )}
                </span>
              </div>
              <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                  style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-[#0a0a0f] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Pay Rate</div>
                <div className="font-semibold">${campaign.pay_per_1k_views}/1K views</div>
              </div>
              <div className="bg-[#0a0a0f] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Total Views</div>
                <div className="font-semibold text-blue-400">
                  {(campaign.views / 1000).toFixed(0)}K
                </div>
              </div>
              <div className="bg-[#0a0a0f] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Clips Created</div>
                <div className="font-semibold">{campaign.clip_count}</div>
              </div>
              <div className="bg-[#0a0a0f] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Participants</div>
                <div className="font-semibold">{campaign.participants} clippers</div>
              </div>
              <div className="bg-[#0a0a0f] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Avg Views/Clip</div>
                <div className="font-semibold">
                  {campaign.clip_count > 0 
                    ? (campaign.views / campaign.clip_count / 1000).toFixed(1) + 'K'
                    : '0'
                  }
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && (
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-12 text-center">
          <Film size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium mb-2">No content campaigns found</h3>
          <p className="text-gray-400 mb-4">
            {isChairman 
              ? 'Agencies and creators will create campaigns here'
              : 'Create a campaign to have clippers distribute your content'
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


























































































