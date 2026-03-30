"use client";

import { useWindowsStore } from '@/lib/state/windowStore';
import { BookOpen, ActivitySquare, LineChart } from 'lucide-react';
import clsx from 'clsx';

export function Dock() {
  const open = useWindowsStore((s) => s.open);

  const DockButton = ({
    label,
    icon: Icon,
    active,
    disabled,
    onClick,
  }: {
    label: string;
    icon: any;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
  }) => (
    <button
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'group relative flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
        'backdrop-blur-md bg-white/5 border border-white/10 shadow-lg',
        'hover:bg-white/10 focus:outline-none',
        disabled && 'opacity-40 cursor-not-allowed',
        active && 'ring-2 ring-purple-500/60'
      )}
      aria-label={label}
      title={label}
    >
      <Icon className={clsx('h-6 w-6', active ? 'text-purple-300' : 'text-zinc-300 group-hover:text-white')} />
    </button>
  );

  return (
    <div className="pointer-events-auto fixed right-4 top-1/2 z-[1000] -translate-y-1/2">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
        <DockButton label="Recipe Book" icon={BookOpen} active onClick={() => open('recipeBook')} />
        <DockButton label="Analyzer" icon={ActivitySquare} disabled />
        <DockButton label="Predictor" icon={LineChart} disabled />
      </div>
    </div>
  );
}


