import { useEffect } from "react";
import { CheckCircle2, Download, RefreshCw, FileCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";

interface SuccessStateProps {
  fileName: string;
  onDownload: () => void;
  onReset: () => void;
}

export function SuccessState({ fileName, onDownload, onReset }: SuccessStateProps) {
  useEffect(() => {
    // Fire beautiful confetti burst
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[300px] text-center animate-in fade-in zoom-in-95 duration-200">
      {/* Circle check icon with smooth shadow */}
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
      </div>

      <h3 className="text-xl font-bold text-foreground mb-1">PDF successfully unlocked!</h3>
      <div className="flex items-center gap-1.5 justify-center max-w-[320px] mb-8 bg-muted/30 px-3 py-1.5 rounded-full border border-border/20">
        <FileCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground truncate max-w-[220px]" title={fileName}>
          {fileName}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs justify-center">
        <Button
          onClick={onDownload}
          className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-500/10 gap-2 cursor-pointer"
        >
          <Download className="h-4 w-4" /> Download PDF
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          className="flex-1 h-11 rounded-xl border-border hover:bg-muted/50 font-bold gap-2 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" /> Unlock Another
        </Button>
      </div>
    </div>
  );
}
