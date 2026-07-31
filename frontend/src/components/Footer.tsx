import { FileLock2, Github, Coffee, ArrowUpRight } from "lucide-react";
import { GITHUB_URL } from "@/components/Navbar";
import { BUY_ME_COFFEE_URL } from "@/components/BuyMeCoffee";

const PORTFOLIO_URL = "#";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-muted/20 py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 max-w-6xl mx-auto">
          {/* Logo & Branding column */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <a href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-rose-500 to-violet-600 text-white shadow-md">
                <FileLock2 className="h-4 w-4" />
              </div>
              <span className="font-extrabold">UnlockPDF</span>
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Unlock password protected PDFs online quickly and securely. Free forever, no watermarks, no registration.
            </p>
          </div>

          {/* Product Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Product</h4>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </div>

          {/* Support Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Support</h4>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
          </div>

          {/* Community Column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Community</h4>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Github className="h-3.5 w-3.5" /> GitHub <ArrowUpRight className="h-3 w-3 opacity-60" />
            </a>
            <a
              href={BUY_ME_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Coffee className="h-3.5 w-3.5" /> Buy Me a Coffee <ArrowUpRight className="h-3 w-3 opacity-60" />
            </a>
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Portfolio <ArrowUpRight className="h-3 w-3 opacity-60" />
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40 pt-8 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} UnlockPDF. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            Made with <span className="text-rose-500 animate-pulse">❤️</span> using React + Node.js
          </p>
        </div>
      </div>
    </footer>
  );
}
