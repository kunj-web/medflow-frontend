import { Gender, BloodGroup, PaginationParams } from "./common";

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  city?: string | null;
  state?: string | null;
  date_of_birth?: string | null;
  gender?: Gender | null;
  blood_group?: BloodGroup | null;
  height?: number | null;
  weight?: number | null;
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
  height?: number;
  weight?: number;
  city?: string;
  state?: string;
  allergies?: string;
  existing_conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface PatientUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  date_of_birth?: string | null;
  gender?: Gender | null;
  blood_group?: BloodGroup | null;
  height?: number | null;
  weight?: number | null;
  city?: string | null;
  state?: string | null;
  allergies?: string | null;
  existing_conditions?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface PatientListParams extends PaginationParams {
  search?: string; // name or phone
}
