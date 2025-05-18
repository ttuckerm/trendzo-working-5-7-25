"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { forceReinitializeComponents } from '@/lib/utils/component-fix';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  attemptCount: number;
  isFatal: boolean;
}

/**
 * Enhanced ErrorBoundary component catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of the crashed component.
 * 
 * This version includes additional recovery mechanisms to handle component loading issues
 * and automatic retries for non-fatal errors.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      attemptCount: 0,
      isFatal: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      attemptCount: 1
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Check if this is a fatal error that shouldn't auto-retry
    const isFatal = this.isErrorFatal(error);
    
    // Log the error to console and set state
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    
    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    this.setState({
      errorInfo,
      isFatal
    });
    
    // For non-fatal errors, automatically attempt recovery once
    if (!isFatal && this.state.attemptCount <= 1) {
      setTimeout(() => {
        this.handleReset();
      }, 1000);
    }
  }
  
  /**
   * Determine if an error is fatal and shouldn't be auto-recovered
   */
  isErrorFatal(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    
    // Fatal errors that shouldn't auto-retry
    const fatalPatterns = [
      "memory leak",
      "out of memory",
      "stack overflow",
      "maximum call stack",
      "cannot read property",
      "invalid hook call"
    ];
    
    // Check if any fatal patterns are in the error message
    return fatalPatterns.some(pattern => errorMessage.includes(pattern));
  }
  
  /**
   * Reset error state and attempt component recovery
   */
  handleReset = (): void => {
    // Try to fix component issues
    if (typeof window !== 'undefined') {
      forceReinitializeComponents();
    }
    
    // Reset error state and increment attempt count
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      attemptCount: prevState.attemptCount + 1
    }));
  }
  
  /**
   * Go to home page as a last resort
   */
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
            
            <p className="text-gray-700 mb-4">
              {this.state.attemptCount > 1 
                ? "We've tried to fix this automatically but still encountered an error." 
                : "We encountered an error while rendering this page."}
            </p>
            
            {this.state.error && (
              <div className="text-sm text-red-600 mb-6 p-2 border border-red-200 bg-red-50 rounded">
                <p className="font-medium">Error details:</p>
                <p className="break-words">{this.state.error.toString()}</p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={this.handleReset}
                className="mb-2 sm:mb-0"
                disabled={this.state.attemptCount > 3}
              >
                {this.state.attemptCount > 3 ? "Too Many Attempts" : "Try Again"}
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