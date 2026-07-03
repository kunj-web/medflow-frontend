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
import Spinner from "@/components/ui/Spinner";
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

  if (loaded && isDoctor && !isAdmin) {
    return (
      <div>
        <PageHeader title="Patients" subtitle={subtitle} />
        <Card padding="lg" className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)]">
            <UserRound size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Patient list is admin-only</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
              Doctors can view patient information from appointments they are assigned to.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle={subtitle}
        actions={
          <Button variant="outline" size="sm" onClick={fetchPatients} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <Card padding="none">
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-[var(--border)] sm:flex-row sm:items-center">
          <div className="w-full sm:max-w-sm">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or phone"
              leftAddon={<Search size={15} />}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] sm:ml-auto">
            {loading ? "Loading..." : `${patients.length} shown`}
          </p>
        </div>

        {error && (
          <div className="px-5 py-3 bg-[var(--error-bg)] border-b border-red-200">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-sm text-[var(--text-muted)]">
            <Spinner size="sm" /> Loading patients...
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-10 h-10 rounded-full bg-[var(--gray-100)] flex items-center justify-center text-[var(--text-muted)]">
              <UserRound size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">No patients found</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Try a different name or phone search.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
                  {["Patient", "Contact", "DOB", "Blood", "Medical", ""].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap first:pl-5 last:pr-5"
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
                      "border-b border-[var(--border)] hover:bg-[var(--gray-50)] transition-colors",
                      index === patients.length - 1 && "border-b-0"
                    )}
                  >
                    <td className="px-4 py-3 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center text-xs font-semibold">
                          {getInitials(patient.first_name, patient.last_name)}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)] whitespace-nowrap">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">{patient.gender ?? "Gender not set"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {patient.phone && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <Phone size={13} /> {formatPhone(patient.phone)}
                          </span>
                        )}
                        {patient.email && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                            <Mail size={13} /> {patient.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      {patient.date_of_birth ? formatDate(patient.date_of_birth) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {patient.blood_group ? <Badge variant="neutral">{patient.blood_group}</Badge> : <span className="text-xs text-[var(--text-muted)]">-</span>}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-xs text-[var(--text-secondary)] truncate">
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
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)] bg-[var(--gray-50)]">
            <p className="text-xs text-[var(--text-muted)]">
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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={(event) => event.target === event.currentTarget && setSelectedPatient(null)}>
          <aside className="h-full w-full max-w-xl bg-white shadow-lg flex flex-col">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[var(--border)]">
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">Patient profile and appointment history</p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--gray-100)] hover:text-[var(--text-primary)]"
                aria-label="Close patient detail"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
              {detailError && (
                <div className="px-4 py-3 rounded-[var(--radius-md)] bg-[var(--error-bg)] text-sm text-[var(--error)]">
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
                  <CalendarClock size={16} className="text-[var(--text-muted)]" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Appointments</h3>
                </div>

                {detailLoading ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-sm text-[var(--text-muted)]">
                    <Spinner size="sm" /> Loading history...
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="py-10 text-center text-sm text-[var(--text-muted)] border border-[var(--border)] rounded-[var(--radius-md)]">
                    No appointment history found.
                  </div>
                ) : (
                  <div className="flex flex-col border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden">
                    {appointments.map((appointment) => {
                      const badge = STATUS_BADGE[appointment.status];
                      return (
                        <div key={appointment.id} className="flex items-start justify-between gap-3 px-4 py-3 border-b border-[var(--border)] last:border-b-0">
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              Dr. {appointment.doctor?.first_name} {appointment.doctor?.last_name}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
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
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5 break-words">{value}</p>
    </div>
  );
}
