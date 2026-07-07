"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import ScheduleModal from "@/components/dashboard/doctors/ScheduleModal";
import SlotViewer from "@/components/dashboard/doctors/SlotViewer";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import type { PaginatedResponse } from "@/types/common";
import type { Doctor } from "@/types/doctor";

export default function MySchedulePage() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
        setError("Doctor profile not found.");
        return;
      }
      setDoctor(current);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    fetchDoctor();
  }, [fetchDoctor]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Schedule"
        subtitle="Manage your working hours, slot duration, and unavailable times"
      />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Spinner size="sm" /> Loading schedule tools...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg px-4 py-3 text-sm bg-[var(--error-bg)] text-[var(--error)] border border-[var(--error)]">
          {error}
        </div>
      )}

      {!loading && doctor && (
        <Card padding="none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 border-b border-[var(--border)]">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Dr. {doctor.first_name} {doctor.last_name}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {doctor.specialization} · {doctor.work_type}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setScheduleOpen(true)}>
                Schedule
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSlotsOpen(true)}>
                Slots
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-5 py-4">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Status</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {doctor.is_active ? "Active" : "Inactive"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Clinic/Hospital</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {doctor.clinic_name ?? doctor.pending_hospital_name ?? "Assigned"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Experience</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {doctor.experience_years} yr{doctor.experience_years === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </Card>
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
