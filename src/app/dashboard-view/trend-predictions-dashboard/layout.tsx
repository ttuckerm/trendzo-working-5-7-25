"use client";

import { Suspense } from 'react';
import ErrorBoundary from '@/components/ui/error-boundary';
import LoadingFallback from '@/components/ui/LoadingFallback';

export default function TrendPredictionsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback loadingMessage="Loading trend predictions dashboard..." />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
} 