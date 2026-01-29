import type { ReactNode as _ReactNode, FC as _FC } from 'react';
declare global {
  namespace React {
    // Allows legacy `React.ReactNode` / `React.FC` references to type-check
    type ReactNode = _ReactNode;
    type FC<P = {}> = _FC<P>;
  }
}
export {};




