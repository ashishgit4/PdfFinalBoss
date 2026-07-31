import { useEffect } from "react";
import confetti from "canvas-confetti";

interface SuccessStateProps {
  fileName: string;
  onDownload: () => void;
  onReset: () => void;
  isLockMode?: boolean;
}

export function SuccessState({ fileName, onDownload, onReset, isLockMode = false }: SuccessStateProps) {
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
    <div className="card-state active flex flex-col items-center justify-center p-10 text-center animate-in fade-in zoom-in-95 duration-200">
      <div className="upload-icon-container success-badge">
        <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      <h3 className="card-state-title">
        {isLockMode ? "PDF successfully locked!" : "PDF successfully unlocked!"}
      </h3>
      <p className="card-state-subtitle truncate max-w-xs px-4" title={fileName}>
        {fileName}
      </p>
      <div className="success-actions flex flex-col items-center gap-4 w-full">
        <button className="cta-pill" onClick={onDownload}>
          <span>Download PDF</span>
        </button>
        <button className="link-btn" onClick={onReset}>
          {isLockMode ? "Lock Another" : "Unlock Another"}
        </button>
      </div>
    </div>
  );
}
