"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FilePlus2,
  IndianRupee,
  ReceiptText,
  Send,
  X,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/Skeleton";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { PaginatedResponse } from "@/types/common";
import {
  Invoice,
  InvoiceCreate,
  InvoiceListParams,
  InvoiceStatus,
  LineItem,
  PaymentMethod,
} from "@/types/invoice";

const PAGE_SIZE = 12;

const STATUS_TABS: { label: string; value: InvoiceStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: InvoiceStatus.DRAFT },
  { label: "Issued", value: InvoiceStatus.ISSUED },
  { label: "Partial", value: InvoiceStatus.PARTIALLY_PAID },
  { label: "Paid", value: InvoiceStatus.PAID },
  { label: "Cancelled", value: InvoiceStatus.CANCELLED },
];

const STATUS_BADGE: Record<InvoiceStatus, { variant: "success" | "warning" | "error" | "neutral" | "info"; label: string }> = {
  [InvoiceStatus.DRAFT]: { variant: "neutral", label: "Draft" },
  [InvoiceStatus.ISSUED]: { variant: "info", label: "Issued" },
  [InvoiceStatus.PARTIALLY_PAID]: { variant: "warning", label: "Partially paid" },
  [InvoiceStatus.PAID]: { variant: "success", label: "Paid" },
  [InvoiceStatus.CANCELLED]: { variant: "error", label: "Cancelled" },
};

