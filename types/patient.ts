import { Gender, BloodGroup, PaginationParams } from "./common";

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  date_of_birth?: string | null;
  gender?: Gender | null;
  blood_group?: BloodGroup | null;
  allergies?: string | null;
  existing_conditions?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
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
