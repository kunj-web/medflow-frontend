import { DayOfWeek, Gender, UserRole } from "./common";

export type AccountStatus = "pending" | "active" | "rejected";
export type WorkType = "hospital" | "clinic";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  name: string;
  role: UserRole.PATIENT | UserRole.DOCTOR;
  specialization?: string;
  qualification?: string;
  registration_number?: string;
  experience_years?: number;
  work_type?: WorkType;
  gender?: Gender;
  hospital_id?: string;
  pending_hospital_name?: string;
  pending_hospital_city?: string;
  pending_hospital_state?: string;
  clinic_name?: string;
  clinic_city?: string;
  clinic_address?: string;
  weekly_schedule?: {
    day_of_week: DayOfWeek;
    start_time: string;
    end_time: string;
    slot_duration_minutes: number;
  }[];
}

export interface RegisterResponse {
  user_id: string;
  role: UserRole;
  status: AccountStatus;
  message: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: UserRole;
  status: AccountStatus;
  is_super_admin: boolean;
}

export interface UserProfile {
  user_id: string;
  role: UserRole;
  status: AccountStatus;
  is_super_admin: boolean;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  hospital_id?: string | null;
}

export interface StoredAuth {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}
