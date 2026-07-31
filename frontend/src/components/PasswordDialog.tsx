import { useState, useEffect } from "react";

interface PasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => void;
  isUnlocking: boolean;
  fileName: string;
}

export function PasswordDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  isUnlocking,
  fileName,
}: PasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPassword("");
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isUnlocking) return;
    onSubmit(password);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop active" onClick={() => onOpenChange(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <div className="modal-lock-circle">
              <svg className="modal-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3 className="modal-title">Password Required</h3>
            <p className="modal-subtitle">{fileName}</p>
          </div>
          
          <div className="password-input-wrapper">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Enter PDF password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isUnlocking}
              autoFocus
              required
            />
            <button 
              type="button" 
              className="eye-btn" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ opacity: showPassword ? 1 : 0.4 }}
            >
              <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          
          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={() => onOpenChange(false)}
              disabled={isUnlocking}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit" 
              disabled={isUnlocking || !password}
            >
              {isUnlocking ? "Unlocking..." : "Unlock PDF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
