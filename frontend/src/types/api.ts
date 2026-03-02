export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthPayload {
  full_name?: string;
}

export interface AnalyzeResponse {
  probabilities: Record<string, number>;
  predicted_class: string;
  ecg_data: number[][];
}

export interface ApiValidationErrorItem {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiErrorResponse {
  detail?: string | ApiValidationErrorItem[];
}
