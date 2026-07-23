"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { register, parseApiError } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { DayOfWeek, Gender, UserRole } from "@/types/common";
import { RegisterRequest, RegisterResponse, WorkType } from "@/types/auth";

interface HospitalOption {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
}

interface HospitalListResponse {
  data: HospitalOption[];
}

interface FormState {
  role: UserRole.PATIENT | UserRole.DOCTOR;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  specialization: string;
  qualification: string;
  registration_number: string;
  experience_years: string;
  gender: Gender | "";
  work_type: WorkType;
  affiliation_mode: "existing" | "manual";
  hospital_id: string;
  pending_hospital_name: string;
  pending_hospital_city: string;
  pending_hospital_state: string;
  clinic_name: string;
  clinic_city: string;
  clinic_address: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;
type ScheduleState = Record<
  DayOfWeek,
  {
    active: boolean;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
  }
>;

const WEEK_DAYS: { label: string; value: DayOfWeek }[] = [
  { label: "Mon", value: DayOfWeek.MONDAY },
  { label: "Tue", value: DayOfWeek.TUESDAY },
  { label: "Wed", value: DayOfWeek.WEDNESDAY },
  { label: "Thu", value: DayOfWeek.THURSDAY },
  { label: "Fri", value: DayOfWeek.FRIDAY },
  { label: "Sat", value: DayOfWeek.SATURDAY },
  { label: "Sun", value: DayOfWeek.SUNDAY },
];

const SLOT_DURATIONS = [5, 10, 15, 20, 30, 60];

const DEFAULT_SCHEDULE: ScheduleState = WEEK_DAYS.reduce((acc, day) => {
  acc[day.value] = {
    active: true,
    start_time: "09:00",
    end_time: "17:00",
    slot_duration_minutes: 10,
  };
  return acc;
}, {} as ScheduleState);

const EMPTY: FormState = {
  role: UserRole.PATIENT,
  name: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
  specialization: "",
  qualification: "",
  registration_number: "",
  experience_years: "",
  gender: "",
  work_type: "hospital",
  affiliation_mode: "existing",
  hospital_id: "",
  pending_hospital_name: "",
  pending_hospital_city: "",
  pending_hospital_state: "",
  clinic_name: "",
  clinic_city: "",
  clinic_address: "",
};

export default function RegisterForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [weeklySchedule, setWeeklySchedule] = useState<ScheduleState>(DEFAULT_SCHEDULE);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [success, setSuccess] = useState<RegisterResponse | null>(null);

