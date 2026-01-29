"use client";

import ErrorBoundary from '@/components/ui/error-boundary';

export default function AdvancedTrendPredictionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
} 