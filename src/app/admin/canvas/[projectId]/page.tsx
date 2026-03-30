'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { CanvasSidebar } from './_components/CanvasSidebar';
import { TopBar } from './_components/TopBar';
import { CanvasNode as CanvasNodeComponent } from './_components/CanvasNode';
import { ConnectionLayer } from './_components/ConnectionLayer';
import { DetailPanel } from './_components/DetailPanel';

// === Shared Types ===
export type NodeType = 'screen' | 'action' | 'logic' | 'ai' | 'step' | 'acceptance_tests';
export type Fidelity = 'concept' | 'wireframe' | 'mockup' | 'build-ready';

export interface CanvasProject {
  id: string;
  title: string;
  template_type: string | null;
  updated_at: string;
}

export interface StepData {
  user_action: string;
  system_action: string;
  success_state: string;
  error_states: string;
  api_called: string;
}

export interface CanvasNodeStep {
  sort_order: number;
  title: string;
  user_action: string;
  system_action: string;
  success_state: string;
  error_states: string;
  api_called: string;
}

export interface CanvasNodeApi {
  method: string;
  endpoint: string;
  purpose: string;
  request_shape: string;
  response_shape: string;
}

export interface CanvasNodeAcceptance {
  text: string;
  done: boolean;
  sort_order: number;
}

export interface CanvasNode {
  id: string;
  project_id: string;
  node_type: NodeType;
  step_number: number;
  title: string;
  description: string;
  x: number;
  y: number;
  fidelity: Fidelity;
  priority: number;
  notes: string;
  steps: CanvasNodeStep[];
  apis: CanvasNodeApi[];
  acceptance: CanvasNodeAcceptance[];
  dependencies: { depends_on_node_id: string }[];
  parent_node_id?: string | null;
  step_data?: StepData | null;
}

