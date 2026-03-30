'use client';

import React, { useState } from 'react';
import {
  Webhook,
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Clock,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  PlayCircle,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type WebhookStatus = 'active' | 'inactive' | 'failing';
type WebhookEvent = 
  | 'video.analyzed'
  | 'prediction.completed'
  | 'creator.verified'
  | 'campaign.created'
  | 'payout.processed';

interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  status: WebhookStatus;
  secret: string;
  created_at: string;
  last_triggered_at: string | null;
  success_rate: number;
  last_response_code: number | null;
}

interface WebhookLog {
  id: string;
  webhook_id: string;
  event: WebhookEvent;
  status_code: number;
  response_time_ms: number;
  success: boolean;
  payload: object;
  response: string;
  created_at: string;
}

const EVENT_OPTIONS: { value: WebhookEvent; label: string; description: string }[] = [
  { value: 'video.analyzed', label: 'Video Analyzed', description: 'When a video analysis completes' },
  { value: 'prediction.completed', label: 'Prediction Completed', description: 'When a DPS prediction is ready' },
  { value: 'creator.verified', label: 'Creator Verified', description: 'When a creator is verified' },
  { value: 'campaign.created', label: 'Campaign Created', description: 'When a new campaign starts' },
  { value: 'payout.processed', label: 'Payout Processed', description: 'When a payout is sent' },
];

