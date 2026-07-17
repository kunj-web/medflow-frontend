"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import PageHeader from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { SkeletonLine } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import { BloodGroup, Gender, UserRole } from "@/types/common";
import { Patient, PatientUpdate } from "@/types/patient";

interface ProfileForm {
  gender: Gender | "";
  date_of_birth: string;
  blood_group: BloodGroup | "";
  height: string;
  weight: string;
  allergies: string;
  existing_conditions: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  city: string;
  state: string;
}

const EMPTY_FORM: ProfileForm = {
  gender: "",
  date_of_birth: "",
  blood_group: "",
  height: "",
  weight: "",
  allergies: "",
  existing_conditions: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  city: "",
  state: "",
};

const BLOOD_GROUPS = Object.values(BloodGroup);
const GENDERS = Object.values(Gender);

function displayValue(value?: string | null) {
  return value || "-";
}

function toForm(patient: Patient): ProfileForm {
  return {
    gender: patient.gender ?? "",
    date_of_birth: patient.date_of_birth ?? "",
    blood_group: patient.blood_group ?? "",
    height: patient.height ? String(patient.height) : "",
    weight: patient.weight ? String(patient.weight) : "",
    allergies: patient.allergies ?? "",
    existing_conditions: patient.existing_conditions ?? "",
    emergency_contact_name: patient.emergency_contact_name ?? "",
    emergency_contact_phone: patient.emergency_contact_phone ?? "",
    city: patient.city ?? "",
    state: patient.state ?? "",
  };
}

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

function calculateAge(dateOfBirth: string) {
  if (!dateOfBirth) return "";
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? `${age} years` : "";
}

