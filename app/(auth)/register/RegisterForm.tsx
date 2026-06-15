"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { register, parseApiError } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  hospital_name: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

interface FieldErrors {
  hospital_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
}

const EMPTY: FormState = {
  hospital_name: "",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  confirm_password: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function RegisterForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── helpers ───────────────────────────────────────────────────
  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };
  }

  // ── validation ────────────────────────────────────────────────
  function validate(): boolean {
    const errors: FieldErrors = {};

    if (!form.hospital_name.trim())
      errors.hospital_name = "Hospital name is required.";
    if (!form.first_name.trim())
      errors.first_name = "First name is required.";
    if (!form.last_name.trim())
      errors.last_name = "Last name is required.";
    if (!form.email.trim())
      errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errors.email = "Enter a valid email address.";
    if (!form.password)
      errors.password = "Password is required.";
    else if (form.password.length < 8)
      errors.password = "Password must be at least 8 characters.";
    if (!form.confirm_password)
      errors.confirm_password = "Please confirm your password.";
    else if (form.password !== form.confirm_password)
      errors.confirm_password = "Passwords do not match.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ── submit ────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await register({
        hospital_name: form.hospital_name.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setHospitalId(res.hospital_id);
    } catch (err) {
      setGlobalError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }

  // ── copy hospital id ──────────────────────────────────────────
  async function handleCopy() {
    if (!hospitalId) return;
    await navigator.clipboard.writeText(hospitalId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── success screen ────────────────────────────────────────────
  if (hospitalId) {
    return (
      <div className="min-h-screen bg-[var(--gray-50)] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--accent)] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v4M8 10v4M2 8h4M10 8h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-semibold text-[var(--text-primary)] text-lg tracking-tight">MedFlow</span>
            </Link>
          </div>

          <div className="card p-6 flex flex-col gap-5">
            {/* Success icon + heading */}
            <div className="flex flex-col items-center text-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "var(--success-bg)" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ color: "var(--success)" }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Hospital registered!
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Save your Hospital ID — you and your staff will need it to log in.
                </p>
              </div>
            </div>

            {/* Hospital ID box */}
            <div
              className="rounded-lg border p-4 flex flex-col gap-2"
              style={{ background: "var(--gray-50)", borderColor: "var(--border)" }}
            >
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                Your Hospital ID
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-sm font-medium text-[var(--text-primary)] break-all">
                  {hospitalId}
                </p>
                <button
                  onClick={handleCopy}
                  className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] text-xs font-medium transition-colors"
                  style={{
                    background: copied ? "var(--success-bg)" : "var(--gray-100)",
                    color: copied ? "var(--success)" : "var(--text-secondary)",
                  }}
                >
                  {copied ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Warning note */}
            <div
              className="rounded-lg px-4 py-3 flex items-start gap-3"
              style={{ background: "var(--warning-bg)", border: "1px solid var(--warning)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5" style={{ color: "var(--warning)" }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <p className="text-xs" style={{ color: "var(--warning)" }}>
                Store this ID somewhere safe. Share it with your doctors and staff — they will need it along with their credentials every time they log in.
              </p>
            </div>

            {/* Go to login */}
            <Link href="/login">
              <Button variant="primary" size="lg" className="w-full">
                Continue to login →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── register form ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--gray-50)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo + heading */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--accent)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v4M8 10v4M2 8h4M10 8h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-semibold text-[var(--text-primary)] text-lg tracking-tight">MedFlow</span>
          </Link>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
            Set up your hospital
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Create your MedFlow account and hospital in one step
          </p>
        </div>

        {/* Form card */}
        <div className="card p-6">
          {globalError && (
            <div className="mb-5 px-4 py-3 rounded-[var(--radius-md)] bg-[var(--error-bg)] border border-red-200 flex items-start gap-3">
              <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--error)" }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm" style={{ color: "var(--error)" }}>{globalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* Hospital */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                Hospital
              </p>
              <Input
                label="Hospital name"
                placeholder="City General Hospital"
                value={form.hospital_name}
                onChange={handleChange("hospital_name")}
                error={fieldErrors.hospital_name}
                autoComplete="organization"
                required
                leftAddon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                }
              />
            </div>

            <div className="border-t border-[var(--border)]" />

            {/* Admin account */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                Admin account
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First name"
                  placeholder="Arjun"
                  value={form.first_name}
                  onChange={handleChange("first_name")}
                  error={fieldErrors.first_name}
                  autoComplete="given-name"
                  required
                />
                <Input
                  label="Last name"
                  placeholder="Sharma"
                  value={form.last_name}
                  onChange={handleChange("last_name")}
                  error={fieldErrors.last_name}
                  autoComplete="family-name"
                  required
                />
              </div>
              <Input
                label="Email"
                type="email"
                placeholder="admin@hospital.com"
                value={form.email}
                onChange={handleChange("email")}
                error={fieldErrors.email}
                autoComplete="email"
                required
                leftAddon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                }
              />
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange("password")}
                error={fieldErrors.password}
                autoComplete="new-password"
                required
                leftAddon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                }
                rightAddon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                }
              />
              <Input
                label="Confirm password"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={form.confirm_password}
                onChange={handleChange("confirm_password")}
                error={fieldErrors.confirm_password}
                autoComplete="new-password"
                required
                leftAddon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                }
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-1"
            >
              {loading ? "Creating account…" : "Create hospital account"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium hover:text-[var(--text-secondary)] transition-colors"
            style={{ color: "var(--accent)" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}