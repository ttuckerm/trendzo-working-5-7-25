'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Users,
  DollarSign,
  TrendingUp,
  UserPlus,
  Pause,
  Play,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft';

interface PlatformCampaign {
  id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  budget: number;
  spent: number;
  pay_per_1k_views: number;
  pay_per_signup: number;
  views: number;
  signups: number;
  participants: number;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export default function PlatformCampaignsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');

  // Mock data
  const campaigns: PlatformCampaign[] = [
    {
      id: '1',
      name: 'CleanCopy Launch Promo',
      description: 'Promote CleanCopy viral prediction platform',
      status: 'active',
      budget: 10000,
      spent: 7800,
      pay_per_1k_views: 5,
      pay_per_signup: 25,
      views: 1200000,
      signups: 180,
      participants: 34,
      start_date: '2024-03-01',
      end_date: '2024-04-01',
      created_at: '2024-02-28',
    },
    {
      id: '2',
      name: 'Creator Tools Campaign',
      description: 'Highlight DPS calculator and pattern extraction',
      status: 'active',
      budget: 5000,
      spent: 3200,
      pay_per_1k_views: 4,
      pay_per_signup: 20,
      views: 600000,
      signups: 95,
      participants: 22,
      start_date: '2024-03-10',
      end_date: null,
      created_at: '2024-03-09',
    },
    {
      id: '3',
      name: 'Agency Partnership Push',
      description: 'Target content agencies and managers',
      status: 'paused',
      budget: 8000,
      spent: 5000,
      pay_per_1k_views: 6,
      pay_per_signup: 30,
      views: 500000,
      signups: 95,
      participants: 18,
      start_date: '2024-02-15',
      end_date: '2024-03-15',
      created_at: '2024-02-14',
    },
  ];

  const filteredCampaigns = campaigns
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalSignups = campaigns.reduce((sum, c) => sum + c.signups, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Megaphone className="text-yellow-400" />
            Platform Campaigns
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full">
              Layer 1
            </span>
          </h1>
          <p className="text-gray-400 mt-1">
            Campaigns you fund to promote CleanCopy
          </p>
        </div>
        <Link
          href="/admin/rewards/platform-campaigns/create"
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg transition-colors font-medium"
        >
          <Plus size={18} />
          Create Campaign
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <DollarSign size={14} />
            Total Budget
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            ${(totalBudget / 1000).toFixed(0)}K
          </div>
        </div>
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <TrendingUp size={14} />
            Total Spent
          </div>
          <div className="text-2xl font-bold text-green-400">
            ${(totalSpent / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {((totalSpent / totalBudget) * 100).toFixed(0)}% of budget
          </div>
        </div>
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <UserPlus size={14} />
            Total Signups
          </div>
          <div className="text-2xl font-bold text-green-400">
            {totalSignups}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ${(totalSpent / totalSignups).toFixed(2)} per signup
          </div>
        </div>
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Users size={14} />
            Active Clippers
          </div>
          <div className="text-2xl font-bold">
            {campaigns.filter(c => c.status === 'active').reduce((sum, c) => sum + c.participants, 0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500/50"
          />
        </div>
        
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | 'all')}
            className="appearance-none px-4 py-2 pr-10 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white focus:outline-none focus:border-yellow-500/50 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {filteredCampaigns.map((campaign) => (
          <div 
            key={campaign.id}
            className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5 hover:border-yellow-500/30 transition-colors cursor-pointer"
            onClick={() => router.push(`/admin/rewards/platform-campaigns/${campaign.id}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg">{campaign.name}</h3>
                  <StatusBadge status={campaign.status} />
                </div>
                <p className="text-gray-400 text-sm mt-1">{campaign.description}</p>
              </div>
              
              <div className="flex items-center gap-2">
                {campaign.status === 'active' ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* pause */ }}
                    className="p-2 hover:bg-yellow-500/20 rounded-lg text-yellow-400 transition-colors"
                    title="Pause campaign"
                  >
                    <Pause size={18} />
                  </button>
                ) : campaign.status === 'paused' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* resume */ }}
                    className="p-2 hover:bg-green-500/20 rounded-lg text-green-400 transition-colors"
                    title="Resume campaign"
                  >
                    <Play size={18} />
                  </button>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); }}
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
                </span>
              </div>
              <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full"
                  style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-[#0a0a0f] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Pay Rate</div>
                <div className="font-semibold">
                  ${campaign.pay_per_1k_views}/1K + ${campaign.pay_per_signup}/signup
                </div>
              </div>
              <div className="bg-[#0a0a0f] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Views</div>
                <div className="font-semibold text-blue-400">
                  {(campaign.views / 1000000).toFixed(1)}M
                </div>
              </div>
              <div className="bg-[#0a0a0f] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Signups</div>
                <div className="font-semibold text-green-400">
                  {campaign.signups}
                </div>
              </div>
              <div className="bg-[#0a0a0f] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Participants</div>
                <div className="font-semibold">
                  {campaign.participants} clippers
                </div>
              </div>
              <div className="bg-[#0a0a0f] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Duration</div>
                <div className="font-semibold text-sm">
                  {new Date(campaign.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {campaign.end_date 
                    ? ` - ${new Date(campaign.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : ' - Ongoing'
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
          <Megaphone size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
          <p className="text-gray-400 mb-4">Create your first platform campaign to start promoting CleanCopy</p>
          <Link
            href="/admin/rewards/platform-campaigns/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg transition-colors font-medium"
          >
            <Plus size={18} />
            Create Campaign
          </Link>
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


























































































