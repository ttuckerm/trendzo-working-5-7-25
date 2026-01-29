"use client";

import clsx from 'clsx';
import React from 'react';

export function Button({
  className,
  children,
  variant = 'default',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'ghost' | 'outline' }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
        'focus:outline-none focus-visible:ring-2 ring-purple-500/50',
        variant === 'default' && 'bg-white/10 hover:bg-white/20 text-white border border-white/10',
        variant === 'ghost' && 'bg-transparent hover:bg-white/10 text-zinc-200',
        variant === 'outline' && 'border border-white/15 hover:bg-white/10 text-zinc-100',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}


