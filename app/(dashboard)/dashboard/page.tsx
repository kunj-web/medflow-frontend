"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import StatCard from "@/components/dashboard/StatCard";
import PageHeader from "@/components/dashboard/PageHeader";
import BookModal from "@/components/dashboard/appointments/BookModal";
import PatientSnapshotCard from "@/components/dashboard/patient/PatientSnapshotCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { formatDateTime, getGreeting } from "@/lib/utils";
import { Appointment, AppointmentStatus } from "@/types/appointment";
import { DayOfWeek, PaginatedResponse, UserRole } from "@/types/common";
import type {
  Doctor,
  DoctorLeave,
  DoctorSchedule,
  DoctorSlotBlock,
} from "@/types/doctor";
import { Patient } from "@/types/patient";

// Quick action tiles
const QUICK_ACTIONS = [
  {
    label: "Book appointment",
    href: "/appointments",
    description: "Schedule a new patient visit",
    roles: [UserRole.ADMIN, UserRole.DOCTOR],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/>
      </svg>
    ),
  },
  {
    label: "Add patient",
    href: "/patients",
    description: "Register a new patient record",
    roles: [UserRole.ADMIN, UserRole.DOCTOR],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
      </svg>
    ),
  },
  {
    label: "Create invoice",
    href: "/invoices",
    description: "Draft a billing invoice",
    roles: [UserRole.ADMIN],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
  },
  {
    label: "Manage doctors",
    href: "/doctors",
    description: "View schedules and leaves",
    roles: [UserRole.ADMIN],
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

// Placeholder stats — these will be replaced with real API calls in the filled page
const STATS = [
  {
    label: "Today's appointments",
    value: "—",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    label: "Active doctors",
    value: "—",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    label: "Patients registered",
    value: "—",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    label: "Pending invoices",
    value: "—",
    accent: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
];

const STATUS_BADGE: Record<AppointmentStatus, { variant: "success" | "warning" | "error" | "neutral" | "info"; label: string }> = {
  [AppointmentStatus.SCHEDULED]: { variant: "info", label: "Scheduled" },
  [AppointmentStatus.CONFIRMED]: { variant: "info", label: "Confirmed" },
  [AppointmentStatus.IN_PROGRESS]: { variant: "warning", label: "In progress" },
  [AppointmentStatus.COMPLETED]: { variant: "success", label: "Completed" },
  [AppointmentStatus.CANCELLED]: { variant: "error", label: "Cancelled" },
  [AppointmentStatus.NO_SHOW]: { variant: "warning", label: "No-show" },
};

const WEEK_DAYS: { label: string; value: DayOfWeek }[] = [
  { label: "Mon", value: DayOfWeek.MONDAY },
  { label: "Tue", value: DayOfWeek.TUESDAY },
  { label: "Wed", value: DayOfWeek.WEDNESDAY },
  { label: "Thu", value: DayOfWeek.THURSDAY },
  { label: "Fri", value: DayOfWeek.FRIDAY },
  { label: "Sat", value: DayOfWeek.SATURDAY },
  { label: "Sun", value: DayOfWeek.SUNDAY },
];

function toDateParam(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function tomorrowDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
}

function countByStatus(appointments: Appointment[], status: AppointmentStatus): number {
  return appointments.filter((appointment) => appointment.status === status).length;
}

function formatScheduleTime(value: string): string {
  return value.slice(0, 5);
}

function formatDateLabel(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [patientLoading, setPatientLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [recentError, setRecentError] = useState("");
  const [patientError, setPatientError] = useState("");
  const [bookOpen, setBookOpen] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const { data } = await api.get<PaginatedResponse<Appointment>>(
        "/api/v1/appointments/",
        {
          params: {
            page: 1,
            page_size: 20,
            status: AppointmentStatus.SCHEDULED,
          },
        }
      );
      setAppointments(data.data ?? []);
    } catch (err) {
      setFetchError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const fetchRecentAppointments = useCallback(async () => {
    setRecentLoading(true);
    setRecentError("");
    try {
      const { data } = await api.get<PaginatedResponse<Appointment>>(
        "/api/v1/appointments/",
        { params: { page: 1, page_size: 5 } }
      );
      setRecentAppointments(data.data ?? []);
    } catch (err) {
      setRecentAppointments([]);
      setRecentError(parseApiError(err));
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentAppointments();
  }, [fetchRecentAppointments]);

  const fetchPatient = useCallback(async () => {
    setPatientLoading(true);
    setPatientError("");
    try {
      const { data } = await api.get<Patient>("/api/v1/patients/me");
      setPatient(data);
    } catch (err) {
      setPatient(null);
      setPatientError(parseApiError(err));
    } finally {
      setPatientLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  const nextAppointment = useMemo(() => {
    const now = new Date();

    return appointments
      .filter((appointment) => new Date(appointment.slot_time) >= now)
      .sort(
        (a, b) =>
          new Date(a.slot_time).getTime() - new Date(b.slot_time).getTime()
      )[0] ?? null;
  }, [appointments]);

  const statusMeta = nextAppointment
    ? STATUS_BADGE[nextAppointment.status]
    : null;
  const greeting = getGreeting();
  const firstName = user?.first_name ?? "there";

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${firstName}`}
        subtitle="Your dashboard"
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <Card padding="lg" className="min-h-[220px]">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Next appointment
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Your nearest scheduled visit
              </p>
            </div>
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
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Spinner size="sm" /> Loading next appointment...
              </div>
            ) : fetchError ? (
              <p className="text-sm text-[var(--error)]">{fetchError}</p>
            ) : nextAppointment ? (
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-5 items-end">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xl font-semibold text-[var(--text-primary)]">
                      {nextAppointment.doctor
                        ? `Dr. ${nextAppointment.doctor.first_name} ${nextAppointment.doctor.last_name}`
                        : "Doctor appointment"}
                    </p>
                    {statusMeta && (
                      <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {nextAppointment.doctor?.specialization ?? "Doctor"}
                  </p>
                  <p className="text-sm font-medium text-[var(--text-primary)] mt-5">
                    {formatDateTime(nextAppointment.slot_time)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 capitalize">
                    {nextAppointment.type.replace("_", " ")}
                    {nextAppointment.token_number
                      ? ` - Token #${nextAppointment.token_number}`
                      : ""}
                  </p>
                </div>

                <Link
                  href="/appointments"
                  className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
                >
                  View appointments
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  No upcoming appointment
                </p>
                <p className="text-sm text-[var(--text-muted)] max-w-lg">
                  Book a visit with an available doctor when you are ready.
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card padding="lg" className="flex flex-col justify-between gap-6 min-h-[220px]">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Quick book
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Open the booking flow and choose doctor, date, and slot.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setBookOpen(true)}
            className="w-full"
            leftIcon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
          >
            Book appointment
          </Button>
        </Card>
      </div>

      <div className="mt-4">
        <PatientSnapshotCard
          patient={patient}
          loading={patientLoading}
          error={patientError}
        />
      </div>

      <div className="mt-4">
        <Card padding="lg">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Recent appointments
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Latest activity from your appointments
              </p>
            </div>
            <Link
              href="/appointments"
              className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              View all
            </Link>
          </div>

          {recentLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-[var(--text-muted)]">
              <Spinner size="sm" /> Loading recent appointments...
            </div>
          ) : recentError ? (
            <p className="py-6 text-sm text-[var(--error)]">{recentError}</p>
          ) : recentAppointments.length === 0 ? (
            <div className="py-8">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                No appointments yet
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Book your first appointment when you are ready.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {recentAppointments.map((appointment) => {
                const status = STATUS_BADGE[appointment.status];
                return (
                  <div
                    key={appointment.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {appointment.doctor
                            ? `Dr. ${appointment.doctor.first_name} ${appointment.doctor.last_name}`
                            : "Doctor appointment"}
                        </p>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {appointment.doctor?.specialization ?? "Doctor"} -{" "}
                        <span className="capitalize">
                          {appointment.type.replace("_", " ")}
                        </span>
                      </p>
                    </div>
                    <div className="md:text-right shrink-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {formatDateTime(appointment.slot_time)}
                      </p>
                      {appointment.token_number && (
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          Token #{appointment.token_number}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {bookOpen && (
        <BookModal
          onClose={() => setBookOpen(false)}
          onSuccess={() => {
            setBookOpen(false);
            fetchAppointments();
            fetchRecentAppointments();
          }}
        />
      )}
    </div>
  );
}

function DoctorDashboard() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [leaves, setLeaves] = useState<DoctorLeave[]>([]);
  const [tomorrowBlocks, setTomorrowBlocks] = useState<DoctorSlotBlock[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [tomorrowAppointments, setTomorrowAppointments] = useState<Appointment[]>([]);
  const [scheduledAppointments, setScheduledAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDoctorDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const today = toDateParam(new Date());
      const tomorrow = toDateParam(tomorrowDate());

      const [todayRes, tomorrowRes, scheduledRes] = await Promise.all([
        api.get<PaginatedResponse<Appointment>>("/api/v1/appointments/", {
          params: { page: 1, page_size: 100, date: today },
        }),
        api.get<PaginatedResponse<Appointment>>("/api/v1/appointments/", {
          params: { page: 1, page_size: 100, date: tomorrow },
        }),
        api.get<PaginatedResponse<Appointment>>("/api/v1/appointments/", {
          params: {
            page: 1,
            page_size: 50,
            status: AppointmentStatus.SCHEDULED,
          },
        }),
      ]);

      setTodayAppointments(todayRes.data.data ?? []);
      setTomorrowAppointments(tomorrowRes.data.data ?? []);
      setScheduledAppointments(scheduledRes.data.data ?? []);

      if (user?.user_id) {
        const doctorsRes = await api.get<PaginatedResponse<Doctor>>("/api/v1/doctors", {
          params: { page: 1, page_size: 100 },
        });
        const currentDoctor = (doctorsRes.data.data ?? []).find(
          (item) => item.user_id === user.user_id
        );
        setDoctor(currentDoctor ?? null);

        if (currentDoctor) {
          const [schedulesRes, leavesRes, blocksRes] = await Promise.all([
            api.get<DoctorSchedule[]>(
              `/api/v1/doctors/${currentDoctor.id}/schedules`
            ),
            api.get<DoctorLeave[]>(`/api/v1/doctors/${currentDoctor.id}/leaves`),
            api.get<DoctorSlotBlock[]>(
              `/api/v1/doctors/${currentDoctor.id}/slot-blocks`,
              { params: { date: tomorrow } }
            ),
          ]);
          setSchedules(schedulesRes.data);
          setLeaves(leavesRes.data);
          setTomorrowBlocks(blocksRes.data);
        } else {
          setSchedules([]);
          setLeaves([]);
          setTomorrowBlocks([]);
        }
      }
    } catch (err) {
      setDoctor(null);
      setSchedules([]);
      setLeaves([]);
      setTomorrowBlocks([]);
      setTodayAppointments([]);
      setTomorrowAppointments([]);
      setScheduledAppointments([]);
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    fetchDoctorDashboard();
  }, [fetchDoctorDashboard]);

  const nextAppointment = useMemo(() => {
    const now = new Date();

    return scheduledAppointments
      .filter((appointment) => new Date(appointment.slot_time) >= now)
      .sort(
        (a, b) =>
          new Date(a.slot_time).getTime() - new Date(b.slot_time).getTime()
      )[0] ?? null;
  }, [scheduledAppointments]);

  const nextStatus = nextAppointment
    ? STATUS_BADGE[nextAppointment.status]
    : null;
  const scheduleByDay = useMemo(() => {
    return new Map(schedules.map((schedule) => [schedule.day_of_week, schedule]));
  }, [schedules]);
  const upcomingLeaves = useMemo(() => {
    const today = toDateParam(new Date());

    return leaves
      .filter((leave) => leave.leave_date >= today)
      .sort((a, b) => a.leave_date.localeCompare(b.leave_date))
      .slice(0, 5);
  }, [leaves]);
  const activeScheduleDays = schedules.length;
  const greeting = getGreeting();
  const firstName = user?.first_name ?? "doctor";

  const appointmentCountGroups = [
    {
      title: "Today",
      subtitle: toDateParam(new Date()),
      appointments: todayAppointments,
    },
    {
      title: "Tomorrow",
      subtitle: toDateParam(tomorrowDate()),
      appointments: tomorrowAppointments,
    },
  ];

  const appointmentCountStatuses = [
    {
      label: "Scheduled",
      status: AppointmentStatus.SCHEDULED,
      variant: "info" as const,
    },
    {
      label: "Completed",
      status: AppointmentStatus.COMPLETED,
      variant: "success" as const,
    },
    {
      label: "Cancelled",
      status: AppointmentStatus.CANCELLED,
      variant: "error" as const,
    },
    {
      label: "No-show",
      status: AppointmentStatus.NO_SHOW,
      variant: "warning" as const,
    },
  ];

  return (
    <div>
      <PageHeader
        title={`${greeting}, Dr. ${firstName}`}
        subtitle="Your appointment overview"
        actions={
          <Link href="/my-schedule">
            <Button variant="secondary" size="sm">
              My Schedule
            </Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg px-4 py-3 text-sm bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        {appointmentCountGroups.map((group) => (
          <Card key={group.title} padding="lg">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  {group.title} appointments
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {group.subtitle}
                </p>
              </div>
              <Badge variant="neutral">
                {loading ? "..." : group.appointments.length} total
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {appointmentCountStatuses.map((item) => (
                <div
                  key={`${group.title}-${item.status}`}
                  className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--gray-50)] px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                      {item.label}
                    </span>
                    <Badge variant={item.variant} dot>
                      {loading
                        ? "..."
                        : countByStatus(group.appointments, item.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4">
        <Card padding="lg" className="min-h-[240px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Next patient
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Nearest upcoming scheduled appointment
              </p>
            </div>
            <Link
              href="/appointments"
              className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              View appointments
            </Link>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Spinner size="sm" /> Loading next patient...
              </div>
            ) : nextAppointment ? (
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-5 items-end">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xl font-semibold text-[var(--text-primary)]">
                      {nextAppointment.patient
                        ? `${nextAppointment.patient.first_name} ${nextAppointment.patient.last_name}`
                        : "Patient appointment"}
                    </p>
                    {nextStatus && (
                      <Badge variant={nextStatus.variant}>{nextStatus.label}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mt-1 capitalize">
                    {nextAppointment.type.replace("_", " ")}
                  </p>
                  <p className="text-sm font-medium text-[var(--text-primary)] mt-5">
                    {formatDateTime(nextAppointment.slot_time)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {nextAppointment.token_number
                      ? `Token #${nextAppointment.token_number}`
                      : "Token not assigned"}
                    {nextAppointment.patient?.phone
                      ? ` - ${nextAppointment.patient.phone}`
                      : ""}
                  </p>
                </div>

                <Link href="/appointments">
                  <Button variant="primary" size="sm">
                    Open appointment
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  No upcoming patient
                </p>
                <p className="text-sm text-[var(--text-muted)] max-w-lg">
                  Scheduled appointments will appear here when patients book a slot.
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card padding="lg" className="min-h-[240px]">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Today queue
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                First five appointments today
              </p>
            </div>
            <Badge variant="neutral">
              {loading ? "..." : todayAppointments.length} total
            </Badge>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-[var(--text-muted)]">
              <Spinner size="sm" /> Loading queue...
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="py-8">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                No appointments today
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Your queue is clear for today.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {todayAppointments
                .slice()
                .sort(
                  (a, b) =>
                    new Date(a.slot_time).getTime() - new Date(b.slot_time).getTime()
                )
                .slice(0, 5)
                .map((appointment) => {
                  const status = STATUS_BADGE[appointment.status];
                  return (
                    <div key={appointment.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {appointment.patient
                              ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
                              : "Patient"}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            {formatDateTime(appointment.slot_time)}
                          </p>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4">
        <Card padding="lg">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Schedule status
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {doctor
                  ? `${doctor.specialization} availability for patient bookings`
                  : "Weekly availability for patient bookings"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={activeScheduleDays > 0 ? "success" : "warning"} dot>
                {loading
                  ? "Loading"
                  : activeScheduleDays > 0
                    ? `${activeScheduleDays} active day${activeScheduleDays === 1 ? "" : "s"}`
                    : "Schedule needed"}
              </Badge>
              <Link href="/my-schedule">
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-[var(--text-muted)]">
              <Spinner size="sm" /> Loading schedule...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
              {WEEK_DAYS.map((day) => {
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
                          ? `${formatScheduleTime(schedule.start_time)} - ${formatScheduleTime(schedule.end_time)}`
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
          )}
        </Card>
      </div>

      <div className="mt-4">
        <Card padding="lg">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Blocked availability
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Dates and slots patients cannot book
              </p>
            </div>
            <Link href="/my-schedule">
              <Button variant="ghost" size="sm">
                Manage slots
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-[var(--text-muted)]">
              <Spinner size="sm" /> Loading blocked availability...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Upcoming unavailable days
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Full-day blocks
                    </p>
                  </div>
                  <Badge variant={upcomingLeaves.length > 0 ? "warning" : "neutral"} dot>
                    {upcomingLeaves.length}
                  </Badge>
                </div>

                {upcomingLeaves.length === 0 ? (
                  <p className="py-4 text-sm text-[var(--text-muted)]">
                    No upcoming unavailable days.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {upcomingLeaves.map((leave) => (
                      <div key={leave.id} className="py-3 first:pt-0 last:pb-0">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {formatDateLabel(leave.leave_date)}
                        </p>
                        {leave.reason && (
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            {leave.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Tomorrow blocked slots
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {formatDateLabel(toDateParam(tomorrowDate()))}
                    </p>
                  </div>
                  <Badge variant={tomorrowBlocks.length > 0 ? "warning" : "neutral"} dot>
                    {tomorrowBlocks.length}
                  </Badge>
                </div>

                {tomorrowBlocks.length === 0 ? (
                  <p className="py-4 text-sm text-[var(--text-muted)]">
                    No blocked slots for tomorrow.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {tomorrowBlocks.map((block) => (
                      <div key={block.id} className="py-3 first:pt-0 last:pb-0">
                        <p className="text-sm font-mono font-medium text-[var(--text-primary)]">
                          {formatScheduleTime(block.start_time)} - {formatScheduleTime(block.end_time)}
                        </p>
                        {block.reason && (
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            {block.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const greeting = getGreeting();
  const firstName = user?.first_name ?? "there";
  const roleLabel = user?.role?.replace("_", " ") ?? "workspace";

  const visibleActions = QUICK_ACTIONS.filter(
    (a) => !user?.role || a.roles.includes(user.role as UserRole)
  );

  if (user?.role === UserRole.PATIENT) {
    return <PatientDashboard />;
  }

  if (user?.role === UserRole.DOCTOR) {
    return <DoctorDashboard />;
  }

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${firstName}`}
        subtitle={`${roleLabel} operations overview`}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            accent={s.accent}
          />
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {visibleActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card
                padding="md"
                className="h-full flex flex-col gap-3 cursor-pointer hover:border-[var(--accent-muted)] hover:shadow-md transition-all duration-150 group"
              >
                <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:text-white transition-colors duration-150">
                  {action.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{action.label}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{action.description}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity placeholder — will be replaced when feature pages are built */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Recent activity</h2>
        <Card padding="lg" className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="w-10 h-10 rounded-full bg-[var(--gray-100)] flex items-center justify-center text-[var(--text-muted)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">No recent activity</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Activity will appear here once appointments and invoices are created.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
