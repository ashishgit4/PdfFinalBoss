import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Heart, 
  Copy, Check, Globe, Send, CreditCard
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { loadRazorpayScript } from "@/lib/payment";

export function BuyMeCoffeePage() {
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

  const handleKofiClick = () => {
    toast.success("Opened Ko-fi in a new tab — thank you for supporting the project!");
  };

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
    <div className="min-h-screen w-full bg-[#050608] text-[#F5F5F5] flex flex-col justify-between relative overflow-x-hidden selection:bg-white/10 selection:text-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Top Navbar */}
      <header className="relative z-50 w-full max-w-[1240px] mx-auto px-6 md:px-12 py-6 md:py-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          </svg>
          <span className="font-sans font-bold text-lg tracking-tight text-[#F5F5F5]">PdfFinalBoss</span>
        </div>

        <Button asChild variant="ghost" className="rounded-full px-4 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.08] border border-white/10 bg-white/[0.03] transition-all duration-200 cursor-pointer flex items-center gap-2 backdrop-blur-md">
          <Link to="/">
            <ArrowLeft className="w-3.5 h-3.5 text-zinc-300" />
            <span>Back to Home</span>
          </Link>
        </Button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-[1240px] mx-auto w-full px-6 md:px-12 py-8 md:py-12 flex flex-col items-center justify-center gap-10 md:gap-14 relative z-10">
        
        {/* Centered Title & Intro */}
        <div className="text-center max-w-2xl flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-1 bg-white/[0.03] border border-white/10 rounded-full text-[11px] font-medium text-zinc-300 uppercase tracking-widest select-none backdrop-blur-md">
            <Heart className="w-3.5 h-3.5 text-white fill-white" />
            <span>SUPPORT OPEN SOURCE</span>
          </div>
          
          <h1 className="font-sans text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Support PdfFinalBoss
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-sans max-w-xl text-center">
            PdfFinalBoss is completely free and open source. Every contribution helps keep the project maintained, improved, and accessible for everyone.
          </p>
        </div>

        {/* Symmetrical Two Cards Layout matching Image 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 w-full max-w-[1040px] items-stretch justify-center">
          
          {/* CARD 1: International Support */}
          <div className="bg-[#0B0C0E]/90 border border-white/10 text-white flex flex-col justify-between p-8 md:p-9 rounded-[28px] shadow-2xl relative overflow-hidden backdrop-blur-xl group hover:border-white/20 transition-all duration-300">
            
            <div>
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-white/10 rounded-full text-[11px] font-medium text-zinc-300 uppercase tracking-wider select-none mb-6">
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                <span>GLOBAL</span>
              </div>

              {/* Body Content Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white tracking-tight mb-2">International Support</h3>
                  
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-[280px] mb-6">
                    Support the project securely using Ko-fi with Card, PayPal, Apple Pay, or Google Pay.
                  </p>

                  {/* Payment Pills */}
                  <div className="flex items-center gap-2 flex-wrap select-none">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/10 rounded-full text-xs font-medium text-zinc-300">
                      <span className="text-sm"></span> Apple Pay
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/10 rounded-full text-xs font-medium text-zinc-300">
                      <svg className="w-3 h-3 text-zinc-300" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .761-.645h6.417c2.423 0 4.319.53 5.485 1.534 1.166 1.004 1.58 2.457 1.272 4.417-.464 2.955-2.28 4.793-5.253 5.318l.582 3.652a.641.641 0 0 1-.633.741H10.15a.77.77 0 0 1-.76-.645l-.47-2.956H7.076z"/>
                      </svg>
                      PayPal
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/10 rounded-full text-xs font-medium text-zinc-300">
                      <CreditCard className="w-3 h-3 text-zinc-300" />
                      Card
                    </span>
                  </div>
                </div>

                {/* 3D Glass Coffee Mug Graphic */}
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center flex-shrink-0 select-none self-center sm:self-auto">
                  <div className="absolute w-20 h-20 rounded-full bg-red-500/20 blur-2xl opacity-75" />
                  
                  {/* Styled 3D Mug SVG */}
                  <svg className="w-28 h-28 relative z-10 drop-shadow-[0_10px_25px_rgba(255,77,79,0.3)]" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Shadow under mug */}
                    <ellipse cx="55" cy="100" rx="30" ry="8" fill="black" fillOpacity="0.5" />
                    
                    {/* Mug Handle */}
                    <path d="M75 48C88 48 98 55 98 68C98 81 88 88 75 88" stroke="url(#mugHandleGrad)" strokeWidth="10" strokeLinecap="round" />
                    
                    {/* Mug Body */}
                    <rect x="25" y="38" width="52" height="54" rx="10" fill="url(#mugBodyGrad)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                    
                    {/* Rim Outer */}
                    <ellipse cx="51" cy="38" rx="26" ry="7" fill="url(#mugRimGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    
                    {/* Rim Inner Liquid */}
                    <ellipse cx="51" cy="39" rx="23" ry="5.5" fill="#1C1414" />
                    
                    {/* 3D Glowing Red Heart */}
                    <g filter="url(#heartGlow)">
                      <path d="M51 60C48.5 56 42 56 42 61.5C42 67 51 73.5 51 73.5C51 73.5 60 67 60 61.5C60 56 53.5 56 51 60Z" fill="url(#heartGrad)" />
                    </g>

                    <defs>
                      <linearGradient id="mugBodyGrad" x1="25" y1="38" x2="77" y2="92" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#2A2A30" stopOpacity="0.9" />
                        <stop offset="50%" stopColor="#1A1A1E" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#0F0F12" stopOpacity="0.95" />
                      </linearGradient>

                      <linearGradient id="mugRimGrad" x1="25" y1="38" x2="77" y2="38" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#4A4A52" />
                        <stop offset="50%" stopColor="#2A2A30" />
                        <stop offset="100%" stopColor="#1A1A1E" />
                      </linearGradient>

                      <linearGradient id="mugHandleGrad" x1="75" y1="48" x2="98" y2="88" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#3A3A42" />
                        <stop offset="100%" stopColor="#1A1A1E" />
                      </linearGradient>

                      <linearGradient id="heartGrad" x1="42" y1="56" x2="60" y2="73.5" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FF6B6B" />
                        <stop offset="100%" stopColor="#E63946" />
                      </linearGradient>

                      <filter id="heartGlow" x="35" y="50" filterUnits="userSpaceOnUse">
                        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#FF4D4F" floodOpacity="0.8" />
                      </filter>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Bottom Button */}
            <Button asChild onClick={handleKofiClick} className="w-full h-12 bg-white/[0.06] hover:bg-white/[0.12] text-white font-medium rounded-full cursor-pointer text-sm flex items-center justify-center gap-2 border border-white/10 transition-all duration-200 active:scale-[0.98] select-none">
              <a href="https://ko-fi.com/ashishsharma11" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.881 8.948c-.773-4.085-4.859-5.005-7.875-5.005h-9.52c-.775 0-1.404.63-1.404 1.405v13.315c0 .775.629 1.405 1.404 1.405h8.182c4.619 0 7.821-2.524 8.793-7.555.309-1.606.321-2.535.42-3.565zm-4.321 4.545c-.563 2.923-2.673 3.655-5.597 3.655H7.318V6.16h7.458c2.045 0 4.195.42 4.672 3.19.261 1.516.273 2.457.112 4.143zM16.592 11.23h1.365a1.82 1.82 0 1 1 0 3.64h-1.365V11.23z" />
                </svg>
                <span>Continue with Ko-fi</span>
                <span>→</span>
              </a>
            </Button>
          </div>

          {/* CARD 2: India Support */}
          <div className="bg-[#0B0C0E]/90 border border-white/10 text-white flex flex-col justify-between p-8 md:p-9 rounded-[28px] shadow-2xl relative overflow-hidden backdrop-blur-xl group hover:border-white/20 transition-all duration-300">
            
            <div>
              {/* Eyebrow Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-white/10 rounded-full text-[11px] font-medium text-zinc-300 uppercase tracking-wider select-none mb-6">
                <span className="text-xs">🇮🇳</span>
                <span>LOCAL PAYMENT</span>
              </div>

              {/* Body Content Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-white tracking-tight mb-2">India Support</h3>
                  
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-[260px]">
                    Support instantly using UPI, local cards, or net banking.
                  </p>
                </div>

                {/* Dark Recessed QR Code Container matching Image 2 */}
                <div className="bg-[#060708]/90 border border-white/10 p-3.5 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 select-none self-center sm:self-auto shadow-inner">
                  <div className="bg-white p-2 rounded-xl">
                    <img 
                      src={qrCodeImageUrl} 
                      alt="UPI QR Code" 
                      className="w-24 h-24 rounded-lg pointer-events-none select-none"
                    />
                  </div>
                  <span className="text-[11px] text-zinc-400 font-medium mt-2">Scan to pay</span>
                </div>
              </div>
            </div>

            <div>
              {/* Copyable UPI ID row */}
              <div className="bg-black/50 border border-white/10 p-3 pl-4 rounded-xl flex items-center justify-between w-full mb-4">
                <div className="flex flex-col text-left justify-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">UPI ID</span>
                  <span className="text-sm font-mono font-medium text-zinc-200">{upiId}</span>
                </div>
                <button 
                  onClick={handleCopyUpiId}
                  className="h-8 px-3 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 rounded-lg text-xs text-zinc-200 font-medium transition-colors cursor-pointer flex items-center gap-1.5 select-none"
                  title="Copy UPI ID"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-300" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Bottom Main Button */}
              <Button 
                onClick={handleRazorpayPayment}
                disabled={isProcessing}
                className="w-full h-12 bg-white hover:bg-zinc-100 text-zinc-950 font-semibold rounded-full cursor-pointer text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] border-0 select-none shadow-md"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
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
                
                <p className="text-zinc-400 text-sm leading-relaxed font-normal mb-6 max-w-[260px]">
                  Thank you for contributing {successDetails.amount ? `₹${successDetails.amount}` : ""} via {paymentMethod === "Ko-fi" ? "Ko-fi" : "UPI"}. Your support keeps this project free.
                </p>

                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-[12px] text-left text-[10px] mb-6 font-mono text-zinc-400 w-full select-all">
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
                  className="w-full h-11 bg-white hover:bg-zinc-100 text-zinc-950 font-semibold rounded-xl cursor-pointer text-sm border-0 transition-transform active:scale-[0.97]"
                >
                  Done
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimalist Footer matching Image 2 */}
        <footer className="w-full py-6 flex items-center justify-center text-center">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Heart className="w-3.5 h-3.5 text-zinc-400 fill-zinc-400" />
            <span>Thank you for being part of the open source journey.</span>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default BuyMeCoffeePage;
