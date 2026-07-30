import { useState } from "react";
import { FileLock2, Github, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export const GITHUB_URL = "#";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "FAQ", href: "#faq" },
    { label: "Security", href: "#security" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground hover:opacity-90 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-violet-600 text-white shadow-md shadow-rose-500/20">
            <FileLock2 className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent font-extrabold">
            UnlockPDF
          </span>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-full w-9 h-9 border border-border/40 hover:bg-muted/50 cursor-pointer"
          >
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository">
              <Github className="h-5 w-5 text-foreground" />
            </a>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-xl w-9 h-9 border border-border/40"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-border/40 bg-background/95 backdrop-blur-lg animate-in fade-in slide-in-from-top-5 duration-200">
          <nav className="flex flex-col gap-4 p-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
            <hr className="border-border/40" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">GitHub Project</span>
              <Button variant="outline" size="sm" asChild className="gap-2 cursor-pointer">
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" /> Code
                </a>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
