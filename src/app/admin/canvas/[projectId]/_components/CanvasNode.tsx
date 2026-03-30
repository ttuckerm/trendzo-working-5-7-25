'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Zap, GitBranch, Sparkles, ChevronRight, ChevronUp, ChevronDown, MoreHorizontal, Trash2, Copy, Plus, PanelRight, CheckSquare } from 'lucide-react';
import type { CanvasNode as CanvasNodeType } from '../page';
import { FIDELITY_INDEX } from '../page';

interface CanvasNodeProps {
  node: CanvasNodeType;
  isSelected: boolean;
  isAnimating?: boolean;
  config: { bg: string; border: string; color: string; label: string; icon: string };
  onMouseDown: (e: React.MouseEvent) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  parentConfig?: { bg: string; border: string; color: string; label: string; icon: string };
  stepChildCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: (parentNodeId: string) => void;
  onAddStep?: (parentNodeId: string) => void;
  stepAnimIndex?: number;
}

const ICONS: Record<string, React.ElementType> = {
  Monitor,
  Zap,
  GitBranch,
  Sparkles,
  ChevronRight,
  CheckSquare,
};

interface MenuPos {
  x: number;
  y: number;
}

export function CanvasNode({ node, isSelected, isAnimating, config, onMouseDown, onDeleteNode, onDuplicateNode, parentConfig, stepChildCount = 0, isCollapsed, onToggleCollapse, onAddStep, stepAnimIndex }: CanvasNodeProps) {
  const [hovered, setHovered] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const Icon = ICONS[config.icon] || Monitor;

  const isStep = node.node_type === 'step';
  const fidelityPercent = (FIDELITY_INDEX[node.fidelity] / 3) * 100;
  const doneCriteria = node.acceptance.filter(a => a.done).length;
  const totalCriteria = node.acceptance.length;
  const stepData = node.step_data;

  // Count filled step_data fields for completion dots
  const stepFieldsFilled = stepData ? [stepData.user_action, stepData.system_action, stepData.success_state, stepData.error_states, stepData.api_called].filter(Boolean).length : 0;

  // Close menu on click outside or scroll
  useEffect(() => {
    if (!menuPos) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPos(null);
      }
    };
    const handleScroll = () => setMenuPos(null);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuPos]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Position relative to the node's parent (canvas area)
    const nodeEl = nodeRef.current;
    if (!nodeEl) return;
    const rect = nodeEl.getBoundingClientRect();
    setMenuPos({
      x: e.clientX - rect.left + node.x,
      y: e.clientY - rect.top + node.y,
    });
  };

  const handleDotsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuPos({ x: node.x + 4, y: node.y + 38 });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuPos(null);
    onDeleteNode(node.id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuPos(null);
    onDuplicateNode(node.id);
  };

  // === Step Node Render ===
  if (isStep) {
    const accentColor = parentConfig?.color || config.border;
    const animDelay = stepAnimIndex != null ? `${stepAnimIndex * 80}ms` : undefined;
    const isAnimatingStep = stepAnimIndex != null;

    return (
      <>
        <div
          ref={nodeRef}
          onMouseDown={onMouseDown}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onContextMenu={handleContextMenu}
          className={`absolute select-none cursor-grab active:cursor-grabbing${isAnimatingStep ? ' step-animate-in' : ''}`}
          style={{
            left: node.x,
            top: node.y,
            width: 180,
            borderRadius: 12,
            background: config.bg,
            border: `${isSelected ? 2 : 1}px solid ${config.border}`,
            padding: '10px 10px 8px',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            transform: isSelected ? 'scale(1.03)' : hovered ? 'translateY(-2px)' : 'none',
            boxShadow: isSelected
              ? `0 0 16px ${accentColor}40, 0 4px 20px rgba(0,0,0,0.1)`
              : hovered
              ? `0 0 10px ${accentColor}20, 0 2px 10px rgba(0,0,0,0.06)`
              : '0 1px 6px rgba(0,0,0,0.05)',
            zIndex: isSelected ? 10 : hovered ? 5 : 1,
            animationDelay: animDelay,
          }}
        >
          {/* Left accent bar */}
          <div
            className="absolute left-0 top-3 bottom-3 rounded-r"
            style={{ width: 3, background: accentColor }}
          />

          {/* "..." hover button */}
          {hovered && !menuPos && (
            <button
              onMouseDown={handleDotsClick}
              className="absolute flex items-center justify-center rounded-md transition-colors"
              style={{ top: 4, right: 4, width: 20, height: 20, background: 'rgba(0,0,0,0.06)', color: '#888', zIndex: 20 }}
            >
              <MoreHorizontal size={11} />
            </button>
          )}

          {/* Header */}
          <div className="flex items-center gap-1.5 mb-1 pl-1.5">
            <div
              className="flex items-center justify-center shrink-0"
              style={{ width: 28, height: 28, borderRadius: '50%', background: `${accentColor}15`, color: accentColor }}
            >
              <ChevronRight size={13} />
            </div>
            <span className="text-[12px] font-semibold truncate" style={{ color: '#1a1a1a', maxWidth: 110 }}>
              {(node.title || 'Untitled').slice(0, 25)}
            </span>
          </div>

          {/* Body: first 60 chars of user_action */}
          {stepData?.user_action && (
            <p className="text-[10px] leading-tight text-gray-400 pl-1.5 mb-1.5 line-clamp-2">
              {stepData.user_action.slice(0, 60)}{stepData.user_action.length > 60 ? '...' : ''}
            </p>
          )}

          {/* Footer: completion dots */}
          <div className="flex items-center gap-1 pl-1.5">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 5, height: 5,
                  background: i < stepFieldsFilled ? accentColor : '#e2e8f0',
                }}
              />
            ))}
            <span className="text-[9px] text-gray-400 ml-1">#{node.step_number}</span>
          </div>
        </div>

        {/* Step context menu */}
        {menuPos && (
          <div ref={menuRef} className="absolute" style={{ left: menuPos.x, top: menuPos.y, zIndex: 100 }}>
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              <button
                onMouseDown={(e) => { e.stopPropagation(); setMenuPos(null); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <PanelRight size={13} className="text-gray-400" />
                Edit in Panel
              </button>
              <button
                onMouseDown={handleDelete}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={13} />
                Delete Step
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // === Feature Node Render ===
  return (
    <>
      <div
        ref={nodeRef}
        onMouseDown={onMouseDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onContextMenu={handleContextMenu}
        className={`absolute select-none cursor-grab active:cursor-grabbing${isAnimating ? ' node-animate-in' : ''}`}
        style={{
          left: node.x,
          top: node.y,
          width: 220,
          borderRadius: 16,
          background: config.bg,
          border: `${isSelected ? 2 : 1}px solid ${config.border}`,
          padding: '14px 14px 10px',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          transform: isSelected
            ? 'scale(1.02)'
            : hovered
            ? 'translateY(-3px) scale(1.01)'
            : 'none',
          boxShadow: isSelected
            ? `0 0 24px ${config.border}40, 0 8px 32px rgba(0,0,0,0.12)`
            : hovered
            ? `0 0 16px ${config.border}25, 0 4px 16px rgba(0,0,0,0.08)`
            : '0 2px 8px rgba(0,0,0,0.06)',
          zIndex: isSelected ? 10 : hovered ? 5 : 1,
        }}
      >
        {/* "..." hover button */}
        {hovered && !menuPos && (
          <button
            onMouseDown={handleDotsClick}
            className="absolute flex items-center justify-center rounded-md transition-colors"
            style={{
              top: 6,
              left: 6,
              width: 22,
              height: 22,
              background: 'rgba(0,0,0,0.06)',
              color: '#888',
              zIndex: 20,
            }}
          >
            <MoreHorizontal size={13} />
          </button>
        )}

        {/* Step number badge */}
        <div
          className="absolute flex items-center justify-center text-[10px] font-bold text-white"
          style={{
            top: -8,
            right: -8,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: config.color,
          }}
        >
          {node.step_number}
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: `${config.color}18`,
              color: config.color,
            }}
          >
            <Icon size={15} />
          </div>
          <span
            className="text-[13px] font-semibold truncate"
            style={{ color: '#1a1a1a' }}
          >
            {node.title || 'Untitled'}
          </span>
        </div>

        {/* Description */}
        {node.description && (
          <p className="text-[10.5px] leading-tight text-gray-500 mb-2 line-clamp-2">
            {node.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-1">
          <span
            className="text-[9px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: `${config.color}12`, color: config.color }}
          >
            {config.label}
          </span>
          <div className="flex items-center gap-2">
            {node.steps.length > 0 && (
              <span className="text-[9px] text-gray-400">
                {node.steps.length} step{node.steps.length !== 1 ? 's' : ''}
              </span>
            )}
            {totalCriteria > 0 && (
              <span className="text-[9px] text-gray-400">
                {doneCriteria}/{totalCriteria}
              </span>
            )}
            {/* Step children badge */}
            {stepChildCount > 0 && (
              <span
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: `${config.color}10`, color: config.color }}
              >
                {stepChildCount} step{stepChildCount !== 1 ? 's' : ''}{isCollapsed ? ' (collapsed)' : ''}
              </span>
            )}
          </div>
        </div>

        {/* XP bar */}
        <div
          className="mt-2 rounded-full overflow-hidden"
          style={{ height: 3, background: `${config.color}15` }}
        >
          <div
            className="h-full rounded-full animate-shimmer"
            style={{
              width: `${fidelityPercent}%`,
              background: `linear-gradient(90deg, ${config.color}, ${config.border})`,
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      </div>

      {/* Feature context menu */}
      {menuPos && (
        <div
          ref={menuRef}
          className="absolute"
          style={{
            left: menuPos.x,
            top: menuPos.y,
            zIndex: 100,
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
          >
            <button
              onMouseDown={handleDuplicate}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Copy size={13} className="text-gray-400" />
              Duplicate
            </button>
            {stepChildCount > 0 && onToggleCollapse && (
              <button
                onMouseDown={(e) => { e.stopPropagation(); setMenuPos(null); onToggleCollapse(node.id); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {isCollapsed ? <ChevronDown size={13} className="text-gray-400" /> : <ChevronUp size={13} className="text-gray-400" />}
                {isCollapsed ? 'Expand Steps' : 'Collapse Steps'}
              </button>
            )}
            {onAddStep && (
              <button
                onMouseDown={(e) => { e.stopPropagation(); setMenuPos(null); onAddStep(node.id); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Plus size={13} className="text-gray-400" />
                Add Step
              </button>
            )}
            <button
              onMouseDown={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </div>
      )}
    </>
  );
}
