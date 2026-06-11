"use client";

import PageHeader from "@/components/dashboard/PageHeader";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// TODO (8e-1): Fill this page with:
// - Paginated appointment table with status + date filters
// - Book appointment modal: select doctor → pick date → pick slot → confirm
// - Cancel appointment dialog with reason input
// API calls:
//   GET  /api/v1/appointments
//   POST /api/v1/appointments
//   POST /api/v1/appointments/{id}/cancel

export default function AppointmentsPage() {
  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="Manage and schedule patient appointments"
        actions={
          <Button variant="primary" size="sm">
            Book appointment
          </Button>
        }
      />

      {/* Placeholder */}
      <Card padding="lg" className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Appointments — coming next</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
            Paginated table, status filters, date picker, booking modal, and cancel flow will be built here.
          </p>
        </div>
      </Card>
    </div>
  );
}
