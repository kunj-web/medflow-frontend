"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Search,
  UserRound,
  X,
} from "lucide-react";
import PageHeader from "@/components/dashboard/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/Skeleton";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import { cn, formatDate, formatDateTime, formatPhone, getInitials } from "@/lib/utils";
import { Appointment, AppointmentStatus } from "@/types/appointment";
import { PaginatedResponse } from "@/types/common";
import { Patient, PatientListParams } from "@/types/patient";
import { useAuth } from "@/hooks/useAuth";

const PAGE_SIZE = 12;

const STATUS_BADGE: Record<AppointmentStatus, { variant: "success" | "warning" | "error" | "neutral" | "info"; label: string }> = {
  [AppointmentStatus.SCHEDULED]: { variant: "info", label: "Scheduled" },
  [AppointmentStatus.CONFIRMED]: { variant: "info", label: "Confirmed" },
  [AppointmentStatus.IN_PROGRESS]: { variant: "warning", label: "In progress" },
  [AppointmentStatus.COMPLETED]: { variant: "success", label: "Completed" },
  [AppointmentStatus.CANCELLED]: { variant: "error", label: "Cancelled" },
  [AppointmentStatus.NO_SHOW]: { variant: "warning", label: "No-show" },
};

export default function PatientsPage() {
  const { isAdmin, isDoctor, loaded } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchPatients = useCallback(async () => {
    if (!loaded || !isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params: PatientListParams = { page, page_size: PAGE_SIZE };
      if (debouncedSearch) params.search = debouncedSearch;

      const { data } = await api.get<PaginatedResponse<Patient>>("/api/v1/patients", {
        params,
      });

      setPatients(data.data ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.total_pages ?? 1);
    } catch (err) {
      setPatients([]);
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, isAdmin, loaded, page]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  async function openPatient(patient: Patient) {
    setSelectedPatient(patient);
    setAppointments([]);
    setDetailError("");
    setDetailLoading(true);

    try {
      const [detailRes, historyRes] = await Promise.all([
        api.get<Patient>(`/api/v1/patients/${patient.id}`),
        api.get<PaginatedResponse<Appointment>>(`/api/v1/patients/${patient.id}/appointments`, {
          params: { page: 1, page_size: 10 },
        }),
      ]);

      setSelectedPatient(detailRes.data);
      setAppointments(historyRes.data.data ?? []);
    } catch (err) {
      setDetailError(parseApiError(err));
    } finally {
      setDetailLoading(false);
    }
  }

  const subtitle = useMemo(() => {
    if (isDoctor) return "Patient records are available from your appointment context";
    if (total > 0) return `${total} patient${total === 1 ? "" : "s"} found`;
    return "Search and review patient records";
  }, [isDoctor, total]);
  const patientStats = [
    {
      label: "Shown",
      value: patients.length,
      tone: "bg-[#d9edbd]/80",
    },
    {
      label: "Total",
      value: total,
      tone: "bg-[#bfe0f2]/80",
    },
    {
      label: "Profiles",
      value: patients.filter((patient) => patient.blood_group || patient.date_of_birth || patient.existing_conditions || patient.allergies).length,
      tone: "bg-[#ffc2dc]/75",
    },
  ];

  if (loaded && isDoctor && !isAdmin) {
    return (
      <div className="flex flex-col gap-7">
        <PageHeader title="Patients" subtitle={subtitle} />
        <Card padding="lg" className="flex flex-col items-center justify-center gap-3 border-white/70 bg-white/72 py-20 text-center shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8edf3] bg-[#edf8fb] text-[#0a6792]">
            <UserRound size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#062f3d]">Patient list is admin-only</p>
            <p className="text-xs text-[#55717b] mt-1 max-w-sm">
              Doctors can view patient information from appointments they are assigned to.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Patients"
        subtitle={subtitle}
        actions={
          <Button variant="outline" size="sm" onClick={fetchPatients} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <section className="overflow-hidden rounded-[28px] border border-white/65 bg-[#dceff5]/80 p-5 shadow-[0_20px_60px_rgba(24,86,115,0.12)] backdrop-blur-2xl sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#24708a]">
              Admin patient directory
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-[#062f3d] sm:text-4xl">
              Search patient records and review care history.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#456773]">
              Find patients by name or phone, inspect their profile details, and
              review recent appointment history from one place.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {patientStats.map((item) => (
              <div
                key={item.label}
                className={`${item.tone} rounded-2xl border border-white/60 px-3 py-4 text-[#062f3d] shadow-sm backdrop-blur-xl`}
              >
                <p className="text-2xl font-semibold leading-none">
                  {loading ? "..." : item.value}
                </p>
                <p className="mt-2 text-xs font-medium text-[#456773]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Card padding="none" className="overflow-hidden border-white/70 bg-white/72 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
        <div className="border-b border-[#d8edf3] bg-[#f8fcfd]/70 px-5 py-4">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-normal text-[#062f3d]">
                Patient list
              </h2>
              <p className="mt-1 text-sm text-[#55717b]">
                Search and open a patient profile drawer.
              </p>
            </div>
          </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:max-w-sm">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or phone"
              leftAddon={<Search size={15} />}
              className="rounded-full border-[#d8edf3] bg-white/80 text-[#062f3d] focus:border-[#0a6792] focus:ring-[#0a6792]"
            />
          </div>
          <p className="text-xs text-[#55717b] sm:ml-auto">
            {loading ? "Refreshing" : `${patients.length} shown`}
          </p>
        </div>
        </div>

        {error && (
          <div className="border-b border-red-200 bg-[var(--error-bg)] px-5 py-3">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="px-5 py-6">
            <SkeletonList rows={5} />
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8edf3] bg-[#edf8fb] text-[#0a6792]">
              <UserRound size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#062f3d]">No patients found</p>
              <p className="text-xs text-[#55717b] mt-1">
                Try a different name or phone search.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#d8edf3] bg-[#edf8fb]/70">
                  {["Patient", "Contact", "DOB", "Blood", "Medical", ""].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#55717b] whitespace-nowrap first:pl-5 last:pr-5"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((patient, index) => (
                  <tr
                    key={patient.id}
                    className={cn(
                      "border-b border-[#d8edf3] transition-colors hover:bg-[#f8fcfd]",
                      index === patients.length - 1 && "border-b-0"
                    )}
                  >
                    <td className="px-4 py-3 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0a6792] text-xs font-semibold text-[#eaf8fb]">
                          {getInitials(patient.first_name, patient.last_name)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#062f3d] whitespace-nowrap">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-xs text-[#55717b]">{patient.gender ?? "Gender not set"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {patient.phone && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-[#456773]">
                            <Phone size={13} /> {formatPhone(patient.phone)}
                          </span>
                        )}
                        {patient.email && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-[#55717b]">
                            <Mail size={13} /> {patient.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#456773] whitespace-nowrap">
                      {patient.date_of_birth ? formatDate(patient.date_of_birth) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {patient.blood_group ? <Badge variant="neutral">{patient.blood_group}</Badge> : <span className="text-xs text-[#55717b]">-</span>}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-[#55717b] truncate">
                        {patient.existing_conditions || patient.allergies || "No notes"}
                      </p>
                    </td>
                    <td className="px-4 py-3 pr-5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openPatient(patient)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#d8edf3] bg-[#f8fcfd]/70 px-5 py-3">
            <p className="text-xs text-[#55717b]">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft size={14} /> Prev
              </Button>
              <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-sm" onClick={(event) => event.target === event.currentTarget && setSelectedPatient(null)}>
          <aside className="flex h-full w-full max-w-xl flex-col border-l border-white/60 bg-white/82 shadow-[0_24px_70px_rgba(24,86,115,0.22)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#d8edf3] px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#24708a]">
                  Patient profile
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#062f3d]">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </h2>
                <p className="mt-1 text-sm text-[#55717b]">Profile details and appointment history</p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="flex h-8 w-8 items-center justify-center rounded-2xl text-[#55717b] transition-colors hover:bg-[#edf8fb] hover:text-[#062f3d]"
                aria-label="Close patient detail"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
              {detailError && (
                <div className="rounded-2xl border border-red-200 bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]">
                  {detailError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Info label="Phone" value={selectedPatient.phone ? formatPhone(selectedPatient.phone) : "-"} />
                <Info label="Email" value={selectedPatient.email || "-"} />
                <Info label="Date of birth" value={selectedPatient.date_of_birth ? formatDate(selectedPatient.date_of_birth) : "-"} />
                <Info label="Blood group" value={selectedPatient.blood_group || "-"} />
                <Info label="Allergies" value={selectedPatient.allergies || "-"} />
                <Info label="Conditions" value={selectedPatient.existing_conditions || "-"} />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarClock size={16} className="text-[#55717b]" />
                  <h3 className="text-sm font-semibold text-[#062f3d]">Appointments</h3>
                </div>

                {detailLoading ? (
                  <div className="py-2">
                    <SkeletonList rows={3} />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 py-10 text-center text-sm text-[#55717b]">
                    No appointment history found.
                  </div>
                ) : (
                  <div className="flex flex-col overflow-hidden rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78">
                    {appointments.map((appointment) => {
                      const badge = STATUS_BADGE[appointment.status];
                      return (
                        <div key={appointment.id} className="flex items-start justify-between gap-3 border-b border-[#d8edf3] px-4 py-3 last:border-b-0">
                          <div>
                            <p className="text-sm font-semibold text-[#062f3d]">
                              Dr. {appointment.doctor?.first_name} {appointment.doctor?.last_name}
                            </p>
                            <p className="text-xs text-[#55717b] mt-0.5">
                              {appointment.doctor?.specialization ?? "Doctor"} - {formatDateTime(appointment.slot_time)}
                            </p>
                          </div>
                          <Badge variant={badge.variant} dot>{badge.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3">
      <p className="text-xs font-medium text-[#55717b]">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#062f3d]">{value}</p>
    </div>
  );
}
