"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/dashboard/PageHeader";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import {
  AdminDoctorReview,
  DoctorApproveRequest,
  PublicHospitalListResponse,
  PublicHospitalOption,
} from "@/types/adminReview";

interface ReviewState {
  mode: "existing" | "create";
  hospital_id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  reject_reason: string;
}

const EMPTY_REVIEW: ReviewState = {
  mode: "existing",
  hospital_id: "",
  name: "",
  city: "",
  state: "",
  address: "",
  phone: "",
  email: "",
  reject_reason: "",
};

function fullName(doctor: AdminDoctorReview) {
  return `${doctor.first_name} ${doctor.last_name}`.trim();
}

function formatWorkplace(doctor: AdminDoctorReview) {
  if (doctor.work_type === "clinic") {
    return [doctor.clinic_name, doctor.clinic_city].filter(Boolean).join(", ");
  }

  if (doctor.hospital_id) return "Existing hospital selected";

  return [doctor.pending_hospital_name, doctor.pending_hospital_city, doctor.pending_hospital_state]
    .filter(Boolean)
    .join(", ");
}

export default function AdminReviewPage() {
  const [doctors, setDoctors] = useState<AdminDoctorReview[]>([]);
  const [hospitals, setHospitals] = useState<PublicHospitalOption[]>([]);
  const [reviewState, setReviewState] = useState<Record<string, ReviewState>>({});
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<AdminDoctorReview[]>("/api/v1/admin/doctors/pending");
      setDoctors(data);
      setReviewState((prev) => {
        const next = { ...prev };
        data.forEach((doctor) => {
          if (!next[doctor.id]) {
            next[doctor.id] = {
              ...EMPTY_REVIEW,
              name: doctor.pending_hospital_name ?? "",
              city: doctor.pending_hospital_city ?? "",
              state: doctor.pending_hospital_state ?? "",
            };
          }
        });
        return next;
      });
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHospitals = useCallback(async () => {
    try {
      const { data } = await api.get<PublicHospitalListResponse>("/api/v1/public/hospitals", {
        params: { page_size: 100 },
      });
      setHospitals(data.data);
    } catch {
      setHospitals([]);
    }
  }, []);

  useEffect(() => {
    fetchPendingDoctors();
    fetchHospitals();
  }, [fetchPendingDoctors, fetchHospitals]);

  function updateReview(doctorId: string, patch: Partial<ReviewState>) {
    setReviewState((prev) => ({
      ...prev,
      [doctorId]: {
        ...(prev[doctorId] ?? EMPTY_REVIEW),
        ...patch,
      },
    }));
  }

  function buildApprovePayload(doctor: AdminDoctorReview): DoctorApproveRequest {
    if (doctor.work_type === "clinic" || doctor.hospital_id) return {};

    const state = reviewState[doctor.id] ?? EMPTY_REVIEW;

    if (state.mode === "existing") {
      if (!state.hospital_id) throw new Error("Select a hospital before approval.");
      return { hospital_id: state.hospital_id };
    }

    if (!state.name.trim()) {
      throw new Error("Hospital name is required before approval.");
    }

    return {
      create_hospital: {
        name: state.name.trim(),
        ...(state.city.trim() ? { city: state.city.trim() } : {}),
        ...(state.state.trim() ? { state: state.state.trim() } : {}),
        ...(state.address.trim() ? { address: state.address.trim() } : {}),
        ...(state.phone.trim() ? { phone: state.phone.trim() } : {}),
        ...(state.email.trim() ? { email: state.email.trim() } : {}),
      },
    };
  }

  async function approveDoctor(doctor: AdminDoctorReview) {
    setError(null);
    setActionId(doctor.id);
    try {
      await api.post(`/api/v1/admin/doctors/${doctor.id}/approve`, buildApprovePayload(doctor));
      await fetchPendingDoctors();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setActionId(null);
    }
  }

  async function rejectDoctor(doctor: AdminDoctorReview) {
    setError(null);
    setActionId(doctor.id);
    try {
      const state = reviewState[doctor.id] ?? EMPTY_REVIEW;
      await api.post(`/api/v1/admin/doctors/${doctor.id}/reject`, {
        ...(state.reject_reason.trim() ? { reason: state.reject_reason.trim() } : {}),
      });
      await fetchPendingDoctors();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Doctor review"
        subtitle="Approve pending doctor registrations and resolve hospital affiliations"
        actions={
          <Button variant="secondary" size="sm" onClick={fetchPendingDoctors} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm bg-[var(--error-bg)] text-[var(--error)] border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <Card padding="lg" className="text-sm text-[var(--text-muted)]">
          Loading pending doctors...
        </Card>
      ) : doctors.length === 0 ? (
        <Card padding="lg" className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <div className="w-10 h-10 rounded-full bg-[var(--success-bg)] text-[var(--success)] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)]">No pending doctors</p>
          <p className="text-xs text-[var(--text-muted)]">New doctor registrations will appear here.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {doctors.map((doctor) => {
            const state = reviewState[doctor.id] ?? EMPTY_REVIEW;
            const needsHospitalDecision =
              doctor.work_type === "hospital" && !doctor.hospital_id;
            const busy = actionId === doctor.id;

            return (
              <Card key={doctor.id} padding="lg" className="flex flex-col gap-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-semibold text-[var(--text-primary)]">
                        {fullName(doctor)}
                      </h2>
                      <Badge variant="warning" dot>
                        Pending
                      </Badge>
                      <Badge variant="neutral" className="capitalize">
                        {doctor.work_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {doctor.specialization}
                      {doctor.qualification ? `, ${doctor.qualification}` : ""}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {[doctor.email, doctor.phone].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                      Affiliation
                    </p>
                    <p className="text-sm text-[var(--text-primary)] mt-1">
                      {formatWorkplace(doctor) || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Registration no.</p>
                    <p className="text-[var(--text-primary)]">{doctor.registration_number ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Experience</p>
                    <p className="text-[var(--text-primary)]">{doctor.experience_years} years</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Gender</p>
                    <p className="text-[var(--text-primary)] capitalize">
                      {doctor.gender.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>

                {needsHospitalDecision && (
                  <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--gray-50)] p-4 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2 max-w-md">
                      <button
                        type="button"
                        onClick={() => updateReview(doctor.id, { mode: "existing" })}
                        className={`h-9 rounded-[var(--radius-md)] border text-sm font-medium ${
                          state.mode === "existing"
                            ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                            : "border-[var(--border)] bg-white text-[var(--text-secondary)]"
                        }`}
                      >
                        Link existing
                      </button>
                      <button
                        type="button"
                        onClick={() => updateReview(doctor.id, { mode: "create" })}
                        className={`h-9 rounded-[var(--radius-md)] border text-sm font-medium ${
                          state.mode === "create"
                            ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                            : "border-[var(--border)] bg-white text-[var(--text-secondary)]"
                        }`}
                      >
                        Create hospital
                      </button>
                    </div>

                    {state.mode === "existing" ? (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[var(--text-primary)]">
                          Hospital
                        </label>
                        <select
                          value={state.hospital_id}
                          onChange={(e) => updateReview(doctor.id, { hospital_id: e.target.value })}
                          className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 text-sm"
                        >
                          <option value="">Select hospital</option>
                          {hospitals.map((hospital) => (
                            <option key={hospital.id} value={hospital.id}>
                              {hospital.name}{hospital.city ? `, ${hospital.city}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <Input label="Hospital name" value={state.name} onChange={(e) => updateReview(doctor.id, { name: e.target.value })} required />
                        <Input label="City" value={state.city} onChange={(e) => updateReview(doctor.id, { city: e.target.value })} />
                        <Input label="State" value={state.state} onChange={(e) => updateReview(doctor.id, { state: e.target.value })} />
                        <Input label="Phone" value={state.phone} onChange={(e) => updateReview(doctor.id, { phone: e.target.value })} />
                        <Input label="Email" type="email" value={state.email} onChange={(e) => updateReview(doctor.id, { email: e.target.value })} />
                        <Input label="Address" value={state.address} onChange={(e) => updateReview(doctor.id, { address: e.target.value })} />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-end gap-3 border-t border-[var(--border)] pt-4">
                  <div className="flex-1">
                    <Input
                      label="Rejection reason"
                      value={state.reject_reason}
                      onChange={(e) => updateReview(doctor.id, { reject_reason: e.target.value })}
                      placeholder="Optional note"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => rejectDoctor(doctor)}
                      loading={busy}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => approveDoctor(doctor)}
                      loading={busy}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
