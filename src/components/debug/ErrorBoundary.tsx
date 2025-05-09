"use client";

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorBoundaryProps {
  fallback?: ReactNode;
  children: ReactNode;
  componentName?: string;
  resetCondition?: any;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showHomeButton?: boolean;
  homePath?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastReset: number;
}

/**
 * Enhanced ErrorBoundary - Catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 * Also detects potential infinite loops by tracking error frequency.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static defaultProps = {
    showHomeButton: true,
    homePath: '/dashboard-view'
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastReset: Date.now()
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Track error count and time to detect potential infinite loops
    const now = Date.now();
    const timeSinceLastError = now - this.state.lastReset;
    
    // If errors are happening rapidly, it might be an infinite loop
    const errorCount = timeSinceLastError < 1000 ? this.state.errorCount + 1 : 1;
    
    this.setState({
      error,
      errorInfo,
      errorCount,
      lastReset: now
    });
    
    // Log the error to console
    console.error(`Error in ${this.props.componentName || 'component'}:`, error, errorInfo);
    
    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log to analytics or error reporting service (if available)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
  }

  // Reset the error boundary when the reset condition changes
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.hasError &&
      prevProps.resetCondition !== this.props.resetCondition
    ) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If we hit too many errors too quickly, we might be in an infinite loop
      const potentialLoop = this.state.errorCount > 3 && (Date.now() - this.state.lastReset) < 5000;
      
      // Custom fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold mb-2">
            {this.props.componentName ? `Error in ${this.props.componentName}` : 'Something went wrong'}
          </h2>
          <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          
          {potentialLoop && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-md mb-4 text-sm text-amber-800">
              Multiple errors detected in rapid succession. This could indicate an infinite loop or rendering issue.
            </div>
          )}
          
          <div className="flex gap-3">
            <Button 
              onClick={this.resetErrorBoundary}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            {this.props.showHomeButton && (
              <Link href={this.props.homePath || "/"}>
                <Button variant="outline" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </Link>
            )}
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mt-4 p-2 border border-gray-200 rounded bg-gray-50 w-full">
              <summary className="text-xs font-medium cursor-pointer">Stack Trace</summary>
              <pre className="mt-2 text-xs overflow-auto p-2 bg-gray-100 rounded max-h-[200px] whitespace-pre-wrap">
                {this.state.error?.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
} 