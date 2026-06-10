"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border)] bg-white/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--accent)] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2v4M8 10v4M2 8h4M10 8h4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="font-semibold text-[var(--text-primary)] tracking-tight text-lg">
            MedFlow
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            How it works
          </a>
          <a href="#contact" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            Contact
          </a>
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/login">
            <Button variant="primary" size="sm">Login to portal</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--gray-100)]"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={cn(
        "md:hidden border-t border-[var(--border)] bg-white overflow-hidden transition-all duration-200",
        mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
      )}>
        <nav className="px-6 py-4 flex flex-col gap-3">
          <a href="#features" className="text-sm text-[var(--text-secondary)] py-2" onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#how-it-works" className="text-sm text-[var(--text-secondary)] py-2" onClick={() => setMobileOpen(false)}>How it works</a>
          <a href="#contact" className="text-sm text-[var(--text-secondary)] py-2" onClick={() => setMobileOpen(false)}>Contact</a>
          <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" size="md" className="w-full">Sign in</Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}