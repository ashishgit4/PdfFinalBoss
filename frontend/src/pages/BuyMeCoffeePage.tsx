import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, CreditCard, ArrowLeft, Heart, ShieldCheck, 
  Star, Copy 
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { loadRazorpayScript } from "@/lib/payment";

export function BuyMeCoffeePage() {
  const [gitHubStars, setGitHubStars] = useState<number | null>(null);
  
  // Razorpay states
  const [customAmount, setCustomAmount] = useState<string>("250");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [successDetails, setSuccessDetails] = useState<{
    paymentId: string;
    amount: number;
  } | null>(null);

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

  const triggerConfetti = () => {
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

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
              setPaymentSuccess(true);
              toast.dismiss();
              toast.success("Thank you for supporting PdfFinalBoss!");
              triggerConfetti();
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
    toast.success("UPI ID copied to clipboard!");
  };

  // UPI deep-link URL config
  const upiId = "ashishtawniya1@okaxis";
  const upiUrl = `upi://pay?pa=${upiId}&pn=PdfFinalBoss&cu=INR`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="min-h-screen bg-[#090909] text-[#F5F5F5] flex flex-col font-sans relative overflow-x-hidden selection:bg-white/10 selection:text-white">
      
      {/* Top Navbar */}
      <header className="relative z-50 w-full max-w-[1100px] mx-auto px-6 py-6 md:py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-sans font-bold text-xl tracking-tight text-[#F5F5F5]">PdfFinalBoss</span>
          <span className="text-[9px] tracking-[0.25em] uppercase text-[#A1A1AA] font-semibold select-none">/ SUPPORT</span>
        </div>

        <div>
          <Button asChild variant="ghost" className="rounded-full px-5 py-2 text-xs font-medium text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-white/[0.04] border border-white/[0.06] transition-all duration-200 cursor-pointer bg-white/[0.02]">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-[1100px] mx-auto w-full px-6 py-12 md:py-20 flex flex-col items-center justify-center gap-16 md:gap-20 relative z-10">
        
        {/* Centered Title & Intro */}
        <div className="text-center max-w-2xl flex flex-col items-center gap-4">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#A1A1AA] font-bold block select-none">
            SUPPORT OPEN SOURCE
          </span>
          
          <h1 className="font-sans text-4xl sm:text-5xl font-semibold tracking-tight text-[#F5F5F5] leading-[1.15]">
            Buy Me a Coffee
          </h1>

          <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed font-sans max-w-md">
            PdfFinalBoss is completely free and open source. If this tool has saved you time, consider supporting its active development.
          </p>
        </div>

        {/* Raycast-inspired Two Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 w-full items-stretch">
          
          {/* CARD 1: International Support */}
          <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] text-[#F5F5F5] flex flex-col justify-between p-8 md:p-10 relative overflow-hidden rounded-[32px] transition-all duration-[250ms] ease-out hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            
            {/* Hero Illustration */}
            <div className="h-48 flex items-center justify-center select-none mb-6">
              <div className="w-24 h-24 bg-white/[0.02] border border-white/[0.04] rounded-[24px] flex items-center justify-center transition-colors duration-300 hover:bg-white/[0.04] hover:border-white/[0.08]">
                <svg className="w-12 h-12 text-[#A1A1AA] hover:text-[#FF5E5B] transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                  <line x1="6" y1="2" x2="6" y2="4" />
                  <line x1="10" y1="2" x2="10" y2="4" />
                  <line x1="14" y1="2" x2="14" y2="4" />
                </svg>
              </div>
            </div>

            <div className="text-center md:text-left mb-8 flex-1">
              <span className="text-[10px] tracking-wider uppercase text-[#A1A1AA]/50 font-bold flex items-center justify-center md:justify-start gap-1.5 mb-2">
                <Globe className="w-3.5 h-3.5" />
                <span>Global Gateway</span>
              </span>
              <h3 className="text-xl font-medium text-[#F5F5F5]">International Support</h3>
              <p className="text-xs text-[#A1A1AA] mt-2 leading-relaxed">
                Support the project securely using Ko-fi with Card, PayPal, Apple Pay, or Google Pay.
              </p>
            </div>
            
            <div>
              <Button asChild className="w-full h-[50px] bg-white/[0.04] border border-white/10 hover:bg-[#FF5E5B] hover:border-[#FF5E5B] text-[#F5F5F5] hover:text-white font-semibold rounded-full shadow-md cursor-pointer text-xs transition-all duration-200">
                <a href="https://ko-fi.com/ashishsharma11" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                  <span>Continue with Ko-fi</span>
                  <span>→</span>
                </a>
              </Button>
            </div>
          </div>

          {/* CARD 2: India Support */}
          <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] text-[#F5F5F5] flex flex-col justify-between p-8 md:p-10 relative overflow-hidden rounded-[32px] transition-all duration-[250ms] ease-out hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            
            {/* QR Code Hero styled exactly like the Ledger card image */}
            <div className="h-48 flex items-center justify-center select-none mb-6">
              <div className="bg-[#18181c] border border-white/[0.04] p-3 rounded-[24px] shadow-2xl flex items-center justify-center">
                <div className="bg-white p-2.5 rounded-[16px]">
                  <img 
                    src={qrCodeImageUrl} 
                    alt="UPI QR Code" 
                    width="100" 
                    height="100"
                    className="rounded-lg pointer-events-none select-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 flex-1 mb-8 text-center md:text-left">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-[#A1A1AA]/50 font-bold flex items-center justify-center md:justify-start gap-1.5 mb-2">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>UPI scan & Pay</span>
                </span>
                <h3 className="text-xl font-medium text-[#F5F5F5]">India Support</h3>
                <p className="text-xs text-[#A1A1AA] mt-2 leading-relaxed">
                  Scan the QR code above or pay directly via local credit cards, netbanking, or UPI wallets.
                </p>
              </div>

              {/* UPI ID Copy Field */}
              <div className="bg-[#18181c] border border-white/[0.04] p-3 rounded-2xl flex items-center justify-between w-full">
                <div className="flex flex-col text-left">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-[#A1A1AA]/50">UPI ID</span>
                  <span className="text-xs font-mono font-medium text-[#F5F5F5]">{upiId}</span>
                </div>
                <button 
                  onClick={handleCopyUpiId}
                  className="h-7 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-[10px] text-[#F5F5F5] font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Copy UPI ID"
                >
                  <Copy className="size-3" />
                  <span>Copy</span>
                </button>
              </div>

              {/* Minimal Amount Input Field */}
              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#A1A1AA]">₹</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full h-11 bg-[#18181c] border border-white/[0.04] focus:border-white/10 rounded-2xl pl-8 pr-4 text-xs font-mono text-[#F5F5F5] placeholder:text-zinc-600 focus:outline-none transition-colors"
                  min="1"
                />
              </div>
            </div>

            <div>
              <Button 
                onClick={handleRazorpayPayment}
                disabled={isProcessing}
                className="w-full h-[50px] bg-[#F5F5F5] hover:bg-white text-zinc-950 font-bold rounded-full cursor-pointer text-xs flex items-center justify-center gap-1.5 transition-colors border-0"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
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
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
            >
              <div className="max-w-xs w-full bg-[#111111] border border-white/[0.08] p-8 rounded-[32px] text-center relative shadow-2xl">
                <div className="w-12 h-12 bg-white/[0.02] border border-white/[0.06] rounded-[16px] flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6 text-[#A1A1AA]" />
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1 font-sans">Support Confirmed</h3>
                <p className="text-[#A1A1AA] text-xs mb-5">
                  Thank you for contributing <span className="text-white font-bold">₹{successDetails.amount}</span>. Your support keeps this project free.
                </p>

                <div className="bg-[#18181c] border border-white/[0.04] p-3 rounded-xl text-left text-[9px] mb-5 font-mono text-[#A1A1AA] select-all">
                  <div><span className="text-white/40">TXN:</span> {successDetails.paymentId}</div>
                  <div><span className="text-white/40">STATUS:</span> VERIFIED</div>
                </div>

                <Button
                  onClick={() => {
                    setPaymentSuccess(false);
                    setSuccessDetails(null);
                    setIsProcessing(false);
                  }}
                  className="w-full h-[40px] bg-[#F5F5F5] hover:bg-white text-zinc-950 font-semibold rounded-full cursor-pointer text-xs border-0"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Elegant minimalist footer */}
        <footer className="w-full border-t border-white/[0.06] pt-8 flex flex-col items-center gap-4 text-center mt-8">
          <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA]">
            <Heart className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Thank you for supporting open source development.</span>
          </div>
          
          <div className="flex items-center gap-4">
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
