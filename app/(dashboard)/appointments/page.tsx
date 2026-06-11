"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import {
  Appointment,
  AppointmentStatus,
  AppointmentListParams,
} from "@/types/appointment";
import { PaginatedResponse } from "@/types/common";
import PageHeader from "@/components/dashboard/PageHeader";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import AppointmentTable from "@/components/dashboard/appointments/AppointmentTable";
import BookModal from "@/components/dashboard/appointments/BookModal";
import CancelDialog from "@/components/dashboard/appointments/CancelDialog";
import { cn } from "@/lib/utils";

const STATUS_TABS: { label: string; value: AppointmentStatus | "ALL" }[] = [
  { label: "All",       value: "ALL" },
  { label: "Scheduled", value: AppointmentStatus.SCHEDULED },
  { label: "Completed", value: AppointmentStatus.COMPLETED },
  { label: "Cancelled", value: AppointmentStatus.CANCELLED },
  { label: "No-show",   value: AppointmentStatus.NO_SHOW },
];

const PAGE_SIZE = 10;

export default function AppointmentsPage() {
  const [activeStatus, setActiveStatus] = useState<AppointmentStatus | "ALL">("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [bookOpen, setBookOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const params: AppointmentListParams = { page, page_size: PAGE_SIZE };
      if (activeStatus !== "ALL") params.status = activeStatus;
      if (dateFilter) params.date = dateFilter;

      const { data } = await api.get<PaginatedResponse<Appointment>>(
        "/api/v1/appointments",
        { params }
      );
      setAppointments(data.items);
      setTotalPages(data.pages);
    } catch (err) {
      setFetchError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, activeStatus, dateFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  function handleStatusChange(status: AppointmentStatus | "ALL") {
    setActiveStatus(status);
    setPage(1);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDateFilter(e.target.value);
    setPage(1);
  }

  function handleClearDate() {
    setDateFilter("");
    setPage(1);
  }

  async function handleCancelConfirm(reason: string) {
    if (!cancelTarget) return;
    await api.post(`/api/v1/appointments/${cancelTarget.id}/cancel`, {
      cancellation_reason: reason,
    });
    setCancelTarget(null);
    fetchAppointments();
  }

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="Manage and schedule patient appointments"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setBookOpen(true)}
            leftIcon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
          >
            Book appointment
          </Button>
        }
      />

      <Card padding="none">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatusChange(tab.value)}
                className={cn(
                  "px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-colors whitespace-nowrap",
                  activeStatus === tab.value
                    ? "bg-[var(--accent)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--gray-100)]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <div className="relative flex items-center">
              <input
                type="date"
                value={dateFilter}
                onChange={handleDateChange}
                className="h-8 pl-3 pr-8 rounded-[var(--radius-md)] border border-[var(--border)] text-xs text-[var(--text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors"
              />
              {dateFilter && (
                <button
                  onClick={handleClearDate}
                  className="absolute right-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label="Clear date"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {fetchError && (
          <div className="px-5 py-3 bg-[var(--error-bg)] border-b border-red-200">
            <p className="text-sm text-[var(--error)]">{fetchError}</p>
          </div>
        )}

        <AppointmentTable
          appointments={appointments}
          loading={loading}
          totalPages={totalPages}
          currentPage={page}
          onPageChange={setPage}
          onCancel={setCancelTarget}
        />
      </Card>

      {bookOpen && (
        <BookModal
          onClose={() => setBookOpen(false)}
          onSuccess={() => {
            setBookOpen(false);
            fetchAppointments();
          }}
        />
      )}

      {cancelTarget && (
        <CancelDialog
          appointment={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
        />
      )}
    </div>
  );
}