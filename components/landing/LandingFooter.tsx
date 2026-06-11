import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer id="contact" className="bg-white border-t border-[var(--border)] py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] flex items-center justify-center">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v4M8 10v4M2 8h4M10 8h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-semibold text-[var(--text-primary)]">MedFlow</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] max-w-xs">
              Hospital operations platform. Multi-tenant, API-first, built for Indian healthcare.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-6">
            <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              How it works
            </a>
            <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Sign in
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} MedFlow. All rights reserved.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Secured. Multi-tenant. RBAC enforced.
          </p>
        </div>
      </div>
    </footer>
  );
}
