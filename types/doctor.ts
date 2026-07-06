import { Gender, DayOfWeek, PaginationParams } from "./common";

// ─── Doctor ───────────────────────────────────────────────────────────────────

export interface Doctor {
  id: string;
  hospital_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string; // computed on backend
  gender: Gender;
  phone: string;
  email: string;
  specialization: string;
  registration_number: string;
  experience_years: number;
  is_active: boolean;
  created_at: string;
  deleted_at: string | null;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: DayOfWeek;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
  slot_duration_minutes: number;
}

export interface DoctorLeave {
  id: string;
  doctor_id: string;
  leave_date: string; // "YYYY-MM-DD"
  reason: string | null;
}

export interface DoctorSlotBlock {
  id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
}

export interface Slot {
  datetime: string; // naive ISO datetime string
  is_available: boolean;
  block_id?: string | null;
  block_reason?: string | null;
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface DoctorCreate {
  // User fields
  email: string;
  password: string;
  // Doctor fields
  first_name: string;
  last_name: string;
  gender: Gender;
  phone: string;
  specialization: string;
  registration_number: string;
  experience_years: number;
}

export interface DoctorUpdate {
  first_name?: string;
  last_name?: string;
  gender?: Gender;
  phone?: string;
  specialization?: string;
  experience_years?: number;
  is_active?: boolean;
}

export interface ScheduleUpsert {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

export interface LeaveCreate {
  leave_date: string;
  reason: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface DoctorListParams extends PaginationParams {
  search?: string;
  is_active?: boolean;
  specialization?: string;
}
