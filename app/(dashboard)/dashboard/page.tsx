"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useHospital } from "@/context/HospitalContext";
import StatCard from "@/components/dashboard/StatCard";
import PageHeader from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { getGreeting } from "@/lib/utils";
import { UserRole } from "@/types/common";

// Quick action tiles
const QUICK_ACTIONS = [
  {
    label: "Book appointment",
    href: "/appointments",
    description: "Schedule a new patient visit",
    roles: [UserRole.ADMIN, UserRole.DOCTOR],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/>
      </svg>
    ),
  },
  {
    label: "Add patient",
    href: "/patients",
    description: "Register a new patient record",
    roles: [UserRole.ADMIN, UserRole.DOCTOR],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
      </svg>
    ),
  },
  {
    label: "Create invoice",
    href: "/invoices",
    description: "Draft a billing invoice",
    roles: [UserRole.ADMIN],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
  },
  {
    label: "Manage doctors",
    href: "/doctors",
    description: "View schedules and leaves",
    roles: [UserRole.ADMIN],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

// Placeholder stats — these will be replaced with real API calls in the filled page
const STATS = [
  {
    label: "Today's appointments",
    value: "—",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    label: "Active doctors",
    value: "—",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    label: "Patients registered",
    value: "—",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    label: "Pending invoices",
    value: "—",
    accent: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { hospital } = useHospital();

  const greeting = getGreeting();
  const firstName = user?.first_name ?? "there";

  const visibleActions = QUICK_ACTIONS.filter(
    (a) => !user?.role || a.roles.includes(user.role as UserRole)
  );

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${firstName}`}
        subtitle={hospital?.name ? `${hospital.name} · Operations overview` : "Operations overview"}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            accent={s.accent}
          />
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {visibleActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card
                padding="md"
                className="h-full flex flex-col gap-3 cursor-pointer hover:border-[var(--accent-muted)] hover:shadow-md transition-all duration-150 group"
              >
                <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:text-white transition-colors duration-150">
                  {action.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{action.label}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{action.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity placeholder — will be replaced when feature pages are built */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Recent activity</h2>
        <Card padding="lg" className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="w-10 h-10 rounded-full bg-[var(--gray-100)] flex items-center justify-center text-[var(--text-muted)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">No recent activity</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Activity will appear here once appointments and invoices are created.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