export interface CanvasConnection {
  from_node_id: string;
  to_node_id: string;
  label: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// === Shared Constants ===
export const NODE_CONFIG: Record<NodeType, { bg: string; border: string; color: string; label: string; icon: string }> = {
  screen: { bg: '#eff6ff', border: '#3b82f6', color: '#2563eb', label: 'Screen', icon: 'Monitor' },
  action: { bg: '#f0fdf4', border: '#22c55e', color: '#16a34a', label: 'Action', icon: 'Zap' },
  logic:  { bg: '#fffbeb', border: '#f59e0b', color: '#d97706', label: 'Logic', icon: 'GitBranch' },
  ai:     { bg: '#faf5ff', border: '#a855f7', color: '#9333ea', label: 'AI', icon: 'Sparkles' },
  step:   { bg: '#f8fafc', border: '#94a3b8', color: '#64748b', label: 'Step', icon: 'ChevronRight' },
  acceptance_tests: { bg: '#ecfdf5', border: '#10b981', color: '#059669', label: 'Acceptance Tests', icon: 'CheckSquare' },
};

export const STEP_BG_TINTS: Record<NodeType, string> = {
  screen: '#f0f7ff',
  action: '#f0fdf8',
  logic:  '#fffdf5',
  ai:     '#fdf8ff',
  step:   '#f8fafc',
  acceptance_tests: '#ecfdf5',
};

export const FIDELITY_INDEX: Record<Fidelity, number> = {
  concept: 0, wireframe: 1, mockup: 2, 'build-ready': 3,
};
export const FIDELITY_LABELS = ['Concept', 'Wireframe', 'Mockup', 'Build Ready'];

export const DEFAULT_ACCEPTANCE = [
  'Required inputs validated',
  'Button disabled until valid',
  'Loading state visible',
  'Completes within target time',
  'Errors shown (no silent failures)',
  'Results include score + confidence + range',
  'Recommendations specific + actionable',
  'Event persisted',
  'No console errors',
];

export const NODE_TYPE_LABELS: Record<string, string> = {
  screen: 'Screen / Page',
  action: 'Action / Process',
  logic: 'Logic / Decision',
  ai: 'AI / ML Feature',
  step: 'Workflow Step',
  acceptance_tests: 'Acceptance Tests',
};

// === Starter Messages (keyed by template_type) ===
const STARTER_MESSAGES: Record<string, string> = {
  page: "What page or screen are you thinking about? Describe it however it's in your head \u2014 the messier the better. I'll structure it.",
  integration: "What service or system do you want to connect? Tell me what you're trying to achieve.",
  workflow: "What process are you trying to build? Walk me through it like you're explaining to someone.",
  feature: "What's the feature idea? Just dump it \u2014 a sentence, a paragraph, a rambling thought. I'll organize it.",
};

// === Page Component ===
export default function CanvasProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [project, setProject] = useState<CanvasProject | null>(null);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [connections, setConnections] = useState<CanvasConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveVersion, setSaveVersion] = useState(0);
  const [isNewProject, setIsNewProject] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [fidelityToast, setFidelityToast] = useState<{ message: string; color: string } | null>(null);
  const [animatingNodeId, setAnimatingNodeId] = useState<string | null>(null);
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set());
  const [animatingStepBatch, setAnimatingStepBatch] = useState<string[]>([]);
  const [replaceStepConfirm, setReplaceStepConfirm] = useState<{ parentNodeId: string; steps: { title: string; user_action: string; system_action: string; success_state: string; error_states: string; api_called: string }[] } | null>(null);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;
  const chatsRef = useRef(chats);
  chatsRef.current = chats;

  // === Computed values ===
  const featureNodes = useMemo(() => nodes.filter(n => n.node_type !== 'step'), [nodes]);

  const visibleNodes = useMemo(() => {
    return nodes.filter(n => {
      if (n.node_type !== 'step') return true;
      if (!n.parent_node_id) return true;
      return !collapsedParents.has(n.parent_node_id);
    });
  }, [nodes, collapsedParents]);

  const visibleConnections = useMemo(() => {
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    return connections.filter(c => visibleIds.has(c.from_node_id) && visibleIds.has(c.to_node_id));
  }, [connections, visibleNodes]);

  const activeChainNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const selected = nodes.find(n => n.id === selectedNodeId);
    if (!selected) return new Set<string>();

    const chain = new Set<string>();
    if (selected.node_type === 'step' && selected.parent_node_id) {
      // Step selected: collect parent + all siblings
      chain.add(selected.parent_node_id);
      nodes.forEach(n => {
        if (n.parent_node_id === selected.parent_node_id) chain.add(n.id);
      });
    } else if (selected.node_type !== 'step') {
      // Feature selected: collect self + all children
      chain.add(selected.id);
      nodes.forEach(n => {
        if (n.parent_node_id === selected.id) chain.add(n.id);
      });
    }
    return chain;
  }, [selectedNodeId, nodes]);

  // Fetch on mount
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/canvas/projects/${projectId}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.project) setProject(data.project);
        if (data.nodes) {
          setNodes(data.nodes);
          if (data.nodes.length === 0) setIsNewProject(true);
        }
        if (data.connections) setConnections(data.connections);
        if (data.chats) {
          const chatMap: Record<string, ChatMessage[]> = {};
          for (const [nodeId, msgs] of Object.entries(data.chats)) {
            chatMap[nodeId] = (msgs as any[]).map(m => ({ role: m.role, content: m.content }));
          }
          setChats(chatMap);
        }
        setDataLoaded(true);
      })
      .catch(err => console.error('Failed to load project:', err));
  }, [projectId]);

  // Auto-save via debounced saveVersion (500ms for responsiveness)
  const debouncedSaveVersion = useDebounce(saveVersion, 500);

  const doSave = useCallback(async (projectIdOverride?: string) => {
    const pid = projectIdOverride || project?.id;
    if (!pid) return;
    setSaving(true);
    setSaveStatus('saving');
    try {
      const payload = {
        nodes: nodesRef.current,
        connections: connectionsRef.current,
        chats: chatsRef.current,
      };
      console.log('[CANVAS SAVE] payload snapshot:', {
        nodeCount: payload.nodes.length,
        chatKeys: Object.keys(payload.chats),
        chatSizes: Object.fromEntries(Object.entries(payload.chats).map(([k, v]) => [k, (v as any[]).length])),
      });
      const res = await fetch(`/api/canvas/projects/${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('[CANVAS SAVE FAILED]', {
          status: res.status,
          error: data.error,
          details: data.details,
          nodeCount: payload.nodes.length,
          nodeTypes: payload.nodes.map((n: any) => n.node_type),
        });
        throw new Error(data.details || data.error || 'Save failed');
      }
      if (data.updated_at) {
        setProject(prev => prev ? { ...prev, updated_at: data.updated_at } : prev);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2000);
    } catch (err) {
      console.error('[CANVAS SAVE FAILED] Exception:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, [project?.id]);

  useEffect(() => {
    if (debouncedSaveVersion === 0 || !project) return;
    doSave();
  }, [debouncedSaveVersion, project?.id, doSave]);

  // Flush save on visibility hidden (tab switch / close) and beforeunload
  const lastSavedVersionRef = useRef(0);
  useEffect(() => {
    const flushSave = () => {
      if (!project?.id || saveVersion <= lastSavedVersionRef.current) return;
      lastSavedVersionRef.current = saveVersion;
      const payload = JSON.stringify({
        nodes: nodesRef.current,
        connections: connectionsRef.current,
        chats: chatsRef.current,
      });
      if (typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(
          `/api/canvas/projects/${project.id}/beacon`,
          new Blob([payload], { type: 'application/json' })
        );
      }
    };
    const handleVisChange = () => { if (document.visibilityState === 'hidden') flushSave(); };
    const handleUnload = () => flushSave();
    document.addEventListener('visibilitychange', handleVisChange);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisChange);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [saveVersion, project?.id]);

  // Track last saved version from auto-save
  useEffect(() => {
    if (saveStatus === 'saved') lastSavedVersionRef.current = saveVersion;
  }, [saveStatus, saveVersion]);

  // Fidelity toast auto-dismiss
  useEffect(() => {
    if (!fidelityToast) return;
    const t = setTimeout(() => setFidelityToast(null), 3500);
    return () => clearTimeout(t);
  }, [fidelityToast]);

  // Callback for DetailPanel to trigger canvas-level fidelity toast
  const handleFidelityToast = useCallback((level: string) => {
    const toasts: Record<string, { message: string; color: string }> = {
      wireframe: { message: 'Concept \u2192 Wireframe \u2014 workflow steps captured', color: '#3b82f6' },
      mockup: { message: 'Wireframe \u2192 Mockup \u2014 API contracts defined', color: '#a855f7' },
      'build-ready': { message: 'Mockup \u2192 Build Ready \u2014 spec complete, ready to export \u2728', color: '#22c55e' },
    };
    const t = toasts[level];
    if (t) setFidelityToast(t);
  }, []);

  // Drag handler with 4px threshold for click vs drag disambiguation
  const handleNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;
    const startNodeX = node.x;
    const startNodeY = node.y;
    let isDragging = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startMouseX;
      const dy = moveEvent.clientY - startMouseY;
      if (!isDragging && Math.sqrt(dx * dx + dy * dy) > 4) {
        isDragging = true;
      }
      if (isDragging) {
        setNodes(prev => prev.map(n =>
          n.id === nodeId ? { ...n, x: startNodeX + dx, y: startNodeY + dy } : n
        ));
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (!isDragging) {
        setSelectedNodeId(nodeId);
      } else {
        setSaveVersion(v => v + 1);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Node update from DetailPanel
  const handleNodeUpdate = useCallback((updatedNode: CanvasNode) => {
    setNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
    setSaveVersion(v => v + 1);
  }, []);

  // Add node from sidebar palette
  const handleAddNode = useCallback((type: NodeType) => {
    const newNode: CanvasNode = {
      id: crypto.randomUUID(),
      project_id: project?.id || '',
      node_type: type,
      step_number: nodesRef.current.length + 1,
      title: `New ${NODE_CONFIG[type].label}`,
      description: '',
      x: 400 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      fidelity: 'concept',
      priority: 1,
      notes: '',
      steps: [],
      apis: [],
      acceptance: [],
      dependencies: [],
    };
    setNodes(prev => [...prev, newNode]);
    setSaveVersion(v => v + 1);
    setSelectedNodeId(newNode.id);
  }, [project?.id]);

  // Delete node — remove from nodes, connections, and other nodes' dependencies
  const handleDeleteNode = useCallback((nodeId: string) => {
    const target = nodesRef.current.find(n => n.id === nodeId);
    if (!target) return;

    if (target.node_type === 'step' && target.parent_node_id) {
      // Step node: remove, re-number siblings, rebuild chain
      const parentId = target.parent_node_id;
      const siblings = nodesRef.current
        .filter(n => n.parent_node_id === parentId && n.id !== nodeId)
        .sort((a, b) => a.step_number - b.step_number);

      // Re-number
      const renumbered = siblings.map((n, i) => ({ ...n, step_number: i + 1 }));
      const renumberedIds = new Set(renumbered.map(n => n.id));

      // Remove old chain connections involving any step of this parent
      const allChildIds = new Set(nodesRef.current.filter(n => n.parent_node_id === parentId).map(n => n.id));
      setConnections(prev => {
        const kept = prev.filter(c =>
          !(allChildIds.has(c.from_node_id) || allChildIds.has(c.to_node_id) ||
            (c.from_node_id === parentId && allChildIds.has(c.to_node_id)))
        );
        // Rebuild chain: parent→first, then sequential
        const newChain: CanvasConnection[] = [];
        renumbered.forEach((n, i) => {
          if (i === 0) {
            newChain.push({ from_node_id: parentId, to_node_id: n.id, label: '' });
          } else {
            newChain.push({ from_node_id: renumbered[i - 1].id, to_node_id: n.id, label: '' });
          }
        });
        return [...kept, ...newChain];
      });

      setNodes(prev => prev
        .filter(n => n.id !== nodeId)
        .map(n => {
          const renum = renumbered.find(r => r.id === n.id);
          if (renum) return renum;
          return { ...n, dependencies: n.dependencies.filter(d => d.depends_on_node_id !== nodeId) };
        })
      );
    } else {
      // Feature node: also delete child step nodes
      const childIds = new Set(nodesRef.current.filter(n => n.parent_node_id === nodeId).map(n => n.id));
      const allRemoveIds = new Set([nodeId, ...childIds]);

      setNodes(prev => prev
        .filter(n => !allRemoveIds.has(n.id))
        .map(n => ({
          ...n,
          dependencies: n.dependencies.filter(d => d.depends_on_node_id !== nodeId),
        }))
      );
      setConnections(prev => prev.filter(c => !allRemoveIds.has(c.from_node_id) && !allRemoveIds.has(c.to_node_id)));
    }

    setSelectedNodeId(prev => prev === nodeId ? null : prev);
    setSaveVersion(v => v + 1);
  }, []);

  // Create node from AI mutation — center on canvas with slight offset
  // Accepts optional pre-generated `id` from applyMutations so UUID is always known
  const handleCreateNodeFromAI = useCallback((nodeData: { id?: string; title: string; description: string; node_type: string }): string => {
    const type = (['screen', 'action', 'logic', 'ai', 'acceptance_tests'].includes(nodeData.node_type)
      ? nodeData.node_type
      : 'screen') as NodeType;
    // Place near canvas center with random offset ±50px
    const rect = canvasRef.current?.getBoundingClientRect();
    const cx = rect ? (rect.width / 2 - 110 + (canvasRef.current?.scrollLeft || 0)) : 400;
    const cy = rect ? (rect.height / 2 - 60 + (canvasRef.current?.scrollTop || 0)) : 250;
    const newId = nodeData.id || crypto.randomUUID();
    console.log('[canvas] handleCreateNodeFromAI → UUID:', newId, 'title:', nodeData.title);
    const newNode: CanvasNode = {
      id: newId,
      project_id: project?.id || '',
      node_type: type,
      step_number: nodesRef.current.length + 1,
      title: nodeData.title,
      description: nodeData.description,
      x: cx + (Math.random() - 0.5) * 100,
      y: cy + (Math.random() - 0.5) * 100,
      fidelity: 'concept',
      priority: 1,
      notes: '',
      steps: [],
      apis: [],
      acceptance: [],
      dependencies: [],
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setIsNewProject(false);
    setAnimatingNodeId(newNode.id);
    setTimeout(() => setAnimatingNodeId(null), 600);
    setSaveVersion(v => v + 1);
    return newId;
  }, [project?.id]);

  // Duplicate node — copy with new ID, "(copy)" title, offset position
  const handleDuplicateNode = useCallback((nodeId: string) => {
    const source = nodesRef.current.find(n => n.id === nodeId);
    if (!source) return;
    const newNode: CanvasNode = {
      ...source,
      id: crypto.randomUUID(),
      step_number: nodesRef.current.length + 1,
      title: `${source.title} (copy)`,
      x: source.x + 40,
      y: source.y + 40,
      steps: source.steps.map(s => ({ ...s })),
      apis: source.apis.map(a => ({ ...a })),
      acceptance: source.acceptance.map(a => ({ ...a })),
      dependencies: source.dependencies.map(d => ({ ...d })),
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setSaveVersion(v => v + 1);
  }, []);

  // === Step Node Handlers ===

  const handleAddStepNodes = useCallback((parentNodeId: string, steps: { title: string; user_action: string; system_action: string; success_state: string; error_states: string; api_called: string }[]) => {
    console.log('[canvas] handleAddStepNodes called with parentId:', parentNodeId, 'steps:', steps.length);

    // Check if parent already has step children (only if parent is in state)
    const existingSteps = nodesRef.current.filter(n => n.parent_node_id === parentNodeId);
    if (existingSteps.length > 0) {
      setReplaceStepConfirm({ parentNodeId, steps });
      return;
    }

    // Create steps immediately — createStepNodes handles missing parent gracefully
    createStepNodes(parentNodeId, steps);
  }, []);

  const createStepNodes = useCallback((parentNodeId: string, steps: { title: string; user_action: string; system_action: string; success_state: string; error_states: string; api_called: string }[]) => {
    // Read latest state via setNodes to get the parent
    setNodes(prev => {
      let parent = prev.find(n => n.id === parentNodeId);

      if (!parent) {
        // Parent was just created in the same mutation batch — not in state yet.
        // Use a synthetic fallback so step nodes are still created.
        // Position at (300, 250) so steps flow rightward from center of canvas.
        console.log('[canvas] createStepNodes: parent not in state, fallback position for', parentNodeId);
        parent = {
          id: parentNodeId,
          project_id: project?.id || '',
          node_type: 'screen' as NodeType,
          step_number: 0,
          title: '',
          description: '',
          x: 300,
          y: 250,
          fidelity: 'concept' as Fidelity,
          priority: 1,
          notes: '',
          steps: [],
          apis: [],
          acceptance: [],
          dependencies: [],
        };
      }

      const newNodes: CanvasNode[] = [];
      const newConnections: CanvasConnection[] = [];
      const colsPerRow = 4;
      const hGap = 220;
      const vGap = 180;
      const startX = parent.x + 260;
      const startY = parent.y;

      steps.forEach((step, i) => {
        const col = i % colsPerRow;
        const row = Math.floor(i / colsPerRow);
        const nodeId = crypto.randomUUID();

        newNodes.push({
          id: nodeId,
          project_id: parent.project_id,
          node_type: 'step',
          step_number: i + 1,
          title: step.title,
          description: '',
          x: startX + col * hGap,
          y: startY + row * vGap,
          fidelity: 'concept',
          priority: parent.priority,
          notes: '',
          steps: [],
          apis: [],
          acceptance: [],
          dependencies: [],
          parent_node_id: parentNodeId,
          step_data: {
            user_action: step.user_action || '',
            system_action: step.system_action || '',
            success_state: step.success_state || '',
            error_states: step.error_states || '',
            api_called: step.api_called || '',
          },
        });

        // Chain connections: parent→first, then sequential
        if (i === 0) {
          newConnections.push({ from_node_id: parentNodeId, to_node_id: nodeId, label: '' });
        } else {
          newConnections.push({ from_node_id: newNodes[i - 1].id, to_node_id: nodeId, label: '' });
        }
      });

      // Side effects (connections, animation, save) scheduled after state update
      const batchIds = newNodes.map(n => n.id);
      setTimeout(() => {
        setConnections(prevC => [...prevC, ...newConnections]);
        setAnimatingStepBatch(batchIds);
        setTimeout(() => setAnimatingStepBatch([]), 600 + steps.length * 80);
        setSaveVersion(v => v + 1);

        // Auto-pan to midpoint
        if (newNodes.length > 0 && canvasRef.current) {
          const midX = newNodes.reduce((s, n) => s + n.x, 0) / newNodes.length;
          const midY = newNodes.reduce((s, n) => s + n.y, 0) / newNodes.length;
          const rect = canvasRef.current.getBoundingClientRect();
          canvasRef.current.scrollTo({
            left: midX - rect.width / 2 + 90,
            top: midY - rect.height / 2 + 60,
            behavior: 'smooth',
          });
        }
      }, 0);

      return [...prev, ...newNodes];
    });
  }, [project?.id]);

  const handleConfirmReplaceSteps = useCallback(() => {
    if (!replaceStepConfirm) return;
    const { parentNodeId, steps } = replaceStepConfirm;

    // Delete old step children and their connections
    const oldStepIds = new Set(nodesRef.current.filter(n => n.parent_node_id === parentNodeId).map(n => n.id));
    setNodes(prev => prev.filter(n => !oldStepIds.has(n.id)));
    setConnections(prev => prev.filter(c => !oldStepIds.has(c.from_node_id) && !oldStepIds.has(c.to_node_id)));
    setReplaceStepConfirm(null);

    // Create new ones after state update
    setTimeout(() => createStepNodes(parentNodeId, steps), 50);
  }, [replaceStepConfirm, createStepNodes]);

  const handleToggleCollapse = useCallback((parentNodeId: string) => {
    setCollapsedParents(prev => {
      const next = new Set(prev);
      if (next.has(parentNodeId)) {
        next.delete(parentNodeId);
        // Trigger re-expand animation
        const childIds = nodesRef.current
          .filter(n => n.parent_node_id === parentNodeId)
          .map(n => n.id);
        setAnimatingStepBatch(childIds);
        setTimeout(() => setAnimatingStepBatch([]), 600 + childIds.length * 80);
      } else {
        next.add(parentNodeId);
      }
      return next;
    });
  }, []);

  const handleAddEmptyStep = useCallback((parentNodeId: string) => {
    const parent = nodesRef.current.find(n => n.id === parentNodeId);
    if (!parent) return;
    const siblings = nodesRef.current.filter(n => n.parent_node_id === parentNodeId);
    const stepNum = siblings.length + 1;
    const lastSibling = siblings.length > 0 ? siblings[siblings.length - 1] : null;

    const newId = crypto.randomUUID();
    const newNode: CanvasNode = {
      id: newId,
      project_id: parent.project_id,
      node_type: 'step',
      step_number: stepNum,
      title: `Step ${stepNum}`,
      description: '',
      x: lastSibling ? lastSibling.x + 220 : parent.x + 260,
      y: lastSibling ? lastSibling.y : parent.y,
      fidelity: 'concept',
      priority: parent.priority,
      notes: '',
      steps: [],
      apis: [],
      acceptance: [],
      dependencies: [],
      parent_node_id: parentNodeId,
      step_data: { user_action: '', system_action: '', success_state: '', error_states: '', api_called: '' },
    };

    // Connect from last sibling or parent
    const fromId = lastSibling ? lastSibling.id : parentNodeId;
    setNodes(prev => [...prev, newNode]);
    setConnections(prev => [...prev, { from_node_id: fromId, to_node_id: newId, label: '' }]);
    setSelectedNodeId(newId);
    setAnimatingStepBatch([newId]);
    setTimeout(() => setAnimatingStepBatch([]), 600);
    setSaveVersion(v => v + 1);
  }, []);

  // Export all nodes sequentially
  const handleExportAll = useCallback(async () => {
    const briefs: string[] = [];
    for (const node of nodesRef.current.filter(n => n.node_type !== 'step')) {
      try {
        const res = await fetch(`/api/canvas/export/${node.id}`, { method: 'POST' });
        const data = await res.json();
        if (data.brief) briefs.push(data.brief);
      } catch {
        briefs.push(`[Error exporting ${node.title}]`);
      }
    }
    const text = briefs.join('\n\n---\n\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // TopBar handles fallback feedback
    }
  }, []);

  const handleChatsUpdate = useCallback((newChats: Record<string, ChatMessage[]>) => {
    setChats(newChats);
    setSaveVersion(v => v + 1);
  }, []);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  // Placeholder node for onboarding mode (no real node selected yet)
  function onboardingPlaceholderNode(proj: CanvasProject | null): CanvasNode {
    return {
      id: '__onboarding__',
      project_id: proj?.id || '',
      node_type: 'screen',
      step_number: 1,
      title: proj?.title || 'New Feature',
      description: '',
      x: 0, y: 0,
      fidelity: 'concept',
      priority: 1,
      notes: '',
      steps: [], apis: [], acceptance: [], dependencies: [],
    };
  }

  return (
    <div className="canvas-project-root flex overflow-hidden bg-white" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Animations */}
      <style jsx global>{`
        @keyframes nodeEntrance {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes nodeGlow {
          0%   { box-shadow: 0 0 0 0 rgba(233,30,99,0.4); }
          50%  { box-shadow: 0 0 20px 8px rgba(233,30,99,0.15); }
          100% { box-shadow: 0 0 0 0 rgba(233,30,99,0); }
        }
        .node-animate-in {
          animation: nodeEntrance 0.4s ease-out, nodeGlow 0.8s ease-out 0.3s;
        }
        @keyframes stepEntrance {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .step-animate-in {
          animation: stepEntrance 0.35s ease-out both;
        }
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes toastFadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        .fidelity-toast {
          animation: toastSlideIn 0.3s ease-out, toastFadeOut 0.4s ease-in 3s forwards;
        }
      `}</style>

      <CanvasSidebar nodeCount={nodes.length} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          project={project}
          nodes={featureNodes}
          saving={saving}
          saveStatus={saveStatus}
          onExport={handleExportAll}
          onManualSave={doSave}
          onProjectUpdate={(updates) => setProject(prev => prev ? { ...prev, ...updates } : prev)}
        />
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-auto"
          style={{
            background: '#f7f7fa',
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px',
            borderRadius: 16,
            margin: 12,
            boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedNodeId(null);
          }}
        >
          <ConnectionLayer
            nodes={visibleNodes}
            connections={visibleConnections}
            selectedNodeId={selectedNodeId}
            activeChainNodeIds={activeChainNodeIds}
          />
          {/* Empty canvas guidance */}
          {dataLoaded && nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p style={{ color: '#bbb', fontSize: 14, fontStyle: 'italic' }}>
                Your features will appear here as you describe them to Canvas AI &rarr;
              </p>
            </div>
          )}
          {visibleNodes.map(node => {
            const parentConfig = node.parent_node_id
              ? NODE_CONFIG[nodesRef.current.find(n => n.id === node.parent_node_id)?.node_type || 'step']
              : undefined;
            const stepChildCount = node.node_type !== 'step'
              ? nodes.filter(n => n.parent_node_id === node.id).length
              : 0;
            const isCollapsed = collapsedParents.has(node.id);
            const stepAnimIndex = animatingStepBatch.indexOf(node.id);

            return (
              <CanvasNodeComponent
                key={node.id}
                node={node}
                isSelected={node.id === selectedNodeId}
                config={node.node_type === 'step' && parentConfig ? { ...NODE_CONFIG.step, bg: STEP_BG_TINTS[nodesRef.current.find(n => n.id === node.parent_node_id)?.node_type || 'step'], border: parentConfig.border } : NODE_CONFIG[node.node_type]}
                onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                onDeleteNode={handleDeleteNode}
                onDuplicateNode={handleDuplicateNode}
                isAnimating={node.id === animatingNodeId}
                parentConfig={parentConfig}
                stepChildCount={stepChildCount}
                isCollapsed={isCollapsed}
                onToggleCollapse={handleToggleCollapse}
                onAddStep={handleAddEmptyStep}
                stepAnimIndex={stepAnimIndex >= 0 ? stepAnimIndex : undefined}
              />
            );
          })}

          {/* Fidelity toast — canvas level */}
          {fidelityToast && (
            <div
              className="fidelity-toast absolute z-50"
              style={{
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg"
                style={{
                  background: '#fff',
                  border: `2px solid ${fidelityToast.color}`,
                  boxShadow: `0 4px 20px ${fidelityToast.color}25`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: fidelityToast.color }}
                />
                <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">
                  {fidelityToast.message}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Detail Panel — show for selected node OR onboarding mode */}
      {(selectedNode || isNewProject) && (
        <DetailPanel
          node={selectedNode || onboardingPlaceholderNode(project)}
          nodes={nodes}
          chats={chats}
          projectId={project?.id || ''}
          onNodeUpdate={handleNodeUpdate}
          onChatsUpdate={handleChatsUpdate}
          onClose={() => { setSelectedNodeId(null); setIsNewProject(false); }}
          onDeleteNode={handleDeleteNode}
          onCreateNodeFromAI={handleCreateNodeFromAI}
          starterMessage={isNewProject && !selectedNode ? STARTER_MESSAGES[project?.template_type || ''] || STARTER_MESSAGES.feature : undefined}
          onFidelityToast={handleFidelityToast}
          onAddStepNodes={handleAddStepNodes}
          onSelectNode={setSelectedNodeId}
        />
      )}

      {/* Replace steps confirm dialog */}
      {replaceStepConfirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 mx-4 shadow-xl" style={{ maxWidth: 340 }}>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Replace existing steps?</h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              This feature already has workflow steps on the canvas. Replace them with {replaceStepConfirm.steps.length} new steps?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setReplaceStepConfirm(null)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReplaceSteps}
                className="px-3 py-1.5 text-xs font-medium text-white rounded-lg"
                style={{ background: '#e91e63' }}
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
