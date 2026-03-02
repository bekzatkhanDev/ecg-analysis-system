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
import { useAnalysisStore } from "../store/analysisStore";

function AnalysisDashboard() {
  const probabilities = useAnalysisStore((state) => state.probabilities);
  const predictedClass = useAnalysisStore((state) => state.predictedClass);

  const chartData = probabilities
    ? Object.entries(probabilities)
        .map(([label, probability]) => ({
          label,
          probability,
        }))
        .sort((a, b) => b.probability - a.probability)
    : [];

  return (
    <section className="panel animate-fade-up p-4">
      <h2 className="mb-1 text-lg font-semibold text-medical-900">Analysis Dashboard</h2>
      <p className="mb-4 text-xs text-medical-700">Class probabilities from model inference.</p>

      {probabilities ? (
        <>
          <div className="mb-3 rounded-lg border border-medical-200 bg-medical-50 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.2em] text-medical-600">Predicted class</p>
            <p className="text-xl font-semibold text-accent-700">{predictedClass}</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 8,
                  right: 12,
                  left: 0,
                  bottom: 8,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d7e3ef" />
                <XAxis
                  dataKey="label"
                  axisLine={{ stroke: "#b2c9de" }}
                  tickLine={{ stroke: "#b2c9de" }}
                  tick={{ fill: "#32557a", fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 1]}
                  axisLine={{ stroke: "#b2c9de" }}
                  tickLine={{ stroke: "#b2c9de" }}
                  tick={{ fill: "#32557a", fontSize: 12 }}
                  tickFormatter={(value: number) => `${(value * 100).toFixed(0)}%`}
                />
                <Tooltip
                  formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "#b2c9de",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="probability" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.label}
                      fill={entry.label === predictedClass ? "#0057b8" : "#86a7c8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-medical-300 bg-medical-50 px-3 py-8 text-center text-sm text-medical-700">
          Upload an ECG and run analysis to see class probabilities.
        </div>
      )}
    </section>
  );
}

export default AnalysisDashboard;