export default function WebhooksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState<WebhookEndpoint | null>(null);

  // Mock data
  const webhooks: WebhookEndpoint[] = [
    {
      id: '1',
      name: 'Production Analytics',
      url: 'https://api.myapp.com/webhooks/cleancopy',
      events: ['video.analyzed', 'prediction.completed'],
      status: 'active',
      secret: 'whsec_abc123...',
      created_at: '2024-02-15',
      last_triggered_at: '2024-03-15T14:30:00Z',
      success_rate: 98.5,
      last_response_code: 200,
    },
    {
      id: '2',
      name: 'Slack Notifications',
      url: 'https://hooks.slack.com/services/T00/B00/xxx',
      events: ['creator.verified', 'campaign.created'],
      status: 'active',
      secret: 'whsec_def456...',
      created_at: '2024-03-01',
      last_triggered_at: '2024-03-15T12:00:00Z',
      success_rate: 100,
      last_response_code: 200,
    },
    {
      id: '3',
      name: 'Legacy System',
      url: 'https://old.system.com/webhook',
      events: ['payout.processed'],
      status: 'failing',
      secret: 'whsec_ghi789...',
      created_at: '2024-01-10',
      last_triggered_at: '2024-03-14T09:00:00Z',
      success_rate: 45.2,
      last_response_code: 500,
    },
  ];

  const filteredWebhooks = webhooks.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Webhook className="text-orange-400" />
            Webhooks
          </h1>
          <p className="text-gray-400 mt-1">
            Receive real-time notifications when events happen
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Add Webhook
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search webhooks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#111118] border border-[#1a1a2e] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500/50"
        />
      </div>

      {/* Webhooks List */}
      <div className="space-y-4">
        {filteredWebhooks.map((webhook) => (
          <div 
            key={webhook.id}
            className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg">{webhook.name}</h3>
                  <StatusBadge status={webhook.status} />
                </div>
                <code className="text-sm text-gray-400 break-all">{webhook.url}</code>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTestModal(webhook)}
                  className="p-2 hover:bg-orange-500/20 rounded-lg text-orange-400 transition-colors"
                  title="Send Test"
                >
                  <PlayCircle size={18} />
                </button>
                <button
                  onClick={() => setShowLogsModal(webhook.id)}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
                  title="View Logs"
                >
                  <Clock size={18} />
                </button>
                <button
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
                  title="Edit"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Events */}
            <div className="flex flex-wrap gap-2 mb-4">
              {webhook.events.map((event) => (
                <span 
                  key={event}
                  className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded"
                >
                  {event}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Success Rate</span>
                <div className={cn(
                  'font-semibold',
                  webhook.success_rate >= 95 ? 'text-green-400' :
                  webhook.success_rate >= 80 ? 'text-yellow-400' : 'text-red-400'
                )}>
                  {webhook.success_rate}%
                </div>
              </div>
              <div>
                <span className="text-gray-500">Last Status</span>
                <div className={cn(
                  'font-semibold',
                  webhook.last_response_code === 200 ? 'text-green-400' : 'text-red-400'
                )}>
                  {webhook.last_response_code || 'Never'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Last Triggered</span>
                <div className="text-gray-300">
                  {webhook.last_triggered_at 
                    ? new Date(webhook.last_triggered_at).toLocaleDateString()
                    : 'Never'
                  }
                </div>
              </div>
              <div>
                <span className="text-gray-500">Created</span>
                <div className="text-gray-300">
                  {new Date(webhook.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Failing Alert */}
            {webhook.status === 'failing' && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="text-red-400 font-medium">Webhook failing</span>
                  <span className="text-gray-400"> - Last 5 attempts returned errors. Check your endpoint.</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredWebhooks.length === 0 && (
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-12 text-center">
          <Webhook size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium mb-2">No webhooks configured</h3>
          <p className="text-gray-400 mb-4">
            Add a webhook to receive real-time event notifications
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
          >
            Add Your First Webhook
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateWebhookModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Test Modal */}
      {showTestModal && (
        <TestWebhookModal 
          webhook={showTestModal}
          onClose={() => setShowTestModal(null)} 
        />
      )}

      {/* Logs Modal */}
      {showLogsModal && (
        <WebhookLogsModal 
          webhookId={showLogsModal}
          onClose={() => setShowLogsModal(null)} 
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: WebhookStatus }) {
  const config = {
    active: { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-500' },
    inactive: { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-500' },
    failing: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
  };
  const c = config[status];
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function CreateWebhookModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);

  const toggleEvent = (event: WebhookEvent) => {
    setSelectedEvents(prev => 
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">Add Webhook</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production Analytics"
              className="w-full px-4 py-2 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Endpoint URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.yourapp.com/webhooks"
              className="w-full px-4 py-2 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Events to Subscribe</label>
            <div className="space-y-2">
              {EVENT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-3 bg-[#0a0a0f] rounded-lg cursor-pointer hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(option.value)}
                    onChange={() => toggleEvent(option.value)}
                    className="w-4 h-4 rounded border-gray-600 bg-[#0a0a0f] text-orange-500"
                  />
                  <div>
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
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
            disabled={!name || !url || selectedEvents.length === 0}
            className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Create Webhook
          </button>
        </div>
      </div>
    </div>
  );
}

function TestWebhookModal({ webhook, onClose }: { webhook: WebhookEndpoint; onClose: () => void }) {
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent>(webhook.events[0]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; statusCode: number; response: string } | null>(null);

  const sendTest = async () => {
    setSending(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setResult({
      success: true,
      statusCode: 200,
      response: '{"received": true}'
    });
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">Test Webhook</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Endpoint</label>
            <code className="block p-3 bg-[#0a0a0f] rounded-lg text-sm text-gray-400 break-all">
              {webhook.url}
            </code>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Event Type</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value as WebhookEvent)}
              className="w-full px-4 py-2 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-white focus:outline-none"
            >
              {webhook.events.map((event) => (
                <option key={event} value={event}>{event}</option>
              ))}
            </select>
          </div>

          {result && (
            <div className={cn(
              'p-4 rounded-lg border',
              result.success 
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            )}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <Check size={16} className="text-green-400" />
                ) : (
                  <X size={16} className="text-red-400" />
                )}
                <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                  Status: {result.statusCode}
                </span>
              </div>
              <pre className="text-xs text-gray-400 overflow-x-auto">
                {result.response}
              </pre>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={sendTest}
            disabled={sending}
            className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <PlayCircle size={16} />
                Send Test
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function WebhookLogsModal({ webhookId, onClose }: { webhookId: string; onClose: () => void }) {
  // Mock logs
  const logs: WebhookLog[] = [
    {
      id: '1',
      webhook_id: webhookId,
      event: 'video.analyzed',
      status_code: 200,
      response_time_ms: 145,
      success: true,
      payload: { video_id: 'v123', dps: 72.5 },
      response: '{"received": true}',
      created_at: '2024-03-15T14:30:00Z',
    },
    {
      id: '2',
      webhook_id: webhookId,
      event: 'prediction.completed',
      status_code: 200,
      response_time_ms: 98,
      success: true,
      payload: { prediction_id: 'p456', score: 68.2 },
      response: '{"received": true}',
      created_at: '2024-03-15T14:00:00Z',
    },
    {
      id: '3',
      webhook_id: webhookId,
      event: 'video.analyzed',
      status_code: 500,
      response_time_ms: 2340,
      success: false,
      payload: { video_id: 'v789' },
      response: 'Internal Server Error',
      created_at: '2024-03-15T13:30:00Z',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Webhook Logs</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3">
          {logs.map((log) => (
            <div 
              key={log.id}
              className={cn(
                'p-4 rounded-lg border',
                log.success 
                  ? 'bg-[#0a0a0f] border-[#1a1a2e]'
                  : 'bg-red-500/5 border-red-500/20'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'px-2 py-0.5 text-xs rounded',
                    log.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  )}>
                    {log.status_code}
                  </span>
                  <span className="text-sm font-medium">{log.event}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{log.response_time_ms}ms</span>
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
              </div>
              <pre className="text-xs text-gray-400 bg-black/30 rounded p-2 overflow-x-auto">
                {JSON.stringify(log.payload, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


























































































