'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Workflow, FileText, Link2, Settings, Sparkles, ArrowLeft, X } from 'lucide-react';

const TEMPLATES = [
  { id: 'page',        title: 'Page Feature',    icon: FileText, color: '#6366f1', iconClass: 'cv-icon-indigo' },
  { id: 'integration', title: 'Integration',     icon: Link2,    color: '#a855f7', iconClass: 'cv-icon-purple' },
  { id: 'workflow',    title: 'Workflow',         icon: Settings,  color: '#f59e0b', iconClass: 'cv-icon-amber' },
  { id: 'feature',     title: 'Feature Request', icon: Sparkles, color: '#10b981', iconClass: 'cv-icon-green' },
];

const DOT_CLASS: Record<string, string> = {
  page: 'cv-dot-page',
  integration: 'cv-dot-integration',
  workflow: 'cv-dot-workflow',
  feature: 'cv-dot-feature',
};

function relativeTime(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

type Project = { id: string; title: string; template_type?: string; updated_at: string };

export default function CanvasHomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  const [namingModal, setNamingModal] = useState<{ template: typeof TEMPLATES[number] } | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [nameError, setNameError] = useState('');
  const [creating, setCreating] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  function showError(msg: string) {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  }

  async function fetchProjects() {
    try {
      const res = await fetch('/api/canvas/projects');
      if (!res.ok) throw new Error('Failed to load projects');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      showError('Could not load projects');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProjects(); }, []);

  function openNamingModal(template: typeof TEMPLATES[number]) {
    setNamingModal({ template });
    setProjectName('');
    setProjectDesc('');
    setNameError('');
    setCreating(false);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  }

  function closeNamingModal() {
    setNamingModal(null);
    setProjectName('');
    setProjectDesc('');
    setNameError('');
    setCreating(false);
  }

  async function handleCreateProject() {
    if (!namingModal) return;
    const name = projectName.trim();
    if (name.length < 3) {
      setNameError('Name must be at least 3 characters');
      return;
    }
    setNameError('');
    setCreating(true);
    try {
      const res = await fetch('/api/canvas/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: name,
          template_type: namingModal.template.id,
          description: projectDesc.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create project');
      const data = await res.json();
      if (data.project?.id) {
        router.push(`/admin/canvas/${data.project.id}`);
      } else {
        throw new Error('No project returned');
      }
    } catch {
      showError('Could not create project');
      setCreating(false);
    }
  }

  async function handleDeleteProject(id: string) {
    setDeleteConfirm(null);
    try {
      const res = await fetch(`/api/canvas/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete project');
      await fetchProjects();
    } catch {
      showError('Could not delete project');
    }
  }

  return (
    <div className="cv-page">
      <main style={{ maxWidth: 760, width: '100%', padding: '48px 24px 48px' }}>
        {/* BACK BUTTON */}
        <button onClick={() => router.push('/admin/control-center')} className="cv-back-btn cv-fade-0">
          <ArrowLeft size={15} />
          Back to Dashboard
        </button>

        {/* HEADER — compact */}
        <div className="cv-fade-0" style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="cv-logo-icon">
            <Workflow size={26} color="#fff" strokeWidth={2.2} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>
            Canvas
          </h1>
          <p style={{ fontSize: 14, fontWeight: 450, color: '#888', margin: '4px 0 0' }}>
            Turn brain slop into buildable specs
          </p>
        </div>

        {/* TEMPLATE ROW — horizontal pills */}
        <div className="cv-fade-1" style={{ display: 'flex', flexDirection: 'row', gap: 10, marginBottom: 32 }}>
          {TEMPLATES.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} className="cv-template-pill" onClick={() => openNamingModal(t)}>
                <div className={`cv-icon-wrap ${t.iconClass}`}>
                  <Icon size={16} color={t.color} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{t.title}</span>
              </button>
            );
          })}
        </div>

        {/* RECENT PROJECTS — horizontal scroll pills */}
        <section className="cv-fade-2">
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 10 }}>
            Recent Projects
          </h2>

          {/* Loading skeleton */}
          {loading && (
            <div className="cv-projects-grid">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="cv-skeleton-pill" style={{ width: 110 + i * 20 }} />
              ))}
            </div>
          )}

          {/* Real project pills */}
          {!loading && projects.length > 0 && (
            <div className="cv-projects-grid">
              {projects.map(p => (
                <div
                  key={p.id}
                  className="cv-project-pill"
                  onClick={() => router.push(`/admin/canvas/${p.id}`)}
                  title={`${p.title}\n${formatDate(p.updated_at)}`}
                >
                  <div className={`cv-pill-dot ${DOT_CLASS[p.template_type || ''] || ''}`} />
                  <span style={{ fontWeight: 600, color: '#333' }}>{truncate(p.title, 24)}</span>
                  <span style={{ color: '#aaa', fontSize: 11 }}>{relativeTime(p.updated_at)}</span>
                  <button
                    className="cv-pill-delete"
                    onClick={e => {
                      e.stopPropagation();
                      setDeleteConfirm({ id: p.id, title: p.title });
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && projects.length === 0 && (
            <div className="cv-empty-state">No projects yet — pick a template above to start</div>
          )}
        </section>
      </main>

      {/* ERROR TOAST */}
      {error && <div className="cv-toast">{error}</div>}

      {/* NAMING MODAL */}
      {namingModal && (
        <div className="cv-modal-overlay" onClick={closeNamingModal}>
          <div className="cv-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
              Create Project
            </h3>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 24px' }}>
              {namingModal.template.title}
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>
                Project Name
              </label>
              <input
                ref={nameInputRef}
                className="cv-input"
                placeholder="e.g. User Onboarding Flow"
                value={projectName}
                onChange={e => { setProjectName(e.target.value); setNameError(''); }}
                onKeyDown={e => { if (e.key === 'Enter' && !creating) handleCreateProject(); }}
                autoFocus
              />
              {nameError && (
                <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{nameError}</div>
              )}
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>
                Description <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span>
              </label>
              <textarea
                className="cv-input"
                placeholder="Brief description of what you're building..."
                value={projectDesc}
                onChange={e => setProjectDesc(e.target.value)}
                rows={2}
                style={{ resize: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="cv-btn-cancel" onClick={closeNamingModal}>
                Cancel
              </button>
              <button className="cv-btn-confirm" disabled={creating} onClick={handleCreateProject}>
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirm && (
        <div className="cv-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="cv-delete-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>
              Delete &ldquo;{deleteConfirm.title}&rdquo;?
            </h3>
            <p style={{ fontSize: 14, color: '#666', margin: '0 0 24px', lineHeight: 1.5 }}>
              This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="cv-btn-cancel" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="cv-btn-delete" onClick={() => handleDeleteProject(deleteConfirm.id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
