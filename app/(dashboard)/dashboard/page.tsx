"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/dashboard/PageHeader";
import BookModal from "@/components/dashboard/appointments/BookModal";
import PatientSnapshotCard from "@/components/dashboard/patient/PatientSnapshotCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SkeletonCard, SkeletonList } from "@/components/ui/Skeleton";
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
    value: "-",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
  },
  {
    label: "Active doctors",
    value: "-",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    label: "Patients registered",
    value: "-",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    label: "Pending invoices",
    value: "-",
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
  const patientOverview = [
    {
      label: "Upcoming",
      value: appointments.length,
      tone: "bg-[#d9edbd]/80",
    },
    {
      label: "Completed",
      value: countByStatus(recentAppointments, AppointmentStatus.COMPLETED),
      tone: "bg-[#bfe0f2]/80",
    },
    {
      label: "Cancelled",
      value: countByStatus(recentAppointments, AppointmentStatus.CANCELLED),
      tone: "bg-[#ffc2dc]/75",
    },
  ];
  const missingProfileItems = [
    !patient?.blood_group ? "blood group" : null,
    !patient?.emergency_contact_name ? "emergency contact name" : null,
    !patient?.emergency_contact_phone ? "emergency contact phone" : null,
  ].filter(Boolean);
  const shouldShowProfilePrompt =
    !patientLoading && !!patient && missingProfileItems.length > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        subtitle="Your care dashboard"
      />

      <section className="overflow-hidden rounded-[28px] border border-white/65 bg-[#dceff5]/80 p-5 shadow-[0_20px_60px_rgba(24,86,115,0.12)] backdrop-blur-2xl sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#24708a]">
              Patient workspace
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-[#062f3d] sm:text-4xl">
              Keep your visits, health card, and booking flow in one place.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#456773]">
              Appointments can be booked from tomorrow onward. Same-day
              cancellation is not available, so manage changes at least one day
              before your visit.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {patientOverview.map((item) => (
              <div
                key={item.label}
                className={`${item.tone} rounded-2xl border border-white/60 px-3 py-4 text-[#062f3d] shadow-sm backdrop-blur-xl`}
              >
                <p className="text-2xl font-semibold leading-none">
                  {recentLoading && item.label !== "Upcoming" ? "..." : item.value}
                </p>
                <p className="mt-2 text-xs font-medium text-[#456773]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {shouldShowProfilePrompt && (
        <Card padding="lg" className="border-white/70 bg-white/75 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="inline-flex rounded-full border border-[#b7d5de] bg-[#edf8fb] px-3 py-1 text-xs font-semibold text-[#0a6792]">
                Profile reminder
              </div>
              <h2 className="mt-3 text-lg font-semibold text-[#062f3d]">
                Complete your health profile.
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#55717b]">
                Add your {missingProfileItems.join(", ")} so your patient card
                and care details stay ready for visits.
              </p>
            </div>
            <Link href="/profile" className="shrink-0">
              <Button variant="primary" size="sm">
                Complete profile
              </Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card padding="lg" className="min-h-[250px] border-white/70 bg-white/72 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="inline-flex rounded-full border border-[#b7d5de] bg-[#edf8fb] px-3 py-1 text-xs font-semibold text-[#0a6792]">
                Next appointment
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-normal text-[#062f3d]">
                Your nearest scheduled visit
              </h2>
              <p className="mt-1 text-sm text-[#55717b]">
                Review the appointment details before you visit.
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

          <div className="mt-8 rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 p-4">
            {loading ? (
              <SkeletonCard />
            ) : fetchError ? (
              <p className="text-sm text-[var(--error)]">{fetchError}</p>
            ) : nextAppointment ? (
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-5 items-end">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xl font-semibold text-[#062f3d]">
                      {nextAppointment.doctor
                        ? `Dr. ${nextAppointment.doctor.first_name} ${nextAppointment.doctor.last_name}`
                        : "Doctor appointment"}
                    </p>
                    {statusMeta && (
                      <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[#55717b] mt-1">
                    {nextAppointment.doctor?.specialization ?? "Doctor"}
                  </p>
                  <p className="text-sm font-medium text-[#062f3d] mt-5">
                    {formatDateTime(nextAppointment.slot_time)}
                  </p>
                  <p className="text-xs text-[#55717b] mt-1 capitalize">
                    {nextAppointment.type.replace("_", " ")}
                    {nextAppointment.token_number
                      ? ` - Token #${nextAppointment.token_number}`
                      : ""}
                  </p>
                </div>

                <Link
                  href="/appointments"
                  className="text-sm font-semibold text-[#0a6792] hover:text-[#064c68]"
                >
                  View appointments
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-[#062f3d]">
                  No upcoming appointment
                </p>
                <p className="text-sm text-[#55717b] max-w-lg">
                  Book a visit with an available doctor when you are ready.
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card padding="lg" className="flex min-h-[250px] flex-col justify-between gap-6 border-white/70 bg-white/72 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
          <div>
            <div className="inline-flex rounded-full border border-[#b7d5de] bg-[#edf8fb] px-3 py-1 text-xs font-semibold text-[#0a6792]">
              Quick book
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-normal text-[#062f3d]">
              Need a new appointment?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#55717b]">
              This opens the existing booking flow. Choose your doctor, pick a
              future date, then select an available slot.
            </p>
          </div>
          <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3 text-xs leading-5 text-[#55717b]">
            Booking starts from tomorrow. Today is intentionally unavailable.
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

      <div>
        <PatientSnapshotCard
          patient={patient}
          loading={patientLoading}
          error={patientError}
        />
      </div>

      <div>
        <Card padding="lg" className="border-white/70 bg-white/72 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-semibold text-[#062f3d]">
                Recent appointments
              </h2>
              <p className="text-xs text-[#55717b] mt-1">
                Latest activity from your appointments
              </p>
            </div>
            <Link
              href="/appointments"
              className="text-sm font-semibold text-[#0a6792] hover:text-[#064c68]"
            >
              View all
            </Link>
          </div>

          {recentLoading ? (
            <SkeletonList rows={3} />
          ) : recentError ? (
            <p className="py-6 text-sm text-[var(--error)]">{recentError}</p>
          ) : recentAppointments.length === 0 ? (
            <div className="py-8">
              <p className="text-sm font-semibold text-[#062f3d]">
                No appointments yet
              </p>
              <p className="text-sm text-[#55717b] mt-1">
                Book your first appointment when you are ready.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {recentAppointments.map((appointment) => {
                const status = STATUS_BADGE[appointment.status];
                return (
                  <div
                    key={appointment.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[#062f3d] truncate">
                          {appointment.doctor
                            ? `Dr. ${appointment.doctor.first_name} ${appointment.doctor.last_name}`
                            : "Doctor appointment"}
                        </p>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-xs text-[#55717b] mt-1">
                        {appointment.doctor?.specialization ?? "Doctor"} -{" "}
                        <span className="capitalize">
                          {appointment.type.replace("_", " ")}
                        </span>
                      </p>
                      {appointment.status === AppointmentStatus.CANCELLED &&
                        appointment.cancellation_reason && (
                          <p className="mt-2 rounded-xl border border-red-200 bg-[var(--error-bg)]/70 px-3 py-2 text-xs leading-5 text-[#55717b]">
                            <span className="font-semibold text-[var(--error)]">
                              Cancellation reason:
                            </span>{" "}
                            {appointment.cancellation_reason}
                          </p>
                        )}
                    </div>
                    <div className="md:text-right shrink-0">
                      <p className="text-sm font-medium text-[#062f3d]">
                        {formatDateTime(appointment.slot_time)}
                      </p>
                      {appointment.token_number && (
                        <p className="text-xs text-[#55717b] mt-1">
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
  const doctorOverview = [
    {
      label: "Today",
      value: todayAppointments.length,
      detail: "Appointments",
      tone: "bg-[#d9edbd]/80",
    },
    {
      label: "Tomorrow",
      value: tomorrowAppointments.length,
      detail: "Bookings",
      tone: "bg-[#bfe0f2]/80",
    },
    {
      label: "Scheduled",
      value: scheduledAppointments.length,
      detail: "Upcoming",
      tone: "bg-[#ffc2dc]/75",
    },
  ];
  const shouldShowSchedulePrompt =
    !loading && !!doctor && activeScheduleDays === 0;

  return (
    <div className="space-y-7">
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

      <section className="overflow-hidden rounded-[28px] border border-white/70 bg-[#dceff5]/80 p-5 shadow-[0_22px_70px_rgba(24,86,115,0.14)] backdrop-blur-2xl sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2f7689]">
              Doctor workspace
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[#062f3d] md:text-3xl">
              Review patients, appointments, and availability.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#55717b]">
              Track the today queue, tomorrow bookings, and the schedule patients
              can book against without leaving your dashboard.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {doctorOverview.map((item) => (
              <div
                key={item.label}
                className={`${item.tone} rounded-2xl border border-white/75 px-3 py-4 shadow-sm backdrop-blur-xl`}
              >
                <p className="text-xs font-medium text-[#55717b]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-[#062f3d]">
                  {loading ? "..." : item.value}
                </p>
                <p className="mt-1 text-[11px] font-medium text-[#55717b]">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {shouldShowSchedulePrompt && (
        <Card padding="lg" className="border-white/70 bg-white/75 shadow-[0_18px_50px_rgba(24,86,115,0.10)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="inline-flex rounded-full border border-[#b7d5de] bg-[#edf8fb] px-3 py-1 text-xs font-semibold text-[#0a6792]">
                Schedule reminder
              </div>
              <h2 className="mt-3 text-lg font-semibold text-[#062f3d]">
                Update your availability.
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[#55717b]">
                Add working days, hours, and slot duration so patients can find
                bookable times.
              </p>
            </div>
            <Link href="/my-schedule" className="shrink-0">
              <Button variant="primary" size="sm">
                Update schedule
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {appointmentCountGroups.map((group) => (
          <Card
            key={group.title}
            padding="lg"
            className="border-white/70 bg-white/75 shadow-[0_18px_50px_rgba(24,86,115,0.10)] backdrop-blur-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-[#062f3d]">
                  {group.title} appointments
                </h2>
                <p className="mt-1 text-xs text-[#55717b]">
                  {group.subtitle}
                </p>
              </div>
              <Badge variant="neutral">
                {loading ? "..." : group.appointments.length} total
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {appointmentCountStatuses.map((item) => (
                <div
                  key={`${group.title}-${item.status}`}
                  className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/80 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#55717b]">
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

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card
          padding="lg"
          className="min-h-[240px] border-white/70 bg-white/75 shadow-[0_18px_50px_rgba(24,86,115,0.10)] backdrop-blur-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[#062f3d]">
                Next patient
              </h2>
              <p className="mt-1 text-xs text-[#55717b]">
                Nearest upcoming scheduled appointment
              </p>
            </div>
            <Link
              href="/appointments"
              className="text-sm font-semibold text-[#0f9fa8] hover:text-[#0b7880]"
            >
              View appointments
            </Link>
          </div>

          <div className="mt-8">
            {loading ? (
              <SkeletonCard />
            ) : nextAppointment ? (
              <div className="grid grid-cols-1 items-end gap-5 rounded-[24px] border border-[#d8edf3] bg-[#f8fcfd]/80 p-5 md:grid-cols-[minmax(0,1fr)_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xl font-semibold text-[#062f3d]">
                      {nextAppointment.patient
                        ? `${nextAppointment.patient.first_name} ${nextAppointment.patient.last_name}`
                        : "Patient appointment"}
                    </p>
                    {nextStatus && (
                      <Badge variant={nextStatus.variant}>{nextStatus.label}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm capitalize text-[#55717b]">
                    {nextAppointment.type.replace("_", " ")}
                  </p>
                  <p className="mt-5 text-sm font-semibold text-[#062f3d]">
                    {formatDateTime(nextAppointment.slot_time)}
                  </p>
                  <p className="mt-1 text-xs text-[#55717b]">
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
              <div className="flex flex-col gap-3 rounded-[24px] border border-[#d8edf3] bg-[#f8fcfd]/80 p-5">
                <p className="text-sm font-semibold text-[#062f3d]">
                  No upcoming patient
                </p>
                <p className="max-w-lg text-sm text-[#55717b]">
                  Scheduled appointments will appear here when patients book a slot.
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card
          padding="lg"
          className="min-h-[240px] border-white/70 bg-white/75 shadow-[0_18px_50px_rgba(24,86,115,0.10)] backdrop-blur-xl"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[#062f3d]">
                Today queue
              </h2>
              <p className="mt-1 text-xs text-[#55717b]">
                First five appointments today
              </p>
            </div>
            <Badge variant="neutral">
              {loading ? "..." : todayAppointments.length} total
            </Badge>
          </div>

          {loading ? (
            <SkeletonList rows={3} />
          ) : todayAppointments.length === 0 ? (
            <div className="py-8">
              <p className="text-sm font-semibold text-[#062f3d]">
                No appointments today
              </p>
              <p className="mt-1 text-sm text-[#55717b]">
                Your queue is clear for today.
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
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
                    <div
                      key={appointment.id}
                      className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/80 px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#062f3d]">
                            {appointment.patient
                              ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
                              : "Patient"}
                          </p>
                          <p className="mt-1 text-xs text-[#55717b]">
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

      <div>
        <Card
          padding="lg"
          className="border-white/70 bg-white/75 shadow-[0_18px_50px_rgba(24,86,115,0.10)] backdrop-blur-xl"
        >
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#062f3d]">
                Schedule status
              </h2>
              <p className="mt-1 text-xs text-[#55717b]">
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
            <SkeletonList rows={4} className="grid-cols-1 md:grid-cols-2 xl:grid-cols-4" />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {WEEK_DAYS.map((day) => {
                const schedule = scheduleByDay.get(day.value);
                return (
                  <div
                    key={day.value}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/80 px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#062f3d]">
                        {day.label}
                      </p>
                      <p className="mt-0.5 text-xs text-[#55717b]">
                        {schedule
                          ? `${formatScheduleTime(schedule.start_time)} - ${formatScheduleTime(schedule.end_time)}`
                          : "Inactive"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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
          )}
        </Card>
      </div>

      <div>
        <Card
          padding="lg"
          className="border-white/70 bg-white/75 shadow-[0_18px_50px_rgba(24,86,115,0.10)] backdrop-blur-xl"
        >
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#062f3d]">
                Blocked availability
              </h2>
              <p className="mt-1 text-xs text-[#55717b]">
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
            <SkeletonList rows={2} className="grid-cols-1 lg:grid-cols-2" />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] border border-[#d8edf3] bg-[#f8fcfd]/80 px-4 py-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#062f3d]">
                      Upcoming unavailable days
                    </p>
                    <p className="mt-0.5 text-xs text-[#55717b]">
                      Full-day blocks
                    </p>
                  </div>
                  <Badge variant={upcomingLeaves.length > 0 ? "warning" : "neutral"} dot>
                    {upcomingLeaves.length}
                  </Badge>
                </div>

                {upcomingLeaves.length === 0 ? (
                  <p className="py-4 text-sm text-[#55717b]">
                    No upcoming unavailable days.
                  </p>
                ) : (
                  <div className="divide-y divide-[#d8edf3]">
                    {upcomingLeaves.map((leave) => (
                      <div key={leave.id} className="py-3 first:pt-0 last:pb-0">
                        <p className="text-sm font-semibold text-[#062f3d]">
                          {formatDateLabel(leave.leave_date)}
                        </p>
                        {leave.reason && (
                          <p className="mt-1 text-xs text-[#55717b]">
                            {leave.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[24px] border border-[#d8edf3] bg-[#f8fcfd]/80 px-4 py-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#062f3d]">
                      Tomorrow blocked slots
                    </p>
                    <p className="mt-0.5 text-xs text-[#55717b]">
                      {formatDateLabel(toDateParam(tomorrowDate()))}
                    </p>
                  </div>
                  <Badge variant={tomorrowBlocks.length > 0 ? "warning" : "neutral"} dot>
                    {tomorrowBlocks.length}
                  </Badge>
                </div>

                {tomorrowBlocks.length === 0 ? (
                  <p className="py-4 text-sm text-[#55717b]">
                    No blocked slots for tomorrow.
                  </p>
                ) : (
                  <div className="divide-y divide-[#d8edf3]">
                    {tomorrowBlocks.map((block) => (
                      <div key={block.id} className="py-3 first:pt-0 last:pb-0">
                        <p className="font-mono text-sm font-semibold text-[#062f3d]">
                          {formatScheduleTime(block.start_time)} - {formatScheduleTime(block.end_time)}
                        </p>
                        {block.reason && (
                          <p className="mt-1 text-xs text-[#55717b]">
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
  const adminStatTones = [
    "bg-[#d9edbd]/80",
    "bg-[#bfe0f2]/80",
    "bg-[#ffc2dc]/75",
    "bg-[#c9efe6]/80",
  ];
  const actionTones = [
    "bg-[#edf8fb]",
    "bg-[#eef7dc]",
    "bg-[#fff0f6]",
    "bg-[#edf2fb]",
  ];

  if (user?.role === UserRole.PATIENT) {
    return <PatientDashboard />;
  }

  if (user?.role === UserRole.DOCTOR) {
    return <DoctorDashboard />;
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        subtitle={`${roleLabel} operations overview`}
      />

      <section className="overflow-hidden rounded-[28px] border border-white/65 bg-[#dceff5]/80 p-5 shadow-[0_20px_60px_rgba(24,86,115,0.12)] backdrop-blur-2xl sm:p-6">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#24708a]">
              Admin command center
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-[#062f3d] sm:text-4xl">
              Keep doctors, patients, appointments, and billing moving together.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#456773]">
              Review operational health, jump into admin workflows, and keep the
              hospital workspace ready for daily care activity.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {STATS.map((stat, index) => (
              <div
                key={stat.label}
                className={`${adminStatTones[index % adminStatTones.length]} rounded-2xl border border-white/60 px-4 py-4 text-[#062f3d] shadow-sm backdrop-blur-xl`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#456773]">
                    {stat.label}
                  </p>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/60 bg-white/48 text-[#0a6792]">
                    {stat.icon}
                  </div>
                </div>
                <p className="mt-4 font-mono text-2xl font-semibold leading-none">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/72 p-5 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl sm:p-6">
        <div className="mb-5">
          <div className="inline-flex rounded-full border border-[#b7d5de] bg-[#edf8fb] px-3 py-1 text-xs font-semibold text-[#0a6792]">
            Quick actions
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-normal text-[#062f3d]">
            Admin workflows
          </h2>
          <p className="mt-1 text-sm text-[#55717b]">
            Fast access to the areas admins use most.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visibleActions.map((action, index) => (
            <Link key={action.href} href={action.href}>
              <div className="group flex h-full min-h-[150px] cursor-pointer flex-col justify-between rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#9bc7d2] hover:shadow-[0_16px_36px_rgba(24,86,115,0.13)]">
                <div
                  className={`${actionTones[index % actionTones.length]} flex h-10 w-10 items-center justify-center rounded-2xl text-[#0a6792] transition-colors duration-150 group-hover:bg-[#dceff5]`}
                >
                  {action.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#062f3d]">{action.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[#55717b]">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent activity placeholder — will be replaced when feature pages are built */}
      <section className="rounded-[28px] border border-white/70 bg-white/72 p-5 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl sm:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold tracking-normal text-[#062f3d]">
            Recent activity
          </h2>
          <p className="mt-1 text-sm text-[#55717b]">
            A live activity stream can be connected here once admin reporting APIs are ready.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-5 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8edf3] bg-[#edf8fb] text-[#0a6792]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#062f3d]">No recent activity</p>
            <p className="mt-1 text-xs text-[#55717b]">
              Activity will appear here once appointments and invoices are created.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
