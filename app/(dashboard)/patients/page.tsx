"use client";

import PageHeader from "@/components/dashboard/PageHeader";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// TODO (8e-3): Fill this page with:
// - Patient list with search by name / phone
// - Create patient form (User + Patient in one transaction)
// - Patient detail drawer: appointment history
// API calls:
//   GET  /api/v1/patients
//   POST /api/v1/patients
//   GET  /api/v1/patients/{id}/appointments

export default function PatientsPage() {
  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle="Search and manage patient records"
        actions={
          <Button variant="primary" size="sm">
            Add patient
          </Button>
        }
      />

      <Card padding="lg" className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Patients — coming next</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
            Patient list with name/phone search, registration form, and appointment history will be built here.
          </p>
        </div>
      </Card>
    </div>
  );
}
