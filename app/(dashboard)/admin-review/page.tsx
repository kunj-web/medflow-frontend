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
      await Promise.all([fetchPendingDoctors(), fetchHospitals()]);
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

  const reviewStats = [
    {
      label: "Pending",
      value: doctors.length,
      tone: "bg-[#d9edbd]/80",
    },
    {
      label: "Hospitals",
      value: doctors.filter((doctor) => doctor.work_type === "hospital").length,
      tone: "bg-[#bfe0f2]/80",
    },
    {
      label: "Clinics",
      value: doctors.filter((doctor) => doctor.work_type === "clinic").length,
      tone: "bg-[#ffc2dc]/75",
    },
  ];

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Doctor review"
        subtitle="Approve pending doctor registrations and resolve hospital affiliations"
        actions={
          <Button variant="secondary" size="sm" onClick={fetchPendingDoctors} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <section className="overflow-hidden rounded-[28px] border border-white/65 bg-[#dceff5]/80 p-5 shadow-[0_20px_60px_rgba(24,86,115,0.12)] backdrop-blur-2xl sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#24708a]">
              Admin review queue
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-[#062f3d] sm:text-4xl">
              Review doctor registrations and resolve affiliations.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#456773]">
              Approve verified doctors, link them to an existing hospital, or
              create a hospital profile from the submitted details.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {reviewStats.map((item) => (
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
        <div className="rounded-2xl border border-red-200 bg-[var(--error-bg)] px-4 py-3 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      {loading ? (
        <Card padding="lg" className="border-white/70 bg-white/72 text-sm text-[#55717b] shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
          Loading pending doctors...
        </Card>
      ) : doctors.length === 0 ? (
        <Card padding="lg" className="flex flex-col items-center justify-center gap-3 border-white/70 bg-white/72 py-14 text-center shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-green-200 bg-[var(--success-bg)] text-[var(--success)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#062f3d]">No pending doctors</p>
          <p className="text-xs text-[#55717b]">New doctor registrations will appear here.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {doctors.map((doctor) => {
            const state = reviewState[doctor.id] ?? EMPTY_REVIEW;
            const needsHospitalDecision =
              doctor.work_type === "hospital" && !doctor.hospital_id;
            const busy = actionId === doctor.id;

            return (
              <Card key={doctor.id} padding="lg" className="flex flex-col gap-5 border-white/70 bg-white/72 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold text-[#062f3d]">
                        {fullName(doctor)}
                      </h2>
                      <Badge variant="warning" dot>
                        Pending
                      </Badge>
                      <Badge variant="neutral" className="capitalize">
                        {doctor.work_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#55717b] mt-1">
                      {doctor.specialization}
                      {doctor.qualification ? `, ${doctor.qualification}` : ""}
                    </p>
                    <p className="text-xs text-[#55717b] mt-1">
                      {[doctor.email, doctor.phone].filter(Boolean).join(" - ")}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#55717b]">
                      Affiliation
                    </p>
                    <p className="text-sm font-medium text-[#062f3d] mt-1">
                      {formatWorkplace(doctor) || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3">
                    <p className="text-xs font-medium text-[#55717b]">Registration no.</p>
                    <p className="mt-1 text-sm font-semibold text-[#062f3d]">{doctor.registration_number ?? "-"}</p>
                  </div>
                  <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3">
                    <p className="text-xs font-medium text-[#55717b]">Experience</p>
                    <p className="mt-1 text-sm font-semibold text-[#062f3d]">{doctor.experience_years} years</p>
                  </div>
                  <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3">
                    <p className="text-xs font-medium text-[#55717b]">Gender</p>
                    <p className="mt-1 text-sm font-semibold text-[#062f3d] capitalize">
                      {doctor.gender.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>

                {needsHospitalDecision && (
                  <div className="flex flex-col gap-3 rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 p-4">
                    <div className="grid grid-cols-2 gap-2 max-w-md">
                      <button
                        type="button"
                        onClick={() => updateReview(doctor.id, { mode: "existing" })}
                        className={`h-9 rounded-full border text-sm font-semibold transition-colors ${
                          state.mode === "existing"
                            ? "border-[#0a6792] bg-[#edf8fb] text-[#0a6792]"
                            : "border-[#d8edf3] bg-white/80 text-[#55717b] hover:bg-[#edf8fb]"
                        }`}
                      >
                        Link existing
                      </button>
                      <button
                        type="button"
                        onClick={() => updateReview(doctor.id, { mode: "create" })}
                        className={`h-9 rounded-full border text-sm font-semibold transition-colors ${
                          state.mode === "create"
                            ? "border-[#0a6792] bg-[#edf8fb] text-[#0a6792]"
                            : "border-[#d8edf3] bg-white/80 text-[#55717b] hover:bg-[#edf8fb]"
                        }`}
                      >
                        Create hospital
                      </button>
                    </div>

                    {state.mode === "existing" ? (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[#062f3d]">
                          Hospital
                        </label>
                        <select
                          value={state.hospital_id}
                          onChange={(e) => updateReview(doctor.id, { hospital_id: e.target.value })}
                          className="h-9 w-full rounded-2xl border border-[#d8edf3] bg-white/80 px-3 text-sm text-[#062f3d] focus:border-[#0a6792] focus:outline-none focus:ring-2 focus:ring-[#0a6792]"
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

                <div className="flex flex-col gap-3 border-t border-[#d8edf3] pt-4 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Input
                      label="Rejection reason"
                      value={state.reject_reason}
                      onChange={(e) => updateReview(doctor.id, { reject_reason: e.target.value })}
                      placeholder="Optional note"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
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
