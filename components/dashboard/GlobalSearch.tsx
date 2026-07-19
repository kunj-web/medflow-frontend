"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  FileText,
  Search,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Appointment } from "@/types/appointment";
import { PaginatedResponse, UserRole } from "@/types/common";
import { Doctor } from "@/types/doctor";
import { Invoice } from "@/types/invoice";
import { Patient } from "@/types/patient";

type SearchKind = "appointment" | "patient" | "doctor" | "invoice";

interface SearchResult {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
}

const PAGE_SIZE = 50;

function normalize(value: string | number | null | undefined) {
  return String(value ?? "").toLowerCase();
}

function includesQuery(query: string, values: Array<string | number | null | undefined>) {
  return values.some((value) => normalize(value).includes(query));
}

function resultIcon(kind: SearchKind) {
  const className = "h-4 w-4";
  if (kind === "appointment") return <CalendarDays className={className} />;
  if (kind === "patient") return <UserRound className={className} />;
  if (kind === "doctor") return <Stethoscope className={className} />;
  return <FileText className={className} />;
}

function kindLabel(kind: SearchKind) {
  if (kind === "appointment") return "Appointment";
  if (kind === "patient") return "Patient";
  if (kind === "doctor") return "Doctor";
  return "Invoice";
}

function appointmentToResult(appointment: Appointment): SearchResult {
  const patientName = appointment.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`.trim()
    : "Patient";
  const doctorName = appointment.doctor
    ? `Dr. ${appointment.doctor.first_name} ${appointment.doctor.last_name}`.trim()
    : "Doctor";

  return {
    id: appointment.id,
    kind: "appointment",
    title: `Token #${appointment.token_number ?? "-"}`,
    subtitle: `${patientName} with ${doctorName}`,
    meta: `${appointment.status} • ${formatDateTime(appointment.slot_time)}`,
    href: `/appointments#${appointment.id}`,
  };
}

function patientToResult(patient: Patient): SearchResult {
  const name = `${patient.first_name} ${patient.last_name}`.trim();
  return {
    id: patient.id,
    kind: "patient",
    title: name || "Patient",
    subtitle: patient.phone ?? patient.email ?? "Patient record",
    meta: [patient.city, patient.state].filter(Boolean).join(", ") || "Profile",
    href: `/patients#${patient.id}`,
  };
}

function doctorToResult(doctor: Doctor): SearchResult {
  const name = `Dr. ${doctor.first_name} ${doctor.last_name}`.trim();
  return {
    id: doctor.id,
    kind: "doctor",
    title: name,
    subtitle: doctor.specialization,
    meta: doctor.phone ?? doctor.email ?? "Doctor profile",
    href: `/doctors#${doctor.id}`,
  };
}

function invoiceToResult(invoice: Invoice): SearchResult {
  return {
    id: invoice.id,
    kind: "invoice",
    title: invoice.invoice_number,
    subtitle: `${invoice.status} • Balance ${formatCurrency(invoice.balance_due)}`,
    meta: `Total ${formatCurrency(invoice.total_amount)}`,
    href: `/invoices#${invoice.id}`,
  };
}

