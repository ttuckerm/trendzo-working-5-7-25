'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  Check,
  X,
  Clock,
  AlertCircle,
  Download,
  ChevronDown,
  User,
  Smartphone,
  Link2,
  Film,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
type PayoutType = 'clipper' | 'developer' | 'affiliate';

interface Payout {
  id: string;
  recipient_id: string;
  recipient_name: string;
  recipient_email: string;
  type: PayoutType;
  amount: number;
  breakdown: {
    platform_campaigns?: number;
    content_campaigns?: number;
    app_campaigns?: number;
    affiliate?: number;
  };
  payout_method: 'paypal' | 'stripe' | 'bank';
  status: PayoutStatus;
  requested_at: string;
  processed_at?: string;
}

export default function PayoutsPage() {
  const [activeTab, setActiveTab] = useState<PayoutStatus | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<PayoutType | 'all'>('all');
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([]);
  const [showProcessModal, setShowProcessModal] = useState<Payout | null>(null);

  // Mock data
  const payouts: Payout[] = [
    {
      id: '1',
      recipient_id: 'c1',
      recipient_name: 'Sarah Johnson',
      recipient_email: 'sarah@email.com',
      type: 'clipper',
      amount: 450,
      breakdown: { platform_campaigns: 280, content_campaigns: 120, app_campaigns: 50 },
      payout_method: 'paypal',
      status: 'pending',
      requested_at: '2024-03-15T10:30:00Z',
    },
    {
      id: '2',
      recipient_id: 'd1',
      recipient_name: 'DevStudio Inc',
      recipient_email: 'billing@devstudio.com',
      type: 'developer',
      amount: 2380,
      breakdown: { app_campaigns: 2380 },
      payout_method: 'stripe',
      status: 'pending',
      requested_at: '2024-03-15T09:15:00Z',
    },
    {
      id: '3',
      recipient_id: 'a1',
      recipient_name: 'Mike Chen',
      recipient_email: 'mike@affiliates.com',
      type: 'affiliate',
      amount: 680,
      breakdown: { affiliate: 680 },
      payout_method: 'paypal',
      status: 'processing',
      requested_at: '2024-03-14T14:00:00Z',
    },
    {
      id: '4',
      recipient_id: 'c2',
      recipient_name: 'Emily Rose',
      recipient_email: 'emily@email.com',
      type: 'clipper',
      amount: 320,
      breakdown: { platform_campaigns: 200, content_campaigns: 120 },
      payout_method: 'bank',
      status: 'completed',
      requested_at: '2024-03-10T11:00:00Z',
      processed_at: '2024-03-12T09:00:00Z',
    },
  ];

  const filteredPayouts = payouts
    .filter(p => activeTab === 'all' || p.status === activeTab)
    .filter(p => typeFilter === 'all' || p.type === typeFilter)
    .filter(p => 
      p.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.recipient_email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const stats = {
    pending: payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    processing: payouts.filter(p => p.status === 'processing').reduce((sum, p) => sum + p.amount, 0),
    thisMonth: payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    allTime: 156800,
  };

  const pendingCount = payouts.filter(p => p.status === 'pending').length;

  const toggleSelectAll = () => {
    const pendingIds = filteredPayouts.filter(p => p.status === 'pending').map(p => p.id);
    if (selectedPayouts.length === pendingIds.length) {
      setSelectedPayouts([]);
    } else {
      setSelectedPayouts(pendingIds);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedPayouts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <DollarSign className="text-green-400" />
            Payouts
          </h1>
          <p className="text-gray-400 mt-1">
            Process and manage payouts for clippers, developers, and affiliates
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-yellow-400 text-sm mb-1">
            <Clock size={14} />
            Pending
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            ${stats.pending.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400">{pendingCount} payouts</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
            <AlertCircle size={14} />
            Processing
          </div>
          <div className="text-2xl font-bold text-blue-400">
            ${stats.processing.toLocaleString()}
          </div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
            <Check size={14} />
            This Month
          </div>
          <div className="text-2xl font-bold text-green-400">
            ${stats.thisMonth.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <DollarSign size={14} />
            All Time
          </div>
          <div className="text-2xl font-bold">
            ${(stats.allTime / 1000).toFixed(1)}K
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-[#1a1a2e]">
        {(['pending', 'processing', 'completed', 'failed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize',
              activeTab === tab
                ? 'border-green-500 text-green-400'
                : 'border-transparent text-gray-400 hover:text-white'
            )}
          >
            {tab}
            {tab === 'pending' && pendingCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters & Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative max-w-xs">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search recipients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-green-500/50"
            />
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as PayoutType | 'all')}
              className="appearance-none px-4 py-2 pr-10 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="clipper">Clippers</option>
              <option value="developer">Developers</option>
              <option value="affiliate">Affiliates</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPayouts.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {selectedPayouts.length} selected
            </span>
            <button
              onClick={() => {
                // Bulk approve
              }}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors text-sm font-medium"
            >
              Approve Selected
            </button>
          </div>
        )}
      </div>

      {/* Payouts Table */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-[#1a1a2e] bg-[#0a0a0f]">
              {activeTab === 'pending' && (
                <th className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedPayouts.length === filteredPayouts.filter(p => p.status === 'pending').length && selectedPayouts.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-600 bg-[#0a0a0f] text-green-500"
                  />
                </th>
              )}
              <th className="px-6 py-4 font-medium">Recipient</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Breakdown</th>
              <th className="px-6 py-4 font-medium">Method</th>
              <th className="px-6 py-4 font-medium">Requested</th>
              <th className="px-6 py-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filteredPayouts.map((payout) => (
              <tr key={payout.id} className="border-b border-[#1a1a2e] last:border-0 hover:bg-white/5">
                {activeTab === 'pending' && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedPayouts.includes(payout.id)}
                      onChange={() => toggleSelect(payout.id)}
                      className="w-4 h-4 rounded border-gray-600 bg-[#0a0a0f] text-green-500"
                    />
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="font-medium">{payout.recipient_name}</div>
                  <div className="text-sm text-gray-500">{payout.recipient_email}</div>
                </td>
                <td className="px-6 py-4">
                  <TypeBadge type={payout.type} />
                </td>
                <td className="px-6 py-4">
                  <span className="text-lg font-semibold text-green-400">
                    ${payout.amount.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <BreakdownDisplay breakdown={payout.breakdown} />
                </td>
                <td className="px-6 py-4 text-gray-400 capitalize">
                  {payout.payout_method}
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {new Date(payout.requested_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {payout.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowProcessModal(payout)}
                        className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-sm transition-colors"
                      >
                        Process
                      </button>
                      <button className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  {payout.status === 'completed' && (
                    <span className="text-green-400 text-sm flex items-center gap-1">
                      <Check size={14} />
                      Paid
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredPayouts.length === 0 && (
        <div className="text-center py-12">
          <DollarSign size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium mb-2">No payouts found</h3>
          <p className="text-gray-400">
            {activeTab === 'pending' ? 'No pending payouts to process' : 'No payouts match your filters'}
          </p>
        </div>
      )}

      {/* Process Modal */}
      {showProcessModal && (
        <ProcessPayoutModal
          payout={showProcessModal}
          onClose={() => setShowProcessModal(null)}
          onApprove={() => {
            // Process payout
            setShowProcessModal(null);
          }}
        />
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: PayoutType }) {
  const config = {
    clipper: { icon: User, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    developer: { icon: Smartphone, color: 'text-green-400', bg: 'bg-green-500/20' },
    affiliate: { icon: Link2, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  };
  const c = config[type];
  const Icon = c.icon;

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 text-xs rounded capitalize', c.bg, c.color)}>
      <Icon size={12} />
      {type}
    </span>
  );
}

function BreakdownDisplay({ breakdown }: { breakdown: Payout['breakdown'] }) {
  const items = [
    { key: 'platform_campaigns', label: 'Platform', icon: '🎯', color: 'text-yellow-400' },
    { key: 'content_campaigns', label: 'Content', icon: '🎬', color: 'text-blue-400' },
    { key: 'app_campaigns', label: 'Apps', icon: '📱', color: 'text-green-400' },
    { key: 'affiliate', label: 'Affiliate', icon: '🔗', color: 'text-purple-400' },
  ].filter(item => breakdown[item.key as keyof typeof breakdown]);

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span key={item.key} className={cn('text-xs', item.color)} title={item.label}>
          {item.icon} ${breakdown[item.key as keyof typeof breakdown]}
        </span>
      ))}
    </div>
  );
}

function ProcessPayoutModal({ 
  payout, 
  onClose, 
  onApprove 
}: { 
  payout: Payout;
  onClose: () => void;
  onApprove: () => void;
}) {
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">Process Payout</h2>
        
        <div className="space-y-4 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-400">Recipient</span>
            <span className="font-medium">{payout.recipient_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Amount</span>
            <span className="text-green-400 font-bold text-xl">${payout.amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Method</span>
            <span className="capitalize">{payout.payout_method}</span>
          </div>
          
          <div className="pt-4 border-t border-[#1a1a2e]">
            <div className="text-sm text-gray-400 mb-2">Breakdown</div>
            {Object.entries(payout.breakdown).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="capitalize">{key.replace('_', ' ')}</span>
                <span>${value}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
              rows={2}
              className="w-full px-4 py-2 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-white placeholder:text-gray-600 focus:outline-none resize-none"
            />
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
            onClick={onApprove}
            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors font-medium"
          >
            Approve & Process
          </button>
        </div>
      </div>
    </div>
  );
}


























































































