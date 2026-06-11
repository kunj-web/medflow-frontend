"use client";

import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import type { Doctor } from "@/types/doctor";

// ── Props ─────────────────────────────────────────────────────────────────────

interface DoctorTableProps {
  doctors: Doctor[];
  total: number;
  loading: boolean;
  totalPages: number;
  currentPage: number;
  search: string;
  activeFilter: "all" | "active" | "inactive";
  onSearchChange: (v: string) => void;
  onActiveFilterChange: (v: "all" | "active" | "inactive") => void;
  onPageChange: (page: number) => void;
  onViewSchedule: (doctor: Doctor) => void;
  onViewSlots: (doctor: Doctor) => void;
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: "all" | "active" | "inactive" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function DoctorTable({
  doctors,
  total,
  loading,
  totalPages,
  currentPage,
  search,
  activeFilter,
  onSearchChange,
  onActiveFilterChange,
  onPageChange,
  onViewSchedule,
  onViewSlots,
}: DoctorTableProps) {
  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-white overflow-hidden"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => onActiveFilterChange(f.value)}
              className={cn(
                "h-8 px-3 rounded-[var(--radius-md)] text-xs font-medium transition-colors duration-150",
                activeFilter === f.value
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--gray-100)] hover:text-[var(--text-primary)]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search name or specialization…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            leftAddon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            }
          />
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-2 text-sm text-[var(--text-muted)]">
          <Spinner size="sm" /> Loading doctors…
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && doctors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-10 h-10 rounded-full bg-[var(--gray-100)] flex items-center justify-center text-[var(--text-muted)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">No doctors found</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {search
                ? "Try a different name or specialization."
                : "Add your first doctor to get started."}
            </p>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && doctors.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
                {["Doctor", "Specialization", "Experience", "Contact", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap first:pl-5 last:pr-5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc, i) => (
                <tr
                  key={doc.id}
                  className={cn(
                    "border-b border-[var(--border)] hover:bg-[var(--gray-50)] transition-colors",
                    i === doctors.length - 1 && "border-b-0"
                  )}
                >
                  {/* Doctor */}
                  <td className="px-4 py-3 pl-5">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold text-white"
                        style={{ background: "var(--accent)" }}
                      >
                        {doc.first_name[0]}{doc.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)] whitespace-nowrap">
                          Dr. {doc.first_name} {doc.last_name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] font-mono">
                          {doc.registration_number}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Specialization */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {doc.specialization ?? "—"}
                    </span>
                  </td>

                  {/* Experience */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono text-xs text-[var(--text-secondary)]">
                      {doc.experience_years} yr{doc.experience_years === 1 ? "" : "s"}
                    </span>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">{doc.phone}</p>
                      <p className="text-xs text-[var(--text-muted)]">{doc.email}</p>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <Badge variant={doc.is_active ? "success" : "neutral"} dot>
                      {doc.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 pr-5">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewSchedule(doc)}
                      >
                        Schedule
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewSlots(doc)}
                      >
                        Slots
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)] bg-[var(--gray-50)]">
          <p className="text-xs text-[var(--text-muted)]">
            Page {currentPage} of {totalPages} · {total} total
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              ← Prev
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}