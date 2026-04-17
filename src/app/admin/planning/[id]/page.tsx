'use client';

/**
 * Prompt 39 — Planning session review page
 *
 * Full-screen review of one planning session. Supports Edit (the
 * Chairman can rewrite the plan markdown before approving), Approve
 * (extracts recommendations, writes action items + memory), and
 * Reject (with optional reason).
 *
 * Mobile-responsive: single column on phones, two columns on md+.
 * This is the "approve from phone" pattern — the whole layout fits
 * inside a 375px viewport with readable text and tap-sized buttons.
 *
 * Action items extracted from the plan appear in a preview list on
 * the right (or below, on mobile). The Chairman can delete individual
 * extracted items or add their own before clicking Approve; the final
 * list is what gets persisted.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Brain,
  Edit3,
  Save,
  X,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface PlanOutput {
  text?: string;
  partial_text?: string;
  thinking?: string;
  usage?: { input_tokens: number; output_tokens: number };
  stop_reason?: string | null;
  model?: string;
  test_mode?: boolean;
  edited_at?: string;
}

interface Session {
  id: string;
  requester_role: 'chairman' | 'agency';
  agency_id: string | null;
  input_prompt: string;
  model_used: string | null;
  status: 'queued' | 'running' | 'reviewing' | 'approved' | 'rejected' | 'failed';
  plan_output: PlanOutput | null;
  error_message: string | null;
  cost_usd: number;
  test_mode: boolean;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface ExtractedItem {
  title: string;
  description: string | null;
}

// ── Same extractor as the server. Kept in-sync manually for preview. ──
function extractRecommendationsClient(markdown: string): ExtractedItem[] {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const HEADER_RE = /^#{1,3}\s+.*\b(recommendations?|top\s*\d*|action\s*items?|next\s*steps?|plan)\b.*$/i;
  const ANY_HEADER = /^#{1,6}\s/;
  const NUM_RE = /^(\d+)\.\s+(.*)$/;

  let inSection = false;
  let foundHeader = false;
  const items: ExtractedItem[] = [];
  let current: { title: string; descLines: string[] } | null = null;

  const flush = () => {
    if (current) {
      const desc = current.descLines.join(' ').trim();
      items.push({ title: current.title.trim(), description: desc || null });
      current = null;
    }
  };

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    if (HEADER_RE.test(line)) {
      flush();
      inSection = true;
      foundHeader = true;
      continue;
    }
    if (inSection && ANY_HEADER.test(line)) {
      flush();
      inSection = false;
      continue;
    }
    if (!inSection) continue;
    const m = line.match(NUM_RE);
    if (m) {
      flush();
      current = { title: m[2], descLines: [] };
      continue;
    }
    if (current && line.trim().length > 0) {
      const cleaned = line.replace(/^\s{2,}[-*]\s+/, '').replace(/^\s+/, '').trim();
      if (cleaned) current.descLines.push(cleaned);
    }
  }
  flush();

  if (!foundHeader) {
    for (const raw of lines) {
      const m = raw.match(NUM_RE);
      if (m) {
        items.push({ title: m[2].trim(), description: null });
        if (items.length >= 10) break;
      }
    }
  }
  return items.slice(0, 10);
}

export default function PlanningReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sessionId = params?.id;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState('');

  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/planning/sessions?id=${sessionId}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load session');
        return;
      }
      setSession(data.session);
      const text = data.session.plan_output?.text || data.session.plan_output?.partial_text || '';
      setEditedText(text);
      setItems(extractRecommendationsClient(text));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Re-extract items when the edited text changes in edit mode.
  useEffect(() => {
    if (editMode) {
      setItems(extractRecommendationsClient(editedText));
    }
  }, [editMode, editedText]);

  const renderedText = useMemo(() => {
    const source = editMode
      ? editedText
      : session?.plan_output?.text || session?.plan_output?.partial_text || '';
    return renderMarkdown(source);
  }, [editMode, editedText, session]);

  const handleApprove = async () => {
    if (!session) return;
    setSubmitting('approve');
    setDecisionError(null);
    try {
      const res = await fetch('/api/admin/planning/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          decision: 'approve',
          edited_text: editMode ? editedText : undefined,
          edited_action_items: items.length > 0 ? items : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDecisionError(data.error || 'Approve failed');
      } else {
        await loadSession();
        setEditMode(false);
      }
    } catch (err) {
      setDecisionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(null);
    }
  };

  const handleReject = async () => {
    if (!session) return;
    setSubmitting('reject');
    setDecisionError(null);
    try {
      const res = await fetch('/api/admin/planning/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          decision: 'reject',
          reject_reason: rejectReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDecisionError(data.error || 'Reject failed');
      } else {
        await loadSession();
        setShowRejectForm(false);
      }
    } catch (err) {
      setDecisionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-gray-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400" size={24} />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-gray-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/admin" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 mb-4">
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
            {error || 'Session not found'}
          </div>
        </div>
      </div>
    );
  }

  const canDecide = session.status === 'reviewing';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/admin"
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </Link>
          <StatusBadge status={session.status} />
        </div>

        {/* Prompt summary */}
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 md:p-5 mb-4">
          <div className="flex items-start gap-3">
            <Brain className="text-cyan-400 flex-shrink-0 mt-1" size={20} />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                {session.requester_role === 'chairman' ? 'Chairman request' : 'Agency request'}
              </div>
              <div className="text-base text-gray-100 break-words">{session.input_prompt}</div>
              <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-3">
                <span>Model: {session.model_used || '?'}</span>
                <span>Cost: ${session.cost_usd.toFixed(4)}</span>
                {session.test_mode && (
                  <span className="bg-gray-500/20 text-gray-400 rounded px-1.5">test mode</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main grid: plan left, action items right on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Plan */}
          <div className="md:col-span-2 bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Plan output</h2>
              {canDecide &&
                (editMode ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const text = session.plan_output?.text || session.plan_output?.partial_text || '';
                        setEditedText(text);
                        setEditMode(false);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
                    >
                      <X size={12} />
                      Cancel edit
                    </button>
                    <div className="text-xs text-cyan-400 flex items-center gap-1">
                      <Save size={12} />
                      Changes applied on Approve
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Edit3 size={12} />
                    Edit
                  </button>
                ))}
            </div>

            {editMode ? (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={20}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm font-mono whitespace-pre-wrap"
              />
            ) : (
              <div
                className="prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderedText }}
              />
            )}

            {session.error_message && (
              <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
                <div className="font-semibold text-red-400 mb-1">
                  {session.status === 'rejected' ? 'Reject reason' : 'Error'}
                </div>
                {session.error_message}
              </div>
            )}
          </div>

          {/* Action items sidebar */}
          <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 md:p-5">
            <h2 className="font-semibold mb-3">
              Action items{' '}
              <span className="text-xs text-gray-500 font-normal">({items.length})</span>
            </h2>

            {items.length === 0 && (
              <div className="text-sm text-gray-500 mb-3">
                No recommendations extracted from the plan.
              </div>
            )}

            <div className="space-y-2">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2"
                >
                  <div className="flex items-start gap-2">
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{i + 1}.</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-200 break-words">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500 mt-1 break-words">
                          {item.description}
                        </div>
                      )}
                    </div>
                    {canDecide && (
                      <button
                        onClick={() => setItems(items.filter((_, j) => j !== i))}
                        className="text-gray-500 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {canDecide && (
              <div className="mt-3 flex gap-2">
                <input
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="Add an item…"
                  className="flex-1 bg-[#0a0a0f] border border-[#1a1a2e] rounded px-2 py-1 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newItemTitle.trim()) {
                      setItems([...items, { title: newItemTitle.trim(), description: null }]);
                      setNewItemTitle('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (newItemTitle.trim()) {
                      setItems([...items, { title: newItemTitle.trim(), description: null }]);
                      setNewItemTitle('');
                    }
                  }}
                  className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded px-2 py-1 text-sm"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Decision bar */}
        {canDecide && (
          <div className="mt-4 bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 md:p-5">
            {showRejectForm ? (
              <div className="space-y-3">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Why are you rejecting this plan? (optional)"
                  rows={2}
                  className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1 bg-[#0a0a0f] text-gray-400 border border-[#1a1a2e] rounded-lg py-3 text-sm hover:bg-[#141424]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={submitting === 'reject'}
                    className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg py-3 text-sm hover:bg-red-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting === 'reject' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ThumbsDown size={14} />
                    )}
                    Confirm reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-2">
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="flex-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg py-3 text-sm hover:bg-red-500/20 flex items-center justify-center gap-2"
                >
                  <ThumbsDown size={16} />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={submitting === 'approve'}
                  className="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg py-3 text-sm hover:bg-green-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting === 'approve' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ThumbsUp size={16} />
                  )}
                  Approve{editMode ? ' edited plan' : ''} ({items.length} items)
                </button>
              </div>
            )}

            {decisionError && (
              <div className="mt-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2 text-sm">
                {decisionError}
              </div>
            )}
          </div>
        )}

        {/* Terminal-state footer */}
        {!canDecide && session.status !== 'running' && session.status !== 'queued' && (
          <div className="mt-4 text-center text-sm text-gray-500">
            This session is {session.status}. No further actions available.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small helpers ──

function StatusBadge({ status }: { status: Session['status'] }) {
  const styles: Record<string, string> = {
    queued: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    running: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    reviewing: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  const icons: Record<string, React.ReactNode> = {
    reviewing: <Brain size={12} />,
    approved: <CheckCircle size={12} />,
    rejected: <XCircle size={12} />,
    failed: <XCircle size={12} />,
  };
  return (
    <span
      className={`text-xs px-2 py-1 rounded border ${styles[status]} flex items-center gap-1`}
    >
      {icons[status]}
      {status}
    </span>
  );
}

/**
 * Tiny markdown → HTML renderer. Not a real parser — just handles
 * headers, bold, italic, code, paragraphs, and numbered/bulleted
 * lists. Good enough for plan output and avoids pulling in a
 * dependency just for this page.
 */
function renderMarkdown(md: string): string {
  if (!md) return '<p class="text-gray-500">(no plan output yet)</p>';

  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const lines = md.split('\n');
  const html: string[] = [];
  let inList: 'ol' | 'ul' | null = null;

  const closeList = () => {
    if (inList) {
      html.push(`</${inList}>`);
      inList = null;
    }
  };

  const inline = (s: string) =>
    escape(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-black/40 px-1 rounded">$1</code>');

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    if (!line.trim()) {
      closeList();
      continue;
    }
    let m = line.match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      closeList();
      const level = m[1].length;
      html.push(`<h${level} class="mt-4 mb-2 font-semibold">${inline(m[2])}</h${level}>`);
      continue;
    }
    m = line.match(/^(\d+)\.\s+(.*)$/);
    if (m) {
      if (inList !== 'ol') {
        closeList();
        html.push('<ol class="list-decimal list-inside space-y-1 my-2">');
        inList = 'ol';
      }
      html.push(`<li>${inline(m[2])}</li>`);
      continue;
    }
    m = line.match(/^[-*]\s+(.*)$/);
    if (m) {
      if (inList !== 'ul') {
        closeList();
        html.push('<ul class="list-disc list-inside space-y-1 my-2">');
        inList = 'ul';
      }
      html.push(`<li>${inline(m[1])}</li>`);
      continue;
    }
    closeList();
    html.push(`<p class="my-2">${inline(line)}</p>`);
  }
  closeList();

  return html.join('\n');
}
