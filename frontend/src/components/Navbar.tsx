interface NavbarProps {
  theme: "day" | "night";
  onToggleTheme: () => void;
}

export function Navbar({ theme, onToggleTheme }: NavbarProps) {
  return (
    <header className="navbar container">
      {/* Left: Logo Badge + Brand */}
      <div className="navbar-left">
        <a href="#" className="nav-logo" aria-label="PdfFinalBoss Home">
          <span className="nav-logo-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </span>
          <span className="logo-text">PdfFinalBoss</span>
        </a>
      </div>

      {/* Center: Monospace / Tracked Navigation Links */}
      <nav className="navbar-center">
        <ul className="nav-links">
          <li className="rise" style={{ animationDelay: "100ms" }}><a href="#features">FEATURES</a></li>
          <li className="rise" style={{ animationDelay: "200ms" }}><a href="#toolkit">TOOLS</a></li>
          <li className="rise" style={{ animationDelay: "300ms" }}><a href="#faq">FAQ</a></li>
          <li className="rise" style={{ animationDelay: "400ms" }}><a href="#security">SECURITY</a></li>
        </ul>
      </nav>

      {/* Right: Tech Action Buttons (Star on GitHub | Follow @ashishgit4 | Theme toggle) */}
      <div className="navbar-right">
        <div className="tech-btn-group">
          {/* Button 1: Star on GitHub with count divider */}
          <a 
            href="https://github.com/ashishgit4/PdfFinalBoss" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="tech-star-btn rise"
            style={{ animationDelay: "450ms" }}
            title="Star ashishgit4/PdfFinalBoss on GitHub"
          >
            <svg className="star-icon-blue" viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>Star on GitHub</span>
            <span className="tech-divider" />
            <span className="tech-count">45.6k</span>
          </a>

          {/* Button 2: Follow @ashishgit4 */}
          <a 
            href="https://github.com/ashishgit4" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="tech-follow-btn rise"
            style={{ animationDelay: "500ms" }}
            title="Follow @ashishgit4 on GitHub"
          >
            <svg className="github-icon" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span>Follow @ashishgit4</span>
          </a>
        </div>

        {/* Theme Toggle Box */}
        <button 
          onClick={onToggleTheme} 
          className="nav-action-box theme-toggle-box rise" 
          style={{ animationDelay: "550ms" }}
          aria-label="Toggle Theme"
        >
          {theme === "day" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "16px", height: "16px" }}>
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "16px", height: "16px" }}>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}

export default Navbar;
