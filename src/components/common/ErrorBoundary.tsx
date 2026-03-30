"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { showToast } from "@/components/ui/use-toast";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    try {
      const source = this.props.name ? ` in ${this.props.name}` : "";
      showToast({
        title: "Something went wrong",
        description: `${error.message}${source}`.slice(0, 180),
        variant: "destructive",
        duration: 4000,
      });
      // also announce via live region if available
      (window as any).__miniui_announce?.("An error occurred; showing fallback");
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", error, errorInfo);
    } catch {}
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div role="alert" className="p-4 border border-white/10 bg-white/5 rounded-md text-sm text-zinc-200">
          <div className="font-medium text-white">Panel failed to render</div>
          {this.state.error && (
            <div className="mt-1 text-xs text-zinc-400 break-words">{String(this.state.error.message || this.state.error)}</div>
          )}
          <button
            className="mt-2 inline-flex items-center justify-center rounded border border-white/10 bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20"
            onClick={this.handleRetry}
          >Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}


