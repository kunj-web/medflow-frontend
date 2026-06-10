import { Gender, BloodGroup, PaginationParams } from "./common";

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  hospital_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  email: string;
  date_of_birth?: string;   // "YYYY-MM-DD"
  gender?: Gender;
  blood_group?: BloodGroup;
  existing_conditions?: string;
  created_at: string;
  deleted_at: string | null;
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface PatientCreate {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth?: string;
  gender?: Gender;
  blood_group?: BloodGroup;
  existing_conditions?: string;
}

export interface PatientUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  blood_group?: BloodGroup;
  existing_conditions?: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface PatientListParams extends PaginationParams {
  search?: string; // name or phone
}