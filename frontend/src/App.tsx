import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Home } from "@/pages/Home";
import { BuyMeCoffeePage } from "@/pages/BuyMeCoffeePage";

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="theme">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/buy-me-a-coffee" element={<BuyMeCoffeePage />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" closeButton richColors />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
