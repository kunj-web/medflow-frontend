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
import { useAuth } from "@/hooks/useAuth";

const STATUS_TABS: { label: string; value: AppointmentStatus | "ALL" }[] = [
  { label: "All",       value: "ALL" },
  { label: "Scheduled", value: AppointmentStatus.SCHEDULED },
  { label: "Completed", value: AppointmentStatus.COMPLETED },
  { label: "Cancelled", value: AppointmentStatus.CANCELLED },
  { label: "No-show",   value: AppointmentStatus.NO_SHOW },
];

const PAGE_SIZE = 10;

export default function AppointmentsPage() {
  const { isPatient } = useAuth();
  const [activeStatus, setActiveStatus] = useState<AppointmentStatus | "ALL">("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [bookOpen, setBookOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const patientStats = [
    {
      label: "Scheduled",
      value: appointments.filter((item) => item.status === AppointmentStatus.SCHEDULED).length,
      tone: "bg-[#d9edbd]/80",
    },
    {
      label: "Completed",
      value: appointments.filter((item) => item.status === AppointmentStatus.COMPLETED).length,
      tone: "bg-[#bfe0f2]/80",
    },
    {
      label: "Cancelled",
      value: appointments.filter((item) => item.status === AppointmentStatus.CANCELLED).length,
      tone: "bg-[#ffc2dc]/75",
    },
  ];
  const appointmentStats = [
    {
      label: "Shown",
      value: appointments.length,
      tone: "bg-[#d9edbd]/80",
    },
    {
      label: "Scheduled",
      value: appointments.filter((item) => item.status === AppointmentStatus.SCHEDULED).length,
      tone: "bg-[#bfe0f2]/80",
    },
    {
      label: "Cancelled",
      value: appointments.filter((item) => item.status === AppointmentStatus.CANCELLED).length,
      tone: "bg-[#ffc2dc]/75",
    },
  ];

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const params: AppointmentListParams = { page, page_size: PAGE_SIZE };
      if (activeStatus !== "ALL") params.status = activeStatus;
      if (dateFilter) params.date = dateFilter;

      const { data } = await api.get<PaginatedResponse<Appointment>>(
        "/api/v1/appointments/",
        { params }
      );
      setAppointments(data.data ?? []);
      setTotalPages(data.total_pages ?? 1);
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
      reason,
    });
    setCancelTarget(null);
    fetchAppointments();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Appointments"
        subtitle={isPatient ? "View and book your appointments" : "Review scheduled patient appointments"}
        actions={
          isPatient ? (
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
          ) : undefined
        }
      />

      {isPatient && (
        <section className="overflow-hidden rounded-[28px] border border-white/65 bg-[#dceff5]/80 p-5 shadow-[0_20px_60px_rgba(24,86,115,0.12)] backdrop-blur-2xl sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#24708a]">
                Patient appointments
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-[#062f3d] sm:text-4xl">
                Book future visits and manage your appointment history.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#456773]">
                You can book appointments starting from tomorrow. Same-day
                booking is not available, and cancellation closes on the
                appointment day.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {patientStats.map((item) => (
                <div
                  key={item.label}
                  className={`${item.tone} rounded-2xl border border-white/60 px-3 py-4 text-[#062f3d] shadow-sm backdrop-blur-xl`}
                >
                  <p className="text-2xl font-semibold leading-none">
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
      )}

      {!isPatient && (
        <section className="overflow-hidden rounded-[28px] border border-white/65 bg-[#dceff5]/80 p-5 shadow-[0_20px_60px_rgba(24,86,115,0.12)] backdrop-blur-2xl sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#24708a]">
                Appointments dashboard
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-[#062f3d] sm:text-4xl">
                Review patient visits, statuses, and cancellation activity.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#456773]">
                Use status and date filters to monitor scheduled appointments,
                completed visits, no-shows, and cancellations across the workspace.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {appointmentStats.map((item) => (
                <div
                  key={item.label}
                  className={`${item.tone} rounded-2xl border border-white/60 px-3 py-4 text-[#062f3d] shadow-sm backdrop-blur-xl`}
                >
                  <p className="text-2xl font-semibold leading-none">
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
      )}

      <Card padding="none" className="overflow-hidden border-white/70 bg-white/72 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
        <div className="border-b border-[#d8edf3] bg-[#f8fcfd]/70 px-5 py-4">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-normal text-[#062f3d]">
                Appointment list
              </h2>
              <p className="mt-1 text-sm text-[#55717b]">
                Filter appointments by status or appointment date.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatusChange(tab.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap",
                  activeStatus === tab.value
                    ? "bg-[#0a6792] text-[#eaf8fb] shadow-sm"
                    : "border border-[#d8edf3] bg-white/70 text-[#55717b] hover:bg-[#edf8fb] hover:text-[#062f3d]"
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
                className="h-9 rounded-full border border-[#d8edf3] bg-white/80 pl-3 pr-8 text-xs text-[#062f3d] transition-colors focus:border-[#0a6792] focus:outline-none focus:ring-2 focus:ring-[#0a6792]"
              />
              {dateFilter && (
                <button
                  onClick={handleClearDate}
                  className="absolute right-2 text-[#55717b] hover:text-[#062f3d]"
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
        </div>

        {fetchError && (
          <div className="border-b border-red-200 bg-[var(--error-bg)] px-5 py-3">
            <p className="text-sm text-[var(--error)]">{fetchError}</p>
          </div>
        )}

        <AppointmentTable
          appointments={appointments}
          loading={loading}
          isPatient={isPatient}
          totalPages={totalPages}
          currentPage={page}
          onPageChange={setPage}
          onCancel={setCancelTarget}
        />
      </Card>

      {bookOpen && isPatient && (
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
          isPatient={isPatient}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
        />
      )}
    </div>
  );
}
