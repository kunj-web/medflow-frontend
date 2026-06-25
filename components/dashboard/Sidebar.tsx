"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/common";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  roles: UserRole[];
  icon: React.ReactNode;
}

const NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    label: "Appointments",
    href: "/appointments",
    roles: [UserRole.ADMIN, UserRole.DOCTOR, UserRole.PATIENT],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    label: "Doctors",
    href: "/doctors",
    roles: [UserRole.ADMIN],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    label: "Review",
    href: "/admin-review",
    roles: [UserRole.ADMIN],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    label: "Patients",
    href: "/patients",
    roles: [UserRole.ADMIN, UserRole.DOCTOR],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    label: "Invoices",
    href: "/invoices",
    roles: [UserRole.ADMIN],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleNav = NAV.filter(
    (item) => !user?.role || item.roles.includes(user.role as UserRole)
  );

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col border-r border-[var(--border)] bg-white">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[var(--border)] shrink-0">
        <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] flex items-center justify-center">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v4M8 10v4M2 8h4M10 8h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="font-semibold text-sm text-[var(--text-primary)] tracking-tight truncate">
          MedFlow
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
        {visibleNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors duration-100",
                active
                  ? "bg-[var(--accent-light)] text-[var(--accent)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--gray-100)] hover:text-[var(--text-primary)]"
              )}
            >
              <span className={cn("shrink-0", active ? "text-[var(--accent)]" : "text-[var(--gray-400)]")}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user info */}
      <div className="px-3 py-3 border-t border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-[var(--radius-md)] bg-[var(--gray-50)]">
          <div className="w-7 h-7 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-xs font-semibold text-[var(--accent)] shrink-0">
            {user?.first_name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">
              {user?.first_name ?? "User"}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate capitalize">
              {user?.role?.toLowerCase() ?? "—"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
