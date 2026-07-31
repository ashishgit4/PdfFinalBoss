import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { BuyMeCoffee } from "@/components/BuyMeCoffee";

export function Home() {
  const [theme, setTheme] = useState<"day" | "night">("night");

  const toggleTheme = () => {
    setTheme(theme === "day" ? "night" : "day");
  };

  useEffect(() => {
    document.documentElement.className = `theme-${theme}`;
  }, [theme]);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px",
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll(".reveal");
    revealElements.forEach((el) => revealObserver.observe(el));

    return () => {
      revealElements.forEach((el) => revealObserver.unobserve(el));
    };
  }, []);

  return (
    <>
      {/* Content Layer */}
      <div className={`content-wrapper theme-${theme}`}>
        <Navbar theme={theme} onToggleTheme={toggleTheme} />
        
        <main className="main-body">
          {/* Hero Section Wrapper with edge-to-edge background video */}
          <div className="relative w-full overflow-hidden min-h-screen">
            {/* Cinematic Background Video - Always starry night/prisma */}
            <video 
              className="absolute inset-0 w-full h-full object-cover" 
              style={{ zIndex: 0 }}
              src="https://zxdefgavgwfxastwmmjm.supabase.co/storage/v1/object/public/assets/prisma.mp4" 
              autoPlay 
              muted 
              loop 
              playsInline
            />
            {/* Scrim Overlay */}
            <div className="scrim absolute inset-0" style={{ zIndex: 1 }} />
            {/* Vignette Overlay */}
            <div className="vignette absolute inset-0" style={{ zIndex: 2 }} />
            {/* Dark Overlay for Readability */}
            <div 
              className="absolute inset-0 pointer-events-none" 
              style={{ 
                zIndex: 3, 
                background: theme === "day" 
                  ? "rgba(246, 243, 235, 0.4)" 
                  : "rgba(13, 11, 9, 0.55)" 
              }} 
            />
            {/* Hero Content */}
            <div className="relative" style={{ zIndex: 10 }}>
              <Hero />
            </div>
          </div>

          <Features />
          <FAQ />
        </main>

        <Footer />
        <BuyMeCoffee />
      </div>
    </>
  );
}
export default Home;
