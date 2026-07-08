"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import PageHeader from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
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
    <div>
      <PageHeader title="Profile" subtitle="Your account and patient details" />

      <div className="flex flex-col gap-4">
        <Card padding="lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-[var(--border)]">
            <div className="w-14 h-14 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-base font-semibold text-[var(--accent)] shrink-0">
              {getInitials(user?.first_name ?? (fullName || "U"), user?.last_name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] truncate">
                  {fullName || displayValue(user?.email)}
                </h2>
                <Badge variant="info" className="capitalize">
                  {roleLabel}
                </Badge>
              </div>
              <p className="text-sm text-[var(--text-muted)] mt-1 truncate">
                {displayValue(user?.email)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pt-6">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Full name</p>
              <p className="text-sm text-[var(--text-primary)] mt-1">
                {fullName || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Phone</p>
              <p className="text-sm text-[var(--text-primary)] mt-1">
                {displayValue(patient?.phone ?? user?.phone)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">Email</p>
              <p className="text-sm text-[var(--text-primary)] mt-1 break-all">
                {displayValue(patient?.email ?? user?.email)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Account status
              </p>
              <p className="text-sm text-[var(--text-primary)] mt-1 capitalize">
                {displayValue(user?.status)}
              </p>
            </div>
          </div>
        </Card>

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
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Spinner size="sm" /> Loading
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
