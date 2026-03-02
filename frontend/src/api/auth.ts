import { apiClient } from "../lib/apiClient";
import type {
  AuthPayload,
  RegisterPayload,
  TokenResponse,
  UserResponse,
} from "../types/api";

export async function login(payload: AuthPayload): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>("/auth/login", payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<UserResponse> {
  const { data } = await apiClient.post<UserResponse>("/auth/register", payload);
  return data;
}

export async function getMe(): Promise<UserResponse> {
  const { data } = await apiClient.get<UserResponse>("/users/me");
  return data;
}