  const fetchHospitals = useCallback(async () => {
    setHospitalsLoading(true);
    try {
      const { data } = await api.get<HospitalListResponse>("/api/v1/public/hospitals", {
        params: { page_size: 100 },
      });
      setHospitals(data.data);
    } catch {
      setHospitals([]);
    } finally {
      setHospitalsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  function handleChange(field: keyof FormState) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };
  }

  function updateSchedule(
    day: DayOfWeek,
    patch: Partial<ScheduleState[DayOfWeek]>
  ) {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        ...patch,
      },
    }));
    setScheduleError(null);
  }

  function validate(): boolean {
    const errors: FieldErrors = {};
    let nextScheduleError: string | null = null;

    if (!form.name.trim()) errors.name = "Name is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = "Enter a valid email address.";
    if (!form.phone.trim()) errors.phone = "Phone number is required.";
    if (!form.password) errors.password = "Password is required.";
    else if (form.password.length < 8) errors.password = "Password must be at least 8 characters.";
    if (!form.confirm_password) errors.confirm_password = "Please confirm your password.";
    else if (form.password !== form.confirm_password) errors.confirm_password = "Passwords do not match.";

    if (form.role === UserRole.DOCTOR) {
      if (!form.specialization.trim()) errors.specialization = "Specialization is required.";
      if (!form.gender) errors.gender = "Gender is required.";

      if (form.work_type === "hospital") {
        if (form.affiliation_mode === "existing" && !form.hospital_id) {
          errors.hospital_id = "Select a hospital.";
        }
        if (form.affiliation_mode === "manual" && !form.pending_hospital_name.trim()) {
          errors.pending_hospital_name = "Hospital name is required.";
        }
      }

      if (form.work_type === "clinic") {
        if (!form.clinic_name.trim()) errors.clinic_name = "Clinic name is required.";
        if (!form.clinic_city.trim()) errors.clinic_city = "Clinic city is required.";
      }

      const activeSchedules = WEEK_DAYS.filter((day) => weeklySchedule[day.value].active);
      if (activeSchedules.length === 0) {
        nextScheduleError = "Keep at least one working day active.";
      } else {
        const invalidDay = activeSchedules.find((day) => {
          const schedule = weeklySchedule[day.value];
          return schedule.end_time <= schedule.start_time;
        });
        nextScheduleError = invalidDay
          ? `${invalidDay.label} end time must be after start time.`
          : null;
      }
    }

    setScheduleError(nextScheduleError);
    setFieldErrors(errors);
    return Object.keys(errors).length === 0 && nextScheduleError === null;
  }

  function buildPayload(): RegisterRequest {
    const payload: RegisterRequest = {
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      name: form.name.trim(),
      role: form.role,
    };

    if (form.role !== UserRole.DOCTOR) return payload;

    payload.specialization = form.specialization.trim();
    payload.work_type = form.work_type;
    payload.gender = form.gender as Gender;

    if (form.qualification.trim()) payload.qualification = form.qualification.trim();
    if (form.registration_number.trim()) {
      payload.registration_number = form.registration_number.trim();
    }
    if (form.experience_years.trim()) {
      payload.experience_years = Number(form.experience_years);
    }

    if (form.work_type === "hospital") {
      if (form.affiliation_mode === "existing") {
        payload.hospital_id = form.hospital_id;
      } else {
        payload.pending_hospital_name = form.pending_hospital_name.trim();
        if (form.pending_hospital_city.trim()) {
          payload.pending_hospital_city = form.pending_hospital_city.trim();
        }
        if (form.pending_hospital_state.trim()) {
          payload.pending_hospital_state = form.pending_hospital_state.trim();
        }
      }
    } else {
      payload.clinic_name = form.clinic_name.trim();
      payload.clinic_city = form.clinic_city.trim();
      if (form.clinic_address.trim()) payload.clinic_address = form.clinic_address.trim();
    }

    payload.weekly_schedule = WEEK_DAYS.filter((day) => weeklySchedule[day.value].active).map(
      (day) => {
        const schedule = weeklySchedule[day.value];
        return {
          day_of_week: day.value,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          slot_duration_minutes: schedule.slot_duration_minutes,
        };
      }
    );

    return payload;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await register(buildPayload());
      setSuccess(res);
    } catch (err) {
      setGlobalError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#dceff5] px-4 py-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center">
          <div className="w-full rounded-[30px] border border-white/65 bg-white/68 p-5 shadow-[0_24px_70px_rgba(24,86,115,0.16)] backdrop-blur-2xl sm:p-8">
            <div className="mb-8 text-center">
              <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-xl transition-colors hover:bg-white">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a6792] text-sm font-semibold text-[#eaf8fb]">
                  M
                </div>
                <span className="text-sm font-semibold tracking-tight text-[#062f3d]">MedFlow</span>
              </Link>
            </div>

            <div className="flex flex-col gap-5 rounded-[24px] border border-white/70 bg-white/75 p-6 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--success-bg)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ color: "var(--success)" }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Registration submitted
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">{success.message}</p>
              </div>
            </div>

            <Link href="/login" className="inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-6 text-base font-medium text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)]">
                Continue to login
            </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#dceff5] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[0.78fr_1fr]">
        <aside className="hidden h-full min-h-[680px] flex-col justify-between rounded-[30px] border border-white/60 bg-[#b9dbe8]/70 p-8 text-[#062f3d] shadow-[0_24px_70px_rgba(24,86,115,0.12)] backdrop-blur-2xl lg:flex">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0a6792]/90 text-base font-semibold text-[#eaf8fb]">
              M
            </div>
            <span className="text-xl font-semibold tracking-tight">MedFlow</span>
          </Link>
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#24708a]">
              Account setup
            </p>
            <h2 className="max-w-sm text-4xl font-semibold leading-tight tracking-tight">
              Start with the right role for your care workflow.
            </h2>
            <p className="max-w-sm text-sm leading-6 text-[#315866]">
              Patients get instant dashboard access. Doctors can submit profile details for review before they start managing schedules.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              "Patient appointment booking",
              "Doctor approval flow",
              "Hospital and clinic profiles",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/55 bg-white/45 px-4 py-3 text-sm font-medium shadow-sm backdrop-blur-xl">
                {item}
              </div>
            ))}
          </div>
        </aside>

        <main className="rounded-[30px] border border-white/65 bg-white/62 p-5 shadow-[0_24px_70px_rgba(24,86,115,0.16)] backdrop-blur-2xl sm:p-8">
          <div className="mb-8 text-center">
            <Link href="/" className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-xl transition-colors hover:bg-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a6792] text-sm font-semibold text-[#eaf8fb]">
                M
              </div>
              <span className="text-sm font-semibold tracking-tight text-[#062f3d]">MedFlow</span>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-[#062f3d]">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-[#55717b]">
              Patients can log in after registration; doctors are reviewed before access.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/70 bg-white/74 p-5 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl sm:p-6">
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
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, role: UserRole.PATIENT }))}
                className={`h-10 rounded-[var(--radius-md)] border text-sm font-medium transition-colors ${
                  form.role === UserRole.PATIENT
                    ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                    : "border-[var(--border)] bg-white text-[var(--text-secondary)]"
                }`}
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, role: UserRole.DOCTOR }))}
                className={`h-10 rounded-[var(--radius-md)] border text-sm font-medium transition-colors ${
                  form.role === UserRole.DOCTOR
                    ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                    : "border-[var(--border)] bg-white text-[var(--text-secondary)]"
                }`}
              >
                Doctor
              </button>
            </div>

            <Input label="Full name" value={form.name} onChange={handleChange("name")} error={fieldErrors.name} autoComplete="name" required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Email" type="email" value={form.email} onChange={handleChange("email")} error={fieldErrors.email} autoComplete="email" required />
              <Input label="Phone" value={form.phone} onChange={handleChange("phone")} error={fieldErrors.phone} autoComplete="tel" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange("password")}
                error={fieldErrors.password}
                autoComplete="new-password"
                required
              />
              <Input
                label="Confirm password"
                type={showPassword ? "text" : "password"}
                value={form.confirm_password}
                onChange={handleChange("confirm_password")}
                error={fieldErrors.confirm_password}
                autoComplete="new-password"
                required
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)]"
              />
              Show password
            </label>

            {form.role === UserRole.DOCTOR && (
              <>
                <div className="border-t border-[var(--border)] my-1" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Specialization" value={form.specialization} onChange={handleChange("specialization")} error={fieldErrors.specialization} required />
                  <Input label="Qualification" value={form.qualification} onChange={handleChange("qualification")} error={fieldErrors.qualification} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input label="Registration no." value={form.registration_number} onChange={handleChange("registration_number")} error={fieldErrors.registration_number} />
                  <Input label="Experience years" type="number" min="0" value={form.experience_years} onChange={handleChange("experience_years")} error={fieldErrors.experience_years} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[var(--text-primary)]">
                      Gender<span className="ml-1 text-[var(--error)]">*</span>
                    </label>
                    <select value={form.gender} onChange={handleChange("gender")} className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 text-sm">
                      <option value="">Select</option>
                      <option value={Gender.MALE}>Male</option>
                      <option value={Gender.FEMALE}>Female</option>
                      <option value={Gender.OTHER}>Other</option>
                      <option value={Gender.PREFER_NOT_TO_SAY}>Prefer not to say</option>
                    </select>
                    {fieldErrors.gender && <p className="text-xs text-[var(--error)]">{fieldErrors.gender}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, work_type: "hospital" }))} className={`h-10 rounded-[var(--radius-md)] border text-sm font-medium ${form.work_type === "hospital" ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]" : "border-[var(--border)] bg-white text-[var(--text-secondary)]"}`}>
                    Hospital
                  </button>
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, work_type: "clinic" }))} className={`h-10 rounded-[var(--radius-md)] border text-sm font-medium ${form.work_type === "clinic" ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]" : "border-[var(--border)] bg-white text-[var(--text-secondary)]"}`}>
                    Clinic
                  </button>
                </div>

                {form.work_type === "hospital" ? (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setForm((prev) => ({ ...prev, affiliation_mode: "existing" }))} className={`h-9 rounded-[var(--radius-md)] border text-sm ${form.affiliation_mode === "existing" ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]" : "border-[var(--border)] bg-white text-[var(--text-secondary)]"}`}>
                        Existing hospital
                      </button>
                      <button type="button" onClick={() => setForm((prev) => ({ ...prev, affiliation_mode: "manual" }))} className={`h-9 rounded-[var(--radius-md)] border text-sm ${form.affiliation_mode === "manual" ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]" : "border-[var(--border)] bg-white text-[var(--text-secondary)]"}`}>
                        Enter manually
                      </button>
                    </div>

                    {form.affiliation_mode === "existing" ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <label className="text-sm font-medium text-[var(--text-primary)]">
                            Hospital<span className="ml-1 text-[var(--error)]">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={fetchHospitals}
                            disabled={hospitalsLoading}
                            className="text-xs font-semibold text-[#0a6792] transition-colors hover:text-[#064c68] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {hospitalsLoading ? "Refreshing..." : "Refresh list"}
                          </button>
                        </div>
                        <select value={form.hospital_id} onFocus={fetchHospitals} onChange={handleChange("hospital_id")} className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 text-sm">
                          <option value="">
                            {hospitalsLoading ? "Loading hospitals..." : "Select hospital"}
                          </option>
                          {hospitals.map((hospital) => (
                            <option key={hospital.id} value={hospital.id}>
                              {hospital.name}{hospital.city ? `, ${hospital.city}` : ""}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.hospital_id && <p className="text-xs text-[var(--error)]">{fieldErrors.hospital_id}</p>}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input label="Hospital name" value={form.pending_hospital_name} onChange={handleChange("pending_hospital_name")} error={fieldErrors.pending_hospital_name} required />
                        <Input label="City" value={form.pending_hospital_city} onChange={handleChange("pending_hospital_city")} error={fieldErrors.pending_hospital_city} />
                        <Input label="State" value={form.pending_hospital_state} onChange={handleChange("pending_hospital_state")} error={fieldErrors.pending_hospital_state} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="Clinic name" value={form.clinic_name} onChange={handleChange("clinic_name")} error={fieldErrors.clinic_name} required />
                    <Input label="Clinic city" value={form.clinic_city} onChange={handleChange("clinic_city")} error={fieldErrors.clinic_city} required />
                    <div className="sm:col-span-2">
                      <Input label="Clinic address" value={form.clinic_address} onChange={handleChange("clinic_address")} error={fieldErrors.clinic_address} />
                    </div>
                  </div>
                )}

                <div className="rounded-[22px] border border-[#d8edf3] bg-[#f8fcfd]/75 p-4 shadow-sm backdrop-blur-xl">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#062f3d]">Default availability</p>
                      <p className="mt-1 text-xs leading-5 text-[#55717b]">
                        Set each working day separately. These slots are used for patient bookings after approval.
                      </p>
                    </div>
                    <span className="mt-2 w-fit rounded-full border border-[#c8e3ea] bg-white/70 px-3 py-1 text-xs font-medium text-[#24708a] sm:mt-0">
                      09:00-17:00 default
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                    {WEEK_DAYS.map((day) => {
                      const schedule = weeklySchedule[day.value];
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => updateSchedule(day.value, { active: !schedule.active })}
                          className={`h-10 rounded-[var(--radius-md)] border text-sm font-medium transition-colors ${
                            schedule.active
                              ? "border-[#1d9aaa] bg-[#dceff5] text-[#062f3d]"
                              : "border-[#d8edf3] bg-white/60 text-[#7a9098]"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 hidden grid-cols-[84px_minmax(0,1fr)_minmax(0,1fr)_minmax(120px,0.8fr)] gap-2 px-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#55717b] md:grid">
                    <span>Day</span>
                    <span>Start</span>
                    <span>End</span>
                    <span>Slot</span>
                  </div>

                  <div className="mt-2 grid gap-2">
                    {WEEK_DAYS.map((day) => {
                      const schedule = weeklySchedule[day.value];
                      return (
                        <div
                          key={day.value}
                          className={`grid gap-2 rounded-2xl border px-3 py-3 transition-colors md:grid-cols-[84px_minmax(0,1fr)_minmax(0,1fr)_minmax(120px,0.8fr)] md:items-center ${
                            schedule.active
                              ? "border-[#d8edf3] bg-white/72"
                              : "border-[#d8edf3] bg-white/35"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 md:block">
                            <button
                              type="button"
                              onClick={() => updateSchedule(day.value, { active: !schedule.active })}
                              className={`h-8 rounded-full border px-3 text-sm font-semibold transition-colors md:w-full ${
                                schedule.active
                                  ? "border-[#1d9aaa] bg-[#dceff5] text-[#062f3d]"
                                  : "border-[#d8edf3] bg-white/70 text-[#7a9098]"
                              }`}
                            >
                              {day.label}
                            </button>
                            {!schedule.active && (
                              <span className="text-xs font-medium text-[#7a9098] md:hidden">
                                Inactive
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-1.5">
                            <label className="text-xs font-medium text-[#55717b] md:hidden">
                              Start time
                            </label>
                            <input
                              type="time"
                              value={schedule.start_time}
                              disabled={!schedule.active}
                              onChange={(e) =>
                                updateSchedule(day.value, { start_time: e.target.value })
                              }
                              className="h-9 rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 text-sm text-[#062f3d] disabled:bg-white/45 disabled:text-[#9aaab0]"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-1.5">
                            <label className="text-xs font-medium text-[#55717b] md:hidden">
                              End time
                            </label>
                            <input
                              type="time"
                              value={schedule.end_time}
                              disabled={!schedule.active}
                              onChange={(e) =>
                                updateSchedule(day.value, { end_time: e.target.value })
                              }
                              className="h-9 rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 text-sm text-[#062f3d] disabled:bg-white/45 disabled:text-[#9aaab0]"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-1.5">
                            <label className="text-xs font-medium text-[#55717b] md:hidden">
                              Slot duration
                            </label>
                            <select
                              value={schedule.slot_duration_minutes}
                              disabled={!schedule.active}
                              onChange={(e) =>
                                updateSchedule(day.value, {
                                  slot_duration_minutes: Number(e.target.value),
                                })
                              }
                              className="h-9 rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 text-sm text-[#062f3d] disabled:bg-white/45 disabled:text-[#9aaab0]"
                            >
                              {SLOT_DURATIONS.map((minutes) => (
                                <option key={minutes} value={minutes}>
                                  {minutes} minutes
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {scheduleError && (
                    <p className="mt-3 text-xs text-[var(--error)]">{scheduleError}</p>
                  )}
                </div>
              </>
            )}

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-1">
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
          </div>

          <p className="mt-6 text-center text-xs text-[#55717b]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#0a6792] transition-colors hover:text-[#064c68]">
            Log in
          </Link>
          </p>
        </main>
      </div>
    </div>
  );
}
