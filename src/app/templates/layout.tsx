"use client";

import ErrorBoundary from '@/components/ui/error-boundary';

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
} 