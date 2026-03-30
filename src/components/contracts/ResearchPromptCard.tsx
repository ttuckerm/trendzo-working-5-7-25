import React from 'react';
import { CheckCircle, Activity, Clock, Lock, FileText } from 'lucide-react';

export interface ResearchPromptCardProps {
  number: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'complete';
  outputPath?: string;
}

const STATUS_CONFIG = {
  complete:    { label: 'Complete',    icon: CheckCircle,  color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/20' },
  in_progress: { label: 'In Progress', icon: Activity,     color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
  pending:     { label: 'Pending',     icon: Clock,        color: 'text-neutral-400', bg: 'bg-neutral-500/10', border: 'border-neutral-500/20' },
};

export function ResearchPromptCard({ number, title, description, status, outputPath }: ResearchPromptCardProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-4 transition-all hover:bg-white/[0.03]`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-500">#{number}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${config.border} ${config.bg} ${config.color} flex items-center gap-1`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        </div>
        {outputPath && status === 'complete' && (
          <span className="text-[10px] text-neutral-500 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Output
          </span>
        )}
      </div>
      <div className="text-sm font-medium text-neutral-200 mb-2">{title}</div>
      <div className="text-[11px] text-neutral-400 leading-relaxed">{description}</div>
      {outputPath && (
        <div className="mt-2 text-[10px] font-mono text-neutral-500 truncate">{outputPath}</div>
      )}
    </div>
  );
}