export default function GlobalSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const role = user?.role as UserRole | undefined;
  const trimmedQuery = query.trim();
  const normalizedQuery = normalize(trimmedQuery);

  const placeholder = useMemo(() => {
    if (role === UserRole.ADMIN) return "Search patients, doctors, invoices, appointments";
    if (role === UserRole.DOCTOR) return "Search appointments and patients";
    if (role === UserRole.PATIENT) return "Search your appointments and invoices";
    return "Search MedFlow";
  }, [role]);

  const search = useCallback(async () => {
    if (!role || trimmedQuery.length < 2) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const requests: Array<Promise<SearchResult[]>> = [];

      requests.push(
        api
          .get<PaginatedResponse<Appointment>>("/api/v1/appointments/", {
            params: { page: 1, page_size: PAGE_SIZE },
          })
          .then(({ data }) =>
            (data.data ?? [])
              .filter((appointment) =>
                includesQuery(normalizedQuery, [
                  appointment.token_number,
                  appointment.status,
                  appointment.type,
                  appointment.slot_time,
                  appointment.patient?.first_name,
                  appointment.patient?.last_name,
                  appointment.patient?.phone,
                  appointment.doctor?.first_name,
                  appointment.doctor?.last_name,
                  appointment.doctor?.specialization,
                ])
              )
              .map(appointmentToResult)
          )
      );

      if (role === UserRole.ADMIN) {
        requests.push(
          api
            .get<PaginatedResponse<Patient>>("/api/v1/patients", {
              params: { search: trimmedQuery, page: 1, page_size: 8 },
            })
            .then(({ data }) => (data.data ?? []).map(patientToResult))
        );
        requests.push(
          api
            .get<PaginatedResponse<Doctor>>("/api/v1/doctors", {
              params: { page: 1, page_size: PAGE_SIZE },
            })
            .then(({ data }) =>
              (data.data ?? [])
                .filter((doctor) =>
                  includesQuery(normalizedQuery, [
                    doctor.first_name,
                    doctor.last_name,
                    doctor.specialization,
                    doctor.phone,
                    doctor.email,
                    doctor.registration_number,
                  ])
                )
                .map(doctorToResult)
            )
        );
      }

      if (role === UserRole.DOCTOR) {
        requests.push(
          api
            .get<PaginatedResponse<Appointment>>("/api/v1/appointments/", {
              params: { page: 1, page_size: PAGE_SIZE },
            })
            .then(({ data }) => {
              const seen = new Set<string>();
              return (data.data ?? [])
                .filter((appointment) => appointment.patient)
                .filter((appointment) =>
                  includesQuery(normalizedQuery, [
                    appointment.patient?.first_name,
                    appointment.patient?.last_name,
                    appointment.patient?.phone,
                  ])
                )
                .flatMap((appointment) => {
                  const patient = appointment.patient;
                  if (!patient || seen.has(patient.id)) return [];
                  seen.add(patient.id);
                  return [
                    {
                      id: patient.id,
                      kind: "patient" as const,
                      title: `${patient.first_name} ${patient.last_name}`.trim(),
                      subtitle: patient.phone ?? "Patient from your appointments",
                      meta: `Appointment ${formatDateTime(appointment.slot_time)}`,
                      href: `/appointments#${appointment.id}`,
                    },
                  ];
                });
            })
        );
      }

      if (role === UserRole.ADMIN || role === UserRole.PATIENT) {
        requests.push(
          api
            .get<PaginatedResponse<Invoice>>("/api/v1/invoices", {
              params: { page: 1, page_size: PAGE_SIZE },
            })
            .then(({ data }) =>
              (data.data ?? [])
                .filter((invoice) =>
                  includesQuery(normalizedQuery, [
                    invoice.invoice_number,
                    invoice.status,
                    invoice.total_amount,
                    invoice.balance_due,
                    invoice.notes,
                  ])
                )
                .map(invoiceToResult)
            )
        );
      }

      const settled = await Promise.allSettled(requests);
      const nextResults = settled
        .flatMap((item) => (item.status === "fulfilled" ? item.value : []))
        .slice(0, 10);

      setResults(nextResults);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [normalizedQuery, role, trimmedQuery]);

  useEffect(() => {
    const timer = window.setTimeout(search, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function closeAndClear() {
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  return (
    <div ref={containerRef} className="relative hidden min-w-0 flex-1 md:block">
      <div className="relative max-w-xl">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6a8791]"
        />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="h-9 w-full rounded-full border border-[#d8edf3] bg-white/75 pl-9 pr-9 text-sm text-[#062f3d] shadow-sm outline-none backdrop-blur-xl transition placeholder:text-[#7f99a3] focus:border-[#9bd4dd] focus:bg-white"
        />
        {query && (
          <button
            type="button"
            onClick={closeAndClear}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#6a8791] transition hover:bg-[#eef7fa] hover:text-[#062f3d]"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && query && (
        <div className="absolute left-0 top-full z-40 mt-2 w-[min(620px,calc(100vw-320px))] overflow-hidden rounded-[24px] border border-white/70 bg-[#f8fcfd]/94 shadow-[0_24px_70px_rgba(24,86,115,0.18)] backdrop-blur-2xl">
          <div className="border-b border-[#d8edf3] bg-[#dceff5]/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#24708a]">
              Global Search
            </p>
            <p className="mt-1 text-xs text-[#55717b]">{placeholder}</p>
          </div>

          <div className="max-h-[430px] overflow-y-auto p-3">
            {trimmedQuery.length < 2 ? (
              <div className="rounded-2xl border border-dashed border-[#c8e3ea] bg-white/55 px-4 py-6 text-center text-sm text-[#55717b]">
                Type at least 2 characters.
              </div>
            ) : loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-2xl bg-gradient-to-r from-[#e7f4f7] via-white/80 to-[#d7edf3]"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]">
                {error}
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#c8e3ea] bg-white/55 px-4 py-8 text-center">
                <p className="text-sm font-medium text-[#062f3d]">No results found</p>
                <p className="mt-1 text-xs text-[#55717b]">
                  Try a name, phone, token, invoice number, status, or date.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map((result) => (
                  <Link
                    key={`${result.kind}-${result.id}`}
                    href={result.href}
                    onClick={closeAndClear}
                    className="group flex items-center gap-3 rounded-2xl border border-[#d8edf3] bg-white/62 px-3 py-3 transition hover:border-[#9bd4dd] hover:bg-[#dceff5]/75"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-[#bfe0f2]/80 text-[#0c6983]">
                      {resultIcon(result.kind)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[#062f3d]">
                          {result.title}
                        </p>
                        <span className="shrink-0 rounded-full border border-[#d8edf3] bg-[#f8fcfd] px-2 py-0.5 text-[10px] font-medium text-[#456773]">
                          {kindLabel(result.kind)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-[#55717b]">{result.subtitle}</p>
                    </div>
                    <p className="hidden max-w-[160px] truncate text-right text-[11px] font-medium text-[#6a8791] lg:block">
                      {result.meta}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
