import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, CreditCard, ArrowLeft, Heart, ExternalLink, ShieldCheck, 
  Zap, Star, Copy, QrCode, Feather, Droplet, Award 
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
          color: "#24211c",
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
    <div className="min-h-screen bg-[#f6f1e7] text-[#24211c] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#e8c87a]/40 selection:text-[#24211c] h-screen overflow-hidden">
      
      {/* Background Video loop */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none"
      >
        <source src="https://zxdefgavgwfxastwmmjm.supabase.co/storage/v1/object/public/assets/plume.mp4" type="video/mp4" />
      </video>

      {/* Light warm ivory paper overlays */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(246, 241, 231, 0.74) 0%, rgba(246, 241, 231, 0.18) 38%, transparent 62%)"
        }}
      />
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(246, 241, 231, 0.6), transparent 18%)"
        }}
      />

      {/* Paper Grain Overlay */}
      <div className="paper-grain" />

      {/* Top Navbar */}
      <header className="relative z-50 px-4 sm:px-6 md:px-12 py-4 md:py-6 flex items-center justify-between w-full">
        <div className="flex items-center gap-3 animate-blur-fade-up" style={{ animationDelay: "0ms" }}>
          <span className="font-serif text-2xl tracking-[0.04em] text-[#24211c]">PdfFinalBoss</span>
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#caa24f] hidden sm:inline-block font-sans select-none">/ PAPERIE</span>
        </div>

        <div className="flex items-center gap-3 animate-blur-fade-up" style={{ animationDelay: "350ms" }}>
          <Button asChild variant="outline" className="rounded-full px-5 py-2 text-sm text-[#24211c] border-[#caa24f]/60 bg-transparent hover:bg-[#24211c]/5 select-none transition-colors cursor-pointer">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </Button>

          <div 
            className="border border-[#caa24f]/60 text-[#caa24f] text-[9px] tracking-[0.25em] uppercase px-3 py-1 rounded-full bg-transparent font-semibold select-none hidden xs:inline-block"
          >
            FREE PACK
          </div>
        </div>
      </header>

      {/* Split Hero Content Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-12 pb-10 md:pb-16 relative z-10 flex flex-col lg:flex-row gap-12 items-stretch justify-end h-[calc(100vh-80px)] overflow-hidden">
        
        {/* Left Side: Cinematic Copy */}
        <div className="flex-1 flex flex-col justify-end max-w-xl pb-4">
          
          {/* Eyebrow */}
          <div className="animate-blur-fade-up" style={{ animationDelay: "300ms" }}>
            <span className="text-[11px] tracking-[0.34em] uppercase text-[#caa24f] font-semibold block mb-2 select-none">
              FINE STATIONERY · SINCE 1888
            </span>
            <div className="hairline w-16 animate-ink-draw mb-6" />
          </div>

          {/* Headline */}
          <h1 
            className="font-serif text-5xl sm:text-6xl md:text-7xl font-light leading-[0.98] tracking-[-0.01em] text-[#24211c] mb-5 animate-blur-fade-up flex flex-col"
            style={{ animationDelay: "450ms" }}
          >
            <span>Every word</span>
            <span className="italic gild font-medium">worth keeping.</span>
          </h1>

          {/* Subline */}
          <p 
            className="text-sm sm:text-base text-[#24211c]/65 max-w-md mb-8 leading-relaxed font-sans animate-blur-fade-up"
            style={{ animationDelay: "560ms" }}
          >
            PdfFinalBoss is completely free and open source. If this project has helped you save time, consider supporting its development. Every contribution helps improve the project and keeps it free for everyone.
          </p>

          {/* Metadata / Trust Row */}
          <div 
            className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] tracking-[0.22em] uppercase text-[#24211c]/50 font-semibold mb-2 animate-blur-fade-up select-none"
            style={{ animationDelay: "380ms" }}
          >
            <div className="flex items-center gap-1.5">
              <Feather className="w-3.5 h-3.5 text-[#caa24f]" />
              <span>HAND-CUT NIBS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#caa24f]" />
              <span>WAX SEALED</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-[#caa24f]" />
              <span>IRON-GALL INK</span>
            </div>
          </div>
        </div>

        {/* Right Side: Support Cards & Features (Scrollable Content Container) */}
        <div className="w-full lg:w-[480px] overflow-y-auto pr-1 flex flex-col gap-6 scrollbar-thin select-none max-h-[85vh] lg:max-h-[calc(100vh-120px)] self-end pb-4 pt-2">
          
          {/* Exactly Two Cards Grid */}
          <div className="flex flex-col gap-4 animate-blur-fade-up" style={{ animationDelay: "660ms" }}>
            
            {/* CARD 1: International Support */}
            <Card className="bg-[#faf7f0]/85 backdrop-blur-md border-[#caa24f]/20 text-[#24211c] shadow-lg flex flex-col justify-between p-5 relative overflow-hidden rounded-2xl">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#caa24f]" />
                  <span>🌍 International Support</span>
                </CardTitle>
                <CardDescription className="text-[#24211c]/60 text-xs">
                  Support me internationally using Ko-fi.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 mb-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#24211c]/40 block mb-1.5">Accepted Methods</span>
                <div className="flex flex-wrap gap-1 text-[10px] text-[#24211c]/80">
                  {["Credit Card", "PayPal", "Apple Pay", "Google Pay"].map((m) => (
                    <span key={m} className="px-2 py-0.5 rounded bg-[#24211c]/5 border border-[#24211c]/5 font-medium">{m}</span>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-0">
                <Button asChild className="w-full h-9 bg-[#24211c] hover:bg-[#34302a] text-[#f6f1e7] font-semibold rounded-lg shadow-sm cursor-pointer text-xs">
                  <a href="https://ko-fi.com/ashishsharma11" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5">
                    <span>Buy me a Coffee</span>
                    <ExternalLink className="w-3 h-3 text-[#f6f1e7]/80" />
                  </a>
                </Button>
              </CardFooter>
            </Card>

            {/* CARD 2: India Support */}
            <Card className="bg-[#faf7f0]/85 backdrop-blur-md border-[#caa24f]/20 text-[#24211c] shadow-lg flex flex-col justify-between p-5 relative overflow-hidden rounded-2xl">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#caa24f]" />
                  <span>🇮🇳 India Support</span>
                </CardTitle>
                <CardDescription className="text-[#24211c]/60 text-xs">
                  Support using Razorpay Checkout.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-0 flex flex-col gap-4">
                {/* Preset donation list */}
                <div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {[100, 250, 500].map((amt) => (
                      <Button
                        key={amt}
                        variant="outline"
                        onClick={() => {
                          setPresetAmount(amt);
                          setCustomAmount("");
                        }}
                        className={`h-8 text-xs border rounded-lg ${
                          presetAmount === amt && !customAmount
                            ? "bg-[#24211c] text-[#f6f1e7] border-[#24211c]"
                            : "bg-[#24211c]/5 border-[#caa24f]/20 text-[#24211c] hover:bg-[#24211c]/10"
                        }`}
                      >
                        ₹{amt}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#24211c]/40">₹</span>
                    <Input
                      type="number"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setPresetAmount(0);
                      }}
                      placeholder="Enter custom amount"
                      className="h-8 bg-[#24211c]/5 border-[#caa24f]/20 pl-6 text-xs text-[#24211c] focus-visible:ring-1 focus-visible:ring-[#caa24f] focus-visible:border-[#caa24f] rounded-lg placeholder:text-[#24211c]/30"
                      min="1"
                    />
                  </div>
                </div>

                {/* UPI details */}
                <div className="bg-[#24211c]/5 border border-[#caa24f]/10 p-3.5 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-[#caa24f]">UPI ID</span>
                      <span className="text-xs font-mono text-[#24211c] mt-0.5">{upiId}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button 
                        variant="ghost" 
                        size="icon-xs"
                        onClick={handleCopyUpiId}
                        className="text-[#24211c]/65 hover:text-[#24211c]"
                        title="Copy UPI ID"
                      >
                        <Copy className="size-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon-xs"
                        onClick={() => setShowQrCode(!showQrCode)}
                        className={`text-[#24211c]/65 hover:text-[#24211c] ${showQrCode ? 'text-[#caa24f]' : ''}`}
                        title="Toggle QR Code"
                      >
                        <QrCode className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showQrCode && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden flex flex-col items-center pt-2"
                      >
                        <div className="bg-white p-1.5 rounded-lg border border-[#caa24f]/30 shadow-md">
                          <img 
                            src={qrCodeImageUrl} 
                            alt="UPI QR Code fallback" 
                            width="140" 
                            height="140"
                            className="rounded"
                          />
                        </div>
                        <span className="text-[8px] text-[#24211c]/40 mt-1.5 font-semibold">Scan with GPay, PhonePe, Paytm, BHIM</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>

              <CardFooter className="p-0 pt-4">
                <Button 
                  onClick={handleRazorpayPayment}
                  disabled={isProcessing}
                  className="w-full h-9 bg-[#e8c87a] hover:bg-[#eed392] text-[#24211c] font-semibold rounded-lg shadow-sm border border-[#caa24f]/30 cursor-pointer text-xs flex items-center justify-center gap-1.5"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#24211c]/30 border-t-[#24211c] rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Support via UPI</span>
                      <Zap className="w-3 h-3" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

          </div>

          {/* Verification Celebration modal */}
          <AnimatePresence>
            {paymentSuccess && successDetails && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-[#f6f1e7]/90 backdrop-blur-md flex items-center justify-center p-6"
              >
                <div className="max-w-xs w-full bg-[#faf7f0] border border-[#caa24f]/40 p-6 rounded-2xl text-center relative shadow-xl">
                  <div className="w-12 h-12 bg-[#e8c87a]/20 border border-[#caa24f]/40 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-6 h-6 text-[#caa24f]" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-[#24211c] mb-1 font-serif">Support Confirmed</h3>
                  <p className="text-[#24211c]/70 text-xs mb-5">
                    Thank you for contributing <span className="text-[#24211c] font-bold">₹{successDetails.amount}</span>. Your support keeps this project free.
                  </p>

                  <div className="bg-[#24211c]/5 border border-[#24211c]/10 p-3 rounded-lg text-left text-[9px] mb-5 font-mono text-[#24211c]/80 select-all">
                    <div><span className="text-[#24211c]/40">TXN:</span> {successDetails.paymentId}</div>
                    <div><span className="text-[#24211c]/40">status:</span> VERIFIED</div>
                  </div>

                  <Button
                    onClick={() => {
                      setPaymentSuccess(false);
                      setSuccessDetails(null);
                      setIsProcessing(false);
                    }}
                    className="w-full h-9 bg-[#24211c] hover:bg-[#34302a] text-[#f6f1e7] font-semibold rounded-lg cursor-pointer text-xs"
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Why support PdfFinalBoss? (4 premium features) */}
          <div className="flex flex-col gap-3 animate-blur-fade-up" style={{ animationDelay: "760ms" }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#caa24f] block">Why support PdfFinalBoss?</span>
            
            <div className="grid grid-cols-1 gap-2.5">
              
              <div className="p-4 rounded-xl bg-[#faf7f0]/60 border border-[#caa24f]/15 hover:border-[#caa24f]/30 transition-colors flex gap-3.5">
                <div className="w-8 h-8 shrink-0 bg-[#e8c87a]/10 rounded-lg flex items-center justify-center border border-[#caa24f]/20">
                  <span className="text-xs">🚀</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#24211c] mb-0.5">Faster updates</h4>
                  <p className="text-[10.5px] text-[#24211c]/65 leading-relaxed">
                    Sponsoring active feature development, memory buffers optimization, and CLI builds.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#faf7f0]/60 border border-[#caa24f]/15 hover:border-[#caa24f]/30 transition-colors flex gap-3.5">
                <div className="w-8 h-8 shrink-0 bg-[#e8c87a]/10 rounded-lg flex items-center justify-center border border-[#caa24f]/20">
                  <span className="text-xs">🔒</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#24211c] mb-0.5">Better PDF tools</h4>
                  <p className="text-[10.5px] text-[#24211c]/65 leading-relaxed">
                    Underwriting sandbox improvements, vault systems, and advanced encryption tasks.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#faf7f0]/60 border border-[#caa24f]/15 hover:border-[#caa24f]/30 transition-colors flex gap-3.5">
                <div className="w-8 h-8 shrink-0 bg-[#e8c87a]/10 rounded-lg flex items-center justify-center border border-[#caa24f]/20">
                  <span className="text-xs">🌍</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#24211c] mb-0.5">Hosting & Domain</h4>
                  <p className="text-[10.5px] text-[#24211c]/65 leading-relaxed">
                    Maintaining operational hosting arrays, bandwidth resources, and SSL certificates.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#faf7f0]/60 border border-[#caa24f]/15 hover:border-[#caa24f]/30 transition-colors flex gap-3.5">
                <div className="w-8 h-8 shrink-0 bg-[#e8c87a]/10 rounded-lg flex items-center justify-center border border-[#caa24f]/20">
                  <span className="text-xs">❤️</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#24211c] mb-0.5">Support Open Source</h4>
                  <p className="text-[10.5px] text-[#24211c]/65 leading-relaxed">
                    Ensuring utility sets remain GPL-compliant, tracker-free, and 100% free of ads.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Footer (GitHub Stars + Thank you note) */}
          <footer className="border-t border-[#caa24f]/20 pt-6 pb-4 flex flex-col gap-5 animate-blur-fade-up" style={{ animationDelay: "860ms" }}>
            <div className="flex flex-col items-center text-center gap-1.5">
              <Heart className="w-4 h-4 text-[#caa24f]" />
              <h3 className="text-sm font-serif font-bold text-[#24211c]">Thank you for supporting</h3>
              <p className="text-[10.5px] text-[#24211c]/65 max-w-sm leading-relaxed">
                PdfFinalBoss is run entirely by an individual developer. Your presence, code updates, and donations make everything possible.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#faf7f0]/60 border border-[#caa24f]/20 p-3.5 rounded-xl justify-between w-full">
              <div className="text-left">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-[#caa24f] block">GitHub Repository</span>
                <span className="text-xs font-mono text-[#24211c] font-semibold select-all">github.com/ashishgit4/PdfFinalBoss</span>
              </div>
              
              <Button asChild className="h-8 bg-[#24211c] hover:bg-[#34302a] text-[#f6f1e7] font-semibold rounded-lg cursor-pointer text-xs">
                <a 
                  href="https://github.com/ashishgit4/PdfFinalBoss" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5"
                >
                  <Star className="size-3.5 fill-current text-[#e8c87a]" />
                  <span>Star on GitHub</span>
                  <span className="text-[9px] bg-[#f6f1e7]/20 px-2 py-0.5 rounded-full font-mono text-[#f6f1e7]">
                    {gitHubStars !== null ? gitHubStars : "50+"}
                  </span>
                </a>
              </Button>
            </div>

            <div className="text-center text-[9px] text-[#24211c]/35 tracking-[0.28em] uppercase flex items-center justify-center gap-1.5 select-none font-semibold mt-2">
              <Feather className="size-3" />
              <span>PRESSED, NOT PRINTED</span>
            </div>
          </footer>

        </div>

      </div>

    </div>
  );
}

export default BuyMeCoffeePage;
