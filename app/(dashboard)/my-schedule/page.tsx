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
  const inactiveDays = DAYS.length - activeDays;
  const defaultSlotDuration =
    schedules.find((schedule) => schedule.slot_duration_minutes)
      ?.slot_duration_minutes ?? 10;
  const scheduleStats = [
    {
      label: "Active days",
      value: activeDays,
      detail: "Bookable",
      tone: "bg-[#d9edbd]/80",
    },
    {
      label: "Inactive days",
      value: inactiveDays,
      detail: "Closed",
      tone: "bg-[#ffc2dc]/75",
    },
    {
      label: "Slot length",
      value: `${defaultSlotDuration}m`,
      detail: "Default",
      tone: "bg-[#bfe0f2]/80",
    },
  ];

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="My Schedule"
        subtitle="Manage your working hours, slot duration, and unavailable times"
      />

      {loading && (
        <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm text-[#55717b] shadow-sm backdrop-blur-xl">
          <Spinner size="sm" /> Loading schedule tools...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      {!loading && doctor && (
        <div className="flex flex-col gap-5">
          <section className="overflow-hidden rounded-[28px] border border-white/70 bg-[#dceff5]/80 p-5 shadow-[0_22px_70px_rgba(24,86,115,0.14)] backdrop-blur-2xl sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2f7689]">
                  Doctor availability
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[#062f3d] md:text-3xl">
                  Keep patient booking slots aligned with your real schedule.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#55717b]">
                  Update weekly hours, adjust slot duration, and block days or
                  time ranges patients should not be able to book.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {scheduleStats.map((item) => (
                  <div
                    key={item.label}
                    className={`${item.tone} rounded-2xl border border-white/75 px-3 py-4 shadow-sm backdrop-blur-xl`}
                  >
                    <p className="text-xs font-medium text-[#55717b]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#062f3d]">
                      {item.value}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-[#55717b]">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Card
            padding="none"
            className="overflow-hidden border-white/70 bg-white/75 shadow-[0_18px_50px_rgba(24,86,115,0.10)] backdrop-blur-xl"
          >
            <div className="flex flex-col justify-between gap-4 border-b border-[#d8edf3] px-5 py-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-semibold text-[#062f3d]">
                  Dr. {doctor.first_name} {doctor.last_name}
                </h2>
                <p className="mt-1 text-xs text-[#55717b]">
                  {doctor.specialization} - {doctor.work_type}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setScheduleOpen(true)}
                >
                  Schedule
                </Button>
                <Button variant="primary" size="sm" onClick={() => setSlotsOpen(true)}>
                  Slots
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 px-5 py-5 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/80 px-4 py-3">
                <p className="text-xs font-medium text-[#55717b]">Status</p>
                <p className="mt-1 text-sm font-semibold text-[#062f3d]">
                  {doctor.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/80 px-4 py-3">
                <p className="text-xs font-medium text-[#55717b]">
                  Clinic/Hospital
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-[#062f3d]">
                  {doctor.clinic_name ?? doctor.pending_hospital_name ?? "Assigned"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/80 px-4 py-3">
                <p className="text-xs font-medium text-[#55717b]">Experience</p>
                <p className="mt-1 text-sm font-semibold text-[#062f3d]">
                  {doctor.experience_years} yr{doctor.experience_years === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="border-t border-[#d8edf3] px-5 py-5">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-sm font-semibold text-[#062f3d]">
                    Weekly availability
                  </h3>
                  <p className="mt-0.5 text-xs text-[#55717b]">
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
                <div className="mb-4 rounded-2xl border border-red-200 bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]">
                  {scheduleError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {DAYS.map((day) => {
                  const schedule = scheduleByDay.get(day.value);
                  return (
                    <div
                      key={day.value}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/80 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#062f3d]">
                          {day.label}
                        </p>
                        <p className="mt-0.5 text-xs text-[#55717b]">
                          {schedule
                            ? `${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`
                            : "Inactive"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {schedule && (
                          <span className="font-mono text-xs text-[#55717b]">
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
        </div>
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
