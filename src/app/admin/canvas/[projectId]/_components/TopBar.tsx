'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, Save, Check } from 'lucide-react';
import type { CanvasProject, CanvasNode } from '../page';
import { FIDELITY_INDEX } from '../page';

interface TopBarProps {
  project: CanvasProject | null;
  nodes: CanvasNode[];
  saving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onExport: () => Promise<void>;
  onManualSave: () => Promise<void>;
  onProjectUpdate?: (updated: Partial<CanvasProject>) => void;
}

export function TopBar({ project, nodes, saving, saveStatus, onExport, onManualSave, onProjectUpdate }: TopBarProps) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [manualSaving, setManualSaving] = useState(false);
  const [manualSaved, setManualSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const progress = nodes.length === 0
    ? 0
    : Math.round(
        (nodes.reduce((sum, n) => sum + FIDELITY_INDEX[n.fidelity], 0) / (nodes.length * 3)) * 100
      );

  const handleExport = async () => {
    setExporting(true);
    await onExport();
    setExporting(false);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const handleManualSave = async () => {
    setManualSaving(true);
    setManualSaved(false);
    await onManualSave();
    setManualSaving(false);
    setManualSaved(true);
    setTimeout(() => setManualSaved(false), 2000);
  };

  function startEditing() {
    if (!project) return;
    setEditValue(project.title);
    setEditing(true);
  }

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  async function saveTitle() {
    setEditing(false);
    const trimmed = editValue.trim();
    if (!trimmed || !project || trimmed === project.title) return;

    try {
      const res = await fetch(`/api/canvas/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        onProjectUpdate?.({ title: data.project?.title || trimmed });
      }
    } catch {
      // Silently fail — title reverts on next load
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') saveTitle();
    if (e.key === 'Escape') setEditing(false);
  }

  return (
    <div
      className="flex items-center justify-between px-4 shrink-0"
      style={{ height: 50, borderBottom: '1px solid #e0e0e0' }}
    >
      {/* Left — status dot, name, save status */}
      <div className="flex items-center gap-3">
        <div
          className="rounded-full shrink-0"
          style={{
            width: 8,
            height: 8,
            background: saveStatus === 'error' ? '#ef4444'
              : saveStatus === 'saving' || saving ? '#f59e0b'
              : '#22c55e',
            boxShadow: saveStatus === 'error' ? '0 0 6px rgba(239,68,68,0.5)'
              : saveStatus === 'saving' || saving ? '0 0 6px rgba(245,158,11,0.5)'
              : '0 0 6px rgba(34,197,94,0.5)',
          }}
        />
        {editing ? (
          <input
            ref={inputRef}
            className="cv-topbar-input"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <span className="cv-topbar-name" onClick={startEditing}>
            {project?.title || 'Loading...'}
          </span>
        )}
        <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
          {saveStatus === 'saving' || saving ? 'Saving...'
            : saveStatus === 'saved' ? 'Saved'
            : saveStatus === 'error' ? (
              <span style={{ color: '#ef4444' }}>Save failed</span>
            ) : null}
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="rounded-full overflow-hidden"
            style={{ width: 100, height: 6, background: '#e5e7eb' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #e91e63, #c2185d)',
              }}
            />
          </div>
          <span className="text-xs text-gray-500 tabular-nums">{progress}%</span>
        </div>
        <span className="text-xs text-gray-400">
          {nodes.length} node{nodes.length !== 1 ? 's' : ''}
        </span>
        {/* Manual Save Button */}
        <button
          onClick={handleManualSave}
          disabled={manualSaving}
          className="cv-save-btn flex items-center gap-1.5"
        >
          {manualSaved ? <Check size={13} /> : manualSaving ? null : <Save size={13} />}
          {manualSaved ? 'Saved ✓' : manualSaving ? 'Saving...' : 'Save Project'}
        </button>
        <button
          onClick={handleExport}
          disabled={exporting || nodes.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #e91e63, #c2185d)' }}
        >
          <Download size={13} />
          {exported ? 'Copied!' : exporting ? 'Exporting...' : 'Export Spec'}
        </button>
      </div>
    </div>
  );
}