export default function ProfilePage() {
  const { user, isPatient } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const roleLabel = user?.role?.replace("_", " ") ?? "-";
  const isAdmin = user?.role === UserRole.ADMIN;

  const fetchPatient = useCallback(async () => {
    if (!isPatient) return;
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get<Patient>("/api/v1/patients/me");
      setPatient(data);
      setForm(toForm(data));
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [isPatient]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  function setField(field: keyof ProfileForm) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (success) setSuccess("");
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const height = optionalNumber(form.height);
    const weight = optionalNumber(form.weight);
    if (
      (form.height.trim() && (height === null || Number.isNaN(height))) ||
      (form.weight.trim() && (weight === null || Number.isNaN(weight)))
    ) {
      setSaving(false);
      setError("Height and weight must be valid numbers.");
      return;
    }

    const payload: PatientUpdate = {
      gender: form.gender ? (form.gender as Gender) : null,
      date_of_birth: form.date_of_birth || null,
      blood_group: form.blood_group ? (form.blood_group as BloodGroup) : null,
      height,
      weight,
      allergies: optionalString(form.allergies),
      existing_conditions: optionalString(form.existing_conditions),
      emergency_contact_name: optionalString(form.emergency_contact_name),
      emergency_contact_phone: optionalString(form.emergency_contact_phone),
      city: optionalString(form.city),
      state: optionalString(form.state),
    };

    try {
      const { data } = await api.put<Patient>("/api/v1/patients/me", payload);
      setPatient(data);
      setForm(toForm(data));
      setSuccess("Profile updated.");
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Profile"
        subtitle={isAdmin ? "Admin account and workspace identity" : "Your account and patient details"}
      />

      <section className="overflow-hidden rounded-[28px] border border-white/65 bg-[#dceff5]/80 p-5 shadow-[0_20px_60px_rgba(24,86,115,0.12)] backdrop-blur-2xl sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#24708a]">
              {isAdmin ? "Admin profile" : "Account profile"}
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-normal text-[#062f3d] sm:text-4xl">
              {isAdmin
                ? "Manage your admin identity and access overview."
                : "Keep your account and care details up to date."}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#456773]">
              {isAdmin
                ? "This profile shows the account details used across admin workflows. Medical profile fields stay hidden for admin users."
                : "Your account identity appears across MedFlow, while patient details help generate your health snapshot card."}
            </p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/48 px-4 py-4 text-[#062f3d] shadow-sm backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#456773]">
              Account status
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <Badge variant={user?.status === "active" ? "success" : "warning"} className="capitalize">
                {displayValue(user?.status)}
              </Badge>
              <span className="text-xs font-medium capitalize text-[#55717b]">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-5">
        <Card padding="lg" className="border-white/70 bg-white/72 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-[#d8edf3]">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0a6792] text-base font-semibold text-[#eaf8fb]">
              {getInitials(user?.first_name ?? (fullName || "U"), user?.last_name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-[#062f3d] truncate">
                  {fullName || displayValue(user?.email)}
                </h2>
                <Badge variant="info" className="capitalize">
                  {roleLabel}
                </Badge>
              </div>
              <p className="text-sm text-[#55717b] mt-1 truncate">
                {displayValue(user?.email)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pt-6">
            <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3">
              <p className="text-xs font-medium text-[#55717b]">Full name</p>
              <p className="mt-1 text-sm font-semibold text-[#062f3d]">
                {fullName || "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3">
              <p className="text-xs font-medium text-[#55717b]">Phone</p>
              <p className="mt-1 text-sm font-semibold text-[#062f3d]">
                {displayValue(patient?.phone ?? user?.phone)}
              </p>
            </div>
            <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3">
              <p className="text-xs font-medium text-[#55717b]">Email</p>
              <p className="mt-1 break-all text-sm font-semibold text-[#062f3d]">
                {displayValue(patient?.email ?? user?.email)}
              </p>
            </div>
            <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3">
              <p className="text-xs font-medium text-[#55717b]">
                Account status
              </p>
              <p className="mt-1 text-sm font-semibold text-[#062f3d] capitalize">
                {displayValue(user?.status)}
              </p>
            </div>
          </div>
        </Card>

        {isAdmin && (
          <Card padding="lg" className="border-white/70 bg-white/72 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
            <div className="mb-6">
              <div className="inline-flex rounded-full border border-[#b7d5de] bg-[#edf8fb] px-3 py-1 text-xs font-semibold text-[#0a6792]">
                Admin settings
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-normal text-[#062f3d]">
                Access overview
              </h2>
              <p className="mt-1 text-sm text-[#55717b]">
                Admin accounts manage platform operations. Profile editing can be connected here when account settings APIs are available.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3">
                <p className="text-xs font-medium text-[#55717b]">Role</p>
                <p className="mt-1 text-sm font-semibold capitalize text-[#062f3d]">{roleLabel}</p>
              </div>
              <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3">
                <p className="text-xs font-medium text-[#55717b]">Super admin</p>
                <p className="mt-1 text-sm font-semibold text-[#062f3d]">
                  {user?.is_super_admin ? "Yes" : "No"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3">
                <p className="text-xs font-medium text-[#55717b]">Hospital scope</p>
                <p className="mt-1 break-all text-sm font-semibold text-[#062f3d]">
                  {displayValue(user?.hospital_id)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {user?.role === UserRole.PATIENT && (
          <Card padding="lg">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Patient details
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Optional medical and location information
                </p>
              </div>
              {loading && (
                <div className="w-28">
                  <SkeletonLine />
                </div>
              )}
            </div>

            {error && (
              <div className="mb-5 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--error-bg)] text-sm text-[var(--error)]">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-5 px-3 py-2 rounded-[var(--radius-md)] bg-green-50 text-sm text-green-700">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={setField("gender")}
                    disabled={loading}
                    className="w-full h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors disabled:bg-[var(--gray-100)]"
                  >
                    <option value="">Not set</option>
                    {GENDERS.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Date of birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={setField("date_of_birth")}
                  disabled={loading}
                  helper={calculateAge(form.date_of_birth)}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">
                    Blood group
                  </label>
                  <select
                    value={form.blood_group}
                    onChange={setField("blood_group")}
                    disabled={loading}
                    className="w-full h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors disabled:bg-[var(--gray-100)]"
                  >
                    <option value="">Not set</option>
                    {BLOOD_GROUPS.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Height"
                  type="number"
                  min="1"
                  step="0.1"
                  placeholder="cm"
                  value={form.height}
                  onChange={setField("height")}
                  disabled={loading}
                />

                <Input
                  label="Weight"
                  type="number"
                  min="1"
                  step="0.1"
                  placeholder="kg"
                  value={form.weight}
                  onChange={setField("weight")}
                  disabled={loading}
                />

                <Input
                  label="City"
                  value={form.city}
                  onChange={setField("city")}
                  disabled={loading}
                />

                <Input
                  label="State"
                  value={form.state}
                  onChange={setField("state")}
                  disabled={loading}
                />

                <Input
                  label="Emergency contact name"
                  value={form.emergency_contact_name}
                  onChange={setField("emergency_contact_name")}
                  disabled={loading}
                />

                <Input
                  label="Emergency contact phone"
                  value={form.emergency_contact_phone}
                  onChange={setField("emergency_contact_phone")}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">
                    Allergies
                  </label>
                  <textarea
                    value={form.allergies}
                    onChange={setField("allergies")}
                    disabled={loading}
                    rows={4}
                    className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors disabled:bg-[var(--gray-100)]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">
                    Existing medical conditions
                  </label>
                  <textarea
                    value={form.existing_conditions}
                    onChange={setField("existing_conditions")}
                    disabled={loading}
                    rows={4}
                    className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors disabled:bg-[var(--gray-100)]"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" loading={saving} disabled={loading}>
                  Save profile
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
