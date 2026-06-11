"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import type { Doctor } from "@/types/doctor";

interface ScheduleModalProps {
  doctor: Doctor;
  onClose: () => void;
  onSaved: () => void;
}

export default function ScheduleModal({
  doctor,
  onClose,
  onSaved,
}: ScheduleModalProps) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.post(`/doctors/${doctor.id}/schedule`, {
        date,
        start_time: startTime,
        end_time: endTime,
        slot_minutes: slotMinutes,
      });

      onSaved();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className="w-full max-w-md rounded-xl border border-[var(--border)] bg-white"
        style={{ boxShadow: "var(--shadow-lg)" }}
      >
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Manage Schedule
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Dr. {doctor.first_name} {doctor.last_name}
          </p>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4">
          {error && (
            <div
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                background: "var(--error-bg)",
                color: "var(--error)",
                border: "1px solid var(--error)",
              }}
            >
              {error}
            </div>
          )}

          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <Input
            label="Start time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />

          <Input
            label="End time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />

          <Input
            label="Slot duration in minutes"
            type="number"
            value={slotMinutes}
            onChange={(e) => setSlotMinutes(Number(e.target.value))}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading || !date || !startTime || !endTime}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" /> Saving
              </span>
            ) : (
              "Save Schedule"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}