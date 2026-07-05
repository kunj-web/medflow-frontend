"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { parseApiError } from "@/lib/auth";
import api from "@/lib/api";
import type { Doctor, DoctorSchedule, ScheduleUpsert } from "@/types/doctor";
import { DayOfWeek } from "@/types/common";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ScheduleModalProps {
  doctor: Doctor;
  onClose: () => void;
  onSaved: () => void;
}

// ── Day config ────────────────────────────────────────────────────────────────

const DAYS: { label: string; short: string; value: DayOfWeek }[] = [
  { label: "Monday",    short: "Mon", value: DayOfWeek.MONDAY },
  { label: "Tuesday",   short: "Tue", value: DayOfWeek.TUESDAY },
  { label: "Wednesday", short: "Wed", value: DayOfWeek.WEDNESDAY },
  { label: "Thursday",  short: "Thu", value: DayOfWeek.THURSDAY },
  { label: "Friday",    short: "Fri", value: DayOfWeek.FRIDAY },
  { label: "Saturday",  short: "Sat", value: DayOfWeek.SATURDAY },
  { label: "Sunday",    short: "Sun", value: DayOfWeek.SUNDAY },
];

// ── Per-day row state ─────────────────────────────────────────────────────────

interface DayRow {
  enabled: boolean;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  slot_duration_minutes: number;
  error: string | null;
}

type ScheduleState = Record<DayOfWeek, DayRow>;

const DEFAULT_ROW: DayRow = {
  enabled: false,
  start_time: "09:00",
  end_time: "17:00",
  slot_duration_minutes: 10,
  error: null,
};

function buildEmpty(): ScheduleState {
  return Object.fromEntries(
    DAYS.map((d) => [d.value, { ...DEFAULT_ROW }])
  ) as ScheduleState;
}

