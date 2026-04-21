import AnalysisDashboard from "../components/AnalysisDashboard";
import ECGChart from "../components/ECGChart";
import ECGUpload from "../components/ECGUpload";
import AppShell from "../components/layout/AppShell";
import { useAnalysisStore } from "../store/analysisStore";
import { useAuthStore } from "../store/authStore";
import { useTranslation } from "react-i18next";

function DashboardPage() {
  const { t } = useTranslation();
  const ecgData = useAnalysisStore((state) => state.ecgData);
  const samplingRate = useAnalysisStore((state) => state.samplingRate);
  const user = useAuthStore((state) => state.user);
  const isPatient = user?.role === "patient";

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
        <div className="space-y-6">
          {isPatient ? (
            <section className="panel animate-fade-up p-4">
              <h2 className="mb-1 text-lg font-semibold text-medical-900">{t('roles.patientView')}</h2>
              <p className="text-sm text-medical-700">{t('roles.patientUploadRestricted')}</p>
            </section>
          ) : (
            <ECGUpload />
          )}
          <AnalysisDashboard />
        </div>
        <div>
          <ECGChart data={ecgData} sampleRate={samplingRate} />
        </div>
      </div>
    </AppShell>
  );
}

export default DashboardPage;
