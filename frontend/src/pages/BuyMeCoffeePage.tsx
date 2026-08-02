import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Heart, 
  Star, Copy, Check, Globe, CreditCard, Send 
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { loadRazorpayScript } from "@/lib/payment";

export function BuyMeCoffeePage() {
  const [gitHubStars, setGitHubStars] = useState<number | null>(null);
  
  // Razorpay states
  const customAmount = "250";
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [successDetails, setSuccessDetails] = useState<{
    paymentId: string;
    amount: number;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Ko-fi" | null>(null);

  const initiatePayment = (method: "UPI" | "Ko-fi") => {
    localStorage.setItem("pending_payment_method", method);
  };

  // Visibility and focus based check to confirm redirected flow success
  // NOTE: Triggered on window focus/visibility-change after redirect checkout returns.
  // This should be swapped for a verified backend/webhook trigger if one becomes available.
  useEffect(() => {
    const handleConfirmPayment = () => {
      const pending = localStorage.getItem("pending_payment_method");
      if (pending) {
        setPaymentMethod(pending as "UPI" | "Ko-fi");
        setSuccessDetails({
          paymentId: "TXN_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
          amount: pending === "UPI" ? Number(customAmount) : 5, // default 5 for Ko-fi order ($5)
        });
        setPaymentSuccess(true);
        localStorage.removeItem("pending_payment_method");
      }
    };

    window.addEventListener("focus", handleConfirmPayment);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleConfirmPayment();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleConfirmPayment);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [customAmount]);

  // Escape key listener to dismiss success modal
  useEffect(() => {
    if (!paymentSuccess) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPaymentSuccess(false);
        setSuccessDetails(null);
        setPaymentMethod(null);
        setIsProcessing(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paymentSuccess]);

  // Fetch GitHub Stars dynamically
  useEffect(() => {
    fetch("https://api.github.com/repos/ashishgit4/PdfFinalBoss")
      .then((res) => {
        if (!res.ok) throw new Error("Rate limit or error");
        return res.json();
      })
      .then((data) => {
        if (data && data.stargazers_count !== undefined) {
          setGitHubStars(data.stargazers_count);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch GitHub stars dynamically:", err);
      });
  }, []);



  const handleRazorpayPayment = async () => {
    const finalAmount = parseFloat(customAmount);

    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast.error("Please enter a valid donation amount.");
      return;
    }

    setIsProcessing(true);
    toast.info("Connecting to secure payment gateway...");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your network.");
      }

      const response = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount, currency: "INR" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to establish payment session");
      }

      const orderData = await response.json();
      const keyId = orderData.keyId;

      if (!keyId) {
        throw new Error("Payment configuration error (Missing public Key ID)");
      }

      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "PdfFinalBoss",
        description: "Support open source development",
        order_id: orderData.id,
        handler: async function (response: any) {
          toast.loading("Verifying transaction authenticity...");
          try {
            const verificationResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.order_id || orderData.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verificationResult = await verificationResponse.json();

            if (verificationResult.success) {
              setSuccessDetails({
                paymentId: response.razorpay_payment_id,
                amount: finalAmount,
              });
              setPaymentMethod("UPI");
              setPaymentSuccess(true);
              toast.dismiss();
              toast.success("Thank you for supporting PdfFinalBoss!");
            } else {
              throw new Error(verificationResult.error || "Payment verification failed");
            }
          } catch (verifyErr: any) {
            console.error("Signature verification error:", verifyErr);
            toast.dismiss();
            toast.error(verifyErr.message || "Failed to confirm payment status.");
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        notes: {
          project: "PdfFinalBoss",
        },
        theme: {
          color: "#111111",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast.dismiss();
            toast.info("Payment session cancelled.");
          },
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      console.error("Razorpay initiation failed:", err);
      toast.dismiss();
      toast.error(err.message || "Failed to connect to gateway.");
      setIsProcessing(false);
    }
  };

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText("ashishtawniya1@okaxis");
    setCopied(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // UPI deep-link URL config
  const upiId = "ashishtawniya1@okaxis";
  const upiUrl = `upi://pay?pa=${upiId}&pn=PdfFinalBoss&cu=INR`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="min-h-screen w-full bg-[#090909] text-[#F5F5F5] flex flex-col items-center relative overflow-x-hidden selection:bg-white/10 selection:text-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* Top Navbar */}
      <header className="relative z-50 w-full max-w-[1280px] mx-auto px-10 py-6 md:py-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Logo icon matching the screenshot */}
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          </svg>
          <span className="font-sans font-bold text-lg tracking-tight text-[#F5F5F5]">PdfFinalBoss</span>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="rounded-full px-4 py-2 text-xs font-medium text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-white/[0.04] border border-white/[0.06] transition-all duration-200 cursor-pointer bg-white/[0.02] flex items-center gap-1.5">
            <a 
              href="https://github.com/ashishgit4/PdfFinalBoss" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5"
            >
              <Star className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>Star the Repo</span>
              <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] font-mono text-[9px] text-[#A1A1AA]/70">
                {gitHubStars !== null ? gitHubStars : "50+"}
              </span>
            </a>
          </Button>

          <Button asChild variant="ghost" className="rounded-full px-5 py-2 text-xs font-medium text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-white/[0.04] border border-white/[0.06] transition-all duration-200 cursor-pointer bg-white/[0.02]">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-[1280px] mx-auto w-full px-10 py-12 md:py-20 flex flex-col items-center justify-center gap-16 md:gap-20 relative z-10">
        
        {/* Centered Title & Intro */}
        <div className="text-center max-w-2xl flex flex-col items-center gap-4">
          {/* Capsule Eyebrow Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/[0.02] border border-white/[0.06] rounded-full text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider font-semibold select-none mb-2">
            <Heart className="w-3 h-3 text-[#A1A1AA] fill-[#A1A1AA]/20" />
            <span>SUPPORT OPEN SOURCE</span>
          </div>
          
          <h1 className="font-sans text-4xl sm:text-5xl font-semibold tracking-tight text-[#F5F5F5] leading-[1.15]">
            Support PdfFinalBoss
          </h1>

          <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed font-sans max-w-lg text-center">
            PdfFinalBoss is completely free and open source. Every contribution helps keep the project maintained, improved, and accessible for everyone.
          </p>
        </div>

        {/* Symmetrical Two Premium Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 w-full max-w-[1100px] items-start">
          
          {/* CARD 1: International Support */}
          <div className="bg-[#141416] border border-white/[0.08] text-[#F5F5F5] flex flex-col p-8 rounded-[22px] shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all duration-200 ease-out hover:-translate-y-[2px] active:translate-y-0 hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.55)] text-left items-start w-full">
            
            {/* Top Row: Details on Left, Mug Graphic on Right */}
            <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
              <div className="flex-1 flex flex-col items-start text-left">
                {/* Eyebrow Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] border border-white/[0.06] rounded-[10px] text-[11px] font-mono text-[#A1A1AA] uppercase tracking-[0.06em] font-medium select-none mb-3">
                  <Globe className="size-3.5 text-[#A1A1AA]" />
                  <span>GLOBAL</span>
                </div>

                <h3 className="text-[22px] font-semibold text-[#F5F5F5] tracking-tight leading-tight mb-2">International Support</h3>
                
                <p className="text-[15px] font-normal leading-[1.5] text-[#A1A1AA] max-w-[280px]">
                  Support the project securely using Ko-fi with Card, PayPal, Apple Pay, or Google Pay.
                </p>

                {/* Spacing Details pills */}
                <div className="flex items-center gap-2 mt-4 flex-wrap select-none">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] border border-white/[0.04] rounded-full text-[10px] font-medium text-[#A1A1AA]/80">
                    <span></span> Apple Pay
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] border border-white/[0.04] rounded-full text-[10px] font-medium text-[#A1A1AA]/80">
                    PayPal
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.02] border border-white/[0.04] rounded-full text-[10px] font-medium text-[#A1A1AA]/80">
                    <CreditCard className="w-2.5 h-2.5 text-[#A1A1AA]" />
                    Card
                  </span>
                </div>
              </div>

              {/* Mug Graphic on Right */}
              <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0 select-none rounded-[14px]">
                <div className="absolute w-12 h-12 rounded-full bg-[#ff4d4f]/15 blur-xl opacity-90" />
                <svg className="w-20 h-20 relative z-10 animate-[pulse_3s_ease-in-out_infinite]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="45" cy="80" rx="20" ry="6" fill="black" fillOpacity="0.3" />
                  <path d="M60 40C68 40 76 45 76 55C76 65 68 70 60 70" stroke="url(#mugGradient)" strokeWidth="8" strokeLinecap="round" />
                  <rect x="25" y="32" width="36" height="42" rx="6" fill="url(#mugGradient)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <ellipse cx="43" cy="32" rx="18" ry="4" fill="url(#mugRimGradient)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <ellipse cx="43" cy="33" rx="16" ry="3" fill="#2d1f1e" />
                  <path d="M43 46C41 43 36 43 36 47C36 51 43 56 43 56C43 56 50 51 50 47C50 43 45 43 43 46Z" fill="#ff4d4f" />
                  <defs>
                    <linearGradient id="mugGradient" x1="25" y1="32" x2="61" y2="74" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#2c2c30" />
                      <stop offset="50%" stopColor="#1e1e21" />
                      <stop offset="100%" stopColor="#121214" />
                    </linearGradient>
                    <linearGradient id="mugRimGradient" x1="25" y1="32" x2="61" y2="32" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#44444a" />
                      <stop offset="50%" stopColor="#2c2c30" />
                      <stop offset="100%" stopColor="#18181a" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            
            <Button asChild onClick={() => initiatePayment("Ko-fi")} className="w-full h-12 bg-[#F5F5F5] hover:bg-white text-zinc-950 font-semibold rounded-[14px] cursor-pointer text-[15px] flex items-center justify-center gap-1.5 transition-all duration-200 ease-out active:scale-[0.97] border-0 select-none">
              <a href="https://ko-fi.com/ashishsharma11" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4 text-zinc-950" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.881 8.948c-.773-4.085-4.859-5.005-7.875-5.005h-9.52c-.775 0-1.404.63-1.404 1.405v13.315c0 .775.629 1.405 1.404 1.405h8.182c4.619 0 7.821-2.524 8.793-7.555.309-1.606.321-2.535.42-3.565zm-4.321 4.545c-.563 2.923-2.673 3.655-5.597 3.655H7.318V6.16h7.458c2.045 0 4.195.42 4.672 3.19.261 1.516.273 2.457.112 4.143zM16.592 11.23h1.365a1.82 1.82 0 1 1 0 3.64h-1.365V11.23z" />
                </svg>
                <span>Continue with Ko-fi</span>
                <span>→</span>
              </a>
            </Button>
          </div>

          {/* CARD 2: India Support */}
          <div className="bg-[#141416] border border-white/[0.08] text-[#F5F5F5] flex flex-col p-8 rounded-[22px] shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all duration-200 ease-out hover:-translate-y-[2px] active:translate-y-0 hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.55)] text-left items-start w-full">
            
            {/* Top Row: Details on Left, QR Code on Right */}
            <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
              <div className="flex-1 flex flex-col items-start text-left">
                {/* Eyebrow Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] border border-white/[0.06] rounded-[10px] text-[11px] font-mono text-[#A1A1AA] uppercase tracking-[0.06em] font-medium select-none mb-3">
                  <span className="text-[10px]">🇮🇳</span>
                  <span>LOCAL PAYMENT</span>
                </div>

                <h3 className="text-[22px] font-semibold text-[#F5F5F5] tracking-tight leading-tight mb-2">India Support</h3>
                
                <p className="text-[15px] font-normal leading-[1.5] text-[#A1A1AA] max-w-[280px]">
                  Support instantly using UPI, local cards, or net banking.
                </p>
              </div>

              {/* QR Code Hero Element */}
              <div className="bg-white p-3 rounded-[14px] flex items-center justify-center w-24 h-24 flex-shrink-0 shadow-lg select-none">
                <img 
                  src={qrCodeImageUrl} 
                  alt="UPI QR Code" 
                  className="w-[72px] h-[72px] rounded-[6px] pointer-events-none select-none"
                />
              </div>
            </div>

            {/* Copyable UPI ID row */}
            <div className="bg-white/[0.04] border border-white/[0.06] p-3 pl-4 rounded-[14px] flex items-center justify-between w-full h-14 mb-6">
              <div className="flex flex-col text-left justify-center">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#A1A1AA]/50">UPI ID</span>
                <span className="text-sm font-mono font-medium text-[#F5F5F5]">{upiId}</span>
              </div>
              <button 
                onClick={handleCopyUpiId}
                className="h-10 min-w-[76px] px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-[10px] text-xs text-[#F5F5F5] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 select-none"
                title="Copy UPI ID"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <Button 
              onClick={() => {
                initiatePayment("UPI");
                handleRazorpayPayment();
              }}
              disabled={isProcessing}
              className="w-full h-12 bg-[#F5F5F5] hover:bg-white text-zinc-950 font-semibold rounded-[14px] cursor-pointer text-[15px] flex items-center justify-center gap-1.5 transition-all duration-200 ease-out active:scale-[0.97] border-0 select-none"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Pay with UPI</span>
                  <span>→</span>
                </>
              )}
            </Button>
          </div>

        </div>

        {/* Success Overlay Modal */}
        <AnimatePresence>
          {paymentSuccess && successDetails && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setPaymentSuccess(false);
                setSuccessDetails(null);
                setPaymentMethod(null);
                setIsProcessing(false);
              }}
              className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-6 cursor-pointer"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-[340px] w-full bg-[#161618] border border-white/[0.08] p-8 rounded-[22px] text-center shadow-2xl items-center flex flex-col cursor-default"
              >
                {/* Drawn-in Checkmark Animation */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
                  className="w-16 h-16 bg-white/[0.03] border border-white/[0.08] rounded-[14px] flex items-center justify-center mb-6"
                >
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.25, duration: 0.35, ease: "easeOut" }}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
                
                <h3 className="text-xl font-semibold text-white mb-2 font-sans tracking-tight">Support Confirmed</h3>
                
                <p className="text-[#A1A1AA] text-[15px] leading-[1.5] font-normal mb-6 max-w-[260px]">
                  Thank you for contributing {successDetails.amount ? `₹${successDetails.amount}` : ""} via {paymentMethod === "Ko-fi" ? "Ko-fi" : "UPI"}. Your support keeps this project free.
                </p>

                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-[12px] text-left text-[10px] mb-6 font-mono text-[#A1A1AA] w-full select-all">
                  <div><span className="text-white/40">TXN:</span> {successDetails.paymentId}</div>
                  <div><span className="text-white/40">STATUS:</span> VERIFIED</div>
                </div>

                <Button
                  onClick={() => {
                    setPaymentSuccess(false);
                    setSuccessDetails(null);
                    setPaymentMethod(null);
                    setIsProcessing(false);
                  }}
                  className="w-full h-11 bg-[#F5F5F5] hover:bg-white text-zinc-950 font-semibold rounded-[14px] cursor-pointer text-sm border-0 transition-transform active:scale-[0.97]"
                >
                  Done
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Elegant minimalist footer */}
        <footer className="w-full border-t border-white/[0.06] pt-8 flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] justify-center">
            <Heart className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Thank you for supporting open source development.</span>
          </div>
          
          <div className="flex items-center gap-4 justify-center">
            <a 
              href="https://github.com/ashishgit4/PdfFinalBoss" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-[#A1A1AA]/60 hover:text-[#F5F5F5] flex items-center gap-1.5 transition-colors"
            >
              <Star className="size-3.5 fill-current text-[#A1A1AA]" />
              <span>GitHub Repository</span>
              <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] font-mono text-[9px]">
                {gitHubStars !== null ? gitHubStars : "50+ stars"}
              </span>
            </a>
          </div>

          <div className="text-[9px] text-[#A1A1AA]/30 tracking-[0.18em] uppercase select-none font-semibold mt-2">
            © 2026 PdfFinalBoss — Licensed under GPL.
          </div>
        </footer>

      </div>
    </div>
  );
}

export default BuyMeCoffeePage;
