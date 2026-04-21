import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAnalyzeMutation } from "../api/hooks";
import { useAnalysisStore } from "../store/analysisStore";
import PatientSelector from "./PatientSelector";

type UploadStatus = "idle" | "uploading" | "success" | "error";

function ECGUpload() {
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const rawData = useAnalysisStore((state) => state.rawData);
  const fileName = useAnalysisStore((state) => state.fileName);
  const uploadProgress = useAnalysisStore((state) => state.uploadProgress);
  const isAnalyzing = useAnalysisStore((state) => state.isAnalyzing);
  const analysisError = useAnalysisStore((state) => state.error);
  const selectedPatientId = useAnalysisStore((state) => state.selectedPatientId);
  const setSignal = useAnalysisStore((state) => state.setSignal);
  const clearSignal = useAnalysisStore((state) => state.clearSignal);
  const setUploadProgress = useAnalysisStore((state) => state.setUploadProgress);
  const setECGData = useAnalysisStore((state) => state.setECGData);

  const analyzeMutation = useAnalyzeMutation();

  const handleFileSelect = async (selected: File) => {
    setParseError(null);
    setIsParsing(true);
    setStatus("idle");

    try {
      setSignal(selected, selected.name);

      if (selected.name.toLowerCase().endsWith(".dat")) {
        const placeholderData: number[][] = Array.from({ length: 12 }, () =>
          Array.from({ length: 5000 }, () => 0),
        );
        setECGData(placeholderData);
      } else {
        const arrayBuffer = await selected.arrayBuffer();
        const text = new TextDecoder().decode(arrayBuffer);

        let ecgData: number[][];
        try {
          const jsonData = JSON.parse(text);
          if (
            Array.isArray(jsonData) &&
            jsonData.length === 12 &&
            Array.isArray(jsonData[0]) &&
            jsonData[0].length === 5000
          ) {
            ecgData = jsonData;
          } else {
            throw new Error("Invalid JSON format");
          }
        } catch {
          const lines = text.trim().split("\n");
          if (lines.length === 12) {
            ecgData = lines.map((line) => line.split(",").map(Number));
          } else if (lines.length === 1 && lines[0].split(",").length === 60000) {
            const values = lines[0].split(",").map(Number);
            ecgData = [];
            for (let i = 0; i < 12; i++) {
              ecgData.push(values.slice(i * 5000, (i + 1) * 5000));
            }
          } else {
            throw new Error("Unsupported file format");
          }
        }

        setECGData(ecgData);
      }
    } catch (error) {
      clearSignal();
      const message = error instanceof Error ? error.message : "Failed to process file";
      setParseError(message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleAnalyze = () => {
    if (!rawData) return;
    analyzeMutation.mutate({
      data: rawData,
      patientId: selectedPatientId,
      onUploadProgress: (progress) => setUploadProgress(progress),
    });
  };

  const handleReset = () => {
    clearSignal();
    setParseError(null);
    setUploadProgress(0);
    setStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const progressVisible = isAnalyzing || uploadProgress > 0;
  const { t } = useTranslation();

  return (
    <section
      className="panel animate-fade-up p-4"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h2 className="mb-1 text-lg font-semibold text-medical-900">{t("ecg.upload.title")}</h2>
      <p className="mb-4 text-xs text-medical-700">{t("ecg.upload.subtitle")}</p>

      <div className="space-y-3">
        {/* Patient selector */}
        <PatientSelector />

        {/* File input */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-medical-700">
            {t("ecg.upload.title")}
          </label>
          <input
            ref={fileInputRef}
            type="file"
            className={`input-field w-full cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-accent-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-600 ${
              isDragging ? "border-accent-500 bg-accent-50" : ""
            }`}
            accept=".json,.csv,.txt,.dat"
            onChange={handleFileChange}
            disabled={isParsing || isAnalyzing}
          />
          <p className="mt-1 text-xs text-medical-600">{t("ecg.upload.dropZone")}</p>
        </div>

        {fileName && (
          <div className="rounded-lg border border-medical-200 bg-medical-50 px-3 py-2 text-sm text-medical-800">
            {t("ecg.upload.fileSelected", { fileName })}
          </div>
        )}

        {parseError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {parseError}
          </div>
        )}

        {analysisError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {analysisError}
          </div>
        )}

        {progressVisible && (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-medical-700">
              <span>{isAnalyzing ? t("ecg.upload.uploadingAndAnalyzing") : t("ecg.upload.uploadComplete")}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-medical-100">
              <div
                className="h-full bg-accent-500 transition-[width] duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {t("ecg.upload.uploadedSuccessfully")}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            className="btn-primary"
            onClick={handleAnalyze}
            disabled={!rawData || isParsing || isAnalyzing}
          >
            {isAnalyzing ? t("ecg.upload.analyzing") : t("ecg.upload.startAnalysis")}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            disabled={!rawData || isAnalyzing}
          >
            {t("common.reset")}
          </button>
        </div>
      </div>
    </section>
  );
}

export default ECGUpload;
