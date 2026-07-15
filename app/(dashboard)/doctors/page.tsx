"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import DoctorTable from "@/components/dashboard/doctors/DoctorTable";
import CreateDoctorModal from "@/components/dashboard/doctors/CreateDoctorModal";
import ScheduleModal from "@/components/dashboard/doctors/ScheduleModal";
import SlotViewer from "@/components/dashboard/doctors/SlotViewer";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { parseApiError } from "@/lib/auth";
import api from "@/lib/api";
import type { Doctor, DoctorListParams } from "@/types/doctor";
import type { PaginatedResponse } from "@/types/common";

const PAGE_SIZE = 15;

export default function DoctorsPage() {
  const { user, isAdmin, isDoctor } = useAuth();

  // ── list state ───────────────────────────────────────────────
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── filter state ─────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  // ── modal state ──────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [scheduleDoctor, setScheduleDoctor] = useState<Doctor | null>(null);
  const [slotDoctor, setSlotDoctor] = useState<Doctor | null>(null);

  // ── fetch ────────────────────────────────────────────────────
  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: DoctorListParams = {
        page,
        page_size: isDoctor && !isAdmin ? 100 : PAGE_SIZE,
      };
      if (search.trim()) params.search = search.trim();
      if (activeFilter === "active") params.is_active = true;
      if (activeFilter === "inactive") params.is_active = false;

      const res = await api.get<PaginatedResponse<Doctor>>("/api/v1/doctors", { params });
      setDoctors(res.data.data ?? []);
      setTotal(res.data.total);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFilter, isAdmin, isDoctor]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, activeFilter]);

  // ── handlers ─────────────────────────────────────────────────
  const handleCreated = () => {
    setShowCreate(false);
    fetchDoctors();
  };

  const visibleDoctors = isDoctor && !isAdmin
    ? doctors.filter((doctor) => doctor.user_id === user?.user_id)
    : doctors;
  const visibleTotal = isDoctor && !isAdmin ? visibleDoctors.length : total;
  const totalPages = isDoctor && !isAdmin ? 1 : Math.ceil(total / PAGE_SIZE);
  const doctorStats = [
    {
      label: "Shown",
      value: visibleDoctors.length,
      tone: "bg-[#d9edbd]/80",
    },
    {
      label: "Active",
      value: visibleDoctors.filter((doctor) => doctor.is_active).length,
      tone: "bg-[#bfe0f2]/80",
    },
    {
      label: "Inactive",
      value: visibleDoctors.filter((doctor) => !doctor.is_active).length,
      tone: "bg-[#ffc2dc]/75",
    },
  ];

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Doctors"
        subtitle={
          total > 0
            ? isDoctor && !isAdmin
              ? "Manage your schedule and slots"
              : `${total} doctor${total === 1 ? "" : "s"} registered`
            : "Manage your medical staff"
        }
        actions={
          isAdmin ? (
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              + Add Doctor
            </Button>
          ) : undefined
        }
      />

      <section className="overflow-hidden rounded-[28px] border border-white/65 bg-[#dceff5]/80 p-5 shadow-[0_20px_60px_rgba(24,86,115,0.12)] backdrop-blur-2xl sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#24708a]">
              {isDoctor && !isAdmin ? "My doctor workspace" : "Admin doctor directory"}
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-[#062f3d] sm:text-4xl">
              {isDoctor && !isAdmin
                ? "Manage your availability, schedules, and blocked slots."
                : "Manage doctor profiles, schedules, and booking availability."}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#456773]">
              {isDoctor && !isAdmin
                ? "Review your profile, update weekly schedule settings, and inspect patient-facing slots."
                : "Search doctors, check active status, open schedule controls, and review slot availability from one place."}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {doctorStats.map((item) => (
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

      {error && (
        <div
          className="rounded-2xl border border-red-200 bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]"
        >
          {error}
        </div>
      )}

    <DoctorTable
      doctors={visibleDoctors}
      total={visibleTotal}
      loading={loading}
      totalPages={totalPages}
      currentPage={page}
      search={search}
      activeFilter={activeFilter}
      onSearchChange={(v) => setSearch(v)}
      onActiveFilterChange={(v) => setActiveFilter(v)}
      onPageChange={(p) => setPage(p)}
      onViewSchedule={(doc: Doctor) => setScheduleDoctor(doc)}
      onViewSlots={(doc: Doctor) => setSlotDoctor(doc)}
    />
      {showCreate && (
        <CreateDoctorModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {scheduleDoctor && (
        <ScheduleModal
          doctor={scheduleDoctor}
          onClose={() => setScheduleDoctor(null)}
          onSaved={() => setScheduleDoctor(null)}
        />
      )}

      {slotDoctor && (
        <SlotViewer
          doctor={slotDoctor}
          onClose={() => setSlotDoctor(null)}
        />
      )}
    </div>
  );
}
