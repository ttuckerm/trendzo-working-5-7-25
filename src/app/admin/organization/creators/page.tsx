'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Video,
  TrendingUp,
  ChevronDown,
  Check,
  Clock,
  Star,
  AlertCircle,
  Eye,
  CheckCircle,
  XCircle,
  Settings,
  Sparkles,
  ClipboardList,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminUserWithDevFallback } from '@/hooks/useAdminUser';

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'featured';

type OnboardingStatus = 'not_started' | 'in_progress' | 'completed';

interface Creator {
  id: string;
  handle: string;
  name: string;
  email: string;
  agency_id: string | null;
  agency_name: string | null;
  platforms: string[];
  video_count: number;
  avg_dps: number;
  follower_count: number;
  verification_status: VerificationStatus;
  onboarding_status: OnboardingStatus;
  created_at: string;
}

export default function CreatorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role, profile } = useAdminUserWithDevFallback();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [agencyFilter, setAgencyFilter] = useState(searchParams.get('agency') || 'all');
  const [verificationFilter, setVerificationFilter] = useState<VerificationStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'dps' | 'videos' | 'followers'>('dps');
  const [showVerificationModal, setShowVerificationModal] = useState<Creator | null>(null);
  const [showOnboardingSettings, setShowOnboardingSettings] = useState(false);
  const [onboardingEnabled, setOnboardingEnabled] = useState(true);
  const [autoShowOnFirstLogin, setAutoShowOnFirstLogin] = useState(true);

  // Mock data
  const creators: Creator[] = [
    { id: '1', handle: '@sarahj', name: 'Sarah Johnson', email: 'sarah@email.com', agency_id: '1', agency_name: 'Viral Kings Agency', platforms: ['tiktok', 'instagram'], video_count: 45, avg_dps: 72.3, follower_count: 125000, verification_status: 'verified', onboarding_status: 'completed', created_at: '2024-01-20' },
    { id: '2', handle: '@mikec', name: 'Mike Chen', email: 'mike@email.com', agency_id: '1', agency_name: 'Viral Kings Agency', platforms: ['tiktok', 'youtube'], video_count: 38, avg_dps: 68.9, follower_count: 89000, verification_status: 'verified', onboarding_status: 'completed', created_at: '2024-02-05' },
    { id: '3', handle: '@emilyr', name: 'Emily Rose', email: 'emily@email.com', agency_id: '2', agency_name: 'TikTok Pros', platforms: ['tiktok'], video_count: 52, avg_dps: 74.1, follower_count: 210000, verification_status: 'featured', onboarding_status: 'completed', created_at: '2023-12-10' },
    { id: '4', handle: '@newcreator', name: 'New Creator', email: 'new@email.com', agency_id: '1', agency_name: 'Viral Kings Agency', platforms: ['tiktok'], video_count: 5, avg_dps: 45.2, follower_count: 5000, verification_status: 'pending', onboarding_status: 'in_progress', created_at: '2024-03-15' },
    { id: '5', handle: '@independent', name: 'Indie Creator', email: 'indie@email.com', agency_id: null, agency_name: null, platforms: ['instagram', 'youtube'], video_count: 23, avg_dps: 61.5, follower_count: 45000, verification_status: 'unverified', onboarding_status: 'not_started', created_at: '2024-03-01' },
  ];

  // Filter by agency if user is agency role
  const filteredCreators = creators
    .filter(c => {
      if (role === 'agency' && profile?.metadata?.agency_id) {
        return c.agency_id === profile.metadata.agency_id;
      }
      return agencyFilter === 'all' || c.agency_id === agencyFilter;
    })
    .filter(c => verificationFilter === 'all' || c.verification_status === verificationFilter)
    .filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'dps': return b.avg_dps - a.avg_dps;
        case 'videos': return b.video_count - a.video_count;
        case 'followers': return b.follower_count - a.follower_count;
        default: return 0;
      }
    });

  const pendingCount = creators.filter(c => c.verification_status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Users className="text-purple-400" />
            Creators
          </h1>
          <p className="text-gray-400 mt-1">
            {creators.length} creators • {pendingCount} pending verification
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Onboarding Settings Button */}
          {(role === 'chairman' || role === 'sub_admin' || role === 'agency') && (
            <button
              onClick={() => setShowOnboardingSettings(!showOnboardingSettings)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border",
                showOnboardingSettings
                  ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              )}
            >
              <ClipboardList size={18} />
              Onboarding Settings
            </button>
          )}
          <Link
            href="/admin/organization/creators/create"
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
          >
            <Plus size={18} />
            Add Creator
          </Link>
        </div>
      </div>

      {/* Onboarding Settings Panel */}
      {showOnboardingSettings && (role === 'chairman' || role === 'sub_admin' || role === 'agency') && (
        <div className="bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Creator Onboarding</h3>
                <p className="text-sm text-gray-400">Configure the onboarding experience for new creators</p>
              </div>
            </div>
            <Link
              href="/admin/organization/creators/onboarding?name=Preview&agencyName=Demo%20Agency"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors"
            >
              <Eye size={16} />
              Preview Form
              <ExternalLink size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Enable/Disable Onboarding */}
            <div className="p-4 bg-[#0a0a0f]/50 border border-[#1a1a2e] rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-purple-400" />
                  <div>
                    <h4 className="font-medium">Onboarding Form</h4>
                    <p className="text-xs text-gray-500">Collect creator information on signup</p>
                  </div>
                </div>
                <button
                  onClick={() => setOnboardingEnabled(!onboardingEnabled)}
                  className="relative"
                >
                  {onboardingEnabled ? (
                    <ToggleRight size={32} className="text-green-400" />
                  ) : (
                    <ToggleLeft size={32} className="text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Auto-show on First Login */}
            <div className="p-4 bg-[#0a0a0f]/50 border border-[#1a1a2e] rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles size={20} className="text-pink-400" />
                  <div>
                    <h4 className="font-medium">Auto-show on First Login</h4>
                    <p className="text-xs text-gray-500">Show form when creators first log in</p>
                  </div>
                </div>
                <button
                  onClick={() => setAutoShowOnFirstLogin(!autoShowOnFirstLogin)}
                  className="relative"
                  disabled={!onboardingEnabled}
                >
                  {autoShowOnFirstLogin && onboardingEnabled ? (
                    <ToggleRight size={32} className="text-green-400" />
                  ) : (
                    <ToggleLeft size={32} className={onboardingEnabled ? "text-gray-500" : "text-gray-700"} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-6 border-t border-[#1a1a2e] grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">3</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">2</div>
              <div className="text-xs text-gray-500">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">0</div>
              <div className="text-xs text-gray-500">Not Started</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">100%</div>
              <div className="text-xs text-gray-500">Completion Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Verification Alert */}
      {pendingCount > 0 && role !== 'agency' && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-yellow-400" size={20} />
            <span className="text-yellow-400">
              {pendingCount} creator{pendingCount > 1 ? 's' : ''} awaiting verification
            </span>
          </div>
          <button
            onClick={() => setVerificationFilter('pending')}
            className="text-sm text-yellow-400 hover:text-yellow-300 font-medium"
          >
            Review Now →
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* Agency Filter (not shown for agency role) */}
        {role !== 'agency' && (
          <div className="relative">
            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white focus:outline-none focus:border-purple-500/50 cursor-pointer"
            >
              <option value="all">All Agencies</option>
              <option value="1">Viral Kings Agency</option>
              <option value="2">TikTok Pros</option>
              <option value="null">Independent</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        )}

        {/* Verification Filter */}
        <div className="relative">
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value as VerificationStatus | 'all')}
            className="appearance-none px-4 py-2 pr-10 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white focus:outline-none focus:border-purple-500/50 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="unverified">Unverified</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="featured">Featured</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none px-4 py-2 pr-10 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white focus:outline-none focus:border-purple-500/50 cursor-pointer"
          >
            <option value="dps">Sort by DPS</option>
            <option value="followers">Sort by Followers</option>
            <option value="videos">Sort by Videos</option>
            <option value="name">Sort by Name</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Creators Table */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-[#1a1a2e] bg-[#0a0a0f]">
              <th className="px-6 py-4 font-medium">Creator</th>
              {role !== 'agency' && <th className="px-6 py-4 font-medium">Agency</th>}
              <th className="px-6 py-4 font-medium">Platforms</th>
              <th className="px-6 py-4 font-medium">Videos</th>
              <th className="px-6 py-4 font-medium">Avg DPS</th>
              <th className="px-6 py-4 font-medium">Followers</th>
              <th className="px-6 py-4 font-medium">Status</th>
              {(role === 'chairman' || role === 'sub_admin' || role === 'agency') && (
                <th className="px-6 py-4 font-medium">Onboarding</th>
              )}
              <th className="px-6 py-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filteredCreators.map((creator) => (
              <tr 
                key={creator.id}
                className="border-b border-[#1a1a2e] last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => router.push(`/admin/organization/creators/${creator.id}`)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                      {creator.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {creator.name}
                        {creator.verification_status === 'featured' && (
                          <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{creator.handle}</div>
                    </div>
                  </div>
                </td>
                {role !== 'agency' && (
                  <td className="px-6 py-4 text-gray-400">
                    {creator.agency_name || (
                      <span className="text-gray-600 italic">Independent</span>
                    )}
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    {creator.platforms.map((p) => (
                      <PlatformBadge key={p} platform={p} />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Video size={14} className="text-gray-500" />
                    {creator.video_count}
                  </div>
                </td>
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
                  {(creator.follower_count / 1000).toFixed(1)}K
                </td>
                <td className="px-6 py-4">
                  <VerificationBadge status={creator.verification_status} />
                </td>
                {(role === 'chairman' || role === 'sub_admin' || role === 'agency') && (
                  <td className="px-6 py-4">
                    <OnboardingBadge status={creator.onboarding_status} />
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    {creator.verification_status === 'pending' && role !== 'agency' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowVerificationModal(creator);
                        }}
                        className="p-2 hover:bg-green-500/20 rounded-lg text-green-400 transition-colors"
                        title="Review verification"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {(role === 'chairman' || role === 'sub_admin' || role === 'agency') && 
                     creator.onboarding_status !== 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `/admin/organization/creators/onboarding?creatorId=${creator.id}&name=${encodeURIComponent(creator.name)}&agencyId=${creator.agency_id || ''}&agencyName=${encodeURIComponent(creator.agency_name || '')}`,
                            '_blank'
                          );
                        }}
                        className="p-2 hover:bg-purple-500/20 rounded-lg text-purple-400 transition-colors"
                        title="Open onboarding form"
                      >
                        <ClipboardList size={16} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/organization/creators/${creator.id}`);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Eye size={16} className="text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open dropdown
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && (
        <VerificationModal
          creator={showVerificationModal}
          onClose={() => setShowVerificationModal(null)}
          onApprove={() => {
            // API call to approve
            setShowVerificationModal(null);
          }}
          onReject={() => {
            // API call to reject
            setShowVerificationModal(null);
          }}
        />
      )}
    </div>
  );
}

// Helper Components
function PlatformBadge({ platform }: { platform: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    tiktok: { bg: 'bg-pink-500/20', text: 'text-pink-400', label: 'TT' },
    instagram: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'IG' },
    youtube: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'YT' },
  };
  const c = config[platform] || { bg: 'bg-gray-500/20', text: 'text-gray-400', label: platform.slice(0, 2).toUpperCase() };
  
  return (
    <span className={`px-2 py-0.5 text-xs rounded ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const config = {
    unverified: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: AlertCircle, label: 'Unverified' },
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Clock, label: 'Pending' },
    verified: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Check, label: 'Verified' },
    featured: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Star, label: 'Featured' },
  };
  const c = config[status];
  const Icon = c.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${c.bg} ${c.text}`}>
      <Icon size={12} className={status === 'featured' ? 'fill-current' : ''} />
      {c.label}
    </span>
  );
}

function OnboardingBadge({ status }: { status: OnboardingStatus }) {
  const config = {
    not_started: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: FileText, label: 'Not Started' },
    in_progress: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: Clock, label: 'In Progress' },
    completed: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle, label: 'Completed' },
  };
  const c = config[status];
  const Icon = c.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${c.bg} ${c.text}`}>
      <Icon size={12} />
      {c.label}
    </span>
  );
}

function VerificationModal({ 
  creator, 
  onClose, 
  onApprove, 
  onReject 
}: { 
  creator: Creator; 
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">Verify Creator</h2>
        
        <div className="flex items-center gap-3 mb-6 p-4 bg-[#0a0a0f] rounded-lg">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium text-lg">
            {creator.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium">{creator.name}</div>
            <div className="text-sm text-gray-400">{creator.handle}</div>
            <div className="text-xs text-gray-500">{creator.email}</div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Agency</span>
            <span>{creator.agency_name || 'Independent'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Videos</span>
            <span>{creator.video_count}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Avg DPS</span>
            <span className={cn(
              creator.avg_dps >= 70 ? 'text-green-400' :
              creator.avg_dps >= 60 ? 'text-yellow-400' :
              'text-red-400'
            )}>
              {creator.avg_dps}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Followers</span>
            <span>{(creator.follower_count / 1000).toFixed(1)}K</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onReject}
            className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <XCircle size={16} />
            Reject
          </button>
          <button
            onClick={onApprove}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} />
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}














































