function applyExisting(base: ScheduleState, schedules: DoctorSchedule[]): ScheduleState {
  const next = { ...base };
  for (const s of schedules) {
    next[s.day_of_week] = {
      enabled: true,
      start_time: s.start_time.slice(0, 5), // "HH:MM:SS" → "HH:MM"
      end_time: s.end_time.slice(0, 5),
      slot_duration_minutes: s.slot_duration_minutes,
      error: null,
    };
  }
  return next;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScheduleModal({ doctor, onClose, onSaved }: ScheduleModalProps) {
  const [schedule, setSchedule] = useState<ScheduleState>(buildEmpty());
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── load existing schedule ────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        const res = await api.get<DoctorSchedule[]>(`/api/v1/doctors/${doctor.id}/schedules`);
        setSchedule((prev) => applyExisting(prev, res.data));
      } catch (err) {
        setFetchError(parseApiError(err));
      } finally {
        setFetchLoading(false);
      }
    };
    load();
  }, [doctor.id]);

  // ── row helpers ───────────────────────────────────────────────
  const toggleDay = (day: DayOfWeek) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled, error: null },
    }));
  };

  const setTime = (day: DayOfWeek, field: "start_time" | "end_time", value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value, error: null },
    }));
  };

  const setDuration = (day: DayOfWeek, value: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], slot_duration_minutes: value, error: null },
    }));
  };

  // ── validation ────────────────────────────────────────────────
  const validate = (): boolean => {
    let valid = true;
    const next = { ...schedule };
    for (const { value: day } of DAYS) {
      const row = next[day];
      if (!row.enabled) continue;
      if (row.start_time >= row.end_time) {
        next[day] = { ...row, error: "End time must be after start time." };
        valid = false;
      }
    }
    setSchedule(next);
    return valid;
  };

  // ── submit ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setApiError(null);
    setSaveLoading(true);
    try {
      const schedules: ScheduleUpsert[] = DAYS
        .filter(({ value }) => schedule[value].enabled)
        .map(({ value: day }) => ({
          day_of_week: day,
          start_time: schedule[day].start_time,
          end_time: schedule[day].end_time,
          slot_duration_minutes: schedule[day].slot_duration_minutes,
        }));

      await api.post(`/api/v1/doctors/${doctor.id}/schedules`, schedules);
      onSaved();
    } catch (err) {
      setApiError(parseApiError(err));
    } finally {
      setSaveLoading(false);
    }
  };

  // ── backdrop close ────────────────────────────────────────────
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const enabledCount = DAYS.filter(({ value }) => schedule[value].enabled).length;

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
              Weekly Schedule
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

          {/* API error */}
          {apiError && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: "var(--error-bg)",
                color: "var(--error)",
                border: "1px solid var(--error)",
              }}
            >
              {apiError}
            </div>
          )}

          {/* Fetch loading */}
          {fetchLoading && (
            <div className="flex items-center justify-center py-12 gap-2 text-sm text-[var(--text-muted)]">
              <Spinner size="sm" /> Loading schedule…
            </div>
          )}

          {/* Fetch error */}
          {!fetchLoading && fetchError && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: "var(--error-bg)",
                color: "var(--error)",
                border: "1px solid var(--error)",
              }}
            >
              {fetchError}
            </div>
          )}

          {/* Day rows */}
          {!fetchLoading && !fetchError && (
            <div className="flex flex-col gap-1">
              {/* Column headers */}
              <div
                className="grid items-center gap-3 px-1 mb-1"
                style={{ gridTemplateColumns: "6rem 1fr 1fr 5rem" }}
              >
                <span />
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  Start
                </span>
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  End
                </span>
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  Slot
                </span>
              </div>

              {DAYS.map(({ label, short, value: day }) => {
                const row = schedule[day];
                return (
                  <div key={day} className="flex flex-col gap-1">
                    <div
                      className="grid items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
                      style={{
                        gridTemplateColumns: "6rem 1fr 1fr 5rem",
                        background: row.enabled ? "var(--gray-50)" : "transparent",
                        border: row.enabled
                          ? "1px solid var(--border)"
                          : "1px solid transparent",
                      }}
                    >
                      {/* Toggle + day label */}
                      <button
                        onClick={() => toggleDay(day)}
                        className="flex items-center gap-2 text-left"
                      >
                        <span
                          className="relative inline-flex w-8 h-4 rounded-full transition-colors duration-200 shrink-0"
                          style={{
                            background: row.enabled ? "var(--accent)" : "var(--gray-300)",
                          }}
                        >
                          <span
                            className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200"
                            style={{
                              transform: row.enabled ? "translateX(17px)" : "translateX(2px)",
                            }}
                          />
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{
                            color: row.enabled ? "var(--text-primary)" : "var(--text-muted)",
                          }}
                        >
                          <span className="hidden sm:inline">{label}</span>
                          <span className="sm:hidden">{short}</span>
                        </span>
                      </button>

                      {/* Start time */}
                      <input
                        type="time"
                        value={row.start_time}
                        disabled={!row.enabled}
                        onChange={(e) => setTime(day, "start_time", e.target.value)}
                        className="h-8 w-full rounded-[var(--radius-md)] border px-2 text-sm font-mono bg-white text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ borderColor: row.error ? "var(--error)" : "var(--border)" }}
                      />

                      {/* End time */}
                      <input
                        type="time"
                        value={row.end_time}
                        disabled={!row.enabled}
                        onChange={(e) => setTime(day, "end_time", e.target.value)}
                        className="h-8 w-full rounded-[var(--radius-md)] border px-2 text-sm font-mono bg-white text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ borderColor: row.error ? "var(--error)" : "var(--border)" }}
                      />

                      <select
                        value={row.slot_duration_minutes}
                        disabled={!row.enabled}
                        onChange={(e) => setDuration(day, Number(e.target.value))}
                        className="h-8 w-full rounded-[var(--radius-md)] border border-[var(--border)] px-2 text-sm font-mono bg-white text-[var(--text-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {[5, 10, 15, 20, 30, 60].map((duration) => (
                          <option key={duration} value={duration}>
                            {duration}m
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Row-level error */}
                    {row.error && (
                      <p className="text-xs text-[var(--error)] px-3">{row.error}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-[var(--border)] shrink-0">
          <p className="text-xs text-[var(--text-muted)]">
            {enabledCount} day{enabledCount === 1 ? "" : "s"} selected
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saveLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saveLoading}
              disabled={fetchLoading || !!fetchError}
            >
              Save Schedule
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
