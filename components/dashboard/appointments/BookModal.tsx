"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { parseApiError } from "@/lib/auth";
import { cn, formatTime } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import { AppointmentCreate, AppointmentType } from "@/types/appointment";
import { PaginatedResponse } from "@/types/common";
import { Doctor, Slot } from "@/types/doctor";

type Step = 1 | 2 | 3;

interface BookModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

const STEP_LABELS: Record<Step, string> = {
  1: "Doctor",
  2: "Date",
  3: "Slot",
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function tomorrowStr() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDateInputValue(date);
}

export default function BookModal({ onSuccess, onClose }: BookModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [apptType, setApptType] = useState<AppointmentType>(AppointmentType.CONSULTATION);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [step1Error, setStep1Error] = useState("");

  const [selectedDate, setSelectedDate] = useState(tomorrowStr());
  const [step2Error, setStep2Error] = useState("");

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api
      .get<PaginatedResponse<Doctor>>("/api/v1/doctors", {
        params: { page_size: 100 },
      })
      .then(({ data }) => {
        if (!cancelled) setDoctors(data.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setDoctors([]);
      })
      .finally(() => {
        if (!cancelled) setDoctorsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (step !== 3 || !selectedDoctor || !selectedDate) return;

    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError("");
    setSelectedSlot(null);

    api
      .get<Slot[]>(`/api/v1/doctors/${selectedDoctor.id}/slots`, {
        params: { date: selectedDate },
      })
      .then(({ data }) => {
        if (!cancelled) setSlots(data);
      })
      .catch((err) => {
        if (!cancelled) setSlotsError(parseApiError(err));
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [step, selectedDoctor, selectedDate]);

  function goToStep2() {
    if (!selectedDoctor) {
      setStep1Error("Select a doctor.");
      return;
    }
    setStep1Error("");
    setStep(2);
  }

  function goToStep3() {
    if (!selectedDate) {
      setStep2Error("Select a date.");
      return;
    }
    if (selectedDate < tomorrowStr()) {
      setStep2Error("Appointments must be booked at least one day in advance.");
      return;
    }
    setStep2Error("");
    setStep(3);
  }

  async function handleSubmit() {
    if (!selectedSlot || !selectedDoctor) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const payload: AppointmentCreate = {
        doctor_id: selectedDoctor.id,
        slot_time: selectedSlot.datetime,
        type: apptType,
        chief_complaint: chiefComplaint.trim() || undefined,
      };

      await api.post("/api/v1/appointments/", payload);
      onSuccess();
    } catch (err) {
      setSubmitError(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-white rounded-[var(--radius-xl)] shadow-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Book appointment</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Step {step} of 3 - {STEP_LABELS[step]}
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

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

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Doctor <span className="text-[var(--error)]">*</span>
                </label>
                {doctorsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <Spinner size="sm" /> Loading doctors...
                  </div>
                ) : (
                  <select
                    value={selectedDoctor?.id ?? ""}
                    onChange={(e) => {
                      const doctor = doctors.find((item) => item.id === e.target.value) ?? null;
                      setSelectedDoctor(doctor);
                      setSelectedSlot(null);
                      if (step1Error) setStep1Error("");
                    }}
                    className="w-full h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors"
                  >
                    <option value="">Select a doctor...</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">Type</label>
                <div className="flex gap-2">
                  {[AppointmentType.CONSULTATION, AppointmentType.FOLLOW_UP].map((type) => (
                    <button
                      key={type}
                      onClick={() => setApptType(type)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-[var(--radius-md)] border text-sm font-medium transition-colors",
                        apptType === type
                          ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--gray-50)]"
                      )}
                    >
                      {type === AppointmentType.CONSULTATION ? "Consultation" : "Follow-up"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Chief complaint <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe the concern..."
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-sm placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-colors"
                />
              </div>

              {step1Error && <p className="text-xs text-[var(--error)]">{step1Error}</p>}
            </div>
          )}

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
                min={tomorrowStr()}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (step2Error) setStep2Error("");
                }}
                required
              />
              {step2Error && <p className="text-xs text-[var(--error)]">{step2Error}</p>}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-[var(--text-secondary)]">
                Available slots on{" "}
                <span className="font-medium text-[var(--text-primary)]">{selectedDate}</span>:
              </p>

              {slotsLoading && (
                <div className="flex items-center gap-2 py-8 justify-center text-sm text-[var(--text-muted)]">
                  <Spinner size="sm" /> Loading slots...
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

              {submitError && <p className="text-xs text-[var(--error)] mt-1">{submitError}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border)] bg-[var(--gray-50)] shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (step === 1 ? onClose() : setStep((value) => (value - 1) as Step))}
            disabled={submitting}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step === 1 && (
            <Button variant="primary" size="sm" onClick={goToStep2}>
              Next
            </Button>
          )}
          {step === 2 && (
            <Button variant="primary" size="sm" onClick={goToStep3}>
              Next
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
