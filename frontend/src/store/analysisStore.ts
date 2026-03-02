import { create } from "zustand";

interface AnalysisState {
  rawData: File | null;
  fileName: string | null;
  samplingRate: number;
  uploadProgress: number;
  probabilities: Record<string, number> | null;
  predictedClass: string | null;
  isAnalyzing: boolean;
  error: string | null;
  ecgData: number[][] | null;
  setSignal: (data: File, fileName: string) => void;
  clearSignal: () => void;
  setAnalyzing: (value: boolean) => void;
  setUploadProgress: (value: number) => void;
  setResult: (probabilities: Record<string, number>, predictedClass: string) => void;
  setError: (message: string | null) => void;
  setECGData: (data: number[][]) => void;
  resetSession: () => void;
}

const initialState = {
  rawData: null,
  fileName: null,
  samplingRate: 500,
  uploadProgress: 0,
  probabilities: null,
  predictedClass: null,
  isAnalyzing: false,
  error: null,
  ecgData: null,
} as const;

export const useAnalysisStore = create<AnalysisState>((set) => ({
  ...initialState,
  setSignal: (data, fileName) =>
    set({
      rawData: data,
      fileName,
      probabilities: null,
      predictedClass: null,
      uploadProgress: 0,
      error: null,
      ecgData: null,
    }),
  clearSignal: () =>
    set({
      rawData: null,
      fileName: null,
      probabilities: null,
      predictedClass: null,
      uploadProgress: 0,
      error: null,
      ecgData: null,
    }),
  setAnalyzing: (value) => set({ isAnalyzing: value }),
  setUploadProgress: (value) =>
    set({
      uploadProgress: Math.max(0, Math.min(100, Math.round(value))),
    }),
  setResult: (probabilities, predictedClass) =>
    set({
      probabilities,
      predictedClass,
      error: null,
    }),
  setError: (message) => set({ error: message }),
  setECGData: (data) => set({ ecgData: data }),
  resetSession: () => set({ ...initialState }),
}));
