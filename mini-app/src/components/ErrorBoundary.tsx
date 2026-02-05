import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 min-h-screen flex flex-col items-center justify-center text-red-900">
          <h1 className="text-2xl font-bold mb-4">Something went wrong 😓</h1>
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm w-full overflow-auto">
            <p className="font-bold text-red-600 mb-2">
              {this.state.error && this.state.error.toString()}
            </p>
            <details className="text-xs text-slate-500 whitespace-pre-wrap">
              {this.state.errorInfo?.componentStack}
            </details>
          </div>
          <button
            className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg font-bold"
            onClick={() => window.location.reload()}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
