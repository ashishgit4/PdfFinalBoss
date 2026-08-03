import { UploadCard } from "@/components/UploadCard";

export function Hero() {
  return (
    <section className="hero container">
      <div className="hero-grid">
        <div className="hero-left">
          <h1 className="rise" style={{ animationDelay: "400ms" }}>
            PdfFinalBoss
          </h1>
        </div>
        <div className="hero-right">
          <p className="sub-line rise" style={{ animationDelay: "560ms" }}>
            Upload your encrypted PDF, enter the correct password, and download an unlocked PDF in seconds. No sign-up. No watermarks. Free forever.
          </p>
          <UploadCard />

          {/* Trust Badges */}
          <div className="trust-indicator-row rise" style={{ animationDelay: "860ms" }}>
            <div className="trust-badge">
              <span className="trust-check">✓</span>
              <span>Secure Processing</span>
            </div>
            <div className="trust-badge">
              <span className="trust-check">✓</span>
              <span>No Registration</span>
            </div>
            <div className="trust-badge">
              <span className="trust-check">✓</span>
              <span>Free Forever</span>
            </div>
            <div className="trust-badge">
              <span className="trust-check">✓</span>
              <span>Fast Unlock</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
