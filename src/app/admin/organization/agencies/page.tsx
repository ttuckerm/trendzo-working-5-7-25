'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Users,
  Video,
  TrendingUp,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AgencyTier = 'starter' | 'growth' | 'pro' | 'enterprise';

interface Agency {
  id: string;
  name: string;
  tier: AgencyTier;
  owner_email: string;
  creator_count: number;
  video_count: number;
  avg_dps: number;
  monthly_revenue: number;
  created_at: string;
  status: 'active' | 'suspended' | 'pending';
}

export default function AgenciesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<AgencyTier | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'creators' | 'dps'>('revenue');

  // Mock data - replace with API call
  const agencies: Agency[] = [
    { id: '1', name: 'Viral Kings Agency', tier: 'pro', owner_email: 'alex@viralkings.com', creator_count: 45, video_count: 1234, avg_dps: 67.3, monthly_revenue: 124500, created_at: '2024-01-15', status: 'active' },
    { id: '2', name: 'TikTok Pros', tier: 'growth', owner_email: 'maria@tiktokpros.com', creator_count: 23, video_count: 567, avg_dps: 71.2, monthly_revenue: 89200, created_at: '2024-02-20', status: 'active' },
    { id: '3', name: 'Content Masters', tier: 'enterprise', owner_email: 'john@contentmasters.io', creator_count: 67, video_count: 2100, avg_dps: 58.9, monthly_revenue: 156800, created_at: '2023-11-05', status: 'active' },
    { id: '4', name: 'Social Spark', tier: 'starter', owner_email: 'sarah@socialspark.co', creator_count: 12, video_count: 189, avg_dps: 74.5, monthly_revenue: 45600, created_at: '2024-03-10', status: 'active' },
  ];

  // Filter and sort
  const filteredAgencies = agencies
    .filter(a => tierFilter === 'all' || a.tier === tierFilter)
    .filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 a.owner_email.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'revenue': return b.monthly_revenue - a.monthly_revenue;
        case 'creators': return b.creator_count - a.creator_count;
        case 'dps': return b.avg_dps - a.avg_dps;
        default: return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Building2 className="text-blue-400" />
            Agencies
          </h1>
          <p className="text-gray-400 mt-1">
            {agencies.length} agencies • ${(agencies.reduce((sum, a) => sum + a.monthly_revenue, 0) / 1000).toFixed(1)}K monthly revenue
          </p>
        </div>
        <Link
          href="/admin/organization/agencies/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Add Agency
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search agencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Tier Filter */}
        <div className="relative">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as AgencyTier | 'all')}
            className="appearance-none px-4 py-2 pr-10 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white focus:outline-none focus:border-blue-500/50 cursor-pointer"
          >
            <option value="all">All Tiers</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none px-4 py-2 pr-10 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white focus:outline-none focus:border-blue-500/50 cursor-pointer"
          >
            <option value="revenue">Sort by Revenue</option>
            <option value="creators">Sort by Creators</option>
            <option value="dps">Sort by DPS</option>
            <option value="name">Sort by Name</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Agencies Table */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-[#1a1a2e] bg-[#0a0a0f]">
              <th className="px-6 py-4 font-medium">Agency</th>
              <th className="px-6 py-4 font-medium">Tier</th>
              <th className="px-6 py-4 font-medium">Creators</th>
              <th className="px-6 py-4 font-medium">Videos</th>
              <th className="px-6 py-4 font-medium">Avg DPS</th>
              <th className="px-6 py-4 font-medium">Revenue</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filteredAgencies.map((agency) => (
              <tr 
                key={agency.id}
                className="border-b border-[#1a1a2e] last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => router.push(`/admin/organization/agencies/${agency.id}`)}
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{agency.name}</div>
                    <div className="text-sm text-gray-500">{agency.owner_email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <TierBadge tier={agency.tier} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users size={14} className="text-gray-500" />
                    {agency.creator_count}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Video size={14} className="text-gray-500" />
                    {agency.video_count.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className={cn(
                      agency.avg_dps >= 70 ? 'text-green-400' :
                      agency.avg_dps >= 60 ? 'text-yellow-400' :
                      'text-red-400'
                    )} />
                    <span className={cn(
                      agency.avg_dps >= 70 ? 'text-green-400' :
                      agency.avg_dps >= 60 ? 'text-yellow-400' :
                      'text-red-400'
                    )}>
                      {agency.avg_dps}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-green-400 font-medium">
                    <DollarSign size={14} />
                    {(agency.monthly_revenue / 1000).toFixed(1)}K/mo
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={agency.status} />
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open dropdown menu
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredAgencies.length === 0 && (
        <div className="text-center py-12 bg-[#111118] border border-[#1a1a2e] rounded-xl">
          <Building2 size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium mb-2">No agencies found</h3>
          <p className="text-gray-400 mb-4">Try adjusting your filters or search query</p>
          <Link
            href="/admin/organization/agencies/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            <Plus size={18} />
            Add First Agency
          </Link>
        </div>
      )}
    </div>
  );
}

// Helper components
function TierBadge({ tier }: { tier: AgencyTier }) {
  const config = {
    starter: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30', label: 'Starter' },
    growth: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Growth' },
    pro: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'Pro' },
    enterprise: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', label: 'Enterprise' },
  };
  const c = config[tier];
  
  return (
    <span className={`px-2 py-1 text-xs rounded border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
}

function StatusBadge({ status }: { status: 'active' | 'suspended' | 'pending' }) {
  const config = {
    active: { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-500' },
    suspended: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  };
  const c = config[status];
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}


























































































