import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Home } from "@/pages/Home";
import { warmUpBackend } from "@/services/api";

const BuyMeCoffeePage = lazy(() => import("@/pages/BuyMeCoffeePage"));

export function App() {
  useEffect(() => {
    // Pre-warm backend cold starts asynchronously on page load
    warmUpBackend();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="theme">
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/buy-me-a-coffee" element={<BuyMeCoffeePage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="top-center" closeButton richColors />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
