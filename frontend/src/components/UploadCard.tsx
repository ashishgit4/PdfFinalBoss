import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { uploadPDF, unlockPDF, lockPDF, convertFileToPDF, downloadConvertedPDF } from "@/services/api";
import { convertDocxToPdfBlob } from "@/services/docxConverter";
import type { UnlockFlowState } from "@/types";
import { LoadingState } from "@/components/LoadingState";
import { SuccessState } from "@/components/SuccessState";
import { PasswordDialog } from "@/components/PasswordDialog";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const CONVERT_EXTENSIONS = [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".jpg", ".jpeg", ".png", ".txt", ".csv", ".html", ".htm", ".md"];

export function UploadCard() {
  // Mode selection: "unlock", "lock", or "convert"
  const [mode, setMode] = useState<"unlock" | "lock" | "convert">("unlock");

  // Flow State
  const [file, setFile] = useState<File | null>(null);
  const [flowState, setFlowState] = useState<UnlockFlowState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileId, setFileId] = useState<string | null>(null);
  const [unlockedBlob, setUnlockedBlob] = useState<Blob | null>(null);
  const [convertedFileName, setConvertedFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Vault and auto-unlock states
  const [vaultPassword, setVaultPassword] = useState("");
  const [vaultHint, setVaultHint] = useState("");

  // Lock Configuration states
  const [lockPassword, setLockPassword] = useState("");
  const [lockHint, setLockHint] = useState("");
  const [saveToVault, setSaveToVault] = useState(true);
  const [showLockPassword, setShowLockPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analyze password strength
  const getPasswordStrength = (pass: string) => {
    if (!pass) {
      return { 
        score: 0, 
        label: "Password Strength", 
        percent: 0 
      };
    }
    
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score >= 4) {
      return { score, label: "Strong", percent: 100 };
    } else if (score >= 2) {
      return { score, label: "Medium", percent: 65 };
    } else {
      return { score, label: "Weak", percent: 30 };
    }
  };

  const generateRandomLockPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let pass = "";
    for (let i = 0; i < 16; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setLockPassword(pass);
    setShowLockPassword(true);
  };

  const handleFile = (selectedFile: File) => {
    const fileName = selectedFile.name.toLowerCase();
    const ext = "." + fileName.split(".").pop();

    if (mode === "convert") {
      if (!CONVERT_EXTENSIONS.includes(ext)) {
        toast.error("Unsupported format. Supported: Word, Excel, PPT, Images (JPG, PNG), TXT, CSV, HTML, MD.");
        return;
      }
    } else {
      // Validate PDF for unlock / lock
      if (selectedFile.type !== "application/pdf" && !fileName.endsWith(".pdf")) {
        toast.error("Unsupported file format. Please upload a PDF.");
        return;
      }
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds 100 MB limit.");
      return;
    }

    setFile(selectedFile);
    startUpload(selectedFile);
  };

  const startUpload = async (fileToUpload: File) => {
    if (mode === "convert") {
      setFlowState("converting");
      setUploadProgress(0);

      const isDocx = fileToUpload.name.toLowerCase().endsWith(".docx") || fileToUpload.name.toLowerCase().endsWith(".doc");

      if (isDocx) {
        // Attempt high-speed client-side conversion for Word documents
        try {
          const blob = await convertDocxToPdfBlob(fileToUpload, (progress) => {
            setUploadProgress(progress);
          });

          const targetName = fileToUpload.name.replace(/\.docx?$/i, "") + ".pdf";
          setConvertedFileName(targetName);
          setUnlockedBlob(blob);
          setFlowState("success");
          toast.success("Word document converted to PDF successfully!");
          return;
        } catch (clientErr) {
          console.warn("Client-side DOCX conversion fallback to server API:", clientErr);
        }
      }

      // Fallback to server API conversion
      try {
        const response = await convertFileToPDF(fileToUpload, (progress) => {
          setUploadProgress(progress);
        });

        setFileId(response.id);
        setConvertedFileName(response.originalname);

        // Retrieve converted PDF binary blob
        const blob = await downloadConvertedPDF(response.id);
        setUnlockedBlob(blob);
        setFlowState("success");
        toast.success("Document converted to PDF successfully!");
      } catch (error: any) {
        toast.error(error.message || "Conversion failed.");
        resetState();
      }
      return;
    }

    setFlowState("uploading");
    setUploadProgress(0);

    try {
      const response = await uploadPDF(fileToUpload, (progress) => {
        setUploadProgress(progress);
      });

      setFileId(response.id);

      if (mode === "lock") {
        setFlowState("lock_config");
      } else {
        if (response.encrypted) {
          // Check local vault first
          const vaultKey = "pdf_vault_" + response.pdfHash;
          const vaultItemStr = localStorage.getItem(vaultKey);
          
          if (vaultItemStr) {
            try {
              const item = JSON.parse(vaultItemStr);
              if (item && item.password) {
                setVaultPassword(item.password);
                setVaultHint(item.hint || "");
                setFlowState("vault_prompt");
                toast.info("Saved password found in vault.");
                return;
              }
            } catch (e) {
              console.error("Error parsing local vault item:", e);
            }
          }

          // If no vault entry, ask for password manually
          setFlowState("password_required");
          setIsDialogOpen(true);
          toast.info("This PDF is password protected.");
        } else {
          // PDF is not password protected. We can decrypt it directly as a blob of the uploaded file
          setUnlockedBlob(fileToUpload);
          setFlowState("success");
          toast.success("PDF is not encrypted. Ready for download!");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Upload failed.");
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
      toast.error(error.message || "Incorrect password. Please try again.");
    }
  };

  const handlePerformLock = async () => {
    if (!fileId || !lockPassword) return;

    setFlowState("unlocking");

    try {
      const { blob, hash, hint } = await lockPDF(fileId, lockPassword, lockHint, saveToVault);
      
      if (saveToVault && hash) {
        localStorage.setItem(
          "pdf_vault_" + hash,
          JSON.stringify({ password: lockPassword, hint: hint || "" })
        );
        console.log("Saved PDF password locally for hash:", hash);
      }

      setUnlockedBlob(blob);
      setFlowState("success");
      toast.success("PDF locked successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to encrypt document.");
      setFlowState("lock_config");
    }
  };

  const handleDownload = () => {
    if (!unlockedBlob || !file) return;

    const url = window.URL.createObjectURL(unlockedBlob);
    const link = document.createElement("a");
    link.href = url;
    
    let downloadName = "";
    if (mode === "convert") {
      downloadName = convertedFileName || `${file.name.substring(0, file.name.lastIndexOf('.'))}.pdf`;
    } else {
      const originalName = file.name;
      const isLockMode = mode === "lock";
      const suffix = isLockMode ? "_locked.pdf" : "_unlocked.pdf";
      downloadName = originalName.toLowerCase().endsWith(".pdf")
        ? `${originalName.substring(0, originalName.length - 4)}${suffix}`
        : `${originalName}${suffix}`;
    }

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
    setConvertedFileName("");
    setIsDialogOpen(false);
    setLockPassword("");
    setLockHint("");
    setVaultPassword("");
    setVaultHint("");
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

  const lockStrength = getPasswordStrength(lockPassword);

  return (
    <div style={{ width: "100%" }}>
      {/* Mode Selector Tabs (only shown when in idle state) */}
      {flowState === "idle" && (
        <div className="mode-tabs-container rise" style={{ animationDelay: "640ms" }}>
          <div className="ios-liquid-pill">
            <button 
              type="button"
              onClick={() => setMode("unlock")} 
              className={`liquid-tab ${mode === "unlock" ? "active" : ""}`}
              id="mode-unlock-btn"
            >
              {mode === "unlock" && (
                <motion.div
                  layoutId="active-glass-bubble"
                  className="active-glass-bg"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className="tab-content">
                <span className="tab-icon-badge">
                  <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                  </svg>
                </span>
                <span>Unlock PDF</span>
              </span>
            </button>

            <button 
              type="button"
              onClick={() => setMode("lock")} 
              className={`liquid-tab ${mode === "lock" ? "active" : ""}`}
              id="mode-lock-btn"
            >
              {mode === "lock" && (
                <motion.div
                  layoutId="active-glass-bubble"
                  className="active-glass-bg"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className="tab-content">
                <span className="tab-icon-badge">
                  <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <span>Lock PDF</span>
              </span>
            </button>

            <button 
              type="button"
              onClick={() => setMode("convert")} 
              className={`liquid-tab ${mode === "convert" ? "active" : ""}`}
              id="mode-convert-btn"
            >
              {mode === "convert" && (
                <motion.div
                  layoutId="active-glass-bubble"
                  className="active-glass-bg"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className="tab-content">
                <span className="tab-icon-badge">
                  <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                </span>
                <span>Convert to PDF</span>
              </span>
            </button>
          </div>
        </div>
      )}

      <motion.div
        className={`upload-card rise ${flowState !== "idle" ? "active-processing" : ""} ${isDragging ? "dragging" : ""}`}
        style={{ animationDelay: "700ms" }}
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
              className="card-state active"
              onClick={triggerFileSelect}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={mode === "convert" ? ".doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt,.csv,.html,.htm,.md" : ".pdf,application/pdf"}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              
              <div className="upload-icon-container">
                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>

              <h3 className="card-state-title">
                {mode === "convert" ? "Drop files to convert to PDF" : mode === "lock" ? "Drop PDF to encrypt" : "Drop your PDF here"}
              </h3>
              <p className="card-state-subtitle">
                or <span className="browse-link">Browse Files</span>
              </p>

              <div className="card-state-footer">
                {mode === "convert" ? (
                  <span>Word • Excel • PPT • Images • TXT • CSV • HTML • MD</span>
                ) : (
                  <>
                    <span>PDF only</span>
                    <span>•</span>
                    <span>Max 100 MB</span>
                  </>
                )}
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
                label="Uploading..."
                fileName={file?.name}
              />
            </motion.div>
          )}

          {/* STATE 2.5: Converting */}
          {flowState === "converting" && (
            <motion.div
              key="converting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingState
                progress={uploadProgress}
                label="Converting document to PDF..."
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
              className="card-state active"
            >
              <div className="upload-icon-container lock-badge">
                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3 className="card-state-title">Document Encrypted</h3>
              <p className="card-state-subtitle" id="locked-sub-text">
                This file is password protected.
              </p>
              
              <div id="manual-password-trigger" className="flex flex-col gap-3">
                <button 
                  className="cta-pill" 
                  onClick={() => setIsDialogOpen(true)}
                >
                  <span>Enter Password</span>
                </button>
                <button 
                  className="link-btn" 
                  onClick={resetState}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE 4: Unlocking/Encrypting */}
          {flowState === "unlocking" && (
            <motion.div
              key="unlocking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingState
                label={mode === "lock" ? "Encrypting document..." : "Decrypting document..."}
                fileName={file?.name}
              />
            </motion.div>
          )}

          {/* STATE 5: Vault Auto-Unlock Prompt */}
          {flowState === "vault_prompt" && (
            <motion.div
              key="vault_prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card-state active"
            >
              <div className="upload-icon-container lock-badge">
                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3 className="card-state-title">Document Encrypted</h3>
              <p className="card-state-subtitle" id="locked-sub-text">
                {vaultHint ? `Hint: ${vaultHint}` : "This file is password protected."}
              </p>
              
              <div className="vault-prompt">
                <p className="vault-prompt-text">A saved password exists for this PDF.</p>
                <button 
                  className="cta-pill" 
                  onClick={() => handlePasswordSubmit(vaultPassword)}
                  style={{ marginBottom: "8px" }}
                >
                  <span>Auto Unlock</span>
                </button>
                <button 
                  className="link-btn" 
                  onClick={() => {
                    setFlowState("password_required");
                    setIsDialogOpen(true);
                  }}
                >
                  Or enter manually
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE 6: Lock Configuration */}
          {flowState === "lock_config" && (
            <motion.div
              key="lock_config"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card-state active"
            >
              <div className="upload-icon-container lock-badge">
                <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3 className="card-state-title">Encrypt PDF</h3>
              <p className="card-state-subtitle truncate max-w-xs px-4" id="lock-filename">
                {file?.name}
              </p>

              <div className="lock-fields">
                <div className="lock-pass-wrapper">
                  <input
                    type={showLockPassword ? "text" : "password"}
                    id="lock-password"
                    placeholder="Choose Password"
                    value={lockPassword}
                    onChange={(e) => setLockPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowLockPassword(!showLockPassword)}
                  >
                    <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                </div>

                <div className="strength-meter">
                  <div 
                    className="strength-bar" 
                    style={{ 
                      width: `${lockStrength.percent}%`,
                      background: lockStrength.score >= 4 ? '#10b981' : lockStrength.score >= 2 ? '#fbbf24' : '#ef4444'
                    }} 
                  />
                  <div 
                    className="strength-text"
                    style={{
                      color: lockStrength.score >= 4 ? '#10b981' : lockStrength.score >= 2 ? '#fbbf24' : '#ef4444'
                    }}
                  >
                    {lockPassword ? `Strength: ${lockStrength.label}` : "Password Strength"}
                  </div>
                </div>

                <button 
                  className="btn-generate" 
                  onClick={(e) => {
                    e.stopPropagation();
                    generateRandomLockPassword();
                  }}
                >
                  <span>Generate Secure Password</span>
                </button>

                <input
                  type="text"
                  id="lock-hint"
                  placeholder="Password Hint (Optional)"
                  value={lockHint}
                  onChange={(e) => setLockHint(e.target.value)}
                  autoComplete="off"
                />

                <div className="vault-checkbox-wrapper" id="vault-save-wrapper">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      id="lock-save-vault"
                      checked={saveToVault}
                      onChange={(e) => setSaveToVault(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    <span className="checkbox-label">Remember this password in my vault</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full max-w-[320px]">
                <button 
                  className="cta-pill" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePerformLock();
                  }}
                  disabled={lockStrength.score < 2 || !lockPassword}
                  style={{ 
                    opacity: (lockStrength.score < 2 || !lockPassword) ? 0.4 : 1, 
                    cursor: (lockStrength.score < 2 || !lockPassword) ? 'not-allowed' : 'pointer',
                    width: "100%",
                    justifyContent: "center"
                  }}
                >
                  <span>Lock Document</span>
                </button>
                <button 
                  className="link-btn" 
                  onClick={resetState}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE 7: Success */}
          {flowState === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SuccessState
                fileName={
                  mode === "convert"
                    ? (convertedFileName || (file?.name ? `${file.name.substring(0, file.name.lastIndexOf('.'))}.pdf` : "converted.pdf"))
                    : file?.name 
                      ? file.name.toLowerCase().endsWith(".pdf")
                        ? `${file.name.substring(0, file.name.length - 4)}${mode === "lock" ? "_locked.pdf" : "_unlocked.pdf"}`
                        : `${file.name}${mode === "lock" ? "_locked.pdf" : "_unlocked.pdf"}`
                      : mode === "lock" ? "locked.pdf" : "unlocked.pdf"
                }
                onDownload={handleDownload}
                onReset={resetState}
                isLockMode={mode === "lock"}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Password Modal Dialog Fallback */}
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
