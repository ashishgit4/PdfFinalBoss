import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  // Reset local state when dialog closes/reopens
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-border/40 bg-card/95 backdrop-blur-lg">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-500 border border-violet-500/20">
            <Lock className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">Password Required</DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground break-all px-2">
            The file "{fileName}" is encrypted. Enter the password to decrypt and download.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter PDF password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10 h-11 rounded-xl border-border/60 bg-muted/20 focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500"
              disabled={isUnlocking}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
              disabled={isUnlocking}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button
              type="submit"
              disabled={isUnlocking || !password}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 hover:from-rose-600 hover:to-violet-700 text-white font-semibold transition-all shadow-md shadow-violet-500/10 cursor-pointer"
            >
              {isUnlocking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Unlocking...
                </>
              ) : (
                "Unlock PDF"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
