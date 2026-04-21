import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { useAnalysisStore } from "../store/analysisStore";
import { useAuthStore } from "../store/authStore";
import DiagnosisForm from "./DiagnosisForm";
import { loadPdfFonts, registerFonts } from "../utils/pdfFonts";

const DIAGNOSIS_COLORS: Record<string, [number, number, number]> = {
  NORM: [39, 174, 96],
  MI: [231, 76, 60],
  STTC: [230, 126, 34],
  CD: [142, 68, 173],
  HYP: [41, 128, 185],
};

async function generatePDFReport(
  probabilities: Record<string, number>,
  predictedClass: string,
  userEmail: string,
  userRole: string,
  userName: string | null,
  doctorDiagnosis: string | null,
  doctorComment: string | null,
  t: (key: string) => string,
) {
  const [{ jsPDF }, fonts] = await Promise.all([
    import("jspdf"),
    loadPdfFonts(),
  ]);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const font = registerFonts(doc, fonts);

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Header ─────────────────────────────────────────────────────────────
  doc.setFillColor(0, 87, 184);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(font, "bold");
  doc.text("ECG Analysis System", margin, 13);
  doc.setFontSize(9);
  doc.setFont(font, "normal");
  doc.text(t("pdf.reportTitle"), margin, 21);
  y = 38;

  // ── Metadata ───────────────────────────────────────────────────────────
  doc.setTextColor(50, 85, 122);
  doc.setFontSize(8);
  doc.setFont(font, "normal");
  const now = new Date();
  doc.text(`${t("pdf.generatedOn")}: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, margin, y);
  y += 5;
  doc.text(`${t("pdf.reportedBy")}: ${userName ?? userEmail} (${userRole})`, margin, y);
  y += 10;

  doc.setDrawColor(178, 201, 222);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;

  // ── ML predicted class box ─────────────────────────────────────────────
  const [r, g, b] = DIAGNOSIS_COLORS[predictedClass] ?? [100, 100, 100];
  doc.setFillColor(r, g, b);
  doc.roundedRect(margin, y, contentWidth, 18, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont(font, "normal");
  doc.text(`${t("dashboard.predictedClass").toUpperCase()} (AI)`, margin + 6, y + 6);
  doc.setFontSize(15);
  doc.setFont(font, "bold");
  doc.text(predictedClass, margin + 6, y + 14);
  y += 26;

  // ── Doctor's diagnosis box ─────────────────────────────────────────────
  if (doctorDiagnosis) {
    const [dr, dg, db] = DIAGNOSIS_COLORS[doctorDiagnosis] ?? [100, 100, 100];
    const boxH = doctorComment ? 28 : 18;
    doc.setFillColor(Math.round(dr * 0.15 + 220), Math.round(dg * 0.15 + 220), Math.round(db * 0.15 + 220));
    doc.roundedRect(margin, y, contentWidth, boxH, 3, 3, "F");
    doc.setDrawColor(dr, dg, db);
    doc.setLineWidth(1);
    doc.roundedRect(margin, y, contentWidth, boxH, 3, 3, "S");
    doc.setTextColor(dr, dg, db);
    doc.setFontSize(8);
    doc.setFont(font, "normal");
    doc.text(t("records.doctorDiagnosis").toUpperCase(), margin + 6, y + 6);
    doc.setFontSize(13);
    doc.setFont(font, "bold");
    doc.text(doctorDiagnosis, margin + 6, y + 14);
    if (doctorComment) {
      doc.setFontSize(8);
      doc.setFont(font, "normal");
      const commentLines = doc.splitTextToSize(doctorComment, contentWidth - 12);
      doc.text(commentLines, margin + 6, y + 22);
    }
    y += boxH + 8;
  }

  // ── Probabilities table ────────────────────────────────────────────────
  doc.setTextColor(44, 72, 101);
  doc.setFontSize(10);
  doc.setFont(font, "bold");
  doc.text(t("ecg.results.probabilities"), margin, y);
  y += 6;

  const sorted = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  const rowH = 9;
  const barMaxW = contentWidth * 0.45;

  sorted.forEach(([label, prob], i) => {
    const rowY = y + i * rowH;
    if (i % 2 === 0) {
      doc.setFillColor(241, 246, 251);
      doc.rect(margin, rowY - 1, contentWidth, rowH, "F");
    }
    const isPredicted = label === predictedClass;
    doc.setFont(font, isPredicted ? "bold" : "normal");
    doc.setTextColor(isPredicted ? r : 50, isPredicted ? g : 85, isPredicted ? b : 122);
    doc.setFontSize(9);
    doc.text(label, margin + 3, rowY + 5.5);
    doc.text(`${(prob * 100).toFixed(1)}%`, margin + 28, rowY + 5.5);
    const barW = prob * barMaxW;
    doc.setFillColor(isPredicted ? r : 134, isPredicted ? g : 167, isPredicted ? b : 200);
    doc.roundedRect(margin + 50, rowY + 2, barW, 4, 1, 1, "F");
    doc.setDrawColor(220, 230, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin + 50, rowY + 2, barMaxW, 4, 1, 1, "S");
  });

  y += sorted.length * rowH + 10;

  doc.setDrawColor(178, 201, 222);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;

  // ── Clinical note (AI description) ────────────────────────────────────
  doc.setTextColor(44, 72, 101);
  doc.setFontSize(9);
  doc.setFont(font, "bold");
  doc.text(t("pdf.clinicalNote"), margin, y);
  y += 5;
  doc.setFont(font, "normal");
  doc.setTextColor(80, 110, 140);
  const description = t(`diagnosis.${predictedClass}.description`);
  const lines = doc.splitTextToSize(description, contentWidth);
  doc.text(lines, margin, y);
  y += lines.length * 5 + 8;

  // ── Disclaimer ────────────────────────────────────────────────────────
  doc.setFillColor(255, 243, 224);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, "F");
  doc.setTextColor(160, 100, 0);
  doc.setFontSize(7.5);
  doc.setFont(font, "bold");
  doc.text(`${t("pdf.disclaimer")}:`, margin + 4, y + 5);
  doc.setFont(font, "normal");
  const dLines = doc.splitTextToSize(t("pdf.disclaimerText"), contentWidth - 8);
  doc.text(dLines, margin + 4, y + 11);

  // ── Footer ────────────────────────────────────────────────────────────
  doc.setTextColor(160, 180, 200);
  doc.setFontSize(7);
  doc.setFont(font, "normal");
  doc.text(
    `ECG Analysis System  •  ${t("pdf.generatedOn")} ${now.toISOString()}`,
    margin,
    doc.internal.pageSize.getHeight() - 10,
  );

  doc.save(`ecg-report-${predictedClass}-${now.toISOString().slice(0, 10)}.pdf`);
}

function AnalysisDashboard() {
  const probabilities = useAnalysisStore((state) => state.probabilities);
  const predictedClass = useAnalysisStore((state) => state.predictedClass);
  const doctorDiagnosis = useAnalysisStore((state) => state.doctorDiagnosis);
  const doctorComment = useAnalysisStore((state) => state.doctorComment);
  const user = useAuthStore((state) => state.user);
  const isDoctor = !user || user.role === "doctor";
  const [pdfLoading, setPdfLoading] = useState(false);

  const chartData = probabilities
    ? Object.entries(probabilities)
        .map(([label, probability]) => ({ label, probability }))
        .sort((a, b) => b.probability - a.probability)
    : [];

  const { t } = useTranslation();

  const handleExportPDF = async () => {
    if (!probabilities || !predictedClass || pdfLoading) return;
    setPdfLoading(true);
    try {
      await generatePDFReport(
        probabilities,
        predictedClass,
        user?.email ?? "",
        user?.role ?? "doctor",
        user?.full_name ?? null,
        doctorDiagnosis,
        doctorComment,
        t,
      );
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <>
      <section className="panel animate-fade-up p-4">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-medical-900">{t("dashboard.analysisDashboard")}</h2>
            <p className="text-xs text-medical-700">{t("dashboard.classProbabilities")}</p>
          </div>
          {isDoctor && probabilities && (
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={pdfLoading}
              className="btn-secondary flex items-center gap-1.5 text-xs disabled:opacity-60"
              title={t("ecg.results.downloadReport")}
            >
              {pdfLoading ? (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <polyline points="9 15 12 18 15 15" />
                </svg>
              )}
              {pdfLoading ? t("common.pleaseWait") : t("ecg.results.downloadReport")}
            </button>
          )}
        </div>

        {probabilities ? (
          <>
            <div className="mb-3 mt-3 rounded-lg border border-medical-200 bg-medical-50 px-3 py-2">
              <p className="text-xs uppercase tracking-[0.2em] text-medical-600">{t("dashboard.predictedClass")} (AI)</p>
              <p className="text-xl font-semibold text-accent-700">{predictedClass}</p>
              <p className="text-xs text-medical-600 mt-0.5">{t(`diagnosis.${predictedClass}.description`)}</p>
            </div>

            {isDoctor && doctorDiagnosis && (
              <div className="mb-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">{t("records.doctorDiagnosis")}</p>
                <p className="text-xl font-semibold text-emerald-800">{doctorDiagnosis}</p>
                {doctorComment && <p className="mt-1 text-xs text-emerald-700 italic">{doctorComment}</p>}
              </div>
            )}

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d7e3ef" />
                  <XAxis dataKey="label" axisLine={{ stroke: "#b2c9de" }} tickLine={{ stroke: "#b2c9de" }} tick={{ fill: "#32557a", fontSize: 12 }} />
                  <YAxis domain={[0, 1]} axisLine={{ stroke: "#b2c9de" }} tickLine={{ stroke: "#b2c9de" }} tick={{ fill: "#32557a", fontSize: 12 }} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
                  <Tooltip formatter={(v: number) => `${(v * 100).toFixed(2)}%`} contentStyle={{ borderRadius: 8, borderColor: "#b2c9de", fontSize: 12 }} />
                  <Bar dataKey="probability" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.label} fill={entry.label === predictedClass ? "#0057b8" : "#86a7c8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-medical-300 bg-medical-50 px-3 py-8 text-center text-sm text-medical-700">
            {t("dashboard.uploadECG")}
          </div>
        )}
      </section>

      {isDoctor && <DiagnosisForm />}
    </>
  );
}

export default AnalysisDashboard;
