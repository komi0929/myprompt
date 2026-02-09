"use client";

import React, { type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
          <div className="text-4xl mb-4">😵</div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">
            エラーが発生しました
          </h2>
          <p className="text-sm text-slate-500 mb-4 max-w-md">
            予期しないエラーが発生しました。ページを再読み込みしてください。
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold rounded-xl text-sm transition-colors"
          >
            ページを再読み込み
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-4 text-xs text-red-500 bg-red-50 p-3 rounded-lg max-w-lg overflow-auto text-left">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
