"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Link from 'next/link';
// Crashlytics temporarily disabled

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Crashlytics temporarily disabled - just log to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-700 mb-4">
              There was an error loading this page. This is likely due to a development mode authentication issue.
            </p>
            
            {this.state.error && (
              <div className="bg-gray-100 p-3 rounded mb-4 overflow-auto max-h-40 text-sm">
                <p className="font-mono text-red-500">{this.state.error.toString()}</p>
              </div>
            )}
            
            <div className="flex flex-col space-y-3">
              <Link 
                href="/"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-center"
              >
                Go to Home Page
              </Link>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded"
              >
                Try Again
              </button>
              
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded"
              >
                Reset Error Boundary
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;