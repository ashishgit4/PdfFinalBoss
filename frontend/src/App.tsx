import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Home } from "@/pages/Home";

export function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="theme">
      <Home />
      <Toaster position="top-center" closeButton richColors />
    </ThemeProvider>
  );
}

export default App;
