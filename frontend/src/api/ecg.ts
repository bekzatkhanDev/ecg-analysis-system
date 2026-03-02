import type { AxiosProgressEvent } from "axios";
import { apiClient } from "../lib/apiClient";
import type { AnalyzeResponse } from "../types/api";

export interface AnalyzeVariables {
  data: File;
  onUploadProgress?: (progress: number) => void;
}

export async function analyzeECG({
  data,
  onUploadProgress,
}: AnalyzeVariables): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("file", data);

  const response = await apiClient.post<AnalyzeResponse>(
    "/ecg/analyze",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (!onUploadProgress || !event.total) {
          return;
        }
        onUploadProgress((event.loaded / event.total) * 100);
      },
    },
  );
  onUploadProgress?.(100);
  return response.data;
}
