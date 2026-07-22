"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/Skeleton";
import { parseApiError } from "@/lib/auth";
import api from "@/lib/api";
import { PaginatedResponse } from "@/types/common";
import { Appointment, AppointmentStatus } from "@/types/appointment";
import type { Doctor, DoctorLeave, Slot } from "@/types/doctor";

interface SlotViewerProps {
  doctor: Doctor;
  onClose: () => void;
}

function tomorrowString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatSlotTime(slotTime: string): string {
  return new Date(slotTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function toTimeInput(slotTime: string): string {
  return new Date(slotTime).toTimeString().slice(0, 5);
}

export default function SlotViewer({ doctor, onClose }: SlotViewerProps) {
  const minimumDate = useMemo(() => tomorrowString(), []);
  const [date, setDate] = useState<string>(tomorrowString());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [leaves, setLeaves] = useState<DoctorLeave[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [closureReason, setClosureReason] = useState("");
  const [confirmClosureOpen, setConfirmClosureOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dayLeave = useMemo(
    () => leaves.find((leave) => leave.leave_date === date) ?? null,
    [date, leaves]
  );
  const affectedAppointments = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.doctor_id === doctor.id &&
          [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED].includes(
            appointment.status
          )
      ),
    [appointments, doctor.id]
  );

  const load = useCallback(async () => {
    if (!date) return;
    if (date < minimumDate) {
      setSlots([]);
      setAppointments([]);
      setError("Slot management is available from tomorrow onward.");
      return;
    }
    setLoading(true);
    setError(null);
    setSlots([]);
    try {
      const [slotsRes, leavesRes, appointmentsRes] = await Promise.all([
        api.get<Slot[]>(`/api/v1/doctors/${doctor.id}/slots`, { params: { date } }),
        api.get<DoctorLeave[]>(`/api/v1/doctors/${doctor.id}/leaves`),
        api.get<PaginatedResponse<Appointment>>("/api/v1/appointments/", {
          params: { date, page: 1, page_size: 100 },
        }),
      ]);
      setSlots(slotsRes.data);
      setLeaves(leavesRes.data);
      setAppointments(appointmentsRes.data.data ?? []);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [date, doctor.id, minimumDate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setClosureReason("");
    setConfirmClosureOpen(false);
    setError(null);
  }, [date]);

  function handleDayAction() {
    if (date < minimumDate) return;
    if (!dayLeave && affectedAppointments.length > 0) {
      if (!closureReason.trim()) {
        setError("Add a cancellation reason before closing a date with booked appointments.");
        return;
      }
      setError(null);
      setConfirmClosureOpen(true);
      return;
    }
    toggleDay();
  }

  async function toggleDay() {
    setActionLoading("day");
    setError(null);
    try {
      if (dayLeave) {
        await api.delete(`/api/v1/doctors/${doctor.id}/leave/${date}`);
      } else {
        await api.post(`/api/v1/doctors/${doctor.id}/leave`, {
          leave_date: date,
          reason: closureReason.trim() || "Unavailable",
          cancel_existing_appointments: affectedAppointments.length > 0,
          cancellation_reason:
            affectedAppointments.length > 0 ? closureReason.trim() : undefined,
        });
      }
      setConfirmClosureOpen(false);
      await load();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleSlot(slot: Slot) {
    if (date < minimumDate) return;
    setActionLoading(slot.datetime);
    setError(null);
    try {
      if (slot.block_id) {
        await api.delete(`/api/v1/doctors/${doctor.id}/slot-blocks/${slot.block_id}`);
      } else {
        const nextSlot = slots.find((item) => item.datetime > slot.datetime);
        const fallbackEnd = new Date(new Date(slot.datetime).getTime() + 10 * 60 * 1000);
        await api.post(`/api/v1/doctors/${doctor.id}/slot-blocks`, {
          block_date: date,
          start_time: toTimeInput(slot.datetime),
          end_time: nextSlot ? toTimeInput(nextSlot.datetime) : fallbackEnd.toTimeString().slice(0, 5),
          reason: "Unavailable",
        });
      }
      await load();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setActionLoading(null);
    }
  }

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const blocked = slots.filter((slot) => slot.block_id).length;
  const available = slots.filter((slot) => slot.is_available).length;
  const booked = slots.length - available - blocked;
  const dateIsBeforeMinimum = !!date && date < minimumDate;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white flex flex-col"
        style={{ boxShadow: "var(--shadow-lg)", maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Slot Viewer</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Dr. {doctor.first_name} {doctor.last_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--gray-100)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <Input
            label="Date"
            type="date"
            min={minimumDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={dateIsBeforeMinimum ? "Choose tomorrow or a later date." : undefined}
            helper="Doctors can manage slots from tomorrow onward."
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--gray-50)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {dayLeave ? "Day unavailable" : "Day available"}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {dayLeave ? "Patients cannot book any slot on this date." : "Block the whole date if the doctor is unavailable."}
              </p>
            </div>
            <Button
              variant={dayLeave ? "secondary" : "ghost"}
              size="sm"
              onClick={handleDayAction}
              loading={actionLoading === "day"}
              disabled={loading || dateIsBeforeMinimum}
            >
              {dayLeave ? "Make active" : "Block day"}
            </Button>
          </div>

          {!dayLeave && affectedAppointments.length > 0 && (
            <div className="rounded-lg border border-[#f3c26b] bg-[#fff7e6] px-4 py-3">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-[#6b4a08]">
                  {affectedAppointments.length} booked appointment
                  {affectedAppointments.length === 1 ? "" : "s"} will be cancelled
                </p>
                <p className="text-xs leading-5 text-[#7a5a17]">
                  Closing this date cancels scheduled patients and sends them the reason below.
                </p>
              </div>

              <div className="mt-3 grid gap-2">
                {affectedAppointments.slice(0, 4).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-[#f3d28b] bg-white/65 px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-[#4f3708]">
                      Token #{appointment.token_number ?? "-"}
                    </span>
                    <span className="text-[#7a5a17]">
                      {appointment.patient
                        ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
                        : "Patient"}
                    </span>
                    <span className="font-mono text-[#4f3708]">
                      {formatSlotTime(appointment.slot_time)}
                    </span>
                  </div>
                ))}
                {affectedAppointments.length > 4 && (
                  <p className="text-xs text-[#7a5a17]">
                    +{affectedAppointments.length - 4} more appointment
                    {affectedAppointments.length - 4 === 1 ? "" : "s"}
                  </p>
                )}
              </div>

              <div className="mt-3">
                <Input
                  label="Cancellation reason"
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  placeholder="e.g. Clinic closed for maintenance"
                  helper="Patients will see this message in notifications and appointment details."
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: "var(--error-bg)",
                color: "var(--error)",
                border: "1px solid var(--error)",
              }}
            >
              {error}
            </div>
          )}

          {loading && (
            <div className="py-3">
              <SkeletonList rows={4} />
            </div>
          )}

          {!loading && !error && date && slots.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {dayLeave ? "This day is unavailable" : "No slots found"}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {dayLeave ? "Make the day active to show generated slots." : "The doctor has no schedule on this day."}
              </p>
            </div>
          )}

          {!loading && slots.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-[var(--text-muted)]">
                  {slots.length} slot{slots.length === 1 ? "" : "s"} total
                </span>
                <Badge variant="success" dot>{available} available</Badge>
                {booked > 0 && <Badge variant="neutral" dot>{booked} booked</Badge>}
                {blocked > 0 && <Badge variant="warning" dot>{blocked} blocked</Badge>}
              </div>
              {booked > 0 && (
                <p className="text-xs text-[var(--text-muted)]">
                  Booked slots cannot be blocked from this screen.
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <div
                    key={slot.datetime}
                    className="rounded-lg border px-3 py-2.5 flex flex-col gap-2 transition-colors"
                    style={{
                      borderColor: slot.block_id ? "var(--warning)" : slot.is_available ? "var(--border)" : "var(--gray-200)",
                      background: slot.block_id ? "var(--warning-bg)" : slot.is_available ? "white" : "var(--gray-50)",
                    }}
                  >
                    <p className="font-mono text-xs font-medium text-[var(--text-primary)]">
                      {formatSlotTime(slot.datetime)}
                    </p>
                    <Badge
                      variant={slot.block_id ? "warning" : slot.is_available ? "success" : "neutral"}
                      dot
                    >
                      {slot.block_id ? "Blocked" : slot.is_available ? "Available" : "Booked"}
                    </Badge>
                    {(slot.is_available || slot.block_id) && !dayLeave && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSlot(slot)}
                        loading={actionLoading === slot.datetime}
                        disabled={!!actionLoading}
                      >
                        {slot.block_id ? "Unblock" : "Block"}
                      </Button>
                    )}
                    {!slot.is_available && !slot.block_id && (
                      <p className="text-xs text-[var(--text-muted)]">
                        Cannot block booked slot
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-[var(--border)] shrink-0">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {confirmClosureOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget && !actionLoading) {
              setConfirmClosureOpen(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-[24px] border border-white/70 bg-[#f8fcfd]/95 p-5 shadow-[0_24px_70px_rgba(24,86,115,0.22)] backdrop-blur-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#f3c26b] bg-[#fff7e6] text-[#9a6500]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#062f3d]">
                  Cancel {affectedAppointments.length} appointment
                  {affectedAppointments.length === 1 ? "" : "s"}?
                </h3>
                <p className="mt-1 text-sm leading-6 text-[#55717b]">
                  Closing {date} will cancel booked appointments and notify patients
                  with the reason you entered.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#d8edf3] bg-white/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#55717b]">
                Reason sent to patients
              </p>
              <p className="mt-2 text-sm text-[#062f3d]">{closureReason}</p>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => setConfirmClosureOpen(false)}
                disabled={!!actionLoading}
              >
                Go back
              </Button>
              <Button
                variant="primary"
                onClick={toggleDay}
                loading={actionLoading === "day"}
              >
                Close date and cancel appointments
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
