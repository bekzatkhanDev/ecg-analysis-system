import { apiClient } from "../lib/apiClient";
import type { DiagnosisPayload, PatientUserResponse, RecordResponse } from "../types/api";

export async function getRecords(): Promise<RecordResponse[]> {
  const { data } = await apiClient.get<RecordResponse[]>("/ecg/records");
  return data;
}

export async function getRecord(id: number): Promise<RecordResponse> {
  const { data } = await apiClient.get<RecordResponse>(`/ecg/records/${id}`);
  return data;
}

export async function updateDiagnosis(id: number, payload: DiagnosisPayload): Promise<RecordResponse> {
  const { data } = await apiClient.patch<RecordResponse>(`/ecg/records/${id}/diagnosis`, payload);
  return data;
}

export async function getPatients(): Promise<PatientUserResponse[]> {
  const { data } = await apiClient.get<PatientUserResponse[]>("/ecg/patients");
  return data;
}
