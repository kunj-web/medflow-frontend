"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { parseApiError } from "@/lib/auth";
import api from "@/lib/api";
import type { Doctor, Slot } from "@/types/doctor";

// ── Props ─────────────────────────────────────────────────────────────────────

interface SlotViewerProps {
  doctor: Doctor;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayString(): string {
  const d = new Date();
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function SlotViewer({ doctor, onClose }: SlotViewerProps) {
  const [date, setDate] = useState<string>(todayString());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── fetch slots whenever date changes ─────────────────────────
  useEffect(() => {
    if (!date) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setSlots([]);
      try {
        const res = await api.get<Slot[]>(`/doctors/${doctor.id}/slots`, {
          params: { date },
        });
        if (!cancelled) setSlots(res.data);
      } catch (err) {
        if (!cancelled) setError(parseApiError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [date, doctor.id]);

  // ── backdrop close ────────────────────────────────────────────
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const available = slots.filter((s) => s.is_available).length;
  const booked = slots.length - available;

  // ── render ────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white flex flex-col"
        style={{ boxShadow: "var(--shadow-lg)", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Slot Viewer
            </h2>
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

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-4">

          {/* Date picker */}
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {/* Error */}
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

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2 text-sm text-[var(--text-muted)]">
              <Spinner size="sm" /> Loading slots…
            </div>
          )}

          {/* Empty */}
          {!loading && !error && date && slots.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <p className="text-sm font-medium text-[var(--text-primary)]">No slots found</p>
              <p className="text-xs text-[var(--text-muted)]">
                The doctor has no schedule on this day.
              </p>
            </div>
          )}

          {/* Slot grid */}
          {!loading && slots.length > 0 && (
            <div className="flex flex-col gap-3">
              {/* Summary row */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-muted)]">
                  {slots.length} slot{slots.length === 1 ? "" : "s"} total
                </span>
                <Badge variant="success" dot>{available} available</Badge>
                {booked > 0 && (
                  <Badge variant="neutral" dot>{booked} booked</Badge>
                )}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <div
                    key={slot.datetime}
                    className="rounded-lg border px-3 py-2.5 flex flex-col gap-1.5 transition-colors"
                    style={{
                      borderColor: slot.is_available ? "var(--border)" : "var(--gray-200)",
                      background: slot.is_available ? "white" : "var(--gray-50)",
                    }}
                  >
                    <p className="font-mono text-xs font-medium text-[var(--text-primary)]">
                      {formatSlotTime(slot.datetime)}
                    </p>
                    <Badge
                      variant={slot.is_available ? "success" : "neutral"}
                      dot
                    >
                      {slot.is_available ? "Available" : "Booked"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-[var(--border)] shrink-0">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
