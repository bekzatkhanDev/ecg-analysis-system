import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../lib/apiClient";
import { useAnalysisStore } from "../store/analysisStore";
import { useAuthStore } from "../store/authStore";
import { getMe, login, register } from "./auth";
import { analyzeECG, type AnalyzeVariables } from "./ecg";
import { getRecords, getRecord, updateDiagnosis, getPatients } from "./records";
import type { DiagnosisPayload } from "../types/api";

const ME_QUERY_KEY = ["auth", "me"] as const;
const RECORDS_QUERY_KEY = ["ecg", "records"] as const;
const PATIENTS_QUERY_KEY = ["ecg", "patients"] as const;

export function useMeQuery() {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

  const query = useQuery({
    queryKey: [...ME_QUERY_KEY, token],
    queryFn: getMe,
    enabled: Boolean(token),
    retry: false,
    staleTime: 300_000,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return query;
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: login,
    onSuccess: async (result) => {
      setToken(result.access_token);
      setUser(null);
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: register,
  });
}

export function useAnalyzeMutation() {
  const setAnalyzing = useAnalysisStore((state) => state.setAnalyzing);
  const setUploadProgress = useAnalysisStore((state) => state.setUploadProgress);
  const setResult = useAnalysisStore((state) => state.setResult);
  const setECGData = useAnalysisStore((state) => state.setECGData);
  const setError = useAnalysisStore((state) => state.setError);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: AnalyzeVariables) => analyzeECG(variables),
    onMutate: () => {
      setAnalyzing(true);
      setUploadProgress(0);
      setError(null);
    },
    onSuccess: (result) => {
      setResult(result.probabilities, result.predicted_class, result.record_id);
      setECGData(result.ecg_data);
      setUploadProgress(100);
      // Refresh the records list so it shows the new entry
      queryClient.invalidateQueries({ queryKey: RECORDS_QUERY_KEY });
    },
    onError: (error) => {
      setError(getApiErrorMessage(error));
    },
    onSettled: () => {
      setAnalyzing(false);
    },
  });
}

export function useRecordsQuery() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: RECORDS_QUERY_KEY,
    queryFn: getRecords,
    enabled: Boolean(token),
    staleTime: 30_000,
  });
}

export function useRecordQuery(id: number | null) {
  return useQuery({
    queryKey: ["ecg", "record", id],
    queryFn: () => getRecord(id!),
    enabled: id != null,
    staleTime: 30_000,
  });
}

export function usePatientsQuery() {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: PATIENTS_QUERY_KEY,
    queryFn: getPatients,
    enabled: user?.role === "doctor",
    staleTime: 60_000,
  });
}

export function useDiagnosisMutation() {
  const queryClient = useQueryClient();
  const setDoctorDiagnosis = useAnalysisStore((state) => state.setDoctorDiagnosis);

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DiagnosisPayload }) =>
      updateDiagnosis(id, payload),
    onSuccess: (result) => {
      setDoctorDiagnosis(result.doctor_diagnosis, result.doctor_comment);
      queryClient.invalidateQueries({ queryKey: RECORDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["ecg", "record", result.id] });
    },
  });
}
