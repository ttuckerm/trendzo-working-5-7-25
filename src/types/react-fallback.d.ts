// Restores legacy React namespace types for code that still uses React.ReactNode / React.FC
import type { ReactNode as _ReactNode, FC as _FC } from 'react';

declare global {
  namespace React {
    // Map legacy names to modern type imports
    type ReactNode = _ReactNode;
    type FC<P = {}> = _FC<P>;
  }
}
export {};
