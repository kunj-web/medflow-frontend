import { PaginationParams } from "./common";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum AppointmentStatus {
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export enum AppointmentType {
  IN_PERSON = "IN_PERSON",
  TELECONSULT = "TELECONSULT",
}

// ─── Appointment ──────────────────────────────────────────────────────────────

export interface Appointment {
  id: string;
  hospital_id: string;
  doctor_id: string;
  patient_id: string;
  slot_time: string;        // naive ISO datetime string — no tz
  token_number: number;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  deleted_at: string | null;
  // relations (when fetched with_relations)
  doctor?: {
    id: string;
    first_name: string;
    last_name: string;
    specialization: string;
  };
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface AppointmentCreate {
  doctor_id: string;
  patient_id: string;
  slot_time: string;        // naive ISO datetime string
  appointment_type: AppointmentType;
  notes?: string;
}

export interface AppointmentCancel {
  cancellation_reason: string;
}

export interface AppointmentReschedule {
  slot_time: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface AppointmentListParams extends PaginationParams {
  status?: AppointmentStatus;
  date?: string;            // "YYYY-MM-DD"
  doctor_id?: string;
  patient_id?: string;
}