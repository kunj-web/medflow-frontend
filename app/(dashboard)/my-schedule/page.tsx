"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import ScheduleModal from "@/components/dashboard/doctors/ScheduleModal";
import SlotViewer from "@/components/dashboard/doctors/SlotViewer";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import { DayOfWeek } from "@/types/common";
import type { PaginatedResponse } from "@/types/common";
import type { Doctor, DoctorSchedule } from "@/types/doctor";

const DAYS: { label: string; value: DayOfWeek }[] = [
  { label: "Monday", value: DayOfWeek.MONDAY },
  { label: "Tuesday", value: DayOfWeek.TUESDAY },
  { label: "Wednesday", value: DayOfWeek.WEDNESDAY },
  { label: "Thursday", value: DayOfWeek.THURSDAY },
  { label: "Friday", value: DayOfWeek.FRIDAY },
  { label: "Saturday", value: DayOfWeek.SATURDAY },
  { label: "Sunday", value: DayOfWeek.SUNDAY },
];

function formatTime(value: string): string {
  return value.slice(0, 5);
}

export default function MySchedulePage() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [slotsOpen, setSlotsOpen] = useState(false);

  const fetchDoctor = useCallback(async () => {
    if (!user?.user_id) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get<PaginatedResponse<Doctor>>("/api/v1/doctors", {
        params: { page: 1, page_size: 100 },
      });
      const current = (data.data ?? []).find((item) => item.user_id === user.user_id);
      if (!current) {
        setDoctor(null);
        setSchedules([]);
        setError("Doctor profile not found.");
        return;
      }
      setDoctor(current);
      setScheduleError("");
      try {
        const schedulesRes = await api.get<DoctorSchedule[]>(
          `/api/v1/doctors/${current.id}/schedules`
        );
        setSchedules(schedulesRes.data);
      } catch (scheduleErr) {
        setSchedules([]);
        setScheduleError(parseApiError(scheduleErr));
      }
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    fetchDoctor();
  }, [fetchDoctor]);

  const scheduleByDay = useMemo(() => {
    return new Map(schedules.map((schedule) => [schedule.day_of_week, schedule]));
  }, [schedules]);

  const activeDays = schedules.length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Schedule"
        subtitle="Manage your working hours, slot duration, and unavailable times"
      />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Spinner size="sm" /> Loading schedule tools...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg px-4 py-3 text-sm bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error)]">
          {error}
        </div>
      )}

      {!loading && doctor && (
        <Card padding="none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 border-b border-[var(--border)]">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Dr. {doctor.first_name} {doctor.last_name}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {doctor.specialization} · {doctor.work_type}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setScheduleOpen(true)}>
                Schedule
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSlotsOpen(true)}>
                Slots
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-5 py-4">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Status</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {doctor.is_active ? "Active" : "Inactive"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Clinic/Hospital</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {doctor.clinic_name ?? doctor.pending_hospital_name ?? "Assigned"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Experience</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {doctor.experience_years} yr{doctor.experience_years === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="border-t border-[var(--border)] px-5 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Weekly availability
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {activeDays > 0
                    ? `${activeDays} active day${activeDays === 1 ? "" : "s"} configured`
                    : "No active days configured yet"}
                </p>
              </div>
              <Badge variant={activeDays > 0 ? "success" : "warning"} dot>
                {activeDays > 0 ? "Schedule active" : "Schedule needed"}
              </Badge>
            </div>

            {scheduleError && (
              <div className="mb-4 rounded-lg px-4 py-3 text-sm bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error)]">
                {scheduleError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {DAYS.map((day) => {
                const schedule = scheduleByDay.get(day.value);
                return (
                  <div
                    key={day.value}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2.5 bg-white"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {day.label}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {schedule
                          ? `${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`
                          : "Inactive"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {schedule && (
                        <span className="text-xs font-mono text-[var(--text-secondary)]">
                          {schedule.slot_duration_minutes}m
                        </span>
                      )}
                      <Badge variant={schedule ? "success" : "neutral"} dot>
                        {schedule ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {doctor && scheduleOpen && (
        <ScheduleModal
          doctor={doctor}
          onClose={() => setScheduleOpen(false)}
          onSaved={() => {
            setScheduleOpen(false);
            fetchDoctor();
          }}
        />
      )}

      {doctor && slotsOpen && (
        <SlotViewer doctor={doctor} onClose={() => setSlotsOpen(false)} />
      )}
    </div>
  );
}
