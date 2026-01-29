// src/app/sandbox/viral-lab-v2/layout.tsx
'use client';

import React from 'react';
import { GlobalStateProvider } from '@/context/GlobalState';

export default function SandboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalStateProvider>
      {children}
    </GlobalStateProvider>
  );
}
