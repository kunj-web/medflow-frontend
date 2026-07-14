"use client";

import { useState } from "react";
import { Appointment } from "@/types/appointment";
import { parseApiError } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface CancelDialogProps {
  appointment: Appointment;
  isPatient?: boolean;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}

export default function CancelDialog({
  appointment,
  isPatient = false,
  onConfirm,
  onClose,
}: CancelDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (reason.trim().length < 5) {
      setError("Please provide a reason (at least 5 characters).");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onConfirm(reason.trim());
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }

  const patientName = appointment.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
    : "-";
  const doctorName = appointment.doctor
    ? `Dr. ${appointment.doctor.first_name} ${appointment.doctor.last_name}`
    : "-";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-white/82 shadow-[0_24px_70px_rgba(24,86,115,0.18)] backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d8edf3] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--error-bg)] text-[var(--error)]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-[#062f3d]">
              Cancel appointment
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#55717b] transition-colors hover:text-[#062f3d]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Appointment summary */}
          <div className="flex flex-col gap-1.5 rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3">
            <div className="flex justify-between text-xs">
              <span className="text-[#55717b]">Patient</span>
              <span className="font-medium text-[#062f3d]">{patientName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#55717b]">Doctor</span>
              <span className="font-medium text-[#062f3d]">{doctorName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#55717b]">Slot</span>
              <span className="font-medium text-[#062f3d]">
                {formatDateTime(appointment.slot_time)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#55717b]">Token</span>
              <span className="font-mono font-medium text-[#062f3d]">
                #{appointment.token_number}
              </span>
            </div>
          </div>

          <p className="rounded-2xl border border-red-200 bg-[var(--error-bg)] px-3 py-2 text-xs leading-5 text-[#55717b]">
            {isPatient
              ? "Cancellation is available only until the day before the appointment. Same-day cancellation is not allowed."
              : "Cancelling this appointment will make the slot unavailable to the patient and update the appointment status."}
          </p>

          {/* Reason */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#062f3d]">
              Reason for cancellation <span className="text-[var(--error)]">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Patient requested reschedule, doctor unavailable..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              className="w-full resize-none rounded-2xl border border-[#d8edf3] bg-white/80 px-3 py-2 text-sm text-[#062f3d] placeholder:text-[#55717b] transition-colors focus:border-[var(--error)] focus:outline-none focus:ring-2 focus:ring-[var(--error)]"
            />
            {error && <p className="text-xs text-[var(--error)]">{error}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[#d8edf3] bg-[#f8fcfd]/70 px-5 py-4">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Keep appointment
          </Button>
          <Button
            variant="destructive"
            size="sm"
            loading={loading}
            onClick={handleConfirm}
          >
            Cancel appointment
          </Button>
        </div>
      </div>
    </div>
  );
}
