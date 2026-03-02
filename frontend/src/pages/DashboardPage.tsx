import AnalysisDashboard from "../components/AnalysisDashboard";
import ECGChart from "../components/ECGChart";
import ECGUpload from "../components/ECGUpload";
import AppShell from "../components/layout/AppShell";
import { useAnalysisStore } from "../store/analysisStore";
import { useTranslation } from "react-i18next";

function DashboardPage() {
  const { t } = useTranslation();
  const ecgData = useAnalysisStore((state) => state.ecgData);
  const samplingRate = useAnalysisStore((state) => state.samplingRate);

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
        <div className="space-y-6">
          <ECGUpload />
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
