import clsx from 'clsx';
import React, { PropsWithChildren } from 'react';

export function GlassCard({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl',
        'transition-colors duration-200 hover:bg-white/10',
        className
      )}
    >
      {children}
    </div>
  );
}


