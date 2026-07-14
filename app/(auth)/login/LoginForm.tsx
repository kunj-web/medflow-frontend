"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login, parseApiError } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface FormState {
  email: string;
  password: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/dashboard";

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = "Enter a valid email.";
    if (!form.password) errors.password = "Password is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });
      router.push(from);
    } catch (err) {
      setGlobalError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };
  }

  return (
    <div className="min-h-screen bg-[#dceff5] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center">
        <div className="grid w-full overflow-hidden rounded-[30px] border border-white/60 bg-white/60 shadow-[0_24px_70px_rgba(24,86,115,0.16)] backdrop-blur-2xl lg:grid-cols-[0.95fr_1fr]">
          <aside className="hidden min-h-[560px] flex-col justify-between bg-[#b9dbe8]/70 p-8 text-[#062f3d] lg:flex">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0a6792]/90 text-base font-semibold text-[#eaf8fb]">
                M
              </div>
              <span className="text-xl font-semibold tracking-tight">MedFlow</span>
            </Link>
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#24708a]">
                Care portal
              </p>
              <h2 className="max-w-sm text-4xl font-semibold leading-tight tracking-tight">
                Manage appointments, patients, and care without friction.
              </h2>
              <p className="max-w-sm text-sm leading-6 text-[#315866]">
                Sign in to continue into your secure workspace with the same dashboard tools already connected to your role.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["Tomorrow booking", "Doctor schedules", "Patient cards", "Secure access"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/55 bg-white/45 px-4 py-3 text-sm font-medium shadow-sm backdrop-blur-xl">
                  {item}
                </div>
              ))}
            </div>
          </aside>

          <main className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <Link href="/" className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-xl transition-colors hover:bg-white">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a6792] text-sm font-semibold text-[#eaf8fb]">
                    M
                  </div>
                  <span className="text-sm font-semibold tracking-tight text-[#062f3d]">MedFlow</span>
                </Link>
                <h1 className="text-2xl font-semibold tracking-tight text-[#062f3d]">Sign in to your portal</h1>
                <p className="mt-2 text-sm text-[#55717b]">Enter your email and password to continue.</p>
              </div>

              <div className="rounded-[24px] border border-white/70 bg-white/72 p-5 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl sm:p-6">
          {globalError && (
            <div className="mb-5 px-4 py-3 rounded-[var(--radius-md)] bg-[var(--error-bg)] border border-red-200 flex items-start gap-3">
              <svg className="w-4 h-4 text-[var(--error)] mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm text-[var(--error)]">{globalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="doctor@hospital.com"
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
              placeholder="Password"
              value={form.password}
              onChange={handleChange("password")}
              error={fieldErrors.password}
              autoComplete="current-password"
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

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-1">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
              </div>

              <p className="mt-6 text-center text-xs text-[#55717b]">
                New to MedFlow?{" "}
                <Link href="/register" className="font-semibold text-[#0a6792] transition-colors hover:text-[#064c68]">
                  Create an account
                </Link>
              </p>
              <p className="mt-3 text-center text-xs text-[#6b838c]">
                <Link href="/" className="transition-colors hover:text-[#062f3d]">
                  Back to MedFlow home
                </Link>
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
