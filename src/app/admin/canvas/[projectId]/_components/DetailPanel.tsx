'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Sparkles, Monitor, Zap, GitBranch, CheckSquare,
  ChevronDown, ChevronRight, ChevronLeft, Plus, Trash2,
  Copy, Check, Send, AlertTriangle,
  Paperclip, Link, Code, Mic,
} from 'lucide-react';
import {
  CANVAS_MODELS, DEFAULT_MODEL_ID, PROVIDER_LABELS, TIER_COLORS,
  getModelById, type CanvasProvider, type CanvasModelOption,
} from '@/lib/canvas/models';
import type {
  CanvasNode, CanvasNodeStep, CanvasNodeApi, CanvasNodeAcceptance,
  StepData, Fidelity, ChatMessage,
} from '../page';
import {
  NODE_CONFIG, FIDELITY_INDEX, FIDELITY_LABELS,
  DEFAULT_ACCEPTANCE, NODE_TYPE_LABELS,
} from '../page';

// === Types ===

interface DetailPanelProps {
  node: CanvasNode;
  nodes: CanvasNode[];
  chats: Record<string, ChatMessage[]>;
  projectId: string;
  onNodeUpdate: (node: CanvasNode) => void;
  onChatsUpdate: (chats: Record<string, ChatMessage[]>) => void;
  onClose: () => void;
  onDeleteNode: (nodeId: string) => void;
  onCreateNodeFromAI: (nodeData: { id?: string; title: string; description: string; node_type: string }) => string | void;
  starterMessage?: string;
  onFidelityToast?: (level: string) => void;
  onAddStepNodes?: (parentNodeId: string, steps: { title: string; user_action: string; system_action: string; success_state: string; error_states: string; api_called: string }[]) => void;
  onSelectNode?: (nodeId: string) => void;
}

interface Classification {
  type: string;
  reasoning: string;
}

// === Constants ===

const ICONS: Record<string, React.ElementType> = {
  Monitor, Zap, GitBranch, Sparkles, CheckSquare,
};

const TABS = ['Overview', 'Steps', 'APIs', 'Acceptance', 'Export'] as const;
type Tab = (typeof TABS)[number];

const CLASSIFICATION_COLORS: Record<string, { bg: string; color: string }> = {
  POP: { bg: '#dbeafe', color: '#2563eb' },
  POB: { bg: '#f3e8ff', color: '#7c3aed' },
  UI: { bg: '#dcfce7', color: '#16a34a' },
  pipeline: { bg: '#fef9c3', color: '#a16207' },
  mixed: { bg: '#fee2e2', color: '#dc2626' },
};

// === Component ===

