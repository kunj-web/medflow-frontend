"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/auth";
import { cn, getInitials } from "@/lib/utils";
import NotificationBell from "@/components/dashboard/NotificationBell";

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title }: TopbarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const displayName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const profileName = displayName || user?.email || "-";
  const initials = getInitials(user?.first_name ?? profileName, user?.last_name);
  const roleLabel = user?.role?.replace("_", " ") ?? "-";

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-[var(--border)] bg-white sticky top-0 z-30">
      <div className="flex items-center gap-2">
        {title ? (
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h1>
        ) : (
          <span className="text-sm text-[var(--text-muted)]">MedFlow</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        <div className="relative">
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--gray-100)] transition-colors"
          aria-label="User menu"
        >
          <div className="w-7 h-7 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-xs font-semibold text-[var(--accent)]">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-medium text-[var(--text-primary)] leading-tight">
              {profileName}
            </p>
            <p className="text-xs text-[var(--text-muted)] capitalize">
              {roleLabel}
            </p>
          </div>
          <svg
            className={cn(
              "w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-150",
              dropdownOpen && "rotate-180"
            )}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-[var(--border)] rounded-[var(--radius-lg)] shadow-lg z-40 py-1 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-[var(--border)]">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                  {user?.email ?? "-"}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate capitalize">
                  {roleLabel}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--gray-100)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--error-bg)] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </header>
  );
}
