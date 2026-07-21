import { AccountStatus, WorkType } from "./auth";
import { DayOfWeek, Gender } from "./common";

export interface AdminDoctorReviewSchedule {
  id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

export interface AdminDoctorReview {
  id: string;
  user_id: string;
  status: AccountStatus;
  first_name: string;
  last_name: string;
  gender: Gender;
  phone: string | null;
  email: string | null;
  specialization: string;
  qualification: string | null;
  registration_number: string | null;
  experience_years: number;
  consultation_fee: number;
  is_active: boolean;
  work_type: WorkType;
  hospital_id: string | null;
  clinic_name: string | null;
  clinic_city: string | null;
  clinic_address: string | null;
  pending_hospital_name: string | null;
  pending_hospital_city: string | null;
  pending_hospital_state: string | null;
  schedules: AdminDoctorReviewSchedule[];
  created_at: string;
}

export interface ApprovalHospitalCreate {
  name: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface DoctorApproveRequest {
  hospital_id?: string;
  create_hospital?: ApprovalHospitalCreate;
}

export interface DoctorRejectRequest {
  reason?: string;
}

export interface PublicHospitalOption {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  address: string | null;
  logo_url: string | null;
}

export interface PublicHospitalListResponse {
  data: PublicHospitalOption[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
