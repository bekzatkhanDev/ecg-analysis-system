import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDiagnosisMutation } from "../api/hooks";
import { useAnalysisStore } from "../store/analysisStore";

const DIAGNOSIS_OPTIONS = ["NORM", "MI", "STTC", "CD", "HYP"] as const;

const DIAGNOSIS_COLORS: Record<string, string> = {
  NORM: "text-emerald-700 bg-emerald-50 border-emerald-300",
  MI: "text-red-700 bg-red-50 border-red-300",
  STTC: "text-orange-700 bg-orange-50 border-orange-300",
  CD: "text-purple-700 bg-purple-50 border-purple-300",
  HYP: "text-blue-700 bg-blue-50 border-blue-300",
};

function DiagnosisForm() {
  const { t } = useTranslation();
  const currentRecordId = useAnalysisStore((state) => state.currentRecordId);
  const predictedClass = useAnalysisStore((state) => state.predictedClass);
  const storedDiagnosis = useAnalysisStore((state) => state.doctorDiagnosis);
  const storedComment = useAnalysisStore((state) => state.doctorComment);

  const [diagnosis, setDiagnosis] = useState<string>(storedDiagnosis ?? predictedClass ?? "NORM");
  const [comment, setComment] = useState<string>(storedComment ?? "");
  const [saved, setSaved] = useState(Boolean(storedDiagnosis));

  const mutation = useDiagnosisMutation();

  if (!currentRecordId || !predictedClass) return null;

  const handleSave = () => {
    mutation.mutate(
      { id: currentRecordId, payload: { doctor_diagnosis: diagnosis, doctor_comment: comment || null } },
      {
        onSuccess: () => setSaved(true),
      },
    );
  };

  return (
    <section className="panel animate-fade-up p-4 space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-medical-900">{t("records.doctorAssessment")}</h2>
        <p className="text-xs text-medical-700">{t("records.doctorAssessmentDesc")}</p>
      </div>

      {/* Diagnosis selector */}
      <div className="space-y-1">
        <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-medical-700">
          {t("records.doctorDiagnosis")}
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {DIAGNOSIS_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { setDiagnosis(opt); setSaved(false); }}
              className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-all ${
                diagnosis === opt
                  ? DIAGNOSIS_COLORS[opt]
                  : "border-medical-200 bg-medical-50 text-medical-600 hover:border-medical-400"
              }`}
            >
              <div className="text-center">
                <div>{opt}</div>
                <div className="mt-0.5 text-[9px] font-normal opacity-70">
                  {t(`diagnosis.${opt}.name`)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Comment textarea */}
      <div className="space-y-1">
        <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-medical-700">
          {t("records.doctorComment")}
        </label>
        <textarea
          className="input-field w-full resize-none"
          rows={3}
          placeholder={t("records.doctorCommentPlaceholder")}
          value={comment}
          onChange={(e) => { setComment(e.target.value); setSaved(false); }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? t("common.pleaseWait") : t("records.saveDiagnosis")}
        </button>
        {saved && !mutation.isPending && (
          <span className="text-xs text-emerald-600 font-medium">{t("records.diagnosisSaved")}</span>
        )}
        {mutation.isError && (
          <span className="text-xs text-red-600">{t("errors.saveFailed")}</span>
        )}
      </div>
    </section>
  );
}

export default DiagnosisForm;
