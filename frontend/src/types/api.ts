export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export type UserRole = "doctor" | "patient";

export interface UserResponse {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  role: UserRole;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthPayload {
  full_name?: string;
  role?: UserRole;
}

export interface AnalyzeResponse {
  probabilities: Record<string, number>;
  predicted_class: string;
  ecg_data: number[][];
  record_id: number;
}

export interface PatientUserResponse {
  id: number;
  email: string;
  full_name: string | null;
}

export interface RecordResponse {
  id: number;
  doctor_id: number;
  patient_id: number | null;
  predicted_class: string;
  prob_norm: number;
  prob_mi: number;
  prob_sttc: number;
  prob_cd: number;
  prob_hyp: number;
  doctor_diagnosis: string | null;
  doctor_comment: string | null;
  created_at: string;
  doctor_email: string | null;
  doctor_name: string | null;
  patient_email: string | null;
  patient_name: string | null;
}

export interface DiagnosisPayload {
  doctor_diagnosis: string | null;
  doctor_comment: string | null;
}

export interface ApiValidationErrorItem {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiErrorResponse {
  detail?: string | ApiValidationErrorItem[];
}
