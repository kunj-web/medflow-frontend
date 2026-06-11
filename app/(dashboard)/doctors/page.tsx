"use client";

import PageHeader from "@/components/dashboard/PageHeader";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// TODO (8e-2): Fill this page with:
// - Doctor list with search + active/inactive filter
// - Create doctor form (User + Doctor in one transaction)
// - Schedule management per doctor (day-of-week + start/end time)
// - Slot viewer: GET /api/v1/doctors/{id}/slots?date=YYYY-MM-DD
// API calls:
//   GET  /api/v1/doctors
//   POST /api/v1/doctors
//   GET  /api/v1/doctors/{id}/slots

export default function DoctorsPage() {
  return (
    <div>
      <PageHeader
        title="Doctors"
        subtitle="Manage doctors, schedules, and leave"
        actions={
          <Button variant="primary" size="sm">
            Add doctor
          </Button>
        }
      />

      <Card padding="lg" className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Doctors — coming next</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
            Doctor list, schedule builder, slot viewer, and leave management will be built here.
          </p>
        </div>
      </Card>
    </div>
  );
}
