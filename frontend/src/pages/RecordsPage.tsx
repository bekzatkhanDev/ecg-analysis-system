import { useState } from "react";
import { useTranslation } from "react-i18next";
import AppShell from "../components/layout/AppShell";
import { useRecordsQuery } from "../api/hooks";
import { useAuthStore } from "../store/authStore";
import type { RecordResponse } from "../types/api";

const DIAGNOSIS_COLORS: Record<string, string> = {
  NORM: "bg-emerald-100 text-emerald-800 border-emerald-300",
  MI: "bg-red-100 text-red-800 border-red-300",
  STTC: "bg-orange-100 text-orange-800 border-orange-300",
  CD: "bg-purple-100 text-purple-800 border-purple-300",
  HYP: "bg-blue-100 text-blue-800 border-blue-300",
};

function ProbBar({ label, value, isPredicted }: { label: string; value: number; isPredicted: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-10 font-medium ${isPredicted ? "text-accent-700" : "text-medical-600"}`}>{label}</span>
      <div className="flex-1 h-2 rounded-full bg-medical-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isPredicted ? "bg-accent-500" : "bg-medical-400"}`}
          style={{ width: `${(value * 100).toFixed(1)}%` }}
        />
      </div>
      <span className={`w-10 text-right ${isPredicted ? "font-semibold text-accent-700" : "text-medical-600"}`}>
        {(value * 100).toFixed(1)}%
      </span>
    </div>
  );
}

function RecordCard({ record }: { record: RecordResponse }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isDoctor = user?.role === "doctor";

  const probs: [string, number][] = [
    ["NORM", record.prob_norm],
    ["MI", record.prob_mi],
    ["STTC", record.prob_sttc],
    ["CD", record.prob_cd],
    ["HYP", record.prob_hyp],
  ].sort((a, b) => b[1] - a[1]);

  const dateStr = new Date(record.created_at).toLocaleString();

  return (
    <div className="panel p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
              DIAGNOSIS_COLORS[record.predicted_class] ?? "bg-medical-100 text-medical-800"
            }`}
          >
            {t("dashboard.predictedClass")} (AI): {record.predicted_class}
          </span>
          {record.doctor_diagnosis && (
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                DIAGNOSIS_COLORS[record.doctor_diagnosis] ?? "bg-medical-100 text-medical-800"
              }`}
            >
              {t("records.doctorDiagnosis")}: {record.doctor_diagnosis}
            </span>
          )}
        </div>
        <span className="text-xs text-medical-500 whitespace-nowrap">{dateStr}</span>
      </div>

      {/* Patient / Doctor info */}
      <div className="text-xs text-medical-600 flex flex-wrap gap-4">
        {isDoctor && (
          <span>
            <span className="font-medium text-medical-700">{t("records.patient")}:</span>{" "}
            {record.patient_name ?? record.patient_email ?? t("records.anonymous")}
          </span>
        )}
        {!isDoctor && (
          <span>
            <span className="font-medium text-medical-700">{t("records.doctor")}:</span>{" "}
            {record.doctor_name ?? record.doctor_email}
          </span>
        )}
        <span>
          <span className="font-medium text-medical-700">ID:</span> #{record.id}
        </span>
      </div>

      {/* Doctor's comment */}
      {record.doctor_comment && (
        <div className="rounded-lg border border-medical-200 bg-medical-50 px-3 py-2 text-sm text-medical-800 italic">
          "{record.doctor_comment}"
        </div>
      )}

      {/* Expand/collapse probabilities */}
      <button
        type="button"
        className="text-xs text-accent-600 hover:text-accent-800 font-medium"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? t("records.hideProbabilities") : t("records.showProbabilities")}
      </button>

      {expanded && (
        <div className="space-y-1.5 pt-1">
          {probs.map(([label, value]) => (
            <ProbBar key={label} label={label} value={value} isPredicted={label === record.predicted_class} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecordsPage() {
  const { t } = useTranslation();
  const { data: records, isLoading, isError } = useRecordsQuery();
  const user = useAuthStore((state) => state.user);
  const isDoctor = user?.role === "doctor";

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="panel animate-fade-up px-5 py-4">
          <h2 className="text-xl font-semibold text-medical-900">{t("records.title")}</h2>
          <p className="text-sm text-medical-700 mt-1">
            {isDoctor ? t("records.doctorSubtitle") : t("records.patientSubtitle")}
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-12 text-medical-600 text-sm">{t("common.loading")}</div>
        )}

        {isError && (
          <div className="panel p-4 text-red-700 text-sm">{t("errors.networkError")}</div>
        )}

        {records && records.length === 0 && (
          <div className="panel p-8 text-center text-medical-600 text-sm">
            {t("records.noRecords")}
          </div>
        )}

        {records?.map((record) => (
          <RecordCard key={record.id} record={record} />
        ))}
      </div>
    </AppShell>
  );
}

export default RecordsPage;
