'use client';

import React, { useState } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  ChevronDown,
  User,
  Building2,
  Key,
  ToggleLeft,
  DollarSign,
  Eye,
  UserCheck,
  Settings,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminUser } from '@/hooks/useAdminUser';

type EventAction = 
  | 'user.login' | 'user.logout'
  | 'agency.created' | 'agency.updated' | 'agency.deleted'
  | 'creator.verified' | 'creator.rejected'
  | 'feature_toggle.changed'
  | 'tier.changed'
  | 'campaign.created' | 'campaign.paused'
  | 'payout.processed'
  | 'api_key.generated' | 'api_key.revoked'
  | 'impersonation.started' | 'impersonation.ended'
  | 'webhook.failed';

interface AuditEvent {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_email: string;
  actor_role: string;
  action: EventAction;
  resource_type: string;
  resource_id: string;
  target_name: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const ACTION_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  'user.login': { icon: User, color: 'text-green-400', label: 'User Login' },
  'user.logout': { icon: User, color: 'text-gray-400', label: 'User Logout' },
  'agency.created': { icon: Building2, color: 'text-blue-400', label: 'Agency Created' },
  'agency.updated': { icon: Building2, color: 'text-yellow-400', label: 'Agency Updated' },
  'agency.deleted': { icon: Building2, color: 'text-red-400', label: 'Agency Deleted' },
  'creator.verified': { icon: UserCheck, color: 'text-green-400', label: 'Creator Verified' },
  'creator.rejected': { icon: UserCheck, color: 'text-red-400', label: 'Creator Rejected' },
  'feature_toggle.changed': { icon: ToggleLeft, color: 'text-yellow-400', label: 'Feature Toggle' },
  'tier.changed': { icon: Settings, color: 'text-purple-400', label: 'Tier Changed' },
  'campaign.created': { icon: DollarSign, color: 'text-green-400', label: 'Campaign Created' },
  'campaign.paused': { icon: DollarSign, color: 'text-yellow-400', label: 'Campaign Paused' },
  'payout.processed': { icon: DollarSign, color: 'text-green-400', label: 'Payout Processed' },
  'api_key.generated': { icon: Key, color: 'text-purple-400', label: 'API Key Generated' },
  'api_key.revoked': { icon: Key, color: 'text-red-400', label: 'API Key Revoked' },
  'impersonation.started': { icon: Eye, color: 'text-yellow-400', label: 'Impersonation Started' },
  'impersonation.ended': { icon: Eye, color: 'text-gray-400', label: 'Impersonation Ended' },
  'webhook.failed': { icon: AlertTriangle, color: 'text-red-400', label: 'Webhook Failed' },
};

