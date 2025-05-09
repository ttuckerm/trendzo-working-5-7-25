"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { forceReinitializeComponents } from '@/lib/utils/component-fix';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of the crashed component.
 * 
 * This is especially useful for handling React errors like "removeChild" that 
 * might crash the entire application.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    
    this.setState({
      errorInfo
    });
  }
  
  handleReset = (): void => {
    // Try to fix component issues
    if (typeof window !== 'undefined') {
      forceReinitializeComponents();
    }
    
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }
  
  handleGoHome = (): void => {
    // Navigate to home page
    window.location.href = '/';
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <div className="bg-red-100 text-red-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            
            <p className="text-gray-700 mb-6">
              We encountered an error while rendering this page. 
              {this.state.error && (
                <span className="block text-sm text-red-600 mt-2">
                  {this.state.error.toString()}
                </span>
              )}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={this.handleReset}
                className="mb-2 sm:mb-0"
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={this.handleGoHome}
              >
                Go to Home Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 