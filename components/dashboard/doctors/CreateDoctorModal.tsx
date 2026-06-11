"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { parseApiError } from "@/lib/auth";
import api from "@/lib/api";
import type { DoctorCreate } from "@/types/doctor";
import { Gender } from "@/types/common";

// ── Props ─────────────────────────────────────────────────────────────────────

interface CreateDoctorModalProps {
  onClose: () => void;
  onCreated: () => void;
}

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  // user fields
  email: string;
  password: string;
  // doctor fields
  first_name: string;
  last_name: string;
  phone: string;
  gender: Gender | "";
  specialization: string;
  registration_number: string;
  experience_years: string;
}

const EMPTY: FormState = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone: "",
  gender: "",
  specialization: "",
  registration_number: "",
  experience_years: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateDoctorModal({ onClose, onCreated }: CreateDoctorModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── field helpers ─────────────────────────────────────────────
  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ── validation ────────────────────────────────────────────────
  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.first_name.trim()) next.first_name = "First name is required.";
    if (!form.last_name.trim()) next.last_name = "Last name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Password is required.";
    else if (form.password.length < 8) next.password = "Password must be at least 8 characters.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    if (!form.gender) next.gender = "Gender is required.";
    if (!form.specialization.trim()) next.specialization = "Specialization is required.";
    if (!form.registration_number.trim())
      next.registration_number = "Registration number is required.";
    if (!form.experience_years) next.experience_years = "Experience is required.";
    else if (isNaN(Number(form.experience_years)) || Number(form.experience_years) < 0)
      next.experience_years = "Enter a valid number of years.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setApiError(null);
    setLoading(true);
    try {
      const payload: DoctorCreate = {
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        gender: form.gender as Gender,
        specialization: form.specialization.trim(),
        registration_number: form.registration_number.trim(),
        experience_years: Number(form.experience_years),
      };
      await api.post("/doctors", payload);
      onCreated();
    } catch (err) {
      setApiError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── backdrop close ────────────────────────────────────────────
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // ── render ────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white flex flex-col"
        style={{
          boxShadow: "var(--shadow-lg)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Add Doctor</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Creates a user account and doctor profile in one step.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--gray-100)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* API error */}
          {apiError && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: "var(--error-bg)",
                color: "var(--error)",
                border: "1px solid var(--error)",
              }}
            >
              {apiError}
            </div>
          )}

          {/* Section — Account */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              Login account
            </p>
            <div className="grid grid-cols-1 gap-3">
              <Input
                label="Email"
                type="email"
                placeholder="doctor@hospital.com"
                value={form.email}
                onChange={set("email")}
                error={errors.email}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={set("password")}
                error={errors.password}
                required
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--border)]" />

          {/* Section — Personal */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              Personal details
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                placeholder="Arjun"
                value={form.first_name}
                onChange={set("first_name")}
                error={errors.first_name}
                required
              />
              <Input
                label="Last name"
                placeholder="Sharma"
                value={form.last_name}
                onChange={set("last_name")}
                error={errors.last_name}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phone"
                type="tel"
                placeholder="10-digit mobile"
                value={form.phone}
                onChange={set("phone")}
                error={errors.phone}
                required
              />
              {/* Gender select — styled to match Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Gender <span className="ml-1 text-[var(--error)]">*</span>
                </label>
                <select
                  value={form.gender}
                  onChange={set("gender")}
                  className="w-full h-9 rounded-[var(--radius-md)] border px-3 text-sm bg-white text-[var(--text-primary)] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] disabled:opacity-60"
                  style={{
                    borderColor: errors.gender ? "var(--error)" : "var(--border)",
                    color: form.gender ? "var(--text-primary)" : "var(--text-muted)",
                  }}
                >
                  <option value="">Select gender</option>
                  <option value={Gender.MALE}>Male</option>
                  <option value={Gender.FEMALE}>Female</option>
                  <option value={Gender.OTHER}>Other</option>
                </select>
                {errors.gender && (
                  <p className="text-xs text-[var(--error)]">{errors.gender}</p>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--border)]" />

          {/* Section — Professional */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              Professional details
            </p>
            <Input
              label="Specialization"
              placeholder="e.g. Cardiology, Dermatology"
              value={form.specialization}
              onChange={set("specialization")}
              error={errors.specialization}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Registration number"
                placeholder="MCI-XXXXXXXX"
                value={form.registration_number}
                onChange={set("registration_number")}
                error={errors.registration_number}
                required
              />
              <Input
                label="Experience (years)"
                type="number"
                min="0"
                placeholder="0"
                value={form.experience_years}
                onChange={set("experience_years")}
                error={errors.experience_years}
                required
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border)] shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Add Doctor
          </Button>
        </div>
      </div>
    </div>
  );
}