export default function AuditLogPage() {
  const { role } = useAdminUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // Mock data
  const events: AuditEvent[] = [
    {
      id: '1',
      actor_id: 'u1',
      actor_name: 'Tommy',
      actor_email: 'tommy@cleancopy.ai',
      actor_role: 'chairman',
      action: 'feature_toggle.changed',
      resource_type: 'agency',
      resource_id: 'a1',
      target_name: 'Viral Kings Agency',
      changes: {
        before: { api_access: false },
        after: { api_access: true },
      },
      ip_address: '192.168.1.1',
      user_agent: 'Mozilla/5.0...',
      created_at: '2024-03-15T14:30:00Z',
    },
    {
      id: '2',
      actor_id: 'u2',
      actor_name: 'Alex Chen',
      actor_email: 'alex@viralkings.com',
      actor_role: 'agency',
      action: 'impersonation.started',
      resource_type: 'user',
      resource_id: 'c1',
      target_name: '@sarahj',
      ip_address: '192.168.1.2',
      user_agent: 'Mozilla/5.0...',
      created_at: '2024-03-15T13:15:00Z',
    },
    {
      id: '3',
      actor_id: 'u1',
      actor_name: 'Tommy',
      actor_email: 'tommy@cleancopy.ai',
      actor_role: 'chairman',
      action: 'tier.changed',
      resource_type: 'agency',
      resource_id: 'a2',
      target_name: 'TikTok Pros',
      changes: {
        before: { tier: 'growth' },
        after: { tier: 'pro' },
      },
      ip_address: '192.168.1.1',
      user_agent: 'Mozilla/5.0...',
      created_at: '2024-03-15T11:00:00Z',
    },
    {
      id: '4',
      actor_id: 'system',
      actor_name: 'System',
      actor_email: 'system@cleancopy.ai',
      actor_role: 'system',
      action: 'creator.verified',
      resource_type: 'creator',
      resource_id: 'c5',
      target_name: '@newcreator',
      ip_address: '127.0.0.1',
      user_agent: 'CleanCopy System',
      created_at: '2024-03-15T10:00:00Z',
    },
    {
      id: '5',
      actor_id: 'u3',
      actor_name: 'DevStudio Inc',
      actor_email: 'dev@devstudio.com',
      actor_role: 'developer',
      action: 'api_key.generated',
      resource_type: 'api_key',
      resource_id: 'k7',
      target_name: 'Production Key',
      ip_address: '192.168.1.5',
      user_agent: 'Mozilla/5.0...',
      created_at: '2024-03-15T09:30:00Z',
    },
  ];

  const filteredEvents = events
    .filter(e => actionFilter === 'all' || e.action === actionFilter)
    .filter(e => resourceFilter === 'all' || e.resource_type === resourceFilter)
    .filter(e => 
      e.actor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.target_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.action.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const exportCsv = () => {
    // Export logic
    console.log('Exporting CSV...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <ScrollText className="text-cyan-400" />
            Audit Log
          </h1>
          <p className="text-gray-400 mt-1">
            Track all actions and changes across the platform
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by actor, target, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="relative">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="appearance-none px-4 py-2 pr-10 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white focus:outline-none cursor-pointer"
          >
            <option value="all">All Actions</option>
            <option value="user.login">User Login</option>
            <option value="agency.created">Agency Created</option>
            <option value="creator.verified">Creator Verified</option>
            <option value="feature_toggle.changed">Feature Toggle</option>
            <option value="tier.changed">Tier Changed</option>
            <option value="payout.processed">Payout Processed</option>
            <option value="impersonation.started">Impersonation</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="appearance-none px-4 py-2 pr-10 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white focus:outline-none cursor-pointer"
          >
            <option value="all">All Resources</option>
            <option value="user">Users</option>
            <option value="agency">Agencies</option>
            <option value="creator">Creators</option>
            <option value="campaign">Campaigns</option>
            <option value="api_key">API Keys</option>
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white focus:outline-none"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Events List */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-[#1a1a2e] bg-[#0a0a0f]">
              <th className="px-6 py-4 font-medium">Timestamp</th>
              <th className="px-6 py-4 font-medium">Actor</th>
              <th className="px-6 py-4 font-medium">Action</th>
              <th className="px-6 py-4 font-medium">Target</th>
              <th className="px-6 py-4 font-medium">IP Address</th>
              <th className="px-6 py-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event) => {
              const config = ACTION_CONFIG[event.action] || { icon: Settings, color: 'text-gray-400', label: event.action };
              const Icon = config.icon;
              const isExpanded = expandedEvent === event.id;

              return (
                <React.Fragment key={event.id}>
                  <tr 
                    className={cn(
                      'border-b border-[#1a1a2e] hover:bg-white/5 cursor-pointer transition-colors',
                      isExpanded && 'bg-white/5'
                    )}
                    onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(event.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'px-2 py-0.5 text-xs rounded',
                          event.actor_role === 'chairman' ? 'bg-yellow-500/20 text-yellow-400' :
                          event.actor_role === 'system' ? 'bg-cyan-500/20 text-cyan-400' :
                          event.actor_role === 'agency' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        )}>
                          {event.actor_role}
                        </span>
                        <span className="font-medium text-sm">{event.actor_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn('flex items-center gap-2 text-sm', config.color)}>
                        <Icon size={16} />
                        {config.label}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-gray-400">{event.resource_type}:</span>{' '}
                      <span className="font-medium">{event.target_name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {event.ip_address}
                    </td>
                    <td className="px-6 py-4">
                      <ChevronDown 
                        size={16} 
                        className={cn(
                          'text-gray-400 transition-transform',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </td>
                  </tr>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <tr className="bg-[#0a0a0f]">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium mb-2 text-gray-400">Event Details</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Event ID</span>
                                <code className="text-gray-400">{event.id}</code>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Actor Email</span>
                                <span>{event.actor_email}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Resource ID</span>
                                <code className="text-gray-400">{event.resource_id}</code>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">User Agent</span>
                                <span className="text-xs text-gray-500 max-w-xs truncate">
                                  {event.user_agent}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {event.changes && (
                            <div>
                              <h4 className="text-sm font-medium mb-2 text-gray-400">Changes</h4>
                              <div className="grid grid-cols-2 gap-4">
                                {event.changes.before && (
                                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                    <div className="text-xs text-red-400 mb-1">Before</div>
                                    <pre className="text-xs text-gray-300">
                                      {JSON.stringify(event.changes.before, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {event.changes.after && (
                                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                    <div className="text-xs text-green-400 mb-1">After</div>
                                    <pre className="text-xs text-gray-300">
                                      {JSON.stringify(event.changes.after, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <ScrollText size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium mb-2">No events found</h3>
          <p className="text-gray-400">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}


























































































