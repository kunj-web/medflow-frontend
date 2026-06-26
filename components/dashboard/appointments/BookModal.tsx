"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import { Doctor } from "@/types/doctor";
import { Patient } from "@/types/patient";
import { AppointmentType, AppointmentCreate } from "@/types/appointment";
import { Slot } from "@/types/doctor";
import { PaginatedResponse } from "@/types/common";
import { formatTime, cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

interface BookModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

// ─── Step labels ──────────────────────────────────────────────────────────────

const STEP_LABELS: Record<Step, string> = {
  1: "Details",
  2: "Date",
  3: "Slot",
};

// ─── Today's date string ──────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookModal({ onSuccess, onClose }: BookModalProps) {
  const [step, setStep] = useState<Step>(1);

  // Step 1 state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [patientQuery, setPatientQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);

  const [apptType, setApptType] = useState<AppointmentType>(AppointmentType.CONSULTATION);
  const [notes, setNotes] = useState("");
  const [step1Error, setStep1Error] = useState("");

  // Step 2 state
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [step2Error, setStep2Error] = useState("");

  // Step 3 state
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Final submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ─── Load doctors on mount ──────────────────────────────────────────────────

  useEffect(() => {
    api
      .get<PaginatedResponse<Doctor>>("/api/v1/doctors", {
        params: { is_active: true, page_size: 100 },
      })
      .then(({ data }) => setDoctors(data.data ?? []))
      .catch(() => {})
      .finally(() => setDoctorsLoading(false));
  }, []);

  // ─── Patient search (debounced) ─────────────────────────────────────────────

  const searchPatients = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setPatients([]); return; }
    setPatientsLoading(true);
    try {
      const { data } = await api.get<PaginatedResponse<Patient>>("/api/v1/patients", {
        params: { search: q, page_size: 20 },
      });
      setPatients(data.data ?? []);
      setPatientDropdownOpen(true);
    } catch {
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchPatients(patientQuery), 350);
    return () => clearTimeout(t);
  }, [patientQuery, searchPatients]);

  // ─── Load slots when entering step 3 ───────────────────────────────────────

  useEffect(() => {
    if (step !== 3 || !selectedDoctor || !selectedDate) return;
    setSlotsLoading(true);
    setSlotsError("");
    setSelectedSlot(null);
    api
      .get<Slot[]>(`/api/v1/doctors/${selectedDoctor.id}/slots`, {
        params: { date: selectedDate },
      })
      .then(({ data }) => setSlots(data))
      .catch((err) => setSlotsError(parseApiError(err)))
      .finally(() => setSlotsLoading(false));
  }, [step, selectedDoctor, selectedDate]);

  // ─── Step navigation ────────────────────────────────────────────────────────

  function goToStep2() {
    if (!selectedDoctor) { setStep1Error("Select a doctor."); return; }
    if (!selectedPatient) { setStep1Error("Select a patient."); return; }
    setStep1Error("");
    setStep(2);
  }

  function goToStep3() {
    if (!selectedDate) { setStep2Error("Select a date."); return; }
    const today = todayStr();
    if (selectedDate < today) { setStep2Error("Date must be today or in the future."); return; }
    setStep2Error("");
    setStep(3);
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!selectedSlot) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload: AppointmentCreate = {
        doctor_id: selectedDoctor!.id,
        slot_time: selectedSlot.datetime,
        type: apptType,
        chief_complaint: notes.trim() || undefined,
      };
      await api.post("/api/v1/appointments/", payload);
      onSuccess();
    } catch (err) {
      setSubmitError(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-white rounded-[var(--radius-xl)] shadow-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Book appointment</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Step {step} of 3 — {STEP_LABELS[step]}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Step progress */}
        <div className="flex px-5 pt-4 gap-1.5 shrink-0">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                s <= step ? "bg-[var(--accent)]" : "bg-[var(--gray-200)]"
              )}
            />
          ))}
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── STEP 1 — Details ── */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              {/* Doctor select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Doctor <span className="text-[var(--error)]">*</span>
                </label>
                {doctorsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <Spinner size="sm" /> Loading doctors…
                  </div>
                ) : (
                  <select
                    value={selectedDoctor?.id ?? ""}
                    onChange={(e) => {
                      const d = doctors.find((x) => x.id === e.target.value) ?? null;
                      setSelectedDoctor(d);
                      setSelectedSlot(null);
                      if (step1Error) setStep1Error("");
                    }}
                    className="w-full h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors"
                  >
                    <option value="">Select a doctor…</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.first_name} {d.last_name} — {d.specialization}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Patient search */}
              <div className="flex flex-col gap-1.5 relative">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Patient <span className="text-[var(--error)]">*</span>
                </label>
                {selectedPatient ? (
                  <div className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)] border border-[var(--accent)] bg-[var(--accent-light)]">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{selectedPatient.phone}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedPatient(null); setPatientQuery(""); }}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="Search by name or phone…"
                      value={patientQuery}
                      onChange={(e) => {
                        setPatientQuery(e.target.value);
                        if (step1Error) setStep1Error("");
                      }}
                      rightAddon={patientsLoading ? <Spinner size="sm" /> : undefined}
                    />
                    {patientDropdownOpen && patients.length > 0 && (
                      <div className="absolute z-20 top-full mt-1 w-full bg-white border border-[var(--border)] rounded-[var(--radius-md)] shadow-md max-h-48 overflow-y-auto">
                        {patients.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setSelectedPatient(p);
                              setPatientDropdownOpen(false);
                              setPatientQuery("");
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-[var(--gray-50)] transition-colors border-b border-[var(--border)] last:border-0"
                          >
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              {p.first_name} {p.last_name}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">{p.phone}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Appointment type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">Type</label>
                <div className="flex gap-2">
                  {[AppointmentType.CONSULTATION, AppointmentType.FOLLOW_UP].map((t) => (
                    <button
                      key={t}
                      onClick={() => setApptType(t)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-[var(--radius-md)] border text-sm font-medium transition-colors",
                        apptType === t
                          ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--gray-50)]"
                      )}
                    >
                      {t === AppointmentType.CONSULTATION ? "Consultation" : "Follow-up"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">Notes <span className="text-[var(--text-muted)] font-normal">(optional)</span></label>
                <textarea
                  rows={2}
                  placeholder="Any relevant notes for this appointment…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-sm placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors"
                />
              </div>

              {step1Error && <p className="text-xs text-[var(--error)]">{step1Error}</p>}
            </div>
          )}

          {/* ── STEP 2 — Date ── */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Choose the appointment date for{" "}
                <span className="font-medium text-[var(--text-primary)]">
                  Dr. {selectedDoctor?.first_name} {selectedDoctor?.last_name}
                </span>.
              </p>
              <Input
                label="Date"
                type="date"
                value={selectedDate}
                min={todayStr()}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (step2Error) setStep2Error("");
                }}
                required
              />
              {step2Error && <p className="text-xs text-[var(--error)]">{step2Error}</p>}
            </div>
          )}

          {/* ── STEP 3 — Slot ── */}
          {step === 3 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-[var(--text-secondary)]">
                Available slots on{" "}
                <span className="font-medium text-[var(--text-primary)]">{selectedDate}</span>:
              </p>

              {slotsLoading && (
                <div className="flex items-center gap-2 py-8 justify-center text-sm text-[var(--text-muted)]">
                  <Spinner size="sm" /> Loading slots…
                </div>
              )}

              {!slotsLoading && slotsError && (
                <p className="text-sm text-[var(--error)]">{slotsError}</p>
              )}

              {!slotsLoading && !slotsError && slots.length === 0 && (
                <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                  No slots available for this date.
                </div>
              )}

              {!slotsLoading && !slotsError && slots.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.datetime}
                      disabled={!slot.is_available}
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "py-2 px-3 rounded-[var(--radius-md)] border text-sm font-mono font-medium transition-colors",
                        !slot.is_available && "opacity-40 cursor-not-allowed bg-[var(--gray-100)] border-[var(--border)] text-[var(--text-muted)]",
                        slot.is_available && selectedSlot?.datetime === slot.datetime &&
                          "border-[var(--accent)] bg-[var(--accent)] text-white",
                        slot.is_available && selectedSlot?.datetime !== slot.datetime &&
                          "border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent-light)]"
                      )}
                    >
                      {formatTime(slot.datetime)}
                    </button>
                  ))}
                </div>
              )}

              {submitError && (
                <p className="text-xs text-[var(--error)] mt-1">{submitError}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border)] bg-[var(--gray-50)] shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (step === 1 ? onClose() : setStep((s) => (s - 1) as Step))}
            disabled={submitting}
          >
            {step === 1 ? "Cancel" : "← Back"}
          </Button>

          {step === 1 && (
            <Button variant="primary" size="sm" onClick={goToStep2}>
              Next — Pick date →
            </Button>
          )}
          {step === 2 && (
            <Button variant="primary" size="sm" onClick={goToStep3}>
              Next — Pick slot →
            </Button>
          )}
          {step === 3 && (
            <Button
              variant="primary"
              size="sm"
              disabled={!selectedSlot}
              loading={submitting}
              onClick={handleSubmit}
            >
              Confirm booking
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
