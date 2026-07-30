import { useState, useRef } from "react";
import { FileUp, FileWarning } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { uploadPDF, unlockPDF } from "@/services/api";
import type { UnlockFlowState } from "@/types";
import { LoadingState } from "@/components/LoadingState";
import { SuccessState } from "@/components/SuccessState";
import { PasswordDialog } from "@/components/PasswordDialog";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function UploadCard() {
  const [file, setFile] = useState<File | null>(null);
  const [flowState, setFlowState] = useState<UnlockFlowState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileId, setFileId] = useState<string | null>(null);
  const [unlockedBlob, setUnlockedBlob] = useState<Blob | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    // Validate file type
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Unsupported file format. Please upload a PDF file.");
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("File is too large. Maximum file size is 100 MB.");
      return;
    }

    setFile(selectedFile);
    startUpload(selectedFile);
  };

  const startUpload = async (fileToUpload: File) => {
    setFlowState("uploading");
    setUploadProgress(0);

    try {
      const response = await uploadPDF(fileToUpload, (progress) => {
        setUploadProgress(progress);
      });

      setFileId(response.id);

      if (response.encrypted) {
        setFlowState("password_required");
        setIsDialogOpen(true);
        toast.info("This PDF is password protected. Password required.");
      } else {
        // PDF is not password protected. We can decrypt it directly as a blob of the uploaded file
        setUnlockedBlob(fileToUpload);
        setFlowState("success");
        toast.success("PDF is not encrypted. Ready for download!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload PDF. Please try again.");
      resetState();
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!fileId) return;

    setFlowState("unlocking");

    try {
      const blob = await unlockPDF(fileId, password);
      setUnlockedBlob(blob);
      setIsDialogOpen(false);
      setFlowState("success");
      toast.success("PDF unlocked successfully!");
    } catch (error: any) {
      setFlowState("password_required");
      setIsDialogOpen(true);
      toast.error(error.message || "Wrong password. Please try again.");
    }
  };

  const handleDownload = () => {
    if (!unlockedBlob || !file) return;

    const url = window.URL.createObjectURL(unlockedBlob);
    const link = document.createElement("a");
    link.href = url;
    
    // Add "unlocked_" prefix to the file name
    const originalName = file.name;
    const downloadName = originalName.toLowerCase().endsWith(".pdf")
      ? `${originalName.substring(0, originalName.length - 4)}_unlocked.pdf`
      : `${originalName}_unlocked.pdf`;

    link.setAttribute("download", downloadName);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success("Download started!");
  };

  const resetState = () => {
    setFile(null);
    setFlowState("idle");
    setUploadProgress(0);
    setFileId(null);
    setUnlockedBlob(null);
    setIsDialogOpen(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        className="rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md shadow-2xl overflow-hidden"
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <AnimatePresence mode="wait">
          {/* STATE 1: Idle (Drop Zone) */}
          {flowState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`p-10 text-center flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed rounded-3xl transition-colors cursor-pointer ${
                isDragging
                  ? "border-violet-500 bg-violet-500/5"
                  : "border-border/50 hover:border-border hover:bg-muted/10"
              }`}
              onClick={triggerFileSelect}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 border border-border text-muted-foreground shadow-inner">
                <FileUp className="h-8 w-8 text-foreground/75" />
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2">
                Drop your PDF here
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                or <span className="text-primary font-semibold underline decoration-2 underline-offset-4 hover:text-primary/95">Browse Files</span>
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground/80 font-medium">
                <span>Supported: <strong>PDF files only</strong></span>
                <span className="hidden sm:inline text-border/60">•</span>
                <span>Maximum size: <strong>100 MB</strong></span>
              </div>
            </motion.div>
          )}

          {/* STATE 2: Uploading */}
          {flowState === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingState
                progress={uploadProgress}
                label="Uploading your file"
                fileName={file?.name}
              />
            </motion.div>
          )}

          {/* STATE 3: Password Required */}
          {flowState === "password_required" && (
            <motion.div
              key="password_required"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-10 text-center flex flex-col items-center justify-center min-h-[300px]"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <FileWarning className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Password Protected PDF</h3>
              <p className="text-sm text-muted-foreground mb-6 break-all max-w-sm">
                "{file?.name}" requires password decryption to be unlocked.
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="h-11 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 hover:from-rose-600 hover:to-violet-700 text-white font-bold px-6 shadow-md shadow-violet-500/10 cursor-pointer"
              >
                Enter Password
              </Button>
            </motion.div>
          )}

          {/* STATE 4: Unlocking */}
          {flowState === "unlocking" && (
            <motion.div
              key="unlocking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingState
                label="Decrypting PDF document"
                fileName={file?.name}
              />
            </motion.div>
          )}

          {/* STATE 5: Success */}
          {flowState === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SuccessState
                fileName={file?.name || "unlocked.pdf"}
                onDownload={handleDownload}
                onReset={resetState}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Trust Badges */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground/80">
          <span className="text-emerald-500 font-extrabold">✓</span>
          <span>Secure Processing</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground/80">
          <span className="text-emerald-500 font-extrabold">✓</span>
          <span>No Registration</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground/80">
          <span className="text-emerald-500 font-extrabold">✓</span>
          <span>Free Forever</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground/80">
          <span className="text-emerald-500 font-extrabold">✓</span>
          <span>Fast Unlock</span>
        </div>
      </div>

      {/* Password Modal Trigger */}
      <PasswordDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handlePasswordSubmit}
        isUnlocking={flowState === "unlocking"}
        fileName={file?.name || "PDF Document"}
      />
    </div>
  );
}
