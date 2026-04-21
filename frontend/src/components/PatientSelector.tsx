import { useTranslation } from "react-i18next";
import { usePatientsQuery } from "../api/hooks";
import { useAnalysisStore } from "../store/analysisStore";

function PatientSelector() {
  const { t } = useTranslation();
  const { data: patients, isLoading } = usePatientsQuery();
  const selectedPatientId = useAnalysisStore((state) => state.selectedPatientId);
  const setSelectedPatient = useAnalysisStore((state) => state.setSelectedPatient);

  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-medical-700">
        {t("records.patient")}
      </label>
      <select
        className="input-field w-full"
        value={selectedPatientId ?? ""}
        onChange={(e) => setSelectedPatient(e.target.value ? Number(e.target.value) : null)}
        disabled={isLoading}
      >
        <option value="">{t("records.noPatient")}</option>
        {patients?.map((p) => (
          <option key={p.id} value={p.id}>
            {p.full_name ?? p.email}
            {p.full_name ? ` (${p.email})` : ""}
          </option>
        ))}
      </select>
      {patients?.length === 0 && (
        <p className="text-xs text-medical-600">{t("records.noPatientsRegistered")}</p>
      )}
    </div>
  );
}

export default PatientSelector;
