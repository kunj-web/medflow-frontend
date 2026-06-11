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
  const { isAdmin } = useAuth();

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
      const params: DoctorListParams = { page, page_size: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      if (activeFilter === "active") params.is_active = true;
      if (activeFilter === "inactive") params.is_active = false;

      const res = await api.get<PaginatedResponse<Doctor>>("/doctors", { params });
      setDoctors(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFilter]);

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

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Doctors"
        subtitle={
          total > 0
            ? `${total} doctor${total === 1 ? "" : "s"} registered`
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

      {error && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: "var(--error-bg)",
            color: "var(--error)",
            border: "1px solid var(--error)",
          }}
        >
          {error}
        </div>
      )}

    <DoctorTable
      doctors={doctors}
      total={total}
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
