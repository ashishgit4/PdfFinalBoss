export function Footer() {
  return (
    <footer id="inquiries" className="footer container">
      <div className="footer-content">
        <div className="footer-grid">
          <div className="footer-left">
            <span className="footer-logo">PdfFinalBoss</span>
            <span className="copyright">© 2026 PdfFinalBoss . open source.</span>
          </div>
          
          <div className="footer-center">
            <div className="tech-btn-group">
              <a 
                href="https://github.com/ashishgit4/PdfFinalBoss" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="tech-star-btn"
                title="Star ashishgit4/PdfFinalBoss on GitHub"
              >
                <svg className="star-icon-blue" viewBox="0 0 24 24">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>Star on GitHub</span>
                <span className="tech-divider" />
                <span className="tech-count">45.6k</span>
              </a>

              <a 
                href="https://github.com/ashishgit4" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="tech-follow-btn"
                title="Follow @ashishgit4 on GitHub"
              >
                <svg className="github-icon" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>Follow @ashishgit4</span>
              </a>
            </div>
          </div>
          
          <ul className="footer-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#toolkit">Tools</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="https://github.com/ashishgit4/PdfFinalBoss" target="_blank" rel="noopener noreferrer">GitHub</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