const DEFAULT_LINE_ITEM: LineItem = {
  description: "Consultation",
  quantity: 1,
  unit_price: 500,
  amount: 500,
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [status, setStatus] = useState<InvoiceStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params: InvoiceListParams = { page, page_size: PAGE_SIZE };
      if (status !== "ALL") params.status = status;

      const { data } = await api.get<PaginatedResponse<Invoice>>("/api/v1/invoices", {
        params,
      });

      setInvoices(data.data ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.total_pages ?? 1);
    } catch (err) {
      setInvoices([]);
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const subtitle = useMemo(() => {
    if (total > 0) return `${total} invoice${total === 1 ? "" : "s"} in view`;
    return "Billing, payments, and invoice lifecycle";
  }, [total]);
  const invoiceStats = [
    {
      label: "Shown",
      value: invoices.length,
      tone: "bg-[#d9edbd]/80",
    },
    {
      label: "Paid",
      value: invoices.filter((invoice) => invoice.status === InvoiceStatus.PAID).length,
      tone: "bg-[#bfe0f2]/80",
    },
    {
      label: "Balance",
      value: formatCurrency(invoices.reduce((sum, invoice) => sum + invoice.balance_due, 0)),
      tone: "bg-[#ffc2dc]/75",
    },
  ];

  async function refreshSelected(invoiceId: string) {
    const { data } = await api.get<Invoice>(`/api/v1/invoices/${invoiceId}`);
    setSelectedInvoice(data);
    setInvoices((current) => current.map((item) => (item.id === data.id ? data : item)));
  }

  useEffect(() => {
    function openInvoiceFromHash() {
      const invoiceId = window.location.hash.replace("#", "");
      if (!invoiceId) return;
      refreshSelected(invoiceId).catch(() => undefined);
    }

    openInvoiceFromHash();
    window.addEventListener("hashchange", openInvoiceFromHash);
    return () => window.removeEventListener("hashchange", openInvoiceFromHash);
  }, []);

  async function issueInvoice(invoice: Invoice) {
    setActionLoading(true);
    setActionError("");
    try {
      await api.post(`/api/v1/invoices/${invoice.id}/issue`);
      await refreshSelected(invoice.id);
      await fetchInvoices();
    } catch (err) {
      setActionError(parseApiError(err));
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelInvoice(invoice: Invoice) {
    setActionLoading(true);
    setActionError("");
    try {
      await api.post(`/api/v1/invoices/${invoice.id}/cancel`);
      await refreshSelected(invoice.id);
      await fetchInvoices();
    } catch (err) {
      setActionError(parseApiError(err));
    } finally {
      setActionLoading(false);
    }
  }

  function openInvoice(invoice: Invoice) {
    setSelectedInvoice(invoice);
    setActionError("");
    setPayOpen(false);
    refreshSelected(invoice.id).catch(() => undefined);
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Invoices"
        subtitle={subtitle}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
            leftIcon={<FilePlus2 size={14} />}
          >
            Create invoice
          </Button>
        }
      />

      <section className="overflow-hidden rounded-[28px] border border-white/65 bg-[#dceff5]/80 p-5 shadow-[0_20px_60px_rgba(24,86,115,0.12)] backdrop-blur-2xl sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#24708a]">
              Admin billing
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-[#062f3d] sm:text-4xl">
              Manage invoices, payment status, and balances.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#456773]">
              Create invoices for appointments, issue drafts, record payments,
              and track outstanding balances in one place.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {invoiceStats.map((item) => (
              <div
                key={item.label}
                className={`${item.tone} rounded-2xl border border-white/60 px-3 py-4 text-[#062f3d] shadow-sm backdrop-blur-xl`}
              >
                <p className="truncate text-2xl font-semibold leading-none">
                  {loading ? "..." : item.value}
                </p>
                <p className="mt-2 text-xs font-medium text-[#456773]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Card padding="none" className="overflow-hidden border-white/70 bg-white/72 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
        <div className="border-b border-[#d8edf3] bg-[#f8fcfd]/70 px-5 py-4">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-normal text-[#062f3d]">
                Invoice list
              </h2>
              <p className="mt-1 text-sm text-[#55717b]">
                Filter invoices by lifecycle status and open details.
              </p>
            </div>
          </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatus(tab.value);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap",
                  status === tab.value
                    ? "bg-[#0a6792] text-[#eaf8fb] shadow-sm"
                    : "border border-[#d8edf3] bg-white/70 text-[#55717b] hover:bg-[#edf8fb] hover:text-[#062f3d]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="sm:ml-auto" onClick={fetchInvoices} disabled={loading}>
            Refresh
          </Button>
        </div>
        </div>

        {error && (
          <div className="border-b border-red-200 bg-[var(--error-bg)] px-5 py-3">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="px-5 py-6">
            <SkeletonList rows={5} />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8edf3] bg-[#edf8fb] text-[#0a6792]">
              <ReceiptText size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#062f3d]">No invoices found</p>
              <p className="text-xs text-[#55717b] mt-1">
                Create an invoice from a completed or scheduled appointment.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#d8edf3] bg-[#edf8fb]/70">
                  {["Invoice", "Created", "Status", "Total", "Paid", "Balance", ""].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#55717b] whitespace-nowrap first:pl-5 last:pr-5"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => {
                  const badge = STATUS_BADGE[invoice.status];
                  return (
                    <tr
                      key={invoice.id}
                      className={cn(
                        "border-b border-[#d8edf3] transition-colors hover:bg-[#f8fcfd]",
                        index === invoices.length - 1 && "border-b-0"
                      )}
                    >
                      <td className="px-4 py-3 pl-5">
                        <p className="font-semibold text-[#062f3d]">{invoice.invoice_number}</p>
                        <p className="text-xs text-[#55717b]">Appt {invoice.appointment_id.slice(0, 8)}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#456773] whitespace-nowrap">
                        {formatDate(invoice.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badge.variant} dot>{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#456773]">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#456773]">
                        {formatCurrency(invoice.amount_paid)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#456773]">
                        {formatCurrency(invoice.balance_due)}
                      </td>
                      <td className="px-4 py-3 pr-5 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openInvoice(invoice)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#d8edf3] bg-[#f8fcfd]/70 px-5 py-3">
            <p className="text-xs text-[#55717b]">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={14} /> Prev
              </Button>
              <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {createOpen && (
        <CreateInvoiceModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            fetchInvoices();
          }}
        />
      )}

      {selectedInvoice && (
        <InvoiceDrawer
          invoice={selectedInvoice}
          actionError={actionError}
          actionLoading={actionLoading}
          payOpen={payOpen}
          setPayOpen={setPayOpen}
          onClose={() => setSelectedInvoice(null)}
          onIssue={issueInvoice}
          onCancel={cancelInvoice}
          onPaid={async () => {
            setPayOpen(false);
            await refreshSelected(selectedInvoice.id);
            await fetchInvoices();
          }}
        />
      )}
    </div>
  );
}

function CreateInvoiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [appointmentId, setAppointmentId] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ ...DEFAULT_LINE_ITEM }]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const total = Math.max(0, subtotal - discountAmount);

  function updateLineItem(index: number, patch: Partial<LineItem>) {
    setLineItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, ...patch };
        next.quantity = Number(next.quantity) || 1;
        next.unit_price = Number(next.unit_price) || 0;
        next.amount = Number((next.quantity * next.unit_price).toFixed(2));
        return next;
      })
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const payload: InvoiceCreate = {
        appointment_id: appointmentId.trim(),
        line_items: lineItems,
        discount_amount: discountAmount,
        notes: notes.trim() || undefined,
      };

      await api.post("/api/v1/invoices", payload);
      onCreated();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="w-full max-w-2xl bg-white rounded-[var(--radius-xl)] shadow-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Create invoice</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Invoice an existing appointment</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <Input
            label="Appointment ID"
            value={appointmentId}
            onChange={(event) => setAppointmentId(event.target.value)}
            placeholder="Paste appointment UUID"
            required
          />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--text-primary)]">Line items</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLineItems((current) => [...current, { ...DEFAULT_LINE_ITEM }])}
              >
                Add item
              </Button>
            </div>

            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 rounded-[var(--radius-md)] border border-[var(--border)] p-3">
                <input
                  value={item.description}
                  onChange={(event) => updateLineItem(index, { description: event.target.value })}
                  className="col-span-12 sm:col-span-5 h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border)] text-sm"
                  placeholder="Description"
                />
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) => updateLineItem(index, { quantity: Number(event.target.value) })}
                  className="col-span-4 sm:col-span-2 h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border)] text-sm"
                />
                <input
                  type="number"
                  min={0}
                  value={item.unit_price}
                  onChange={(event) => updateLineItem(index, { unit_price: Number(event.target.value) })}
                  className="col-span-4 sm:col-span-2 h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border)] text-sm"
                />
                <div className="col-span-4 sm:col-span-2 h-9 px-3 rounded-[var(--radius-md)] bg-[var(--gray-50)] border border-[var(--border)] text-sm flex items-center">
                  {formatCurrency(item.amount)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="col-span-12 sm:col-span-1"
                  disabled={lineItems.length === 1}
                  onClick={() => setLineItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <X size={14} />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Discount"
              type="number"
              min={0}
              value={discountAmount}
              onChange={(event) => setDiscountAmount(Number(event.target.value) || 0)}
            />
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2">
              <p className="text-xs text-[var(--text-muted)]">Total</p>
              <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{formatCurrency(total)}</p>
            </div>
          </div>

          <textarea
            rows={2}
            placeholder="Notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-sm resize-none"
          />

          {error && <p className="text-sm text-[var(--error)]">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border)] bg-[var(--gray-50)]">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={submitting} disabled={!appointmentId.trim()}>
            Create invoice
          </Button>
        </div>
      </div>
    </div>
  );
}

function InvoiceDrawer({
  invoice,
  actionError,
  actionLoading,
  payOpen,
  setPayOpen,
  onClose,
  onIssue,
  onCancel,
  onPaid,
}: {
  invoice: Invoice;
  actionError: string;
  actionLoading: boolean;
  payOpen: boolean;
  setPayOpen: (open: boolean) => void;
  onClose: () => void;
  onIssue: (invoice: Invoice) => void;
  onCancel: (invoice: Invoice) => void;
  onPaid: () => void;
}) {
  const badge = STATUS_BADGE[invoice.status];
  const canIssue = invoice.status === InvoiceStatus.DRAFT;
  const canPay = invoice.status === InvoiceStatus.ISSUED || invoice.status === InvoiceStatus.PARTIALLY_PAID;
  const canCancel = invoice.status !== InvoiceStatus.PAID && invoice.status !== InvoiceStatus.CANCELLED;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-sm" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="flex h-full w-full max-w-xl flex-col border-l border-white/60 bg-white/82 shadow-[0_24px_70px_rgba(24,86,115,0.22)] backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#d8edf3] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#24708a]">
              Invoice detail
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#062f3d]">{invoice.invoice_number}</h2>
            <p className="mt-1 text-sm text-[#55717b]">Created {formatDateTime(invoice.created_at)}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-2xl text-[#55717b] transition-colors hover:bg-[#edf8fb] hover:text-[#062f3d]"
            aria-label="Close invoice detail"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          {actionError && (
            <div className="rounded-2xl border border-red-200 bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]">
              {actionError}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <Badge variant={badge.variant} dot>{badge.label}</Badge>
            <p className="text-xs text-[#55717b]">Patient {invoice.patient_id.slice(0, 8)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric label="Total" value={formatCurrency(invoice.total_amount)} />
            <Metric label="Balance" value={formatCurrency(invoice.balance_due)} />
            <Metric label="Paid" value={formatCurrency(invoice.amount_paid)} />
            <Metric label="Discount" value={formatCurrency(invoice.discount_amount)} />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-[#062f3d]">Line items</h3>
            <div className="overflow-hidden rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78">
              {invoice.line_items.map((item, index) => (
                <div key={`${item.description}-${index}`} className="grid grid-cols-12 gap-2 border-b border-[#d8edf3] px-4 py-3 last:border-b-0">
                  <div className="col-span-6">
                    <p className="text-sm font-semibold text-[#062f3d]">{item.description}</p>
                    <p className="text-xs text-[#55717b]">Qty {item.quantity} x {formatCurrency(item.unit_price)}</p>
                  </div>
                  <p className="col-span-6 text-right font-mono text-xs text-[#456773]">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {invoice.notes && (
            <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3">
              <p className="text-xs font-medium text-[#55717b]">Notes</p>
              <p className="mt-1 text-sm text-[#062f3d]">{invoice.notes}</p>
            </div>
          )}

          {payOpen && (
            <PaymentForm invoice={invoice} onPaid={onPaid} />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#d8edf3] bg-[#f8fcfd]/70 px-6 py-4">
          {canCancel && (
            <Button variant="ghost" size="sm" onClick={() => onCancel(invoice)} loading={actionLoading} className="text-[var(--error)]">
              <Ban size={14} /> Cancel
            </Button>
          )}
          {canIssue && (
            <Button variant="outline" size="sm" onClick={() => onIssue(invoice)} loading={actionLoading}>
              <Send size={14} /> Issue
            </Button>
          )}
          {canPay && (
            <Button variant="primary" size="sm" onClick={() => setPayOpen(!payOpen)}>
              <CreditCard size={14} /> Record payment
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}

function PaymentForm({ invoice, onPaid }: { invoice: Invoice; onPaid: () => void }) {
  const [amountPaid, setAmountPaid] = useState(invoice.balance_due);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.UPI);
  const [transactionReference, setTransactionReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      await api.post(`/api/v1/invoices/${invoice.id}/pay`, {
        amount_paid: amountPaid,
        payment_method: paymentMethod,
        transaction_reference: transactionReference.trim() || undefined,
      });
      onPaid();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 p-4">
      <h3 className="text-sm font-semibold text-[#062f3d]">Record payment</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Amount"
          type="number"
          min={1}
          max={invoice.balance_due}
          value={amountPaid}
          onChange={(event) => setAmountPaid(Number(event.target.value) || 0)}
          leftAddon={<IndianRupee size={14} />}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#062f3d]">Method</label>
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
            className="h-9 w-full rounded-2xl border border-[#d8edf3] bg-white/80 px-3 text-sm text-[#062f3d] focus:border-[#0a6792] focus:outline-none focus:ring-2 focus:ring-[#0a6792]"
          >
            <option value={PaymentMethod.UPI}>UPI</option>
            <option value={PaymentMethod.CASH}>Cash</option>
            <option value={PaymentMethod.CARD}>Card</option>
            <option value={PaymentMethod.INSURANCE}>Insurance</option>
          </select>
        </div>
      </div>
      <Input
        label="Reference"
        value={transactionReference}
        onChange={(event) => setTransactionReference(event.target.value)}
        placeholder="Optional transaction ID"
      />
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
      <Button variant="primary" size="sm" onClick={handleSubmit} loading={submitting} disabled={amountPaid <= 0}>
        Save payment
      </Button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3">
      <p className="text-xs font-medium text-[#55717b]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#062f3d]">{value}</p>
    </div>
  );
}