export function DetailPanel({
  node, nodes, chats, projectId,
  onNodeUpdate, onChatsUpdate, onClose,
  onDeleteNode, onCreateNodeFromAI, starterMessage, onFidelityToast,
  onAddStepNodes, onSelectNode,
}: DetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [reviewExpanded, setReviewExpanded] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [classification, setClassification] = useState<Classification | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`canvas-model-${projectId}`) || DEFAULT_MODEL_ID;
    }
    return DEFAULT_MODEL_ID;
  });
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownMenuRef = useRef<HTMLDivElement>(null);

  const config = NODE_CONFIG[node.node_type];
  const Icon = ICONS[config.icon] || Monitor;

  // Sync chat messages when node changes
  useEffect(() => {
    setChatMessages(chats[node.id] || []);
  }, [node.id, chats]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Close model dropdown on outside click
  useEffect(() => {
    if (!modelDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const clickedInButton = modelDropdownRef.current?.contains(e.target as Node);
      const clickedInMenu = modelDropdownMenuRef.current?.contains(e.target as Node);
      if (!clickedInButton && !clickedInMenu) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [modelDropdownOpen]);

  // === Quick Prompts (context-sensitive) ===
  // Use step node count from canvas, not the old embedded array
  const stepNodeCount = nodes.filter(n => n.parent_node_id === node.id && n.node_type === 'step').length;
  const effectiveStepCount = stepNodeCount || node.steps.length;
  const getQuickPrompts = useCallback((): string[] => {
    const hasDesc = !!node.description;
    const apiCount = node.apis.length;
    const acceptCount = node.acceptance.length;

    if (!hasDesc && effectiveStepCount === 0) {
      return ['Describe this feature', 'What problem does it solve?'];
    }
    if (hasDesc && effectiveStepCount === 0) {
      return ['Generate workflow steps', 'Classify this feature', 'What inputs/outputs?'];
    }
    if (effectiveStepCount > 0 && apiCount === 0) {
      return ['Generate API endpoints', 'Review my workflow', 'Add more steps'];
    }
    if (apiCount > 0 && acceptCount < 5) {
      return ['Generate acceptance criteria', 'Review full spec', "What's missing?"];
    }
    return ['Final review', 'Generate Claude Code brief', 'What could go wrong?'];
  }, [node.description, effectiveStepCount, node.apis.length, node.acceptance.length]);

  // === Fidelity auto-advancement ===
  // Uses step node count from canvas OR embedded steps array (backward compat)
  const checkFidelityAdvancement = useCallback((updatedNode: CanvasNode): CanvasNode => {
    let n = { ...updatedNode };
    const fi = FIDELITY_INDEX[n.fidelity];
    const stepsWithTitles = Math.max(
      n.steps.filter(s => s.title).length,
      stepNodeCount,
    );
    const hasSteps = stepsWithTitles > 0;

    if (fi === 0 && stepsWithTitles >= 2) {
      n = { ...n, fidelity: 'wireframe' };
      onFidelityToast?.('wireframe');
    }
    if (FIDELITY_INDEX[n.fidelity] === 1 && n.apis.length >= 1) {
      n = { ...n, fidelity: 'mockup' };
      onFidelityToast?.('mockup');
    }
    if (FIDELITY_INDEX[n.fidelity] === 2 &&
      n.acceptance.length >= 5 &&
      hasSteps &&
      n.apis.length >= 1
    ) {
      n = { ...n, fidelity: 'build-ready' };
      onFidelityToast?.('build-ready');
    }
    return n;
  }, [onFidelityToast, stepNodeCount]);

  // === Mutation handling ===
  // Returns { node, createdNodeId } so handleSendChat can transfer chats to the new node
  const applyMutations = useCallback((mutations: any[], currentNode: CanvasNode): { node: CanvasNode; createdNodeId: string | null } => {
    let updated = { ...currentNode };
    // Pre-generate UUID for create_node so we never depend on a callback return value.
    let lastCreatedNodeId: string | null = null;

    for (const mut of mutations) {
      switch (mut.action) {
        case 'create_node':
          if (mut.node) {
            // Generate UUID here — guaranteed available for add_step_nodes later in the loop
            const preId = crypto.randomUUID();
            lastCreatedNodeId = preId;
            console.log('[canvas] create_node → pre-generated UUID:', preId);
            onCreateNodeFromAI({
              id: preId,
              title: mut.node.title || 'Untitled',
              description: mut.node.description || '',
              node_type: mut.node.node_type || 'screen',
            });
          }
          break;

        case 'update_node':
          if (mut.updates) {
            updated = { ...updated, ...mut.updates };
          }
          break;

        case 'set_steps':
          if (Array.isArray(mut.steps)) {
            updated = {
              ...updated,
              steps: mut.steps.map((s: any, i: number) => ({
                sort_order: i,
                title: s.title || '',
                user_action: s.user_action || '',
                system_action: s.system_action || '',
                success_state: s.success_state || '',
                error_states: s.error_states || '',
                api_called: s.api_called || '',
              })),
            };
          }
          break;

        case 'set_apis':
          if (Array.isArray(mut.apis)) {
            updated = {
              ...updated,
              apis: mut.apis.map((a: any) => ({
                method: a.method || 'POST',
                endpoint: a.endpoint || '',
                purpose: a.purpose || '',
                request_shape: a.request_shape || '',
                response_shape: a.response_shape || '',
              })),
            };
          }
          break;

        case 'set_acceptance':
          if (Array.isArray(mut.acceptance)) {
            updated = {
              ...updated,
              acceptance: mut.acceptance.map((a: any, i: number) => ({
                text: a.text || '',
                done: a.done ?? false,
                sort_order: i,
              })),
            };
          }
          break;

        case 'set_acceptance_tests':
          if (Array.isArray(mut.tests)) {
            updated = {
              ...updated,
              notes: JSON.stringify(mut.tests),
              acceptance: mut.tests.map((t: any, i: number) => ({
                text: `[${t.status || 'untested'}] ${t.description || ''} → Expected: ${t.expected || ''}`,
                done: t.status === 'pass',
                sort_order: i,
              })),
            };
          }
          break;

        case 'add_step_nodes':
          if (Array.isArray(mut.steps) && onAddStepNodes) {
            let parentId = lastCreatedNodeId;

            if (!parentId) {
              // create_node didn't fire in this batch.
              // Check if the raw parentId is a real UUID or a symbolic placeholder.
              const rawId = mut.parentNodeId || mut.parent_node_id || currentNode.id;
              const looksLikeUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(rawId);

              if (looksLikeUUID) {
                parentId = rawId;
              } else {
                // Symbolic ID — pre-generate UUID and create a real feature node
                const fallbackId = crypto.randomUUID();
                console.log('[canvas] add_step_nodes fallback: creating feature node', fallbackId, 'for symbolic:', rawId);
                onCreateNodeFromAI({
                  id: fallbackId,
                  title: currentNode.title || 'New Feature',
                  description: currentNode.description || '',
                  node_type: currentNode.node_type || 'screen',
                });
                parentId = fallbackId;
                lastCreatedNodeId = fallbackId;
              }
            }

            console.log('[canvas] add_step_nodes → parentId:', parentId);
            onAddStepNodes(parentId, mut.steps.map((s: any) => {
              const sd = s.stepData || s.step_data || s;
              return {
                title: s.title || '',
                user_action: sd.user_action || s.user_action || '',
                system_action: sd.system_action || s.system_action || '',
                success_state: sd.success_state || s.success_state || '',
                error_states: sd.error_states || s.error_states || '',
                api_called: sd.api_called || s.api_called || '',
              };
            }));
          }
          break;

        case 'classify':
          if (mut.classification) {
            setClassification({
              type: mut.classification,
              reasoning: mut.reasoning || '',
            });
          }
          break;
      }
    }

    return { node: updated, createdNodeId: lastCreatedNodeId };
  }, [onCreateNodeFromAI, onAddStepNodes]);

  // === Fidelity manual click (gated) ===
  const handleFidelityClick = (level: Fidelity) => {
    const targetIndex = FIDELITY_INDEX[level];
    const currentIndex = FIDELITY_INDEX[node.fidelity];
    if (targetIndex <= currentIndex) return;

    if (targetIndex >= 1 && node.steps.filter(s => s.title).length < 2) {
      setToast('Wireframe requires at least 2 steps with titles');
      return;
    }
    if (targetIndex >= 2 && (node.apis.length < 1 || !node.description)) {
      setToast('Mockup requires at least 1 API endpoint and a description');
      return;
    }
    if (targetIndex >= 3) {
      const hasEnoughAcceptance = node.acceptance.length >= 5;
      const allStepsTitled = node.steps.every(s => s.title);
      const hasFilledStep = node.steps.some(s => s.user_action || s.system_action || s.success_state);
      if (!hasEnoughAcceptance || !allStepsTitled || !hasFilledStep || node.apis.length < 1) {
        setToast('Build Ready requires: 5+ acceptance, all steps titled, 1+ step field filled, 1+ API');
        return;
      }
    }

    onNodeUpdate({ ...node, fidelity: level });
  };

  // === Send chat message ===
  const handleSendChat = async (overrideMessage?: string) => {
    const msg = overrideMessage ?? chatInput.trim();
    if (!msg || chatLoading) return;
    if (!overrideMessage) setChatInput('');

    // If in onboarding mode (0-node project), create a real node FIRST so
    // the AI gets a real UUID (enabling server-side chat insert) and all
    // mutations operate on a real node instead of the __onboarding__ placeholder.
    let effectiveNodeId = node.id;
    let effectiveNode = node;
    if (node.id === '__onboarding__') {
      const realId = onCreateNodeFromAI({
        title: node.title || 'New Feature',
        description: '',
        node_type: 'screen',
      });
      if (realId) {
        effectiveNodeId = realId as string;
        effectiveNode = {
          ...node,
          id: effectiveNodeId,
        };
      }
    }

    const userMsg: ChatMessage = { role: 'user', content: msg };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const depTitles = effectiveNode.dependencies
        .map(d => nodes.find(n => n.id === d.depends_on_node_id)?.title)
        .filter(Boolean) as string[];

      const selectedModel = getModelById(selectedModelId);
      const res = await fetch('/api/canvas/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          nodeId: effectiveNodeId,
          message: msg,
          history: chatMessages,
          provider: selectedModel?.provider ?? 'anthropic',
          modelId: selectedModel?.modelId ?? 'claude-sonnet-4-6',
          maxTokens: selectedModel?.maxTokens ?? 16000,
          nodeContext: {
            id: effectiveNodeId,
            title: effectiveNode.title,
            node_type: effectiveNode.node_type,
            fidelity: effectiveNode.fidelity,
            description: effectiveNode.description,
            priority: effectiveNode.priority,
            notes: effectiveNode.notes,
            stepCount: effectiveStepCount,
            apiCount: effectiveNode.apis.length,
            acceptanceDone: effectiveNode.acceptance.filter(a => a.done).length,
            acceptanceTotal: effectiveNode.acceptance.length,
            dependencies: depTitles,
            ...(effectiveNode.parent_node_id ? { parent_node_id: effectiveNode.parent_node_id } : {}),
            ...(effectiveNode.step_data ? { step_data: effectiveNode.step_data } : {}),
          },
        }),
      });
      const data = await res.json();
      const content = data.message || data.details || data.error || 'No response from AI. Try a shorter question.';
      const assistantMsg: ChatMessage = { role: 'assistant', content };
      const finalMessages = [...updatedMessages, assistantMsg];
      setChatMessages(finalMessages);
      onChatsUpdate({ ...chats, [effectiveNodeId]: finalMessages });

      // Apply mutations if present
      if (data.mutations && data.mutations.length > 0) {
        console.log('[canvas] mutations received:', data.mutations.length, 'for node:', effectiveNodeId);
        const result = applyMutations(data.mutations, effectiveNode);
        const advancedNode = checkFidelityAdvancement(result.node);
        onNodeUpdate(advancedNode);

        if (result.createdNodeId && result.createdNodeId !== effectiveNodeId) {
          onChatsUpdate({ ...chats, [effectiveNodeId]: finalMessages, [result.createdNodeId]: finalMessages });
        }
      }
    } catch {
      const errorMsg: ChatMessage = { role: 'assistant', content: 'Failed to get response. Try again.' };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  // === Build export brief ===
  const buildBrief = () => {
    const lines: string[] = [];
    lines.push(`TASK: ${node.title || 'Untitled'}`);
    lines.push(`TYPE: ${NODE_TYPE_LABELS[node.node_type] || node.node_type}`);
    lines.push(`PRIORITY: P${node.priority ?? 1}`);
    lines.push(`SPEC: ${node.description || 'None'}`);
    lines.push(`NOTES: ${node.notes || 'None'}`);
    lines.push('');
    lines.push('WORKFLOW STEPS:');
    // Prefer step nodes from canvas; fall back to old embedded steps array
    if (stepChildNodes.length > 0) {
      stepChildNodes.sort((a, b) => a.step_number - b.step_number).forEach((sn, i) => {
        const sd = sn.step_data;
        lines.push(`${i + 1}. ${sn.title || 'Untitled step'}`);
        lines.push(`   User Action: ${sd?.user_action || 'N/A'}`);
        lines.push(`   System Action: ${sd?.system_action || 'N/A'}`);
        lines.push(`   Success: ${sd?.success_state || 'N/A'}`);
        lines.push(`   Errors: ${sd?.error_states || 'N/A'}`);
        lines.push(`   API: ${sd?.api_called || 'N/A'}`);
      });
    } else if (node.steps.length === 0) {
      lines.push('None defined');
    } else {
      node.steps.forEach((step, i) => {
        lines.push(`${i + 1}. ${step.title || 'Untitled step'}`);
        lines.push(`   User Action: ${step.user_action || 'N/A'}`);
        lines.push(`   System Action: ${step.system_action || 'N/A'}`);
        lines.push(`   Success: ${step.success_state || 'N/A'}`);
        lines.push(`   Errors: ${step.error_states || 'N/A'}`);
        lines.push(`   API: ${step.api_called || 'N/A'}`);
      });
    }
    lines.push('');
    lines.push('API ENDPOINTS:');
    if (node.apis.length === 0) {
      lines.push('None defined');
    } else {
      node.apis.forEach(api => {
        lines.push(`- ${api.method} ${api.endpoint || '/unknown'} -- ${api.purpose || 'N/A'}`);
        lines.push(`  Request: ${api.request_shape || 'N/A'}`);
        lines.push(`  Response: ${api.response_shape || 'N/A'}`);
      });
    }
    lines.push('');
    lines.push('DEPENDENCIES:');
    if (node.dependencies.length === 0) {
      lines.push('None defined');
    } else {
      node.dependencies.forEach(dep => {
        const depNode = nodes.find(n => n.id === dep.depends_on_node_id);
        lines.push(`- ${depNode?.title || dep.depends_on_node_id}`);
      });
    }
    lines.push('');
    lines.push('ACCEPTANCE CRITERIA:');
    if (node.acceptance.length === 0) {
      lines.push('None defined');
    } else {
      node.acceptance.forEach(criterion => {
        const check = criterion.done ? '[x]' : '[ ]';
        lines.push(`${check} ${criterion.text}`);
      });
    }
    lines.push('');
    lines.push('DO NOT claim done without: test output, screenshots/logs, sample requests/responses');
    return lines.join('\n');
  };

  // "Ask AI" helper — collapses review, pre-fills chat input, focuses it
  const askAIFromTab = useCallback((prompt: string) => {
    setReviewExpanded(false);
    setChatInput(prompt);
    setTimeout(() => chatInputRef.current?.focus(), 100);
  }, []);

  // Spec counts for review bar — step count from step NODES on the canvas, not the old embedded array
  const stepChildNodes = nodes.filter(n => n.parent_node_id === node.id && n.node_type === 'step');
  const stepCount = stepChildNodes.length || node.steps.length;
  const apiCount = node.apis.length;
  const acceptDone = node.acceptance.filter(a => a.done).length;
  const acceptTotal = node.acceptance.length;

  // === STEP NODE PANEL (early return) ===
  if (node.node_type === 'step') {
    const parentNode = nodes.find(n => n.id === node.parent_node_id);
    const siblings = nodes.filter(n => n.parent_node_id === node.parent_node_id && n.node_type === 'step').sort((a, b) => a.step_number - b.step_number);
    const siblingIndex = siblings.findIndex(s => s.id === node.id);
    const prevSibling = siblingIndex > 0 ? siblings[siblingIndex - 1] : null;
    const nextSibling = siblingIndex < siblings.length - 1 ? siblings[siblingIndex + 1] : null;
    const parentConfig = parentNode ? NODE_CONFIG[parentNode.node_type] : config;

    const updateStepData = (field: keyof StepData, value: string) => {
      onNodeUpdate({
        ...node,
        step_data: { ...(node.step_data || { user_action: '', system_action: '', success_state: '', error_states: '', api_called: '' }), [field]: value },
      });
    };

    const stepFields: { key: keyof StepData; label: string; rows: number }[] = [
      { key: 'user_action', label: 'User Action', rows: 2 },
      { key: 'system_action', label: 'System Action', rows: 2 },
      { key: 'success_state', label: 'Success State', rows: 2 },
      { key: 'error_states', label: 'Error States', rows: 2 },
      { key: 'api_called', label: 'API Called', rows: 1 },
    ];

    return (
      <div
        className="shrink-0 flex flex-col overflow-hidden"
        style={{
          width: 400,
          background: 'linear-gradient(180deg, #18181b 0%, #141418 100%)',
          borderLeft: '1px solid rgba(63,63,70,0.6)',
          borderRadius: 16,
          margin: '12px 8px 12px 0',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        {/* Step Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/80">
          <div
            className="flex items-center justify-center shrink-0 rounded"
            style={{ width: 20, height: 20, background: `${parentConfig.color}22`, color: parentConfig.color }}
          >
            <ChevronRight size={12} />
          </div>
          <input
            className="flex-1 min-w-0 text-sm font-semibold bg-transparent outline-none text-zinc-100"
            value={node.title}
            onChange={(e) => onNodeUpdate({ ...node, title: e.target.value })}
          />
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0" style={{ background: `${parentConfig.color}22`, color: parentConfig.color }}>
            Step {node.step_number} of {siblings.length}
          </span>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="p-1 text-zinc-600 hover:text-red-400 shrink-0 transition-colors"
            title="Delete step"
          >
            <Trash2 size={14} />
          </button>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300 shrink-0 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Parent link */}
        {parentNode && (
          <button
            onClick={() => onSelectNode?.(parentNode.id)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 transition-colors border-b border-zinc-800/60"
          >
            <ChevronLeft size={10} /> Parent: {parentNode.title || 'Untitled'}
          </button>
        )}

        {/* Step data fields */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {stepFields.map(({ key, label, rows }) => (
            <div key={key}>
              <label className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{label}</label>
              <textarea
                value={node.step_data?.[key] || ''}
                onChange={(e) => updateStepData(key, e.target.value)}
                placeholder={`Enter ${label.toLowerCase()}...`}
                className="w-full mt-1 p-2 text-xs border border-zinc-700/60 bg-zinc-800/40 rounded-lg resize-none outline-none focus:border-pink-500/50 text-zinc-200 placeholder-zinc-600"
                rows={rows}
              />
            </div>
          ))}
        </div>

        {/* AI Chat for step node */}
        <div className="border-t border-zinc-800/80">
          <div className="p-3">
            <div className="flex gap-2">
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                placeholder="Ask about this step..."
                className="flex-1 resize-none rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-pink-500/50 placeholder-zinc-600"
                rows={1}
              />
              <button
                onClick={() => handleSendChat()}
                disabled={chatLoading || !chatInput.trim()}
                className="self-end p-2 rounded-lg text-white disabled:opacity-40 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #e91e63, #c2185b)',
                  boxShadow: chatLoading || !chatInput.trim() ? 'none' : '0 0 12px rgba(233,30,99,0.5)',
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Prev / Next navigation */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800/60">
          <button
            onClick={() => prevSibling && onSelectNode?.(prevSibling.id)}
            disabled={!prevSibling}
            className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={12} /> Prev
          </button>
          <span className="text-[10px] text-zinc-600">{siblingIndex + 1} / {siblings.length}</span>
          <button
            onClick={() => nextSibling && onSelectNode?.(nextSibling.id)}
            disabled={!nextSibling}
            className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-zinc-300 disabled:opacity-30 transition-colors"
          >
            Next <ChevronRight size={12} />
          </button>
        </div>

        {/* Delete confirm */}
        {deleteConfirm && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mx-4 shadow-xl" style={{ maxWidth: 300 }}>
              <h3 className="text-sm font-bold text-zinc-100 mb-1">Delete step &ldquo;{node.title || 'Untitled'}&rdquo;?</h3>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">The chain will be re-connected automatically.</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeleteConfirm(false)} className="px-3 py-1.5 text-xs font-medium text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors">Cancel</button>
                <button onClick={() => { setDeleteConfirm(false); onDeleteNode(node.id); }} className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs font-medium rounded-lg shadow-lg z-50 whitespace-nowrap">
            {toast}
          </div>
        )}
      </div>
    );
  }

  // === ACCEPTANCE TESTS NODE PANEL (early return) ===
  if (node.node_type === 'acceptance_tests') {
    let parsedTests: { id: string; description: string; expected: string; status: string }[] = [];
    try {
      if (node.notes) parsedTests = JSON.parse(node.notes);
    } catch { /* not JSON yet */ }

    const toggleTestStatus = (idx: number) => {
      const test = parsedTests[idx];
      const nextStatus = test.status === 'untested' ? 'pass' : test.status === 'pass' ? 'fail' : 'untested';
      const updated = [...parsedTests];
      updated[idx] = { ...test, status: nextStatus };
      onNodeUpdate({
        ...node,
        notes: JSON.stringify(updated),
        acceptance: updated.map((t, i) => ({
          text: `[${t.status}] ${t.description} → Expected: ${t.expected}`,
          done: t.status === 'pass',
          sort_order: i,
        })),
      });
    };

    const statusColors: Record<string, { bg: string; text: string; label: string }> = {
      pass: { bg: 'rgba(16,185,129,0.15)', text: '#10b981', label: 'PASS' },
      fail: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', label: 'FAIL' },
      untested: { bg: 'rgba(161,161,170,0.1)', text: '#a1a1aa', label: 'UNTESTED' },
    };

    return (
      <div
        className="shrink-0 flex flex-col overflow-hidden"
        style={{ width: 400, background: 'linear-gradient(180deg, #18181b 0%, #141418 100%)', borderLeft: '1px solid rgba(63,63,70,0.6)', borderRadius: 16, margin: '12px 8px 12px 0', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center justify-center shrink-0 rounded" style={{ width: 20, height: 20, background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                <CheckSquare size={12} />
              </div>
              <input
                className="flex-1 min-w-0 text-sm font-semibold bg-transparent outline-none text-zinc-100 truncate"
                value={node.title}
                onChange={(e) => onNodeUpdate({ ...node, title: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                Acceptance Tests
              </span>
              <button onClick={() => setDeleteConfirm(true)} className="p-1 text-zinc-600 hover:text-red-400 shrink-0 transition-colors" title="Delete node">
                <Trash2 size={14} />
              </button>
              <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300 shrink-0 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
          {parsedTests.length > 0 && (
            <div className="flex items-center gap-3 text-[10px] text-zinc-500">
              <span style={{ color: '#10b981' }}>{parsedTests.filter(t => t.status === 'pass').length} pass</span>
              <span style={{ color: '#ef4444' }}>{parsedTests.filter(t => t.status === 'fail').length} fail</span>
              <span>{parsedTests.filter(t => t.status === 'untested').length} untested</span>
            </div>
          )}
        </div>

        {/* Test List + Chat */}
        <div className="flex-1 overflow-y-auto px-4 py-3" style={{ minHeight: 0 }}>
          <textarea
            className="w-full text-xs bg-zinc-800/60 rounded-lg px-3 py-2 mb-3 outline-none text-zinc-300 resize-none"
            placeholder="Description of what these tests verify..."
            value={node.description}
            onChange={(e) => onNodeUpdate({ ...node, description: e.target.value })}
            rows={2}
          />

          {parsedTests.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400 mb-3 leading-relaxed">No acceptance tests yet. Ask the AI to generate them based on a feature spec.</p>
              <button
                onClick={() => {
                  const msg = 'Generate acceptance tests for this feature. Include 5-8 specific, verifiable test cases with expected outcomes.';
                  handleSendChat(msg);
                }}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}
              >
                Generate Tests
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {parsedTests.map((test, idx) => {
                const sc = statusColors[test.status] || statusColors.untested;
                return (
                  <div key={test.id || idx} className="rounded-lg p-2.5" style={{ background: 'rgba(39,39,42,0.5)', border: '1px solid rgba(63,63,70,0.4)' }}>
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => toggleTestStatus(idx)}
                        className="mt-0.5 shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                        style={{ background: sc.bg, color: sc.text }}
                        title="Click to toggle status"
                      >
                        {sc.label}
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-200 leading-snug">{test.description}</p>
                        <p className="text-[10px] text-zinc-500 mt-1">Expected: {test.expected}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Chat Messages */}
          <div className="mt-4 pt-3 border-t border-zinc-800/60">
            <p className="text-[10px] text-zinc-500 font-medium mb-2">AI CHAT</p>
            <div className="space-y-2">
              {chatMessages.map((msg, i) => (
                <div key={i} className="text-xs" style={{ color: msg.role === 'user' ? '#a1a1aa' : '#e4e4e7' }}>
                  <span className="font-bold text-[10px]" style={{ color: msg.role === 'user' ? '#71717a' : '#10b981' }}>
                    {msg.role === 'user' ? 'You' : 'AI'}:
                  </span>{' '}
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                  <span className="animate-pulse">●</span> Thinking...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <div className="flex-shrink-0 px-3 pb-3 pt-1 border-t border-zinc-800/60">
          <div className="flex items-center gap-1.5 bg-zinc-800/70 rounded-xl pl-3 pr-1.5 py-1">
            <textarea
              ref={chatInputRef}
              className="flex-1 text-xs bg-transparent outline-none text-zinc-200 resize-none placeholder:text-zinc-600"
              rows={1}
              placeholder="Ask AI to generate or refine tests..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(chatInput); } }}
              disabled={chatLoading}
            />
            <button
              onClick={() => handleSendChat(chatInput)}
              disabled={chatLoading || !chatInput.trim()}
              className="shrink-0 p-1.5 rounded-lg transition-colors"
              style={{ background: chatInput.trim() ? 'rgba(16,185,129,0.2)' : 'transparent', color: chatInput.trim() ? '#10b981' : '#52525b' }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>

        {deleteConfirm && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mx-4 shadow-xl" style={{ maxWidth: 300 }}>
              <p className="text-sm text-zinc-200 mb-4">Delete this acceptance tests node?</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteConfirm(false)} className="flex-1 text-xs py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700">Cancel</button>
                <button onClick={() => { onDeleteNode(node.id); setDeleteConfirm(false); }} className="flex-1 text-xs py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="shrink-0 flex flex-col overflow-hidden"
      style={{
        width: 400,
        background: 'linear-gradient(180deg, #18181b 0%, #141418 100%)',
        borderLeft: '1px solid rgba(63,63,70,0.6)',
        borderRadius: 16,
        margin: '12px 8px 12px 0',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* ============ HEADER ============ */}
      <div className="flex-shrink-0 px-4 pt-3 pb-0 border-b border-zinc-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex items-center justify-center shrink-0 rounded"
              style={{ width: 20, height: 20, background: `${config.color}22`, color: config.color }}
            >
              <Icon size={12} />
            </div>
            <input
              className="flex-1 min-w-0 text-sm font-semibold bg-transparent outline-none text-zinc-100 truncate"
              value={node.title}
              onChange={(e) => onNodeUpdate({ ...node, title: e.target.value })}
            />
            {classification && (
              <span
                className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 font-mono"
                style={{
                  background: CLASSIFICATION_COLORS[classification.type]?.bg ?? 'rgba(63,63,70,0.4)',
                  color: CLASSIFICATION_COLORS[classification.type]?.color ?? '#a1a1aa',
                }}
                title={classification.reasoning}
              >
                {classification.type === 'mixed' && <AlertTriangle size={10} />}
                {classification.type.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: `${config.color}22`, color: config.color }}
            >
              {FIDELITY_LABELS[FIDELITY_INDEX[node.fidelity]]}
            </span>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: `${config.color}18`, color: config.color }}
            >
              {config.label}
            </span>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="p-1 text-zinc-600 hover:text-red-400 shrink-0 transition-colors"
              title="Delete node"
            >
              <Trash2 size={14} />
            </button>
            <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300 shrink-0 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ============ FIDELITY TRACK ============ */}
        <div className="flex items-center gap-1 mb-3">
          {(['concept', 'wireframe', 'mockup', 'build-ready'] as Fidelity[]).map((level, i) => (
            <button
              key={level}
              onClick={() => handleFidelityClick(level)}
              className="flex-1 text-center group"
            >
              <div
                className="h-0.5 rounded-full mb-1 transition-all duration-300"
                style={{
                  background: i <= FIDELITY_INDEX[node.fidelity] ? '#e91e63' : 'rgba(255,255,255,0.08)',
                }}
              />
              <span className={`text-[10px] transition-colors ${
                i === FIDELITY_INDEX[node.fidelity]
                  ? 'text-pink-400 font-medium'
                  : 'text-zinc-600 group-hover:text-zinc-400'
              }`}>
                {FIDELITY_LABELS[i]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ============ AI CHAT (PRIMARY) ============ */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {chatMessages.length === 0 && !chatLoading && (
            <div className="flex items-start gap-2 py-4">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
              >
                <Sparkles size={12} className="text-white" />
              </div>
              <div className="text-xs text-zinc-400 leading-relaxed bg-zinc-800/60 rounded-xl px-3 py-2 border border-zinc-700/40">
                {starterMessage || "Describe your feature idea and I\u2019ll structure it into a buildable spec."}
              </div>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start gap-2'}`}
            >
              {msg.role === 'assistant' && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
                >
                  <Sparkles size={12} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] text-xs leading-relaxed rounded-xl px-3 py-2 whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'text-zinc-100 border border-pink-800/30'
                    : 'text-zinc-300 bg-zinc-800/60 border border-zinc-700/40'
                }`}
                style={msg.role === 'user' ? { background: 'rgba(233,30,99,0.12)' } : {}}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex items-start gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
              >
                <Sparkles size={12} className="text-white" />
              </div>
              <div className="bg-zinc-800/60 border border-zinc-700/40 rounded-xl px-3 py-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick prompts + chat input */}
        <div className="flex-shrink-0 px-3 pb-3">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {getQuickPrompts().map(prompt => (
              <button
                key={prompt}
                onClick={() => handleSendChat(prompt)}
                disabled={chatLoading}
                className="px-2.5 py-1 text-[10px] font-medium rounded-lg border border-zinc-700/50 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200 transition-all disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Dark glass textarea container */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes chatGlow {
              0%, 100% { box-shadow: 0 0 0 1px rgba(139,92,246,0.12), 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04); }
              50% { box-shadow: 0 0 0 1px rgba(139,92,246,0.3), 0 4px 32px rgba(139,92,246,0.15), 0 0 20px rgba(233,30,99,0.08), inset 0 1px 0 rgba(255,255,255,0.06); }
            }
          ` }} />
          <div
            className="relative rounded-2xl overflow-hidden border border-zinc-700/60"
            style={{
              background: 'linear-gradient(135deg, rgba(28,28,32,0.97) 0%, rgba(20,20,28,0.99) 100%)',
              animation: 'chatGlow 3s ease-in-out infinite',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.05), transparent, rgba(233,30,99,0.05))' }}
            />
            {/* Status header inside glass box */}
            <div className="relative flex items-center justify-between px-4 pt-3 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-zinc-400">Canvas AI</span>
              </div>
              <div className="flex items-center gap-2">
                <div ref={modelDropdownRef} className="relative">
                  <button
                    onClick={() => setModelDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-zinc-800/60 text-zinc-300 rounded-2xl border border-zinc-700/40 hover:bg-zinc-700/60 hover:border-zinc-600/60 transition-all duration-200 cursor-pointer"
                  >
                    {getModelById(selectedModelId)?.label ?? 'Sonnet 4.6'}
                    <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-200 ${modelDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {modelDropdownOpen && typeof document !== 'undefined' && createPortal(
                    <div
                      ref={(el) => {
                        (modelDropdownMenuRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                        if (!el || !modelDropdownRef.current) return;
                        const rect = modelDropdownRef.current.getBoundingClientRect();
                        el.style.position = 'fixed';
                        el.style.right = `${window.innerWidth - rect.right}px`;
                        el.style.bottom = `${window.innerHeight - rect.top + 6}px`;
                      }}
                      className="w-60 max-h-[400px] overflow-y-auto rounded-xl border border-zinc-700/50 shadow-2xl"
                      style={{
                        background: 'linear-gradient(180deg, rgba(24,24,28,0.99) 0%, rgba(18,18,24,0.99) 100%)',
                        backdropFilter: 'blur(24px)',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(113,113,122,0.3) transparent',
                        zIndex: 99999,
                      }}
                    >
                      {(['anthropic', 'openai'] as CanvasProvider[]).map((provider, providerIdx) => {
                        const providerModels = CANVAS_MODELS.filter((m) => m.provider === provider);
                        return (
                          <div key={provider}>
                            {providerIdx > 0 && <div className="mx-3 border-t border-zinc-700/30" />}
                            <div
                              className="sticky top-0 z-10 px-3 pt-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500"
                              style={{ background: 'rgba(22,22,26,0.97)', backdropFilter: 'blur(8px)' }}
                            >
                              {PROVIDER_LABELS[provider]}
                            </div>
                            {providerModels.map((model) => {
                              const isSelected = model.id === selectedModelId;
                              const tierStyle = TIER_COLORS[model.tier];
                              return (
                                <button
                                  key={model.id}
                                  onClick={() => { setSelectedModelId(model.id); localStorage.setItem(`canvas-model-${projectId}`, model.id); setModelDropdownOpen(false); }}
                                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-all duration-150 cursor-pointer ${
                                    isSelected
                                      ? 'bg-zinc-700/40 text-white'
                                      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />}
                                    <div className="min-w-0">
                                      <div className="text-xs font-medium truncate">{model.label}</div>
                                      <div className="text-[10px] text-zinc-600 truncate">{model.description}</div>
                                    </div>
                                  </div>
                                  <span className={`ml-2 flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded-lg border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}>
                                    {model.tier === 'pro' ? 'Pro' : model.tier === 'fast' ? 'Fast' : 'Std'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>,
                    document.body,
                  )}
                </div>
                {(() => {
                  const currentModel = getModelById(selectedModelId);
                  const tierStyle = currentModel ? TIER_COLORS[currentModel.tier] : TIER_COLORS.pro;
                  const tierLabel = currentModel?.tier === 'pro' ? 'Pro' : currentModel?.tier === 'fast' ? 'Fast' : 'Std';
                  return (
                    <span className={`px-2 py-1 text-xs font-medium rounded-2xl border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}>
                      {tierLabel}
                    </span>
                  );
                })()}
              </div>
            </div>
            <textarea
              ref={chatInputRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendChat();
                }
              }}
              placeholder="Describe your feature idea..."
              className="relative w-full px-4 pt-3 pb-1 bg-transparent border-none outline-none resize-none text-sm text-zinc-100 placeholder-zinc-600 leading-relaxed"
              style={{ scrollbarWidth: 'none' }}
              rows={2}
              disabled={chatLoading}
            />
            <div className="relative px-3 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 p-1 bg-zinc-800/40 rounded-xl border border-zinc-700/50">
                  <button className="group relative p-2.5 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 hover:scale-105 hover:-rotate-3 transform">
                    <Paperclip className="w-4 h-4 transition-all duration-300 group-hover:scale-125 group-hover:-rotate-12" />
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-zinc-900/95 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1 shadow-lg border border-zinc-700/50 backdrop-blur-sm z-50">
                      Upload files
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95" />
                    </div>
                  </button>
                  <button className="group relative p-2.5 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80 hover:scale-105 hover:rotate-6 transform">
                    <Link className="w-4 h-4 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12" />
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-zinc-900/95 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1 shadow-lg border border-zinc-700/50 backdrop-blur-sm z-50">
                      Web link
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95" />
                    </div>
                  </button>
                  <button className="group relative p-2.5 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-green-400 hover:bg-zinc-800/80 hover:scale-105 hover:rotate-3 transform">
                    <Code className="w-4 h-4 transition-all duration-300 group-hover:scale-125 group-hover:-rotate-6" />
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-zinc-900/95 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1 shadow-lg border border-zinc-700/50 backdrop-blur-sm z-50">
                      Code repo
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95" />
                    </div>
                  </button>
                  <button className="group relative p-2.5 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-purple-400 hover:bg-zinc-800/80 hover:scale-105 hover:-rotate-6 transform">
                    <svg className="w-4 h-4 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.354-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.015-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117v-6.038H8.148zm7.704 0c-2.476 0-4.49 2.015-4.49 4.49s2.014 4.49 4.49 4.49 4.49-2.015 4.49-4.49-2.014-4.49-4.49-4.49zm0 7.509c-1.665 0-3.019-1.355-3.019-3.019s1.355-3.019 3.019-3.019 3.019 1.354 3.019 3.019-1.354 3.019-3.019 3.019zM8.148 24c-2.476 0-4.49-2.015-4.49-4.49s2.014-4.49 4.49-4.49h4.588V24H8.148zm3.117-1.471V16.49H8.148c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.02 3.019 3.02h3.117z" />
                    </svg>
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-zinc-900/95 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1 shadow-lg border border-zinc-700/50 backdrop-blur-sm z-50">
                      Design file
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95" />
                    </div>
                  </button>
                </div>
                <button className="group relative p-2.5 bg-transparent border border-zinc-700/30 rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80 hover:scale-110 hover:rotate-2 transform hover:border-red-500/30">
                  <Mic className="w-4 h-4 transition-all duration-300 group-hover:scale-125 group-hover:-rotate-3" />
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-zinc-900/95 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1 shadow-lg border border-zinc-700/50 backdrop-blur-sm z-50">
                    Voice input
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95" />
                  </div>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-700 font-mono">{chatInput.length}/2000</span>
                <button
                  onClick={() => handleSendChat()}
                  disabled={chatLoading || !chatInput.trim()}
                  className="group relative p-2 rounded-xl text-white transition-all duration-200 hover:scale-110 hover:-rotate-2 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    background: 'linear-gradient(135deg, #e91e63, #c2185b)',
                    boxShadow: chatLoading || !chatInput.trim()
                      ? 'none'
                      : '0 0 12px rgba(233,30,99,0.5), 0 2px 8px rgba(0,0,0,0.4)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(233,30,99,0.6), 0 0 40px rgba(233,30,99,0.3), 0 2px 8px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = chatInput.trim() && !chatLoading
                      ? '0 0 12px rgba(233,30,99,0.5), 0 2px 8px rgba(0,0,0,0.4)'
                      : 'none';
                  }}
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 opacity-0 group-hover:opacity-40 transition-opacity duration-300 blur-lg scale-110 pointer-events-none" />
                  <Send size={16} className="relative" />
                </button>
              </div>
            </div>
            <div className="relative px-4 pb-2.5 flex items-center justify-between border-t border-zinc-800/50 pt-2">
              <div className="flex items-center gap-1.5 text-zinc-700">
                <span className="text-xs">
                  <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-500 font-mono text-[10px]">Shift+Enter</kbd> new line
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] text-zinc-600">Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ REVIEW SPEC (Collapsible) ============ */}
      <div className="flex-shrink-0 px-3 pb-3">
        <button
          onClick={() => setReviewExpanded(!reviewExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800/60 transition-colors mb-2"
        >
          <div className="flex items-center gap-2">
            {reviewExpanded ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
            <span className="text-xs font-medium text-zinc-400">Review Spec</span>
          </div>
          <span className="text-[10px] text-zinc-600">
            {stepCount} steps &middot; {apiCount} APIs &middot; {acceptDone}/{acceptTotal} criteria
          </span>
        </button>

        {reviewExpanded && (
          <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/40">
            {/* Tab bar */}
            <div className="flex border-b border-zinc-800/80">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-2 text-xs transition-colors"
                  style={{
                    fontWeight: activeTab === tab ? 600 : 400,
                    color: activeTab === tab ? '#e91e63' : 'rgba(255,255,255,0.3)',
                    borderBottom: activeTab === tab ? '2px solid #e91e63' : '2px solid transparent',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="overflow-y-auto p-4" style={{ maxHeight: 320 }}>
              {activeTab === 'Overview' && (
                <OverviewTab node={node} nodes={nodes} onNodeUpdate={onNodeUpdate} />
              )}
              {activeTab === 'Steps' && (
                <StepsTabWithEmpty node={node} nodes={nodes} onNodeUpdate={onNodeUpdate} onAskAI={askAIFromTab} onSelectNode={onSelectNode} />
              )}
              {activeTab === 'APIs' && (
                <ApisTabWithEmpty node={node} onNodeUpdate={onNodeUpdate} onAskAI={askAIFromTab} />
              )}
              {activeTab === 'Acceptance' && (
                <AcceptanceTabWithEmpty node={node} onNodeUpdate={onNodeUpdate} onAskAI={askAIFromTab} />
              )}
              {activeTab === 'Export' && (
                <ExportTabWithGuidance node={node} brief={buildBrief()} onAskAI={askAIFromTab} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============ TOAST ============ */}
      {toast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs font-medium rounded-lg shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* ============ DELETE CONFIRMATION ============ */}
      {deleteConfirm && (() => {
        const stepChildCount = nodes.filter(n => n.parent_node_id === node.id).length;
        return (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mx-4 shadow-xl" style={{ maxWidth: 300 }}>
            <h3 className="text-sm font-bold text-zinc-100 mb-1">
              Delete &ldquo;{node.title || 'Untitled'}&rdquo;?
            </h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              This removes all steps, APIs, and acceptance criteria.{stepChildCount > 0 ? ` Also deletes ${stepChildCount} workflow step${stepChildCount !== 1 ? 's' : ''} on the canvas.` : ''} This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDeleteConfirm(false);
                  onDeleteNode(node.id);
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}


// ============================================================
// Tab Components (preserved from v1, with empty state wrappers)
// ============================================================

function OverviewTab({
  node, nodes, onNodeUpdate,
}: {
  node: CanvasNode; nodes: CanvasNode[]; onNodeUpdate: (n: CanvasNode) => void;
}) {
  const depIds = new Set(node.dependencies.map(d => d.depends_on_node_id));
  const otherNodes = nodes.filter(n => n.id !== node.id && n.node_type !== 'step');

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          Description
        </label>
        <textarea
          value={node.description || ''}
          onChange={(e) => onNodeUpdate({ ...node, description: e.target.value })}
          placeholder="Describe this feature..."
          className="w-full mt-1 p-2 text-xs border border-gray-200 rounded-lg resize-none outline-none focus:border-pink-300"
          rows={4}
        />
      </div>

      <div>
        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          Priority
        </label>
        <select
          value={node.priority}
          onChange={(e) => onNodeUpdate({ ...node, priority: Number(e.target.value) })}
          className="w-full mt-1 p-2 text-xs border border-gray-200 rounded-lg outline-none"
        >
          <option value={0}>P0 — Critical</option>
          <option value={1}>P1 — High</option>
          <option value={2}>P2 — Medium</option>
          <option value={3}>P3 — Low</option>
        </select>
      </div>

      <div>
        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          Dependencies
        </label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {otherNodes.map(n => {
            const isLinked = depIds.has(n.id);
            const nConfig = NODE_CONFIG[n.node_type];
            return (
              <button
                key={n.id}
                onClick={() => {
                  const newDeps = isLinked
                    ? node.dependencies.filter(d => d.depends_on_node_id !== n.id)
                    : [...node.dependencies, { depends_on_node_id: n.id }];
                  onNodeUpdate({ ...node, dependencies: newDeps });
                }}
                className="px-2 py-1 rounded text-[10px] font-medium transition-colors"
                style={{
                  background: isLinked ? `${nConfig.color}15` : '#f3f4f6',
                  color: isLinked ? nConfig.color : '#9ca3af',
                  border: isLinked ? `1px solid ${nConfig.color}40` : '1px solid transparent',
                }}
              >
                {isLinked && '\u2713 '}{n.title || 'Untitled'}
              </button>
            );
          })}
          {otherNodes.length === 0 && (
            <span className="text-[10px] text-gray-400">No other nodes yet</span>
          )}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          Notes
        </label>
        <textarea
          value={node.notes || ''}
          onChange={(e) => onNodeUpdate({ ...node, notes: e.target.value })}
          placeholder="Architecture notes, constraints..."
          className="w-full mt-1 p-2 text-xs border border-gray-200 rounded-lg resize-none outline-none focus:border-pink-300"
          rows={3}
        />
      </div>
    </div>
  );
}

// Steps tab with empty state — reads step NODES from canvas, falls back to old embedded array
function StepsTabWithEmpty({
  node, nodes, onNodeUpdate, onAskAI, onSelectNode,
}: {
  node: CanvasNode; nodes: CanvasNode[]; onNodeUpdate: (n: CanvasNode) => void; onAskAI: (msg: string) => void; onSelectNode?: (id: string) => void;
}) {
  // Step nodes on the canvas (the R5 source of truth)
  const stepNodes = nodes
    .filter(n => n.parent_node_id === node.id && n.node_type === 'step')
    .sort((a, b) => a.step_number - b.step_number);

  // If step nodes exist on the canvas, show them
  if (stepNodes.length > 0) {
    return (
      <div className="space-y-2">
        {stepNodes.map((sn) => {
          const sd = sn.step_data;
          const filledFields = sd ? [sd.user_action, sd.system_action, sd.success_state, sd.error_states, sd.api_called].filter(Boolean).length : 0;
          return (
            <button
              key={sn.id}
              onClick={() => onSelectNode?.(sn.id)}
              className="w-full text-left border border-gray-200 rounded-lg p-2.5 hover:border-pink-300 hover:bg-pink-50/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-bold text-gray-400 shrink-0">#{sn.step_number}</span>
                  <span className="text-xs font-medium text-gray-800 truncate">{sn.title || 'Untitled step'}</span>
                </div>
                <span className="text-[9px] text-gray-400 shrink-0">{filledFields}/5 fields</span>
              </div>
              {sd?.user_action && (
                <p className="text-[10px] text-gray-500 mt-1 truncate">User: {sd.user_action}</p>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Fall back to old embedded steps array
  if (node.steps.length === 0) {
    return (
      <EmptyState
        message="No workflow steps yet. Describe your feature in the chat and I'll generate them."
        actions={[
          { label: 'Ask AI to Generate', onClick: () => onAskAI('Generate workflow steps for this feature') },
          { label: '+ Add Step Manually', onClick: () => {
            const newStep: CanvasNodeStep = { sort_order: 0, title: '', user_action: '', system_action: '', success_state: '', error_states: '', api_called: '' };
            onNodeUpdate({ ...node, steps: [newStep] });
          }},
        ]}
      />
    );
  }
  return <StepsTab node={node} onNodeUpdate={onNodeUpdate} />;
}

// APIs tab with empty state
function ApisTabWithEmpty({
  node, onNodeUpdate, onAskAI,
}: {
  node: CanvasNode; onNodeUpdate: (n: CanvasNode) => void; onAskAI: (msg: string) => void;
}) {
  if (node.apis.length === 0) {
    return (
      <EmptyState
        message="No API endpoints yet. I'll generate these from your workflow steps."
        actions={[
          { label: 'Ask AI to Generate', onClick: () => onAskAI('Generate API endpoints based on my workflow steps') },
          { label: '+ Add Endpoint Manually', onClick: () => {
            const newApi: CanvasNodeApi = { method: 'POST', endpoint: '', purpose: '', request_shape: '', response_shape: '' };
            onNodeUpdate({ ...node, apis: [...node.apis, newApi] });
          }},
        ]}
      />
    );
  }
  return <ApisTab node={node} onNodeUpdate={onNodeUpdate} />;
}

// Acceptance tab with empty state
function AcceptanceTabWithEmpty({
  node, onNodeUpdate, onAskAI,
}: {
  node: CanvasNode; onNodeUpdate: (n: CanvasNode) => void; onAskAI: (msg: string) => void;
}) {
  if (node.acceptance.length === 0) {
    return (
      <EmptyState
        message="No acceptance criteria yet. I can generate standard criteria plus feature-specific ones."
        actions={[
          { label: 'Ask AI to Generate', onClick: () => onAskAI('Generate acceptance criteria for this feature') },
          { label: '+ Load Defaults', onClick: () => {
            const items = DEFAULT_ACCEPTANCE.map((text, i) => ({ text, done: false, sort_order: i }));
            onNodeUpdate({ ...node, acceptance: items });
          }},
        ]}
      />
    );
  }
  return <AcceptanceTab node={node} onNodeUpdate={onNodeUpdate} />;
}

// Export tab with spec completeness guidance
function ExportTabWithGuidance({
  node, brief, onAskAI,
}: {
  node: CanvasNode; brief: string; onAskAI: (msg: string) => void;
}) {
  const hasDesc = !!node.description;
  const hasSteps = node.steps.length >= 2;
  const hasApis = node.apis.length >= 1;
  const hasAcceptance = node.acceptance.length >= 5;
  const isComplete = hasDesc && hasSteps && hasApis && hasAcceptance;

  if (!isComplete) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-gray-500">To generate a complete Claude Code brief:</p>
        <div className="space-y-1.5">
          <CheckItem done={hasDesc} label="Description defined" />
          <CheckItem done={hasSteps} label="At least 2 workflow steps" />
          <CheckItem done={hasApis} label="At least 1 API endpoint" />
          <CheckItem done={hasAcceptance} label="At least 5 acceptance criteria" />
        </div>
        <button
          onClick={() => onAskAI('Review this spec and generate anything that\'s missing')}
          className="w-full py-2 text-xs font-medium text-pink-500 border border-dashed border-pink-300 rounded-lg hover:bg-pink-50 transition-colors"
        >
          Ask AI to fill gaps
        </button>
      </div>
    );
  }

  return <ExportTab brief={brief} />;
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span style={{ color: done ? '#16a34a' : '#dc2626' }}>
        {done ? '\u2713' : '\u2717'}
      </span>
      <span className={done ? 'text-gray-600' : 'text-gray-900 font-medium'}>{label}</span>
    </div>
  );
}

function EmptyState({
  message, actions,
}: {
  message: string;
  actions: { label: string; onClick: () => void }[];
}) {
  return (
    <div className="text-center py-6">
      <p className="text-xs text-gray-400 mb-4 leading-relaxed">{message}</p>
      <div className="flex flex-col gap-2">
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={a.onClick}
            className={`w-full py-2 text-xs font-medium rounded-lg transition-colors ${
              i === 0
                ? 'text-pink-500 border border-pink-300 hover:bg-pink-50'
                : 'text-gray-500 border border-dashed border-gray-200 hover:border-gray-300'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}


// ============================================================
// Core Tab Components (unchanged editing logic)
// ============================================================

function StepsTab({
  node, onNodeUpdate,
}: {
  node: CanvasNode; onNodeUpdate: (n: CanvasNode) => void;
}) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleExpand = (index: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const updateStep = (index: number, field: keyof CanvasNodeStep, value: string | number) => {
    const newSteps = node.steps.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    onNodeUpdate({ ...node, steps: newSteps });
  };

  const addStep = () => {
    const newStep: CanvasNodeStep = {
      sort_order: node.steps.length,
      title: '',
      user_action: '',
      system_action: '',
      success_state: '',
      error_states: '',
      api_called: '',
    };
    onNodeUpdate({ ...node, steps: [...node.steps, newStep] });
    setExpandedSteps(prev => new Set(prev).add(node.steps.length));
  };

  const deleteStep = (index: number) => {
    const newSteps = node.steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, sort_order: i }));
    onNodeUpdate({ ...node, steps: newSteps });
  };

  return (
    <div className="space-y-2">
      {node.steps.map((step, i) => {
        const isExpanded = expandedSteps.has(i);
        return (
          <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleExpand(i)}
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <input
                value={step.title}
                onChange={(e) => updateStep(i, 'title', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={`Step ${i + 1} title`}
                className="flex-1 text-xs font-medium bg-transparent outline-none"
              />
              <button
                onClick={(e) => { e.stopPropagation(); deleteStep(i); }}
                className="p-0.5 text-gray-300 hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
            {isExpanded && (
              <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
                {(['user_action', 'system_action', 'success_state', 'error_states', 'api_called'] as const).map(field => (
                  <div key={field}>
                    <label className="text-[9px] font-medium text-gray-400 uppercase">
                      {field.replace(/_/g, ' ')}
                    </label>
                    <textarea
                      value={step[field] || ''}
                      onChange={(e) => updateStep(i, field, e.target.value)}
                      className="w-full mt-0.5 p-1.5 text-[11px] border border-gray-100 rounded resize-none outline-none focus:border-pink-200"
                      rows={field === 'api_called' ? 1 : 2}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <button
        onClick={addStep}
        className="w-full py-2 text-xs text-gray-400 hover:text-pink-500 border border-dashed border-gray-200 rounded-lg hover:border-pink-300 transition-colors flex items-center justify-center gap-1"
      >
        <Plus size={12} /> Add Step
      </button>
    </div>
  );
}

function ApisTab({
  node, onNodeUpdate,
}: {
  node: CanvasNode; onNodeUpdate: (n: CanvasNode) => void;
}) {
  const updateApi = (index: number, field: keyof CanvasNodeApi, value: string) => {
    const newApis = node.apis.map((a, i) =>
      i === index ? { ...a, [field]: value } : a
    );
    onNodeUpdate({ ...node, apis: newApis });
  };

  const addApi = () => {
    const newApi: CanvasNodeApi = {
      method: 'POST', endpoint: '', purpose: '',
      request_shape: '', response_shape: '',
    };
    onNodeUpdate({ ...node, apis: [...node.apis, newApi] });
  };

  const deleteApi = (index: number) => {
    onNodeUpdate({ ...node, apis: node.apis.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      {node.apis.map((api, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={api.method}
              onChange={(e) => updateApi(i, 'method', e.target.value)}
              className="text-[10px] font-bold px-1.5 py-1 border border-gray-200 rounded outline-none"
            >
              {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <input
              value={api.endpoint}
              onChange={(e) => updateApi(i, 'endpoint', e.target.value)}
              placeholder="/api/..."
              className="flex-1 text-xs font-mono bg-transparent outline-none"
            />
            <button
              onClick={() => deleteApi(i)}
              className="p-0.5 text-gray-300 hover:text-red-400"
            >
              <Trash2 size={12} />
            </button>
          </div>
          <input
            value={api.purpose}
            onChange={(e) => updateApi(i, 'purpose', e.target.value)}
            placeholder="Purpose..."
            className="w-full text-[11px] bg-transparent outline-none text-gray-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-medium text-gray-400 uppercase">Request</label>
              <textarea
                value={api.request_shape}
                onChange={(e) => updateApi(i, 'request_shape', e.target.value)}
                placeholder="{ ... }"
                className="w-full mt-0.5 p-1.5 text-[10px] font-mono border border-gray-100 rounded resize-none outline-none focus:border-pink-200"
                rows={3}
              />
            </div>
            <div>
              <label className="text-[9px] font-medium text-gray-400 uppercase">Response</label>
              <textarea
                value={api.response_shape}
                onChange={(e) => updateApi(i, 'response_shape', e.target.value)}
                placeholder="{ ... }"
                className="w-full mt-0.5 p-1.5 text-[10px] font-mono border border-gray-100 rounded resize-none outline-none focus:border-pink-200"
                rows={3}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={addApi}
        className="w-full py-2 text-xs text-gray-400 hover:text-pink-500 border border-dashed border-gray-200 rounded-lg hover:border-pink-300 transition-colors flex items-center justify-center gap-1"
      >
        <Plus size={12} /> Add Endpoint
      </button>
    </div>
  );
}

function AcceptanceTab({
  node, onNodeUpdate,
}: {
  node: CanvasNode; onNodeUpdate: (n: CanvasNode) => void;
}) {
  const [newText, setNewText] = useState('');

  const toggleDone = (index: number) => {
    const newAcceptance = node.acceptance.map((a, i) =>
      i === index ? { ...a, done: !a.done } : a
    );
    onNodeUpdate({ ...node, acceptance: newAcceptance });
  };

  const addCriterion = () => {
    if (!newText.trim()) return;
    const newItem: CanvasNodeAcceptance = {
      text: newText.trim(),
      done: false,
      sort_order: node.acceptance.length,
    };
    onNodeUpdate({ ...node, acceptance: [...node.acceptance, newItem] });
    setNewText('');
  };

  const deleteCriterion = (index: number) => {
    const newAcceptance = node.acceptance
      .filter((_, i) => i !== index)
      .map((a, i) => ({ ...a, sort_order: i }));
    onNodeUpdate({ ...node, acceptance: newAcceptance });
  };

  const addDefaults = () => {
    const existingTexts = new Set(node.acceptance.map(a => a.text));
    const newItems = DEFAULT_ACCEPTANCE
      .filter(text => !existingTexts.has(text))
      .map((text, i) => ({
        text,
        done: false,
        sort_order: node.acceptance.length + i,
      }));
    if (newItems.length > 0) {
      onNodeUpdate({ ...node, acceptance: [...node.acceptance, ...newItems] });
    }
  };

  return (
    <div className="space-y-2">
      {node.acceptance.map((criterion, i) => (
        <div key={i} className="flex items-start gap-2 group">
          <input
            type="checkbox"
            checked={criterion.done}
            onChange={() => toggleDone(i)}
            className="mt-0.5 accent-pink-500"
          />
          <span className={`flex-1 text-xs ${criterion.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
            {criterion.text}
          </span>
          <button
            onClick={() => deleteCriterion(i)}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-300 hover:text-red-400 transition-opacity"
          >
            <Trash2 size={11} />
          </button>
        </div>
      ))}

      <div className="flex gap-2 pt-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCriterion()}
          placeholder="Add criterion..."
          className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-pink-300"
        />
        <button
          onClick={addCriterion}
          disabled={!newText.trim()}
          className="px-2 py-1.5 text-xs text-pink-500 hover:bg-pink-50 rounded-lg disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <button
        onClick={addDefaults}
        className="w-full py-1.5 text-[10px] text-gray-400 hover:text-pink-500 border border-dashed border-gray-200 rounded-lg hover:border-pink-300 transition-colors"
      >
        + Defaults (Product Ops Pack)
      </button>
    </div>
  );
}

function ExportTab({ brief }: { brief: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: text is selectable via select-all on the pre block
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors"
          style={{
            background: copied ? '#f0fdf4' : '#f3f4f6',
            color: copied ? '#16a34a' : '#6b7280',
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>
      <pre className="text-[10px] leading-relaxed text-gray-600 bg-gray-50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap select-all">
        {brief}
      </pre>
    </div>
  );
}
