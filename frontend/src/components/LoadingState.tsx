import { Loader2, FileUp } from "lucide-react";

interface LoadingStateProps {
  progress?: number;
  label: string;
  fileName?: string;
}

export function LoadingState({ progress, label, fileName }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[280px] text-center animate-in fade-in zoom-in-95 duration-200">
      {/* File Upload Icon with animated pulse */}
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
        <FileUp className="h-8 w-8 text-violet-500 animate-bounce" style={{ animationDuration: "2s" }} />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-1">{label}</h3>
      {fileName && <p className="text-xs text-muted-foreground break-all max-w-[280px] mb-6">"{fileName}"</p>}

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="w-full max-w-xs">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-violet-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground font-semibold">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
        </div>
      )}

      {progress === undefined && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
          <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
          <span>Processing file...</span>
        </div>
      )}
    </div>
  );
}
