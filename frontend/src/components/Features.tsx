export function Features() {
  return (
    <>
      {/* Section 1: Three-Card Grid */}
      <section id="features" className="section-grid container reveal">
        <span className="eyebrow">[ Features ]</span>
        <h2 className="section-title">Fast, Secure, and 100% Free.</h2>
        <p className="lead-text">We offer premium PDF decryption capability without pricing models, watermarks, or account logins.</p>
        
        <div className="cards-wrapper">
          <div className="card">
            <span className="card-num">01</span>
            <div className="card-content">
              <h3 className="card-title">Secure Processing</h3>
              <p className="card-description">Files are encrypted with SSL during transfer and run in isolated server instances.</p>
            </div>
          </div>
          <div className="card">
            <span className="card-num">02</span>
            <div className="card-content">
              <h3 className="card-title">Auto Delete</h3>
              <p className="card-description">All uploaded files and parsed outputs are permanently deleted from our disks within 60 minutes.</p>
            </div>
          </div>
          <div className="card">
            <span className="card-num">03</span>
            <div className="card-content">
              <h3 className="card-title">No Limits</h3>
              <p className="card-description">Unlock unlimited document volumes. Supports files up to 100 MB without restriction.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section: Centralized Toolkit (Coming Soon options) */}
      <section id="toolkit" className="section-toolkit container reveal">
        <span className="eyebrow">[ Centralized Hub ]</span>
        <h2 className="section-title">One centralized PDF hub. Fully free.</h2>
        <p className="lead-text">Manage all your document workflows from a single workspace. We are rolling out a full suite of document controls, completely free, with no accounts required.</p>
        
        <div className="tools-grid">
          {/* Tool 1: Active */}
          <div className="tool-card">
            <span className="tool-badge active">Active</span>
            <h3 className="tool-title">Unlock PDF</h3>
            <p className="tool-desc">Bypass owner restrictions and open-passwords instantly.</p>
          </div>
          
          {/* Tool 2: Active */}
          <div className="tool-card">
            <span className="tool-badge active">Active</span>
            <h3 className="tool-title">Lock PDF</h3>
            <p className="tool-desc">Protect your PDF documents with AES-256 secure encryption.</p>
          </div>

          {/* Tool 3: Coming Soon */}
          <div className="tool-card">
            <span className="tool-badge soon">Coming Soon</span>
            <h3 className="tool-title">Merge PDF</h3>
            <p className="tool-desc">Combine multiple documents into a single optimized file.</p>
          </div>

          {/* Tool 4: Coming Soon */}
          <div className="tool-card">
            <span className="tool-badge soon">Coming Soon</span>
            <h3 className="tool-title">Compress PDF</h3>
            <p className="tool-desc">Reduce file size without losing text or image resolution.</p>
          </div>
        </div>
      </section>

      {/* Section 2: Pull Quote Band */}
      <section className="section-quote reveal">
        <div className="container">
          <p className="quote-text">“I needed to edit an old contract but forgot it was password protected. Unlocked it in seconds.”</p>
        </div>
      </section>
    </>
  );
}
