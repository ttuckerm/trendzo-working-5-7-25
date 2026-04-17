'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  ExternalLink,
  Copy,
  AlertOctagon,
  AlertTriangle,
  Info,
  Clock,
  Tag,
  User,
  Building2,
  Activity,
} from 'lucide-react';

export interface AlertDetail {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  body: string | null;
  payload: any;
  action_type: string | null;
  action_payload: any;
  status: string;
  agency_id: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  snoozed_until: string | null;
  snoozed_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

interface Props {
  alert: AlertDetail | null;
  onClose: () => void;
}

function formatFull(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function severityIcon(s: AlertDetail['severity']) {
  if (s === 'critical') return <AlertOctagon size={18} className="text-red-400" />;
  if (s === 'warning') return <AlertTriangle size={18} className="text-yellow-400" />;
  return <Info size={18} className="text-blue-400" />;
}

function relatedLinks(alert: AlertDetail): Array<{ label: string; href: string; icon: React.ReactNode }> {
  const links: Array<{ label: string; href: string; icon: React.ReactNode }> = [];

  if (alert.agency_id) {
    links.push({
      label: 'View agency',
      href: `/admin/organization/agencies/${alert.agency_id}`,
      icon: <Building2 size={14} />,
    });
  }

  if (alert.action_type === 'rollback_model') {
    links.push({
      label: 'Open Model Management',
      href: '/admin/dashboard#model-management',
      icon: <Activity size={14} />,
    });
  }

  if (alert.alert_type === 'niche_spearman_drop' || alert.alert_type === 'platform_volume_drop') {
    links.push({
      label: 'Open Training Engine',
      href: '/admin/operations/training',
      icon: <Activity size={14} />,
    });
  }

  if (alert.alert_type === 'model_degradation' || alert.alert_type === 'insufficient_data') {
    links.push({
      label: 'Promotion History',
      href: '/admin/dashboard',
      icon: <Activity size={14} />,
    });
  }

  return links;
}

export function AlertDetailModal({ alert, onClose }: Props) {
  if (!alert) return null;

  const copyPayload = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(alert, null, 2));
    } catch {
      /* ignore */
    }
  };

  const links = relatedLinks(alert);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0d0d15] border border-[#1a1a2e] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0d0d15] border-b border-[#1a1a2e] p-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {severityIcon(alert.severity)}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    alert.severity === 'critical'
                      ? 'bg-red-500/20 text-red-300'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {alert.severity}
                </span>
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                  {alert.alert_type}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    alert.status === 'open'
                      ? 'bg-orange-500/15 text-orange-300'
                      : alert.status === 'acknowledged'
                      ? 'bg-cyan-500/15 text-cyan-300'
                      : alert.status === 'snoozed'
                      ? 'bg-gray-500/15 text-gray-300'
                      : alert.status === 'resolved'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-gray-500/15 text-gray-400'
                  }`}
                >
                  {alert.status}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-white">{alert.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {alert.body && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Description</div>
              <div className="text-sm text-gray-200 leading-relaxed">{alert.body}</div>
            </div>
          )}

          {/* Lifecycle timeline */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Lifecycle</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-gray-500" />
                <span className="text-gray-500">Created</span>
                <span className="text-gray-300">{formatFull(alert.created_at)}</span>
              </div>
              {alert.acknowledged_at && (
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-cyan-400" />
                  <span className="text-gray-500">Acknowledged</span>
                  <span className="text-gray-300">{formatFull(alert.acknowledged_at)}</span>
                  {alert.acknowledged_by && (
                    <span className="text-gray-500">by {alert.acknowledged_by}</span>
                  )}
                </div>
              )}
              {alert.snoozed_until && (
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-gray-400" />
                  <span className="text-gray-500">Snoozed until</span>
                  <span className="text-gray-300">{formatFull(alert.snoozed_until)}</span>
                  {alert.snoozed_by && (
                    <span className="text-gray-500">by {alert.snoozed_by}</span>
                  )}
                </div>
              )}
              {alert.resolved_at && (
                <div className="flex items-center gap-2">
                  <Clock
                    size={12}
                    className={alert.status === 'resolved' ? 'text-emerald-400' : 'text-gray-500'}
                  />
                  <span className="text-gray-500">
                    {alert.status === 'resolved' ? 'Resolved' : 'Dismissed'}
                  </span>
                  <span className="text-gray-300">{formatFull(alert.resolved_at)}</span>
                  {alert.resolved_by && (
                    <span className="text-gray-500">by {alert.resolved_by}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related links */}
          {links.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Related</div>
              <div className="flex flex-wrap gap-2">
                {links.map(link => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-md hover:bg-purple-500/20 transition-colors"
                  >
                    {link.icon}
                    {link.label}
                    <ExternalLink size={10} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Payload */}
          {alert.payload && Object.keys(alert.payload).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-wider text-gray-500">Payload</div>
                <button
                  onClick={copyPayload}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-400 hover:text-white rounded hover:bg-white/5"
                >
                  <Copy size={10} />
                  Copy JSON
                </button>
              </div>
              <pre className="bg-[#050508] border border-[#1a1a2e] rounded-lg p-3 text-xs text-gray-300 overflow-x-auto font-mono whitespace-pre-wrap break-all">
                {JSON.stringify(alert.payload, null, 2)}
              </pre>
            </div>
          )}

          {/* Action payload (rare — only for actionable alerts like rollback) */}
          {alert.action_type && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Action</div>
              <div className="bg-[#050508] border border-[#1a1a2e] rounded-lg p-3 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <Tag size={12} className="text-orange-400" />
                  <span className="font-mono text-orange-300">{alert.action_type}</span>
                </div>
                {alert.action_payload && (
                  <pre className="text-gray-400 font-mono">
                    {JSON.stringify(alert.action_payload, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AlertDetailModal;
