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
  hospital_id: string;
  day_of_week: DayOfWeek;
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
}

export interface DoctorLeave {
  id: string;
  doctor_id: string;
  hospital_id: string;
  leave_date: string; // "YYYY-MM-DD"
  is_approved: boolean;
  reason: string;
}

export interface Slot {
  slot_time: string; // naive ISO datetime string
  is_available: boolean;
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
