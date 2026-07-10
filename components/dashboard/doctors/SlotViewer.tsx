"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { parseApiError } from "@/lib/auth";
import api from "@/lib/api";
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
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dayLeave = useMemo(
    () => leaves.find((leave) => leave.leave_date === date) ?? null,
    [date, leaves]
  );

  const load = useCallback(async () => {
    if (!date) return;
    if (date < minimumDate) {
      setSlots([]);
      setError("Slot management is available from tomorrow onward.");
      return;
    }
    setLoading(true);
    setError(null);
    setSlots([]);
    try {
      const [slotsRes, leavesRes] = await Promise.all([
        api.get<Slot[]>(`/api/v1/doctors/${doctor.id}/slots`, { params: { date } }),
        api.get<DoctorLeave[]>(`/api/v1/doctors/${doctor.id}/leaves`),
      ]);
      setSlots(slotsRes.data);
      setLeaves(leavesRes.data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [date, doctor.id, minimumDate]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleDay() {
    if (date < minimumDate) return;
    setActionLoading("day");
    setError(null);
    try {
      if (dayLeave) {
        await api.delete(`/api/v1/doctors/${doctor.id}/leave/${date}`);
      } else {
        await api.post(`/api/v1/doctors/${doctor.id}/leave`, {
          leave_date: date,
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
              onClick={toggleDay}
              loading={actionLoading === "day"}
              disabled={loading || dateIsBeforeMinimum}
            >
              {dayLeave ? "Make active" : "Block day"}
            </Button>
          </div>

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
            <div className="flex items-center justify-center py-12 gap-2 text-sm text-[var(--text-muted)]">
              <Spinner size="sm" /> Loading slots...
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
    </div>
  );
}
