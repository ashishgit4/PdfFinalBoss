import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { BuyMeCoffee } from "@/components/BuyMeCoffee";

export function Home() {
  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-hidden selection:bg-rose-500/20 selection:text-rose-500">
      <Navbar />
      <main>
        <Hero />
        <Features />
        
        {/* Security Section (Resolving Navbar anchor link) */}
        <section id="security" className="py-20 bg-muted/20 border-y border-border/40 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center relative z-10">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground mb-4">
              Premium-Grade PDF Security
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8 font-medium">
              We process files locally when possible, and any server-side processing is done in isolated, highly secure, temporary environments. We do not store your documents or decrypt passwords permanently.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
              <div className="flex flex-col items-center p-6 bg-card/30 border border-border/30 rounded-2xl">
                <span className="text-3xl mb-2" role="img" aria-label="Lock">🔒</span>
                <h4 className="font-bold text-foreground mb-1">End-to-End SSL</h4>
                <p className="text-xs text-muted-foreground">Encrypted connections for all transfers.</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-card/30 border border-border/30 rounded-2xl">
                <span className="text-3xl mb-2" role="img" aria-label="Shield">🛡️</span>
                <h4 className="font-bold text-foreground mb-1">Secure Sandboxes</h4>
                <p className="text-xs text-muted-foreground">Standardized secure hosting practices.</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-card/30 border border-border/30 rounded-2xl">
                <span className="text-3xl mb-2" role="img" aria-label="Clock">⏱️</span>
                <h4 className="font-bold text-foreground mb-1">Instant Wipe</h4>
                <p className="text-xs text-muted-foreground">Automatic document purge on processing.</p>
              </div>
            </div>
          </div>
        </section>

        <FAQ />
      </main>
      <Footer />
      <BuyMeCoffee />
    </div>
  );
}
export default Home;
