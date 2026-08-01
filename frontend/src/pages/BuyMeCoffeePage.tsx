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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
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
          color: "#000000",
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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-zinc-800 selection:text-white">
      {/* Premium Vercel/Linear subtle grids & glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-zinc-800/10 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)] pointer-events-none" />

      {/* Header Container */}
      <header className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </Link>
          <div className="text-zinc-500 text-xs font-mono">PdfFinalBoss Support Hub</div>
        </div>
      </header>

      <main className="flex-1 container max-w-4xl mx-auto px-6 py-12 relative z-10 flex flex-col gap-12">
        
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-xl shadow-black/40">
            <span className="text-3xl leading-none">☕</span>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
            Buy Me a Coffee
          </h1>

          <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
            PdfFinalBoss is completely free and open source. If this project has helped you save time, consider supporting its development. Every contribution helps improve the project and keeps it free for everyone.
          </p>
        </div>

        {/* Exactly Two Cards Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* CARD 1: International Support */}
          <Card className="bg-zinc-950 border-zinc-900 flex flex-col justify-between hover:border-zinc-800 transition-colors shadow-2xl shadow-black/50 p-6">
            <CardHeader className="p-0 mb-6">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-zinc-400" />
                  <span>🌍 International Support</span>
                </CardTitle>
              </div>
              <CardDescription className="text-zinc-400 text-xs leading-relaxed">
                Support me internationally using Ko-fi.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 flex-1">
              <div className="mb-6">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-2.5">Accepted Methods</span>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  {["Credit Card", "PayPal", "Apple Pay", "Google Pay"].map((method) => (
                    <div key={method} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-900">
                      <div className="w-1 h-1 rounded-full bg-zinc-500" />
                      <span>{method}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-0 border-t-0 bg-transparent pt-4">
              <Button asChild className="w-full h-10 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg shadow-lg cursor-pointer">
                <a 
                  href="https://ko-fi.com/ashishsharma11" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5"
                >
                  <span>Buy me a Coffee</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            </CardFooter>
          </Card>

          {/* CARD 2: India Support */}
          <Card className="bg-zinc-950 border-zinc-900 flex flex-col justify-between hover:border-zinc-800 transition-colors shadow-2xl shadow-black/50 p-6">
            <CardHeader className="p-0 mb-6">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-zinc-400" />
                  <span>🇮🇳 India Support</span>
                </CardTitle>
              </div>
              <CardDescription className="text-zinc-400 text-xs leading-relaxed">
                Support using Razorpay Checkout.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col gap-6">
              {/* Preset buttons */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-2.5">Amount</span>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[100, 250, 500].map((amt) => (
                    <Button
                      key={amt}
                      variant="outline"
                      onClick={() => {
                        setPresetAmount(amt);
                        setCustomAmount("");
                      }}
                      className={`h-9 text-xs border rounded-lg ${
                        presetAmount === amt && !customAmount
                          ? "bg-white text-black border-white"
                          : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
                      }`}
                    >
                      ₹{amt}
                    </Button>
                  ))}
                </div>
                
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">₹</span>
                  <Input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setPresetAmount(0);
                    }}
                    placeholder="Enter custom amount"
                    className="h-9 bg-zinc-900 border-zinc-800 pl-6 text-xs text-white focus-visible:ring-1 focus-visible:ring-zinc-500 focus-visible:border-zinc-500 rounded-lg placeholder:text-zinc-600"
                    min="1"
                  />
                </div>
              </div>

              {/* UPI ID Info with Copy and QR fallbacks */}
              <div className="bg-zinc-900/50 border border-zinc-900 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">UPI ID Fallback</span>
                    <span className="text-xs font-mono text-white mt-0.5">{upiId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon-xs"
                      onClick={handleCopyUpiId}
                      title="Copy UPI ID"
                      className="text-zinc-400 hover:text-white"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon-xs"
                      onClick={() => setShowQrCode(!showQrCode)}
                      title="Toggle QR Code fallback"
                      className={`text-zinc-400 hover:text-white ${showQrCode ? 'text-[#FF5E5B]' : ''}`}
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
                      className="overflow-hidden flex flex-col items-center"
                    >
                      <div className="bg-white p-2 rounded-xl border border-zinc-800 shadow-xl mt-2 select-none">
                        <img 
                          src={qrCodeImageUrl} 
                          alt="UPI Donation QR Code" 
                          width="180" 
                          height="180"
                          className="rounded-lg pointer-events-none"
                        />
                      </div>
                      <span className="text-[9px] text-zinc-500 mt-2">Scan with GPay, PhonePe, Paytm, BHIM</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-2">Accepted methods</span>
                <div className="flex flex-wrap gap-1 text-[10px] text-zinc-400">
                  {["UPI", "Google Pay", "PhonePe", "Paytm", "Cards", "Wallets", "Net Banking"].map((item) => (
                    <span key={item} className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-900">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-0 border-t-0 bg-transparent pt-4">
              <Button 
                onClick={handleRazorpayPayment}
                disabled={isProcessing}
                className="w-full h-10 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold rounded-lg cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span>Support via UPI</span>
                    <Zap className="w-3.5 h-3.5 text-zinc-900" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

        </div>

        {/* Dynamic Verification Celebration Overlay */}
        <AnimatePresence>
          {paymentSuccess && successDetails && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
            >
              <div className="max-w-sm w-full bg-zinc-950 border border-zinc-900 p-8 rounded-2xl text-center relative shadow-2xl">
                <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-5">
                  <ShieldCheck className="w-6 h-6 text-zinc-300" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Transaction Success</h3>
                <p className="text-zinc-400 text-xs mb-6">
                  You contributed <span className="text-white font-semibold">₹{successDetails.amount}</span>. Thank you for keeping PdfFinalBoss free and open source.
                </p>

                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-left text-[10px] mb-6 font-mono text-zinc-400 flex flex-col gap-1 select-all">
                  <div><span className="text-zinc-600">ID:</span> {successDetails.paymentId}</div>
                  <div><span className="text-zinc-600">Status:</span> SECURED</div>
                </div>

                <Button
                  onClick={() => {
                    setPaymentSuccess(false);
                    setSuccessDetails(null);
                    setIsProcessing(false);
                  }}
                  className="w-full h-9 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg cursor-pointer"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Why Support Section (4 feature cards) */}
        <div>
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Why support PdfFinalBoss?</h2>
            <p className="text-xs text-zinc-500">Your contributions maintain high-speed developer environments with zero barrier entry.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-colors flex gap-4">
              <div className="w-9 h-9 shrink-0 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800">
                <span className="text-sm">🚀</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Faster updates</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Funding development of processing algorithms and keeping the toolbox expanding.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-colors flex gap-4">
              <div className="w-9 h-9 shrink-0 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800">
                <span className="text-sm">🔒</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Better PDF tools</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Securing testing environments to build merges, compressors, and editor tools.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-colors flex gap-4">
              <div className="w-9 h-9 shrink-0 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800">
                <span className="text-sm">🌍</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Hosting & Domain</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Covering network costs, SSLs, sandbox CPU caches, and custom domains.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-colors flex gap-4">
              <div className="w-9 h-9 shrink-0 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800">
                <span className="text-sm">❤️</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Support Open Source</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Encouraging free toolchains completely clean of cookies, tracking, or ads.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* FAQ Area */}
        <div>
          <div className="text-center max-w-xl mx-auto mb-6">
            <h2 className="text-lg font-bold text-white">Frequently Asked Questions</h2>
          </div>

          <div className="max-w-2xl mx-auto bg-zinc-950 border border-zinc-900 rounded-2xl p-4">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-zinc-900">
                  <AccordionTrigger className="text-xs font-semibold py-3 text-zinc-200 hover:text-white hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-zinc-400 leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Footer (Dynamic repository stars + thank you message) */}
        <footer className="border-t border-zinc-900 pt-10 pb-6 flex flex-col items-center text-center gap-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-zinc-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col items-center">
            <Heart className="w-6 h-6 text-zinc-500 mb-4 animate-pulse" />
            <h3 className="text-base font-bold text-white mb-2">Thank you for your support</h3>
            <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
              PdfFinalBoss is run entirely by an individual developer. Your support, stars, and pull requests keep open-source values alive.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-950 border border-zinc-900 p-4 rounded-2xl">
            <div className="text-left">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">GitHub Repository</span>
              <a 
                href="https://github.com/ashishgit4/PdfFinalBoss" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs font-mono text-white hover:underline flex items-center gap-1"
              >
                <span>github.com/ashishgit4/PdfFinalBoss</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
            <div className="h-px sm:h-8 w-8 sm:w-px bg-zinc-900" />
            <Button asChild className="h-9 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold rounded-lg cursor-pointer">
              <a 
                href="https://github.com/ashishgit4/PdfFinalBoss" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5"
              >
                <Star className="size-3.5 fill-current" />
                <span>Star on GitHub</span>
                <span className="text-[10px] bg-zinc-900 text-white px-2 py-0.5 rounded-full font-mono shrink-0 ml-1.5">
                  {gitHubStars !== null ? gitHubStars : "50+"}
                </span>
              </a>
            </Button>
          </div>

          <div className="text-[10px] text-zinc-600 font-mono mt-4">
            PdfFinalBoss Project — Licensed under GPL.
          </div>
        </footer>

      </main>
    </div>
  );
}

const faqItems = [
  {
    q: "Where does my donation money go?",
    a: "Every donation directly funds server hosting costs, domain renewals, API bandwidth usage, and ongoing feature development. Keeping PdfFinalBoss 100% free with no ads is my main priority."
  },
  {
    q: "Are domestic and international payments separate?",
    a: "Yes. Due to gateway constraints, international users are recommended to use Ko-fi (supports global cards, Apple Pay, Google Pay, PayPal). Users in India can support directly using UPI and net banking via Razorpay."
  },
  {
    q: "Is my payment safe?",
    a: "Yes, completely. All transaction workflows occur on SSL-secured sandboxes. Razorpay handles domestic banking security, while Ko-fi routes billing through secure international networks. Your financial details never touch my servers."
  },
  {
    q: "Can I contribute to the codebase instead?",
    a: "Absolutely! PdfFinalBoss is open-source. You can submit pull requests, report issues, or suggest improvements on our GitHub repository."
  }
];

export default BuyMeCoffeePage;
