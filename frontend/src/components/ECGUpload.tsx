import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAnalyzeMutation } from "../api/hooks";
import { useAnalysisStore } from "../store/analysisStore";

interface UploadResponse {
  url: string;
  filename: string;
  size: number;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

async function uploadFile(
  file: File,
  onProgress: (percent: number) => void
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Отслеживание прогресса загрузки
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as UploadResponse);
      } else {
        reject(new Error(`Server error: ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.open("POST", "http://localhost:8000/api/v1/ecg/upload"); // 👈 замените на ваш URL
    // xhr.setRequestHeader("Authorization", `Bearer ${token}`); // если нужен токен
    xhr.send(formData);
  });
}

function ECGUpload() {
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [response, setResponse] = useState<UploadResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const rawData = useAnalysisStore((state) => state.rawData);
  const fileName = useAnalysisStore((state) => state.fileName);
  const uploadProgress = useAnalysisStore((state) => state.uploadProgress);
  const isAnalyzing = useAnalysisStore((state) => state.isAnalyzing);
  const analysisError = useAnalysisStore((state) => state.error);
  const setSignal = useAnalysisStore((state) => state.setSignal);
  const clearSignal = useAnalysisStore((state) => state.clearSignal);
  const setUploadProgress = useAnalysisStore((state) => state.setUploadProgress);
  const setECGData = useAnalysisStore((state) => state.setECGData);

  const analyzeMutation = useAnalyzeMutation();

  // ── Выбор файла ──────────────────────────────────────────────────────────

  const handleFileSelect = async (selected: File) => {
    setParseError(null);
    setIsParsing(true);
    setStatus("idle");
    setProgress(0);
    setResponse(null);
    setErrorMsg("");

    try {
      setSignal(selected, selected.name);
      
      // For .dat files, we can't parse them directly in the browser
      // We'll set a placeholder ECG data and let the backend handle the actual parsing
      if (selected.name.toLowerCase().endsWith('.dat')) {
        // Create a placeholder ECG data with zeros for visualization
        // The actual data will be processed by the backend
        const placeholderData: number[][] = Array.from({ length: 12 }, () => 
          Array.from({ length: 5000 }, () => 0)
        );
        setECGData(placeholderData);
      } else {
        // Parse the file to extract ECG data for visualization
        const arrayBuffer = await selected.arrayBuffer();
        const text = new TextDecoder().decode(arrayBuffer);
        
        // Try to parse as JSON first
        let ecgData: number[][];
        try {
          const jsonData = JSON.parse(text);
          if (Array.isArray(jsonData) && jsonData.length === 12 && Array.isArray(jsonData[0]) && jsonData[0].length === 5000) {
            ecgData = jsonData;
          } else {
            throw new Error("Invalid JSON format");
          }
        } catch {
          // If not JSON, try to parse as CSV
          const lines = text.trim().split('\n');
          if (lines.length === 12) {
            ecgData = lines.map(line => line.split(',').map(Number));
          } else if (lines.length === 1 && lines[0].split(',').length === 60000) {
            // Single line with all values
            const values = lines[0].split(',').map(Number);
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
    if (!file) {
      return;
    }

    handleFileSelect(file);
  };

  // ── Drag & Drop ──────────────────────────────────────────────────────────

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
    if (!rawData) {
      return;
    }

    // Create a FormData object for the file upload
    const formData = new FormData();
    formData.append("file", rawData);

    analyzeMutation.mutate({
      data: rawData,
      onUploadProgress: (progress) => {
        setUploadProgress(progress);
      },
    });
  };

  const handleReset = () => {
    clearSignal();
    setParseError(null);
    setUploadProgress(0);
    setStatus("idle");
    setProgress(0);
    setResponse(null);
    setErrorMsg("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ── Загрузка ─────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!rawData) return;

    setStatus("uploading");
    setProgress(0);

    try {
      const data = await uploadFile(rawData, setProgress);
      setResponse(data);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  };

  const progressVisible = isAnalyzing || uploadProgress > 0;

  const { t } = useTranslation();
  
  return (
    <section className="panel animate-fade-up p-4">
      <h2 className="mb-1 text-lg font-semibold text-medical-900">{t('ecg.upload.title')}</h2>
      <p className="mb-4 text-xs text-medical-700">
        {t('ecg.upload.subtitle')}
      </p>

      <div className="space-y-3">
          <input
          ref={fileInputRef}
          type="file"
          className="input-field cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-accent-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-600"
          accept=".json,.csv,.txt,.dat"
          onChange={handleFileChange}
          disabled={isParsing || isAnalyzing}
        />

        {fileName ? (
          <div className="rounded-lg border border-medical-200 bg-medical-50 px-3 py-2 text-sm text-medical-800">
            {t('ecg.upload.fileSelected', { fileName })}
          </div>
        ) : null}

        {parseError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {parseError}
          </div>
        ) : null}

        {analysisError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {analysisError}
          </div>
        ) : null}

        {progressVisible ? (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-medical-700">
              <span>{isAnalyzing ? t('ecg.upload.uploadingAndAnalyzing') : t('ecg.upload.uploadComplete')}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-medical-100">
              <div
                className="h-full bg-accent-500 transition-[width] duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : null}

        {/* Progress Bar */}
        {status === "uploading" && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-medical-100 rounded-full overflow-hidden">
              <div className="h-full bg-accent-500 transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-medical-700 min-w-[34px]">{progress}%</span>
          </div>
        )}

        {/* Success */}
        {status === "success" && response && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
            ✅ {t('ecg.upload.uploadedSuccessfully')}
            <br />
            <small>{response.url}</small>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            ❌ {t('ecg.upload.errorUploading')}: {errorMsg}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            className="btn-primary"
            onClick={handleAnalyze}
            disabled={!rawData || isParsing || isAnalyzing}
          >
            {isAnalyzing ? t('ecg.upload.analyzing') : t('ecg.upload.startAnalysis')}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            disabled={!rawData || isAnalyzing}
          >
            {t('common.reset')}
          </button>
        </div>
      </div>
    </section>
  );
}

export default ECGUpload;
