import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error Boundary Exception:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#090909] text-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-[#111111] border border-white/10 p-8 rounded-[28px] shadow-2xl flex flex-col items-center">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Something went wrong</h2>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              An unexpected error occurred while rendering the page. Don't worry, your files remain completely private and safe.
            </p>

            <Button 
              onClick={this.handleReset}
              className="w-full h-11 bg-white hover:bg-zinc-100 text-zinc-950 font-semibold rounded-full border-0 cursor-pointer text-sm"
            >
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
