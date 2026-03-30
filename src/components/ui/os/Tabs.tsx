"use client";

import clsx from 'clsx';

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={clsx(
            'px-3 py-1.5 text-xs rounded-full transition-colors',
            t.id === active ? 'bg-white/20 text-white' : 'text-zinc-300 hover:bg-white/10'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}


