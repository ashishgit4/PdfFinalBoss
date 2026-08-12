export function Footer() {
  return (
    <footer id="inquiries" className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-grid">
            <div className="footer-left">
              <div className="footer-brand-row">
                <span className="footer-logo">PdfFinalBoss</span>
                <span className="version-badge">v1.0.0</span>
              </div>
              <span className="copyright">© 2026 PdfFinalBoss. Open Source • Privacy First.</span>
            </div>
            
            <div className="footer-center">
              {/* Logo 1: Star Logo */}
              <a 
                href="https://github.com/ashishgit4/PdfFinalBoss" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-icon-link" 
                aria-label="Star on GitHub"
                title="Star on GitHub"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "20px", height: "20px" }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </a>

              {/* Logo 2: GitHub Logo */}
              <a 
                href="https://github.com/ashishgit4/PdfFinalBoss" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-icon-link" 
                aria-label="GitHub Repository"
                title="GitHub Repository"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "20px", height: "20px" }}>
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>

              {/* Logo 3: Coffee Logo */}
              <a 
                href="https://ko-fi.com/ashishsharma11" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="footer-icon-link" 
                aria-label="Buy me a Ko-fi"
                title="Buy me a Ko-fi"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "20px", height: "20px" }}>
                  <path d="M11.351 2.715c-2.7 0-4.986.025-6.83.26C2.078 3.285 0 5.154 0 8.61c0 3.506.182 6.13 1.585 8.493 1.584 2.701 4.233 4.182 7.662 4.182h.83c4.209 0 6.494-2.234 7.637-4a9.5 9.5 0 0 0 1.091-2.338C21.792 14.688 24 12.22 24 9.208v-.415c0-3.247-2.13-5.507-5.792-5.87-1.558-.156-2.65-.208-6.857-.208m0 1.947c4.208 0 5.09.052 6.571.182 2.624.311 4.13 1.584 4.13 4v.39c0 2.156-1.792 3.844-3.87 3.844h-.935l-.156.649c-.208 1.013-.597 1.818-1.039 2.546-.909 1.428-2.545 3.064-5.922 3.064h-.805c-2.571 0-4.831-.883-6.078-3.195-1.09-2-1.298-4.155-1.298-7.506 0-2.181.857-3.402 3.012-3.714 1.533-.233 3.559-.26 6.39-.26m6.547 2.287c-.416 0-.65.234-.65.546v2.935c0 .311.234.545.65.545 1.324 0 2.051-.754 2.051-2s-.727-2.026-2.052-2.026m-10.39.182c-1.818 0-3.013 1.48-3.013 3.142 0 1.533.858 2.857 1.949 3.897.727.701 1.87 1.429 2.649 1.896a1.47 1.47 0 0 0 1.507 0c.78-.467 1.922-1.195 2.623-1.896 1.117-1.039 1.974-2.364 1.974-3.897 0-1.662-1.247-3.142-3.039-3.142-1.065 0-1.792.545-2.338 1.298-.493-.753-1.246-1.298-2.312-1.298"/>
                </svg>
              </a>
            </div>
            
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#toolkit">Tools</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="https://github.com/ashishgit4/PdfFinalBoss" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
