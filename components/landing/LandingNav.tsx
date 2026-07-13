"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-5 inset-x-0 z-50 px-4">
      <div className="max-w-6xl mx-auto px-7 h-[72px] flex items-center justify-between rounded-[24px] bg-white/95 shadow-[0_18px_45px_rgba(4,47,64,0.10)] backdrop-blur-md">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-[#0a6289] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2v4M8 10v4M2 8h4M10 8h4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="font-semibold text-[#053746] tracking-tight text-xl">
            MedFlow
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="/" className="text-sm font-medium text-[#052f3a] hover:text-[#0a9f9b] transition-colors">
            Home
          </a>
          <a href="#features" className="text-sm font-medium text-[#052f3a] hover:text-[#0a9f9b] transition-colors">
            About
          </a>
          <a href="#features" className="text-sm font-medium text-[#052f3a] hover:text-[#0a9f9b] transition-colors">
            Services
          </a>
          <a href="/appointments" className="text-sm font-medium text-[#052f3a] hover:text-[#0a9f9b] transition-colors">
            Appointments
          </a>
          <a href="#contact" className="text-sm font-medium text-[#052f3a] hover:text-[#0a9f9b] transition-colors">
            Contact
          </a>
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/register">
            <Button
              variant="ghost"
              size="sm"
              className="h-11 rounded-full px-5 text-[#052f3a] hover:bg-[#e7f5f7]"
            >
              Sign up
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="primary"
              size="sm"
              className="h-11 rounded-full bg-[#18b7ae] px-5 text-white hover:bg-[#109d97]"
            >
              Login
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-[var(--radius-md)] text-[#052f3a] hover:bg-[#e7f5f7]"
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
        "md:hidden max-w-6xl mx-auto mt-2 rounded-[20px] bg-white overflow-hidden shadow-[0_18px_45px_rgba(4,47,64,0.10)] transition-all duration-200",
        mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
      )}>
        <nav className="px-6 py-4 flex flex-col gap-3">
          <a href="/" className="text-sm text-[#052f3a] py-2" onClick={() => setMobileOpen(false)}>Home</a>
          <a href="#features" className="text-sm text-[#052f3a] py-2" onClick={() => setMobileOpen(false)}>About</a>
          <a href="#features" className="text-sm text-[#052f3a] py-2" onClick={() => setMobileOpen(false)}>Services</a>
          <a href="/appointments" className="text-sm text-[#052f3a] py-2" onClick={() => setMobileOpen(false)}>Appointments</a>
          <a href="#contact" className="text-sm text-[#052f3a] py-2" onClick={() => setMobileOpen(false)}>Contact</a>
          <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-2">
            <Link href="/register" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" size="md" className="w-full rounded-full">
                Sign up
              </Button>
            </Link>
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="primary" size="md" className="w-full rounded-full bg-[#18b7ae] hover:bg-[#109d97]">
                Login
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
