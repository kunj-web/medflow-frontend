"use client";

import PageHeader from "@/components/dashboard/PageHeader";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// TODO (8e-4): Fill this page with:
// - Invoice list with status filter (DRAFT/ISSUED/PAID/CANCELLED)
// - Create invoice form with dynamic line items (JSONB)
// - Lifecycle actions: issue, pay (partial/full with payment method), cancel
// API calls:
//   GET  /api/v1/invoices
//   POST /api/v1/invoices
//   POST /api/v1/invoices/{id}/issue
//   POST /api/v1/invoices/{id}/pay
//   POST /api/v1/invoices/{id}/cancel

export default function InvoicesPage() {
  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Billing, payments, and invoice lifecycle"
        actions={
          <Button variant="primary" size="sm">
            Create invoice
          </Button>
        }
      />

      <Card padding="lg" className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Invoices — coming next</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
            Invoice list, status filters, line-item builder, and full payment lifecycle will be built here.
          </p>
        </div>
      </Card>
    </div>
  );
}
