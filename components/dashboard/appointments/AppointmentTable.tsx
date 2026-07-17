"use client";

import { Fragment } from "react";
import { Appointment, AppointmentStatus, AppointmentType } from "@/types/appointment";
import { formatDateTime, cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { SkeletonList } from "@/components/ui/Skeleton";

// ─── Status → Badge variant ───────────────────────────────────────────────────

const STATUS_BADGE: Record<AppointmentStatus, { variant: "success" | "warning" | "error" | "neutral" | "info"; label: string }> = {
  [AppointmentStatus.SCHEDULED]:  { variant: "info",    label: "Scheduled" },
  [AppointmentStatus.CONFIRMED]:  { variant: "info",    label: "Confirmed" },
  [AppointmentStatus.IN_PROGRESS]: { variant: "warning", label: "In progress" },
  [AppointmentStatus.COMPLETED]:  { variant: "success", label: "Completed" },
  [AppointmentStatus.CANCELLED]:  { variant: "error",   label: "Cancelled" },
  [AppointmentStatus.NO_SHOW]:    { variant: "warning", label: "No-show" },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppointmentTableProps {
  appointments: Appointment[];
  loading: boolean;
  isPatient: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onCancel: (appointment: Appointment) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppointmentTable({
  appointments,
  loading,
  isPatient,
  totalPages,
  currentPage,
  onPageChange,
  onCancel,
}: AppointmentTableProps) {
  const rows = appointments ?? [];
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  if (loading) {
    return (
      <div className="px-5 py-6">
        <SkeletonList rows={5} />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8edf3] bg-[#edf8fb] text-[#0a6792]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#062f3d]">No appointments found</p>
          <p className="text-xs text-[#55717b] mt-1">
            Try adjusting the filters or book a new appointment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#d8edf3] bg-[#edf8fb]/70">
              {["Token", "Patient", "Doctor", "Date & Time", "Type", "Status", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#55717b] whitespace-nowrap first:pl-5 last:pr-5"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((appt, i) => {
              const { variant, label } = STATUS_BADGE[appt.status];
              const canCancel = appt.status === AppointmentStatus.SCHEDULED;
              const appointmentDate = new Date(appt.slot_time);
              const patientCancellationClosed =
                isPatient && appointmentDate < new Date(todayStart.getTime() + 86_400_000);

              return (
                <Fragment key={appt.id}>
                <tr
                  className={cn(
                    "border-b border-[#d8edf3] transition-colors hover:bg-[#f8fcfd]",
                    i === rows.length - 1 && !appt.cancellation_reason && "border-b-0"
                  )}
                >
                  {/* Token */}
                  <td className="px-4 py-3 pl-5">
                    <span className="rounded-full border border-[#d8edf3] bg-[#f8fcfd] px-2 py-1 font-mono text-xs font-semibold text-[#0a6792]">
                      #{appt.token_number}
                    </span>
                  </td>

                  {/* Patient */}
                  <td className="px-4 py-3">
                    {appt.patient ? (
                      <div>
                        <p className="font-semibold text-[#062f3d] whitespace-nowrap">
                          {appt.patient.first_name} {appt.patient.last_name}
                        </p>
                        <p className="text-xs text-[#55717b]">{appt.patient.phone}</p>
                      </div>
                    ) : (
                      <span className="text-[#55717b]">-</span>
                    )}
                  </td>

                  {/* Doctor */}
                  <td className="px-4 py-3">
                    {appt.doctor ? (
                      <div>
                        <p className="font-semibold text-[#062f3d] whitespace-nowrap">
                          Dr. {appt.doctor.first_name} {appt.doctor.last_name}
                        </p>
                        <p className="text-xs text-[#55717b]">{appt.doctor.specialization}</p>
                      </div>
                    ) : (
                      <span className="text-[#55717b]">-</span>
                    )}
                  </td>

                  {/* Date & Time */}
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-[#456773]">
                    {formatDateTime(appt.slot_time)}
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <span className="text-xs capitalize text-[#55717b]">
                      {appt.type === AppointmentType.CONSULTATION ? "Consultation" : appt.type.replace("_", " ")}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <Badge variant={variant} dot>{label}</Badge>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 pr-5">
                    {canCancel && !patientCancellationClosed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(appt)}
                        className="text-[var(--error)] hover:bg-[var(--error-bg)] hover:text-[var(--error)]"
                      >
                        Cancel
                      </Button>
                    )}
                    {canCancel && patientCancellationClosed && (
                      <span
                        className="text-xs text-[#55717b] whitespace-nowrap"
                        title="Appointments cannot be cancelled on the appointment day."
                      >
                        Cancellation closed
                      </span>
                    )}
                  </td>
                </tr>
                {appt.status === AppointmentStatus.CANCELLED && appt.cancellation_reason && (
                  <tr
                    className={cn(
                      "border-b border-red-200 bg-[var(--error-bg)]/50",
                      i === rows.length - 1 && "border-b-0"
                    )}
                  >
                    <td colSpan={7} className="px-5 py-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-2 text-xs">
                        <span className="font-semibold text-[var(--error)] whitespace-nowrap">
                          Cancellation reason:
                        </span>
                        <span className="text-[#55717b]">
                          {appt.cancellation_reason}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#d8edf3] bg-[#f8fcfd]/70 px-5 py-3">
          <p className="text-xs text-[#55717b]">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Prev
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
