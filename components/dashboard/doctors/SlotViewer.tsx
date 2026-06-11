"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import type { Doctor } from "@/types/doctor";

interface SlotViewerProps {
  doctor: Doctor;
  onClose: () => void;
}

interface DoctorSlot {
  id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function SlotViewer({ doctor, onClose }: SlotViewerProps) {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = async () => {
    if (!date) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.get<DoctorSlot[]>(
        `/doctors/${doctor.id}/slots`,
        {
          params: { date },
        }
      );

      setSlots(res.data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-white"
        style={{ boxShadow: "var(--shadow-lg)" }}
      >
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Available Slots
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Dr. {doctor.first_name} {doctor.last_name}
          </p>
        </div>

        <div className="px-5 py-4">
          <Input
            label="Select date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {error && (
            <div
              className="mt-4 rounded-lg px-3 py-2 text-sm"
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
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--text-muted)]">
              <Spinner size="sm" /> Loading slots…
            </div>
          )}

          {!loading && date && slots.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                No slots found
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Try another date or create a schedule first.
              </p>
            </div>
          )}

          {!loading && slots.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                >
                  <p className="font-mono text-xs text-[var(--text-primary)]">
                    {slot.start_time} - {slot.end_time}
                  </p>
                  <div className="mt-2">
                    <Badge
                      variant={slot.is_available ? "success" : "neutral"}
                      dot
                    >
                      {slot.is_available ? "Available" : "Booked"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-[var(--border)] px-5 py-4">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}