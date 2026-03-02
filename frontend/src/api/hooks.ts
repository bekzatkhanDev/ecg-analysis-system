import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "../lib/apiClient";
import { useAnalysisStore } from "../store/analysisStore";
import { useAuthStore } from "../store/authStore";
import { getMe, login, register } from "./auth";
import { analyzeECG, type AnalyzeVariables } from "./ecg";

const ME_QUERY_KEY = ["auth", "me"] as const;

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

  return useMutation({
    mutationFn: (variables: AnalyzeVariables) => analyzeECG(variables),
    onMutate: () => {
      setAnalyzing(true);
      setUploadProgress(0);
      setError(null);
    },
    onSuccess: (result) => {
      setResult(result.probabilities, result.predicted_class);
      setECGData(result.ecg_data);
      setUploadProgress(100);
    },
    onError: (error) => {
      setError(getApiErrorMessage(error));
    },
    onSettled: () => {
      setAnalyzing(false);
    },
  });
}
