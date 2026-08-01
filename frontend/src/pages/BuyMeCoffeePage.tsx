import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coffee, Globe, CreditCard, ArrowLeft, Check, Github, 
  HelpCircle, Heart, Sparkles, ExternalLink, ShieldCheck, 
  Award, Zap, Star 
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { loadRazorpayScript } from "@/lib/payment";

export function BuyMeCoffeePage() {
  const [theme, setTheme] = useState<"day" | "night">("night");
  const [gitHubStars, setGitHubStars] = useState<number | null>(null);
  
  // Razorpay states
  const [presetAmount, setPresetAmount] = useState<number>(250);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [successDetails, setSuccessDetails] = useState<{
    paymentId: string;
    amount: number;
  } | null>(null);

  // FAQ states
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleTheme = () => {
    setTheme(theme === "day" ? "night" : "day");
  };

  useEffect(() => {
    document.documentElement.className = `theme-${theme}`;
  }, [theme]);

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
    toast.info("Initializing secure gateway connection...");

    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your network.");
      }

      // 2. Create Razorpay order on backend
      const response = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount, currency: "INR" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to establish payment order session");
      }

      const orderData = await response.json();
      const keyId = orderData.keyId;

      if (!keyId) {
        throw new Error("Payment configuration error (Missing public Key ID)");
      }

      // 3. Configure Razorpay checkout options
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "PdfFinalBoss Toolkit",
        description: "Support open-source project development",
        image: "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/kofi.svg", // Fallback logo
        order_id: orderData.id,
        handler: async function (response: any) {
          toast.loading("Securing signature verification...");
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
              toast.success("Thank you for your generous support!");
              triggerConfetti();
            } else {
              throw new Error(verificationResult.error || "Payment validation failed");
            }
          } catch (verifyErr: any) {
            console.error("Signature verification error:", verifyErr);
            toast.dismiss();
            toast.error(verifyErr.message || "Failed to confirm secure transaction.");
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
          color: "#FF5E5B",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast.dismiss();
            toast.info("Payment session dismissed.");
          },
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      console.error("Razorpay workflow initiation failed:", err);
      toast.dismiss();
      toast.error(err.message || "An unexpected transaction fault occurred.");
      setIsProcessing(false);
    }
  };

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
      a: "Yes, completely. All transaction workflows occur on SSL-secured sandboxes. Razorpay handles domestic banking security, while Ko-fi routes global billing through secure international standards. Your financial details never touch my servers."
    },
    {
      q: "Can I contribute to the codebase instead?",
      a: "Absolutely! PdfFinalBoss is open-source. You can submit pull requests, report issues, or suggest UI/UX improvements on our GitHub repository."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0907] text-zinc-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-[#FF5E5B]/30 selection:text-white">
      {/* Vercel/Linear Style Ambient Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#FF5E5B]/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <Navbar theme={theme} onToggleTheme={toggleTheme} />

      <main className="flex-1 container max-w-5xl mx-auto px-6 py-12 relative z-10">
        
        {/* Back Link */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors duration-200 group text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Toolkit
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-purple-300 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF5E5B] animate-pulse" />
            <span>Support Open Source</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6 flex items-center justify-center gap-3.5"
          >
            <Coffee className="w-10 h-10 sm:w-14 sm:h-14 text-[#FF5E5B]" />
            <span>Buy Me a Coffee</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto"
          >
            <span className="text-white font-semibold">PdfFinalBoss</span> is a completely free and open-source PDF toolkit. If this project has helped you, consider supporting me. Every donation helps me improve the project and keep it free.
          </motion.p>
        </div>

        {/* Two Support Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          
          {/* Card 1: International Support */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative rounded-3xl bg-white/[0.01] border border-white/[0.06] backdrop-blur-xl p-8 flex flex-col justify-between hover:border-white/[0.1] transition-all duration-300 group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" />
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-semibold tracking-wider uppercase text-purple-400">Card 1</span>
                <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                  <Globe className="w-6 h-6 text-purple-400" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">🌍 International Support</h2>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                Support me from anywhere in the world using Ko-fi. High speed secure processing.
              </p>

              <div className="mb-8">
                <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-500 mb-3">Accepted Methods</h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <Check className="w-3.5 h-3.5 text-[#FF5E5B]" />
                    <span>Credit Cards</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <Check className="w-3.5 h-3.5 text-[#FF5E5B]" />
                    <span>PayPal</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <Check className="w-3.5 h-3.5 text-[#FF5E5B]" />
                    <span>Apple Pay</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <Check className="w-3.5 h-3.5 text-[#FF5E5B]" />
                    <span>Google Pay</span>
                  </div>
                </div>
              </div>
            </div>

            <motion.a 
              href="https://ko-fi.com/ashishsharma11" 
              target="_blank" 
              rel="noopener noreferrer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              <span>Buy me a coffee ☕</span>
              <ExternalLink className="w-4 h-4 text-zinc-800" />
            </motion.a>
          </motion.div>

          {/* Card 2: India Support (Razorpay) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative rounded-3xl bg-white/[0.01] border border-white/[0.06] backdrop-blur-xl p-8 flex flex-col justify-between hover:border-white/[0.1] transition-all duration-300 group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5E5B]/10 rounded-full blur-2xl group-hover:bg-[#FF5E5B]/20 transition-colors" />
            
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-semibold tracking-wider uppercase text-[#FF5E5B]">Card 2</span>
                <div className="p-2.5 rounded-2xl bg-[#FF5E5B]/10 border border-[#FF5E5B]/20">
                  <CreditCard className="w-6 h-6 text-[#FF5E5B]" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">🇮🇳 India Support</h2>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                Support me securely using Razorpay. Directly integrates UPI payment options.
              </p>

              {/* Preset Support Amounts */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-500 mb-3">Choose Support Amount</h3>
                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  {[100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setPresetAmount(amt);
                        setCustomAmount("");
                      }}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        presetAmount === amt && !customAmount
                          ? "bg-[#FF5E5B]/10 border-[#FF5E5B] text-white"
                          : "bg-white/[0.02] border-white/[0.04] text-zinc-400 hover:text-white hover:border-white/[0.1]"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-semibold">₹</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setPresetAmount(0);
                    }}
                    placeholder="Enter custom amount (INR)"
                    className="w-full bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] focus:border-[#FF5E5B] focus:outline-none rounded-xl py-3 pl-8 pr-4 text-sm text-white transition-all font-medium"
                    min="1"
                  />
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-500 mb-3">Accepted UPI & Cards</h3>
                <div className="flex flex-wrap gap-2 text-[10px] text-zinc-400">
                  {["UPI", "Google Pay", "PhonePe", "Paytm", "Cards", "Net Banking", "Wallets"].map((method) => (
                    <span key={method} className="px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <motion.button 
              onClick={handleRazorpayPayment}
              disabled={isProcessing}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-[#FF5E5B] text-white font-semibold hover:bg-[#ff4a47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting to Bank...</span>
                </>
              ) : (
                <>
                  <span>Support with UPI</span>
                  <Zap className="w-4 h-4 text-white" />
                </>
              )}
            </motion.button>
          </motion.div>

        </div>

        {/* Celebration State Overlay */}
        <AnimatePresence>
          {paymentSuccess && successDetails && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 bg-[#0B0907]/90 backdrop-blur-md flex items-center justify-center p-6"
            >
              <div className="max-w-md w-full bg-white/[0.02] border border-white/[0.08] p-8 rounded-3xl text-center relative overflow-hidden">
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#FF5E5B]/10 rounded-full blur-2xl" />
                
                <div className="w-16 h-16 bg-[#FF5E5B]/10 border border-[#FF5E5B]/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-8 h-8 text-[#FF5E5B]" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">🎉 Payment Verified!</h3>
                <p className="text-zinc-400 text-sm mb-6">
                  You supported <span className="text-white font-semibold">₹{successDetails.amount}</span> to the project.
                  Your contribution keeps PdfFinalBoss free and open-source.
                </p>

                <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl text-left text-xs mb-6 font-mono text-zinc-400 flex flex-col gap-1.5">
                  <div><span className="text-zinc-500">Transaction ID:</span> {successDetails.paymentId}</div>
                  <div><span className="text-zinc-500">Status:</span> Secure/Success</div>
                </div>

                <button
                  onClick={() => {
                    setPaymentSuccess(false);
                    setSuccessDetails(null);
                    setIsProcessing(false);
                  }}
                  className="w-full py-3 bg-[#FF5E5B] hover:bg-[#ff4a47] text-white font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Why Support Section */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Why Support the Project?</h2>
            <p className="text-sm text-zinc-400">
              Maintaining a cloud platform with zero advertisements requires sustainable hosting practices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
              <Zap className="w-8 h-8 text-yellow-400 mb-4" />
              <h3 className="text-base font-bold text-white mb-2">Instant Decryption Array</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Hosting sandboxed system arrays running qpdf demands processing bandwidth. Your funds secure higher CPU nodes.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
              <Award className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-base font-bold text-white mb-2">Zero Data Storage</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Maintaining data privacy rules means we clean cache arrays every 60 minutes. Your support guarantees security standards.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
              <Heart className="w-8 h-8 text-pink-400 mb-4" />
              <h3 className="text-base font-bold text-white mb-2">Free & Open Source</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                No paywalls, subscription models, or watermarks. Donations ensure development keeps progressing transparently.
              </p>
            </div>
          </div>
        </div>

        {/* GitHub Repository Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-white/[0.06] p-8 md:p-12 mb-20 overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500" />
          
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-4 border border-indigo-500/20">
              <Github className="w-3.5 h-3.5" />
              <span>Official Repository</span>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">PdfFinalBoss Codebase</h2>
            <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
              Unlock, inspect, fork, or host the repository yourself. Our source code is fully compliant with GPL open-source licensing.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center shrink-0">
            <a 
              href="https://github.com/ashishgit4/PdfFinalBoss" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-4.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.15] text-zinc-300 hover:text-white transition-all cursor-pointer text-sm font-semibold"
            >
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span>{gitHubStars !== null ? `${gitHubStars} Stars` : "50+ Stars"}</span>
            </a>
            
            <a 
              href="https://github.com/ashishgit4/PdfFinalBoss" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-4.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer text-sm font-semibold shadow-lg shadow-indigo-600/20"
            >
              <span>Inspect Source</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Frequently Asked Questions</h2>
            <p className="text-sm text-zinc-400">Everything you need to know about supporting PdfFinalBoss.</p>
          </div>

          <div className="max-w-3xl mx-auto bg-white/[0.01] border border-white/[0.04] rounded-3xl p-6">
            <div className="divide-y divide-white/[0.04]">
              {faqItems.map((item, index) => (
                <div key={index} className="py-4.5">
                  <button 
                    onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                    className="w-full flex items-center justify-between text-left text-zinc-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-sm">{item.q}</span>
                    <HelpCircle className={`w-4 h-4 text-zinc-500 transform transition-transform duration-300 ${faqOpen === index ? 'rotate-180 text-[#FF5E5B]' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {faqOpen === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Thank You Section */}
        <div className="text-center max-w-xl mx-auto py-12 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#FF5E5B]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-12 h-12 bg-[#FF5E5B]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#FF5E5B]/20">
            <Heart className="w-5 h-5 text-[#FF5E5B]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Thank You for Believing in Us</h2>
          <p className="text-xs text-zinc-400 leading-relaxed mb-6">
            PdfFinalBoss is run entirely by an individual developer. Your presence, stars, and donations are a major motivator to build high-quality, zero-ad developer utilities.
          </p>

          <div className="text-[10px] text-zinc-500 font-mono">
            PdfFinalBoss Project — Handcrafted with precision.
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
export default BuyMeCoffeePage;
