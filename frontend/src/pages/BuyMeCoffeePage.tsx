import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, CreditCard, ArrowLeft, Heart, ExternalLink, ShieldCheck, 
  Zap, Star, Copy, QrCode 
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadRazorpayScript } from "@/lib/payment";

export function BuyMeCoffeePage() {
  const [gitHubStars, setGitHubStars] = useState<number | null>(null);
  
  // Razorpay states
  const [presetAmount, setPresetAmount] = useState<number>(250);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
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
    const finalAmount = customAmount ? parseFloat(customAmount) : presetAmount;

    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast.error("Please select or enter a valid donation amount.");
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
          color: "#0d0b09",
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

    <div className="min-h-screen bg-[#09090b] text-[#f3efe6] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#FF5E5B]/20 selection:text-white">
      
      {/* Top Navbar */}
      <header className="relative z-50 px-6 md:px-12 py-4 md:py-6 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <span className="font-sans font-bold text-2xl tracking-tight text-[#f3efe6]">PdfFinalBoss</span>
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#FF5E5B] hidden sm:inline-block font-semibold select-none">/ SUPPORT</span>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="rounded-full px-5 py-2 text-sm text-[#f3efe6] hover:bg-white/5 border border-white/10 select-none transition-colors cursor-pointer bg-white/5 backdrop-blur-md">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Grid Layout Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-16 relative z-10 flex flex-col items-center justify-center gap-10">
        
        {/* Title & Intro Header */}
        <div className="text-center max-w-2xl flex flex-col items-center">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-5 shadow-xl backdrop-blur-md">
            <span className="text-2xl leading-none">☕</span>
          </div>

          <span className="text-[10px] tracking-[0.3em] uppercase text-[#FF5E5B] font-bold block mb-2 select-none">
            SUPPORT OPEN SOURCE
          </span>
          
          <h1 className="font-sans text-4xl sm:text-5xl font-bold tracking-tight text-[#f3efe6] leading-tight mb-4">
            Buy Me a Coffee
          </h1>

          <p className="text-sm sm:text-base text-[#f3efe6]/70 leading-relaxed font-sans max-w-lg">
            PdfFinalBoss is completely free and open source. If this project has saved you time, consider supporting its development.
          </p>
        </div>

        {/* The Two Cards Side-by-Side Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full items-stretch">
          
          {/* CARD 1: International Support */}
          <Card className="bg-[#121214] border border-[#1f1f23] text-[#f3efe6] shadow-2xl flex flex-col justify-between p-6 md:p-8 relative overflow-hidden rounded-[28px] transition-all duration-300">
            <CardHeader className="p-0 mb-6 text-center md:text-left">
              <CardTitle className="text-base font-bold flex items-center justify-center md:justify-start gap-2">
                <Globe className="w-4 h-4 text-[#FF5E5B]" />
                <span>🌍 International Support</span>
              </CardTitle>
              <CardDescription className="text-[#f3efe6]/60 text-xs">
                Support me internationally using Ko-fi.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-0 mb-6 flex-1 flex flex-col items-center justify-center py-4">
              <div className="relative group mb-6">
                {/* Glow Effect */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-[#FF5E5B] to-[#ff8c8a] rounded-full blur-xl opacity-5 group-hover:opacity-15 transition duration-500"></div>
                <div className="relative w-28 h-28 bg-[#18181c] border border-zinc-800 rounded-full flex items-center justify-center shadow-2xl">
                  <svg className="w-14 h-14 text-[#FF5E5B]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.351 2.715c-2.7 0-4.986.025-6.83.26C2.078 3.285 0 5.154 0 8.61c0 3.506.182 6.13 1.585 8.493 1.584 2.701 4.233 4.182 7.662 4.182h.83c4.209 0 6.494-2.234 7.637-4a9.5 9.5 0 0 0 1.091-2.338C21.792 14.688 24 12.22 24 9.208v-.415c0-3.247-2.13-5.507-5.792-5.87-1.558-.156-2.65-.208-6.857-.208m0 1.947c4.208 0 5.09.052 6.571.182 2.624.311 4.13 1.584 4.13 4v.39c0 2.156-1.792 3.844-3.87 3.844h-.935l-.156.649c-.208 1.013-.597 1.818-1.039 2.546-.909 1.428-2.545 3.064-5.922 3.064h-.805c-2.571 0-4.831-.883-6.078-3.195-1.09-2-1.298-4.155-1.298-7.506 0-2.181.857-3.402 3.012-3.714 1.533-.233 3.559-.26 6.39-.26m6.547 2.287c-.416 0-.65.234-.65.546v2.935c0 .311.234.545.65.545 1.324 0 2.051-.754 2.051-2s-.727-2.026-2.052-2.026m-10.39.182c-1.818 0-3.013 1.48-3.013 3.142 0 1.533.858 2.857 1.949 3.897.727.701 1.87 1.429 2.649 1.896a1.47 1.47 0 0 0 1.507 0c.78-.467 1.922-1.195 2.623-1.896 1.117-1.039 1.974-2.364 1.974-3.897 0-1.662-1.247-3.142-3.039-3.142-1.065 0-1.792.545-2.338 1.298-.493-.753-1.246-1.298-2.312-1.298"/>
                  </svg>
                </div>
              </div>

              <span className="text-[9px] font-bold uppercase tracking-wider text-[#f3efe6]/40 block mb-2.5">Accepted Methods</span>
              <div className="flex flex-wrap justify-center gap-1.5 text-[10px] text-[#f3efe6]/80 max-w-[280px]">
                {["Credit Card", "PayPal", "Apple Pay", "Google Pay"].map((m) => (
                  <span key={m} className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 font-semibold text-[9px] tracking-wider uppercase text-[#f3efe6]/60">{m}</span>
                ))}
              </div>
            </CardContent>
            
            <CardFooter className="p-0 pt-4">
              <Button asChild className="w-full h-10 bg-[#FF5E5B] hover:bg-[#ff7673] text-white font-bold rounded-xl shadow-md cursor-pointer text-xs transition-colors border-0">
                <a href="https://ko-fi.com/ashishsharma11" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                  <span>Support via Ko-fi</span>
                  <ExternalLink className="w-3.5 h-3.5 text-white/80" />
                </a>
              </Button>
            </CardFooter>
          </Card>

          {/* CARD 2: India Support */}
          <Card className="bg-[#121214] border border-[#1f1f23] text-[#f3efe6] shadow-2xl flex flex-col justify-between p-6 md:p-8 relative overflow-hidden rounded-[28px] transition-all duration-300">
            <CardHeader className="p-0 mb-6 text-center md:text-left">
              <CardTitle className="text-base font-bold flex items-center justify-center md:justify-start gap-2">
                <CreditCard className="w-4 h-4 text-[#FF5E5B]" />
                <span>🇮🇳 India Support / UPI</span>
              </CardTitle>
              <CardDescription className="text-[#f3efe6]/60 text-xs">
                Support using UPI or local cards.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-0 flex flex-col gap-4 flex-1 justify-center">
              {/* UPI Copy Area */}
              <div className="bg-[#18181c] border border-zinc-800 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex flex-col text-left">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-[#FF5E5B]">UPI ID</span>
                  <span className="text-xs font-mono font-semibold text-[#f3efe6]">{upiId}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon-xs"
                  onClick={handleCopyUpiId}
                  className="h-7 w-7 rounded-lg text-[#f3efe6]/70 hover:text-white hover:bg-white/5 cursor-pointer flex items-center justify-center"
                  title="Copy UPI ID"
                >
                  <Copy className="size-3.5" />
                </Button>
              </div>

              {/* QR Code Container styled exactly like the Ledger card image */}
              <div className="flex flex-col items-center justify-center py-4 bg-[#18181c] border border-zinc-800 rounded-2xl p-4">
                <div className="bg-white p-2.5 rounded-xl border border-white/5 shadow-2xl">
                  <img 
                    src={qrCodeImageUrl} 
                    alt="UPI QR Code" 
                    width="110" 
                    height="110"
                    className="rounded-lg pointer-events-none"
                  />
                </div>
                <h4 className="text-sm font-semibold text-white mt-4">Scan with any UPI App</h4>
                <p className="text-[10px] text-zinc-400 text-center mt-1 max-w-[200px]">Scan this QR code using GPay, PhonePe, Paytm, or BHIM to complete transaction.</p>
              </div>

              {/* Preset & Custom Payment Options */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  {[100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setPresetAmount(amt);
                        setCustomAmount("");
                      }}
                      className={`flex-1 py-1.5 text-[11px] font-semibold rounded-xl border transition-all cursor-pointer ${
                        presetAmount === amt && !customAmount
                          ? "bg-[#FF5E5B] border-[#FF5E5B] text-white shadow-md"
                          : "bg-white/5 border-white/10 text-[#f3efe6]/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#f3efe6]/40">₹</span>
                  <Input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setPresetAmount(0);
                    }}
                    placeholder="Custom Amount"
                    className="h-8.5 bg-white/5 border-white/10 pl-6 text-xs text-white focus-visible:ring-1 focus-visible:ring-[#FF5E5B] focus-visible:border-[#FF5E5B] rounded-xl placeholder:text-white/20"
                    min="1"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-0 pt-4">
              <Button 
                onClick={handleRazorpayPayment}
                disabled={isProcessing}
                className="w-full h-10 bg-[#f3efe6] hover:bg-white text-zinc-950 font-bold rounded-xl shadow-md cursor-pointer text-xs flex items-center justify-center gap-1.5 transition-colors border-0"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Support via Cards/UPI</span>
                    <Zap className="w-3 h-3 text-zinc-950 fill-current" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

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
              <div className="max-w-xs w-full bg-[#13110f] border border-white/10 p-6 rounded-3xl text-center relative shadow-2xl">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6 text-[#FF5E5B]" />
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1 font-sans">Support Confirmed</h3>
                <p className="text-[#f3efe6]/70 text-xs mb-5">
                  Thank you for contributing <span className="text-white font-bold">₹{successDetails.amount}</span>. Your support keeps this project free.
                </p>

                <div className="bg-white/5 border border-white/5 p-3 rounded-lg text-left text-[9px] mb-5 font-mono text-[#f3efe6]/80 select-all">
                  <div><span className="text-white/40">TXN:</span> {successDetails.paymentId}</div>
                  <div><span className="text-white/40">STATUS:</span> VERIFIED</div>
                </div>

                <Button
                  onClick={() => {
                    setPaymentSuccess(false);
                    setSuccessDetails(null);
                    setIsProcessing(false);
                  }}
                  className="w-full h-9 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl cursor-pointer text-xs"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Elegant minimalist footer */}
        <footer className="w-full border-t border-white/10 pt-8 mt-4 flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-1.5 text-xs text-white">
            <Heart className="w-3.5 h-3.5 text-[#FF5E5B]" />
            <span>Thank you for supporting open source development.</span>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/ashishgit4/PdfFinalBoss" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-[#f3efe6]/50 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Star className="size-3.5 fill-current text-[#FF5E5B]" />
              <span>GitHub Repository</span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-[10px]">
                {gitHubStars !== null ? gitHubStars : "50+ stars"}
              </span>
            </a>
          </div>

          <div className="text-[9px] text-[#f3efe6]/30 tracking-[0.18em] uppercase select-none font-semibold mt-2">
            © 2026 PdfFinalBoss — Licensed under GPL.
          </div>
        </footer>

      </div>
    </div>
  );
}

export default BuyMeCoffeePage;
