"use client";

import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { SkeletonList } from "@/components/ui/Skeleton";
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
    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/72 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
      {/* ── Toolbar ── */}
      <div className="border-b border-[#d8edf3] bg-[#f8fcfd]/70 px-5 py-4">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-normal text-[#062f3d]">
              Doctor list
            </h2>
            <p className="mt-1 text-sm text-[#55717b]">
              Filter by status or search by name and specialization.
            </p>
          </div>
        </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => onActiveFilterChange(f.value)}
              className={cn(
                "h-8 rounded-full px-3 text-xs font-semibold transition-colors duration-150",
                activeFilter === f.value
                  ? "bg-[#0a6792] text-[#eaf8fb] shadow-sm"
                  : "border border-[#d8edf3] bg-white/70 text-[#55717b] hover:bg-[#edf8fb] hover:text-[#062f3d]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search name or specialization..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="rounded-full border-[#d8edf3] bg-white/80 text-[#062f3d] focus:border-[#0a6792] focus:ring-[#0a6792]"
            leftAddon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            }
          />
        </div>
      </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="px-5 py-6">
          <SkeletonList rows={5} />
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && doctors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8edf3] bg-[#edf8fb] text-[#0a6792]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#062f3d]">No doctors found</p>
            <p className="text-xs text-[#55717b] mt-1">
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
              <tr className="border-b border-[#d8edf3] bg-[#edf8fb]/70">
                {["Doctor", "Specialization", "Experience", "Contact", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#55717b] whitespace-nowrap first:pl-5 last:pr-5"
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
                    "border-b border-[#d8edf3] transition-colors hover:bg-[#f8fcfd]",
                    i === doctors.length - 1 && "border-b-0"
                  )}
                >
                  {/* Doctor */}
                  <td className="px-4 py-3 pl-5">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#0a6792] text-xs font-semibold text-[#eaf8fb]">
                        {doc.first_name[0]}{doc.last_name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-[#062f3d] whitespace-nowrap">
                          Dr. {doc.first_name} {doc.last_name}
                        </p>
                        <p className="text-xs text-[#55717b] font-mono">
                          {doc.registration_number}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Specialization */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#55717b]">
                      {doc.specialization ?? "-"}
                    </span>
                  </td>

                  {/* Experience */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono text-xs text-[#456773]">
                      {doc.experience_years} yr{doc.experience_years === 1 ? "" : "s"}
                    </span>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-xs text-[#456773]">{doc.phone}</p>
                      <p className="text-xs text-[#55717b]">{doc.email}</p>
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
        <div className="flex items-center justify-between border-t border-[#d8edf3] bg-[#f8fcfd]/70 px-5 py-3">
          <p className="text-xs text-[#55717b]">
            Page {currentPage} of {totalPages} - {total} total
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Prev
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
