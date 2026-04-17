'use client';

/**
 * Prompt 39 — Action items panel on the Chairman dashboard
 *
 * Lists open/in-progress action items from approved planning sessions,
 * with click-to-march status transitions (open → in_progress → done).
 * Clicking the session link opens the full review page.
 */

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Circle,
  CircleDot,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

type ActionItemStatus = 'open' | 'in_progress' | 'done' | 'cancelled';

interface ActionItem {
  id: string;
  session_id: string;
  agency_id: string | null;
  title: string;
  description: string | null;
  status: ActionItemStatus;
  order_index: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export function PlanningActionItemsPanel() {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statusFilter = showDone ? '' : '?status=open,in_progress';
      const res = await fetch(`/api/admin/planning/action-items${statusFilter}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok) setItems(data.action_items || []);
    } finally {
      setLoading(false);
    }
  }, [showDone]);

  useEffect(() => {
    load();
  }, [load]);

  const cycleStatus = async (item: ActionItem) => {
    const next: ActionItemStatus =
      item.status === 'open'
        ? 'in_progress'
        : item.status === 'in_progress'
          ? 'done'
          : 'open';

    const res = await fetch('/api/admin/planning/action-items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, status: next }),
    });
    if (res.ok) await load();
  };

  return (
    <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <ClipboardList size={18} className="text-green-400" />
          Action items{' '}
          <span className="text-xs text-gray-500 font-normal">({items.length})</span>
        </h3>
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showDone}
              onChange={(e) => setShowDone(e.target.checked)}
              className="accent-green-500"
            />
            Show done
          </label>
          <button
            onClick={load}
            disabled={loading}
            className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-gray-500">
          No action items yet. Approve a planning session to populate this list.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <ActionItemRow key={item.id} item={item} onToggle={() => cycleStatus(item)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActionItemRow({
  item,
  onToggle,
}: {
  item: ActionItem;
  onToggle: () => void;
}) {
  const StatusIcon =
    item.status === 'open'
      ? Circle
      : item.status === 'in_progress'
        ? CircleDot
        : CheckCircle2;
  const statusColor =
    item.status === 'open'
      ? 'text-gray-500'
      : item.status === 'in_progress'
        ? 'text-yellow-400'
        : 'text-green-400';

  return (
    <div
      className={`bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 flex items-start gap-2 ${
        item.status === 'done' ? 'opacity-60' : ''
      }`}
    >
      <button
        onClick={onToggle}
        className={`${statusColor} hover:opacity-80 mt-0.5 flex-shrink-0`}
        title={`Status: ${item.status}. Click to advance.`}
      >
        <StatusIcon size={16} />
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-sm ${item.status === 'done' ? 'line-through text-gray-500' : 'text-gray-100'} break-words`}>
          {item.title}
        </div>
        {item.description && (
          <div className="text-xs text-gray-500 mt-0.5 break-words">{item.description}</div>
        )}
        <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
          <span>{item.agency_id ? 'agency' : 'platform'}</span>
          <span>·</span>
          <Link
            href={`/admin/planning/${item.session_id}`}
            className="text-cyan-500 hover:text-cyan-400 flex items-center gap-0.5"
          >
            session <ExternalLink size={10} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PlanningActionItemsPanel;
