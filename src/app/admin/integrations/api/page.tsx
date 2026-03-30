'use client';

import React, { useState } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  TrendingUp,
  Clock,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminUser } from '@/hooks/useAdminUser';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  permissions: string[];
  status: 'active' | 'revoked';
}

export default function ApiManagementPage() {
  const { role, profile } = useAdminUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check if user has API access (Pro/Enterprise tier)
  const hasApiAccess = role === 'chairman' || profile?.metadata?.tier === 'pro' || profile?.metadata?.tier === 'enterprise';

  // Mock data
  const apiKeys: ApiKey[] = [
    {
      id: '1',
      name: 'Production Key',
      prefix: 'sk_live_abc1',
      created_at: '2024-02-15',
      last_used_at: '2024-03-15T14:30:00Z',
      permissions: ['read:videos', 'analyze:content', 'predict:dps'],
      status: 'active',
    },
    {
      id: '2',
      name: 'Development Key',
      prefix: 'sk_test_xyz2',
      created_at: '2024-03-01',
      last_used_at: '2024-03-14T09:15:00Z',
      permissions: ['read:videos', 'analyze:content'],
      status: 'active',
    },
  ];

  const usage = {
    calls_this_month: 45230,
    limit: 100000,
    top_endpoints: [
      { endpoint: '/api/v1/predict', calls: 18500, avg_latency: 245 },
      { endpoint: '/api/v1/analyze', calls: 15200, avg_latency: 890 },
      { endpoint: '/api/v1/videos', calls: 11530, avg_latency: 120 },
    ],
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!hasApiAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Lock size={64} className="text-gray-600 mb-4" />
        <h2 className="text-xl font-bold mb-2">API Access Required</h2>
        <p className="text-gray-400 max-w-md mb-4">
          API access is available on Pro and Enterprise tiers. Upgrade your plan to access the CleanCopy API.
        </p>
        <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors">
          Upgrade Plan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Key className="text-purple-400" />
            API Management
          </h1>
          <p className="text-gray-400 mt-1">
            Manage your API keys and monitor usage
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Generate Key
        </button>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-400" />
              API Calls This Month
            </h3>
          </div>
          <div className="text-3xl font-bold mb-2">
            {usage.calls_this_month.toLocaleString()}
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Limit</span>
            <span>{usage.limit.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${(usage.calls_this_month / usage.limit) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {((usage.calls_this_month / usage.limit) * 100).toFixed(1)}% used
          </p>
        </div>

        <div className="col-span-2 bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <h3 className="font-semibold mb-4">Top Endpoints</h3>
          <div className="space-y-3">
            {usage.top_endpoints.map((endpoint) => (
              <div key={endpoint.endpoint} className="flex items-center justify-between">
                <code className="text-sm text-purple-400">{endpoint.endpoint}</code>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-gray-400">{endpoint.calls.toLocaleString()} calls</span>
                  <span className="text-gray-500">{endpoint.avg_latency}ms avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1a1a2e]">
          <h3 className="font-semibold">API Keys</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-[#1a1a2e] bg-[#0a0a0f]">
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Key</th>
              <th className="px-6 py-4 font-medium">Permissions</th>
              <th className="px-6 py-4 font-medium">Created</th>
              <th className="px-6 py-4 font-medium">Last Used</th>
              <th className="px-6 py-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.map((key) => (
              <tr key={key.id} className="border-b border-[#1a1a2e] last:border-0">
                <td className="px-6 py-4 font-medium">{key.name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-gray-400">
                      {key.prefix}••••••••
                    </code>
                    <button
                      onClick={() => copyToClipboard(key.prefix, key.id)}
                      className={cn(
                        'p-1 rounded transition-colors',
                        copiedId === key.id 
                          ? 'text-green-400' 
                          : 'text-gray-500 hover:text-white'
                      )}
                    >
                      {copiedId === key.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {key.permissions.slice(0, 2).map((perm) => (
                      <span key={perm} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                        {perm}
                      </span>
                    ))}
                    {key.permissions.length > 2 && (
                      <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded">
                        +{key.permissions.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {new Date(key.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {key.last_used_at 
                    ? new Date(key.last_used_at).toLocaleDateString()
                    : 'Never'
                  }
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                      title="Regenerate"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                      title="Revoke"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Documentation */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-6">
        <h3 className="font-semibold mb-4">Quick Start</h3>
        <div className="bg-[#0a0a0f] rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <pre className="text-gray-300">
{`curl -X POST https://api.cleancopy.ai/v1/predict \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"video_url": "https://tiktok.com/..."}'`}
          </pre>
        </div>
        <div className="mt-4">
          <a 
            href="/docs/api" 
            className="text-purple-400 hover:text-purple-300 text-sm"
          >
            View full API documentation →
          </a>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateApiKeyModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function CreateApiKeyModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<string[]>(['read:videos']);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const allPermissions = [
    { id: 'read:videos', label: 'Read Videos', description: 'Access video metadata' },
    { id: 'analyze:content', label: 'Analyze Content', description: 'Run content analysis' },
    { id: 'predict:dps', label: 'DPS Predictions', description: 'Get DPS predictions' },
    { id: 'extract:patterns', label: 'Pattern Extraction', description: 'Extract viral patterns' },
    { id: 'webhooks', label: 'Webhooks', description: 'Manage webhooks' },
  ];

  const togglePermission = (id: string) => {
    setPermissions(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const generateKey = () => {
    // In real implementation, this would call the API
    setGeneratedKey('sk_live_' + Math.random().toString(36).substring(2, 15));
  };

  const copyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl w-full max-w-lg p-6">
        {!generatedKey ? (
          <>
            <h2 className="text-xl font-bold mb-4">Generate API Key</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Key Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Production Key"
                  className="w-full px-4 py-2 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Permissions</label>
                <div className="space-y-2">
                  {allPermissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center gap-3 p-3 bg-[#0a0a0f] rounded-lg cursor-pointer hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="w-4 h-4 rounded border-gray-600 bg-[#0a0a0f] text-purple-500"
                      />
                      <div>
                        <div className="font-medium text-sm">{perm.label}</div>
                        <div className="text-xs text-gray-500">{perm.description}</div>
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
                onClick={generateKey}
                disabled={!name || permissions.length === 0}
                className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Generate Key
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-400" />
              </div>
              <h2 className="text-xl font-bold">API Key Generated</h2>
              <p className="text-gray-400 text-sm mt-1">
                Copy this key now. You won't be able to see it again.
              </p>
            </div>

            <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-4 mb-4">
              <code className="text-green-400 break-all">{generatedKey}</code>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-yellow-400 text-sm">
                  This key will only be shown once. Store it securely.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyKey}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2',
                  copied 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-purple-500 hover:bg-purple-600'
                )}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Copy Key'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


























































































