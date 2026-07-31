import { UploadCard } from "@/components/UploadCard";
import { FileLock2 } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 lg:pt-32 lg:pb-28">
      {/* Dynamic Glowing Gradients */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 h-[350px] w-[500px] sm:w-[600px] md:w-[800px] rounded-full bg-gradient-to-tr from-rose-500/10 via-violet-600/10 to-blue-500/5 blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 left-1/3 -translate-x-1/2 h-[200px] w-[300px] rounded-full bg-violet-600/10 blur-3xl pointer-events-none -z-10 animate-pulse" style={{ animationDuration: "6s" }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Decorative Badge */}
        <div className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full border border-rose-500/25 bg-rose-500/5 px-3 py-1.5 text-xs font-bold text-rose-500 shadow-sm shadow-rose-500/5">
          <FileLock2 className="h-3.5 w-3.5" />
          <span>Secure PDF Tool</span>
        </div>

        {/* Heading */}
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground mb-6 leading-[1.1]">
          Unlock Password Protected PDFs —{" "}
          <span className="bg-gradient-to-r from-rose-500 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
            100% Free
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed font-medium">
          Upload your encrypted PDF, enter the correct password, and download an unlocked PDF in seconds.
          No sign-up. No watermarks. Free forever.
        </p>

        {/* Central Upload Card */}
        <div className="relative mx-auto max-w-2xl px-2">
          {/* Subtle glow behind card */}
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-violet-500/10 rounded-[32px] blur-xl opacity-75 pointer-events-none" />
          <UploadCard />
        </div>
      </div>
    </section>
  );
}
