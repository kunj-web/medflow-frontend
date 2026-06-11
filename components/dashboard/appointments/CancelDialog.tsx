"use client";

import { useState } from "react";
import { Appointment } from "@/types/appointment";
import { formatDateTime } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface CancelDialogProps {
  appointment: Appointment;
  onConfirm: (reason: string) => Promise<void>;
  onClose: () => void;
}

export default function CancelDialog({
  appointment,
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
    } finally {
      setLoading(false);
    }
  }

  const patientName = appointment.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
    : "—";
  const doctorName = appointment.doctor
    ? `Dr. ${appointment.doctor.first_name} ${appointment.doctor.last_name}`
    : "—";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-white rounded-[var(--radius-xl)] shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--error-bg)] flex items-center justify-center text-[var(--error)]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Cancel appointment
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Appointment summary */}
          <div className="rounded-[var(--radius-md)] bg-[var(--gray-50)] border border-[var(--border)] px-4 py-3 flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Patient</span>
              <span className="font-medium text-[var(--text-primary)]">{patientName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Doctor</span>
              <span className="font-medium text-[var(--text-primary)]">{doctorName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Slot</span>
              <span className="font-medium text-[var(--text-primary)]">
                {formatDateTime(appointment.slot_time)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Token</span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                #{appointment.token_number}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Reason for cancellation <span className="text-[var(--error)]">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Patient requested reschedule, doctor unavailable…"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--error)] focus:border-[var(--error)] transition-colors"
            />
            {error && <p className="text-xs text-[var(--error)]">{error}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[var(--border)] bg-[var(--gray-50)]">
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