"use client";

import ErrorBoundary from '@/components/ui/error-boundary';

export default function DashboardTrendPredictionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
} 