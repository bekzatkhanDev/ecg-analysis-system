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
  // Record tracking
  currentRecordId: number | null;
  selectedPatientId: number | null;
  // Doctor's submitted diagnosis (after PATCH)
  doctorDiagnosis: string | null;
  doctorComment: string | null;
  setSignal: (data: File, fileName: string) => void;
  clearSignal: () => void;
  setAnalyzing: (value: boolean) => void;
  setUploadProgress: (value: number) => void;
  setResult: (probabilities: Record<string, number>, predictedClass: string, recordId: number) => void;
  setError: (message: string | null) => void;
  setECGData: (data: number[][]) => void;
  setSelectedPatient: (id: number | null) => void;
  setDoctorDiagnosis: (diagnosis: string | null, comment: string | null) => void;
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
  currentRecordId: null,
  selectedPatientId: null,
  doctorDiagnosis: null,
  doctorComment: null,
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
      currentRecordId: null,
      doctorDiagnosis: null,
      doctorComment: null,
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
      currentRecordId: null,
      doctorDiagnosis: null,
      doctorComment: null,
    }),
  setAnalyzing: (value) => set({ isAnalyzing: value }),
  setUploadProgress: (value) =>
    set({ uploadProgress: Math.max(0, Math.min(100, Math.round(value))) }),
  setResult: (probabilities, predictedClass, recordId) =>
    set({ probabilities, predictedClass, error: null, currentRecordId: recordId }),
  setError: (message) => set({ error: message }),
  setECGData: (data) => set({ ecgData: data }),
  setSelectedPatient: (id) => set({ selectedPatientId: id }),
  setDoctorDiagnosis: (diagnosis, comment) =>
    set({ doctorDiagnosis: diagnosis, doctorComment: comment }),
  resetSession: () => set({ ...initialState }),
}));
