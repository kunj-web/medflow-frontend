import { PaginationParams } from "./common";

export enum AppointmentStatus {
  SCHEDULED = "scheduled",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

export enum AppointmentType {
  CONSULTATION = "consultation",
  FOLLOW_UP = "follow_up",
  EMERGENCY = "emergency",
  PROCEDURE = "procedure",
}

export interface Appointment {
  id: string;
  hospital_id: string | null;
  doctor_id?: string;
  patient_id?: string;
  slot_time: string;
  end_time?: string | null;
  token_number: number | null;
  type: AppointmentType;
  status: AppointmentStatus;
  chief_complaint?: string | null;
  notes?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
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
    phone?: string;
  };
}

export interface AppointmentCreate {
  doctor_id: string;
  slot_time: string;
  type?: AppointmentType;
  chief_complaint?: string;
}

export interface AppointmentCancel {
  reason: string;
}

export interface AppointmentReschedule {
  new_slot_time: string;
}

export interface AppointmentListParams extends PaginationParams {
  status?: AppointmentStatus;
  date?: string;
  doctor_id?: string;
  patient_id?: string;
}
