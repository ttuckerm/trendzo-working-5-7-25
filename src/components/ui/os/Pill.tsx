import clsx from 'clsx';

export function Pill({ label, color = 'slate' }: { label: string; color?: 'slate' | 'green' | 'red' | 'blue' | 'purple' }) {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-700/40 text-slate-200',
    green: 'bg-emerald-600/30 text-emerald-200',
    red: 'bg-rose-600/30 text-rose-200',
    blue: 'bg-sky-600/30 text-sky-200',
    purple: 'bg-violet-600/30 text-violet-200',
  };
  return <span className={clsx('rounded-full px-2.5 py-1 text-xs', colorMap[color])}>{label}</span>;
}


