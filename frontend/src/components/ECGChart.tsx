import {
  Chart as ChartJS,
  Decimation,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type TooltipItem,
  type ChartData,
  type ChartOptions,
  type Plugin,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Line } from "react-chartjs-2";
import { ECG_LEADS, type ECGMatrix } from "../types/ecg";

type ECGPaperOptions = {
  smallXSec: number;
  bigXSec: number;
  smallY: number;
  bigY: number;
  smallColor: string;
  bigColor: string;
};

type LeadLabelOptions = {
  labels: readonly string[];
  offsets: number[];
  color: string;
};

const ecgPaperGridPlugin: Plugin<"line"> = {
  id: "ecgPaper",
  beforeDatasetsDraw(chart, _args, pluginOptions) {
    const options = pluginOptions as ECGPaperOptions;
    const xScale = chart.scales.x;
    const yScale = chart.scales.y;
    const chartArea = chart.chartArea;

    if (!chartArea || !xScale || !yScale) {
      return;
    }

    const xMin = Number(xScale.min);
    const xMax = Number(xScale.max);
    const yMin = Number(yScale.min);
    const yMax = Number(yScale.max);

    const drawVerticalGrid = (step: number, color: string, width: number) => {
      if (step <= 0) {
        return;
      }
      const first = Math.floor(xMin / step) * step;
      chart.ctx.beginPath();
      chart.ctx.strokeStyle = color;
      chart.ctx.lineWidth = width;
      for (let value = first; value <= xMax + step * 0.5; value += step) {
        const x = xScale.getPixelForValue(Number(value.toFixed(6)));
        if (x < chartArea.left || x > chartArea.right) {
          continue;
        }
        chart.ctx.moveTo(x, chartArea.top);
        chart.ctx.lineTo(x, chartArea.bottom);
      }
      chart.ctx.stroke();
    };

    const drawHorizontalGrid = (step: number, color: string, width: number) => {
      if (step <= 0) {
        return;
      }
      const first = Math.floor(yMin / step) * step;
      chart.ctx.beginPath();
      chart.ctx.strokeStyle = color;
      chart.ctx.lineWidth = width;
      for (let value = first; value <= yMax + step * 0.5; value += step) {
        const y = yScale.getPixelForValue(Number(value.toFixed(6)));
        if (y < chartArea.top || y > chartArea.bottom) {
          continue;
        }
        chart.ctx.moveTo(chartArea.left, y);
        chart.ctx.lineTo(chartArea.right, y);
      }
      chart.ctx.stroke();
    };

    chart.ctx.save();
    chart.ctx.beginPath();
    chart.ctx.rect(
      chartArea.left,
      chartArea.top,
      chartArea.right - chartArea.left,
      chartArea.bottom - chartArea.top,
    );
    chart.ctx.clip();

    drawVerticalGrid(options.smallXSec, options.smallColor, 0.6);
    drawHorizontalGrid(options.smallY, options.smallColor, 0.6);
    drawVerticalGrid(options.bigXSec, options.bigColor, 1.1);
    drawHorizontalGrid(options.bigY, options.bigColor, 1.1);

    chart.ctx.restore();
  },
};

const leadLabelPlugin: Plugin<"line"> = {
  id: "leadLabels",
  afterDatasetsDraw(chart, _args, pluginOptions) {
    const options = pluginOptions as LeadLabelOptions;
    const yScale = chart.scales.y;
    const chartArea = chart.chartArea;
    if (!chartArea || !yScale || !options.labels || !options.offsets) {
      return;
    }

    chart.ctx.save();
    chart.ctx.fillStyle = options.color;
    chart.ctx.textAlign = "left";
    chart.ctx.textBaseline = "middle";
    chart.ctx.font = "600 11px 'IBM Plex Sans', sans-serif";

    options.labels.forEach((label, index) => {
      const yValue = options.offsets[index];
      if (typeof yValue !== "number") {
        return;
      }
      const y = yScale.getPixelForValue(yValue);
      if (y >= chartArea.top && y <= chartArea.bottom) {
        chart.ctx.fillText(label, chartArea.left + 8, y);
      }
    });

    chart.ctx.restore();
  },
};

ChartJS.register(
  Decimation,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  zoomPlugin,
  ecgPaperGridPlugin,
  leadLabelPlugin,
);

const LEAD_COLORS = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
  "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
  "#aec7e8", "#ffbb78"
];

// Lead group definitions (indices into ECG_LEADS)
const LEAD_GROUPS = [
  { key: "all", labelKey: "ecg.leads.groupAll", indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  { key: "limb", labelKey: "ecg.leads.groupLimb", indices: [0, 1, 2] },
  { key: "augmented", labelKey: "ecg.leads.groupAugmented", indices: [3, 4, 5] },
  { key: "precordial", labelKey: "ecg.leads.groupPrecordial", indices: [6, 7, 8, 9, 10, 11] },
] as const;

interface ECGLeadChartProps {
  leadData: number[];
  leadName: string;
  leadIndex: number;
  sampleRate?: number;
  onZoomChange?: (min: number, max: number) => void;
}

function ECGLeadChart({ leadData, leadName, leadIndex, sampleRate = 500, onZoomChange }: ECGLeadChartProps) {
  const { t } = useTranslation();
  const chartRef = useRef<ChartJS<"line"> | null>(null);
  const [xRange, setXRange] = useState<{ min?: number; max?: number }>({});

  const updateVisibleRange = (chart: ChartJS<"line">) => {
    const newRange = {
      min: chart.scales.x.min,
      max: chart.scales.x.max,
    };
    setXRange(newRange);
    if (onZoomChange) {
      onZoomChange(newRange.min ?? 0, newRange.max ?? 0);
    }
  };

  const sampleCount = leadData.length;
  const durationSec = sampleCount > 0 ? sampleCount / sampleRate : 0;

  const chartData = useMemo<ChartData<"line">>(() => {
    const points = new Array(leadData.length);
    for (let i = 0; i < leadData.length; i += 1) {
      points[i] = {
        x: i / sampleRate,
        y: leadData[i],
      };
    }

    return {
      datasets: [
        {
          label: leadName,
          data: points,
          borderColor: LEAD_COLORS[leadIndex] ?? "#0057b8",
          borderWidth: 1.1,
          pointRadius: 0,
          pointHoverRadius: 2,
          fill: false,
          tension: 0,
        },
      ],
    };
  }, [leadData, leadIndex, sampleRate]);

  const chartOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      normalized: true,
      parsing: false,
      interaction: {
        mode: "nearest",
        intersect: false,
      },
      scales: {
        x: {
          type: "linear",
          min: xRange.min ?? 0,
          ticks: {
            display: true,
            color: "#2c4865",
            font: {
              weight: "bold",
            },
          },
          title: {
            display: true,
            text: t('ecg.chart.time'),
            color: "#2c4865",
            font: {
              weight: "bold",
            },
          },
          grid: {
            display: false,
          },
        },
        y: {
          type: "linear",
          min: undefined,
          max: undefined,
          suggestedMin: -2,
          suggestedMax: 2,
          ticks: {
            display: true,
            color: "#32557a",
            maxTicksLimit: 5,
            callback: (value) => `${Number(value).toFixed(1)}`,
          },
          grid: {
            display: true,
            color: "#e9eff5",
            lineWidth: 0.5,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<"line">) => {
              const value = Number(context.parsed.y);
              return `${leadName}: ${value.toFixed(3)}`;
            },
          },
        },
        decimation: {
          enabled: false,
        },
        zoom: {
          limits: {
            x: { min: 0, max: durationSec, minRange: 0.2 },
          },
          pan: {
            enabled: true,
            mode: "x",
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            drag: {
              enabled: true,
              backgroundColor: "rgba(0, 87, 184, 0.12)",
              borderColor: "rgba(0, 87, 184, 0.35)",
              borderWidth: 1,
            },
            mode: "x",
          },
          onZoomComplete: ({ chart }: { chart: ChartJS<"line"> }) => {
            updateVisibleRange(chart);
          },
          onPanComplete: ({ chart }: { chart: ChartJS<"line"> }) => {
            updateVisibleRange(chart);
          },
        },
        ecgPaper: {
          smallXSec: 0.04,
          bigXSec: 0.2,
          smallY: 0.5,
          bigY: 2.5,
          smallColor: "#e9eff5",
          bigColor: "#d2e0eb",
        },
        leadLabels: {
          labels: [leadName],
          offsets: [0],
          color: "#2c4865",
        },
      } as unknown as ChartOptions<"line">["plugins"],
    }),
    [durationSec, leadName, xRange.max, xRange.min],
  );

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
    setXRange({});
    if (onZoomChange) {
      onZoomChange(0, durationSec);
    }
  };

  return (
    <div className="panel animate-fade-up p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: LEAD_COLORS[leadIndex] ?? "#0057b8" }}
          />
          <h3 className="text-sm font-semibold text-medical-900">{leadName}</h3>
        </div>
        <button type="button" className="btn-secondary text-xs" onClick={handleResetZoom}>
          {t('ecg.chart.resetZoom')}
        </button>
      </div>
      <div className="h-[200px] w-full rounded-lg border border-medical-200 bg-white">
        <Line ref={chartRef} data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

interface ECGChartProps {
  data: ECGMatrix | null;
  sampleRate?: number;
}

function ECGChart({ data, sampleRate = 500 }: ECGChartProps) {
  const { t } = useTranslation();
  const [visibleLeads, setVisibleLeads] = useState<Set<number>>(
    new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
  );
  const [activeGroup, setActiveGroup] = useState<string>("all");

  // Early return validation
  if (!data) {
    return (
      <section className="panel animate-fade-up p-4">
        <h2 className="mb-1 text-lg font-semibold text-medical-900">{t('dashboard.ecgCharts')}</h2>
        <p className="mb-4 text-xs text-medical-700">{t('dashboard.individualCharts')}</p>
        <div className="rounded-lg border border-dashed border-medical-300 bg-medical-50 px-3 py-16 text-center text-sm text-medical-700">
          {t('dashboard.noECGSignal')}
        </div>
      </section>
    );
  }

  if (!Array.isArray(data) || data.length !== 12) {
    return (
      <section className="panel animate-fade-up p-4">
        <h2 className="mb-1 text-lg font-semibold text-medical-900">{t('dashboard.ecgCharts')}</h2>
        <p className="mb-4 text-xs text-medical-700">{t('dashboard.invalidECGFormat')}</p>
        <div className="rounded-lg border border-dashed border-medical-300 bg-medical-50 px-3 py-16 text-center text-sm text-medical-700">
          {t('dashboard.pleaseUploadValid')}
        </div>
      </section>
    );
  }

  const leadLength = data[0]?.length ?? 0;
  const allLeadsValid = data.every(lead => Array.isArray(lead) && lead.length === leadLength);

  if (!allLeadsValid) {
    return (
      <section className="panel animate-fade-up p-4">
        <h2 className="mb-1 text-lg font-semibold text-medical-900">{t('dashboard.ecgCharts')}</h2>
        <p className="mb-4 text-xs text-medical-700">{t('dashboard.invalidECGData')}</p>
        <div className="rounded-lg border border-dashed border-medical-300 bg-medical-50 px-3 py-16 text-center text-sm text-medical-700">
          {t('dashboard.pleaseUploadValid')}
        </div>
      </section>
    );
  }

  const handleGroupClick = (groupKey: string, indices: readonly number[]) => {
    setActiveGroup(groupKey);
    setVisibleLeads(new Set(indices));
  };

  const toggleLead = (index: number) => {
    setActiveGroup("custom");
    setVisibleLeads(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        if (next.size > 1) next.delete(index); // keep at least one
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const visibleCount = visibleLeads.size;

  return (
    <section className="panel animate-fade-up p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-medical-900">{t('dashboard.ecgCharts')}</h2>
        <p className="text-xs text-medical-700">{t('dashboard.detailedAnalysis')}</p>
      </div>

      {/* Lead group selector */}
      <div className="mb-4 space-y-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-medical-600">
            {t('ecg.leads.groups')}
          </p>
          <div className="flex flex-wrap gap-2">
            {LEAD_GROUPS.map(group => (
              <button
                key={group.key}
                type="button"
                onClick={() => handleGroupClick(group.key, group.indices)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  activeGroup === group.key
                    ? "bg-accent-600 text-white shadow-sm"
                    : "bg-medical-100 text-medical-700 hover:bg-medical-200"
                }`}
              >
                {t(group.labelKey)}
                <span className="ml-1.5 opacity-70">({group.indices.length})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Individual lead toggles */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-medical-600">
            {t('ecg.leads.individualToggles')}
            <span className="ml-2 font-normal normal-case text-medical-500">
              {visibleCount}/{ECG_LEADS.length} {t('ecg.leads.shown')}
            </span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ECG_LEADS.map((lead, index) => {
              const isVisible = visibleLeads.has(index);
              return (
                <button
                  key={lead}
                  type="button"
                  onClick={() => toggleLead(index)}
                  className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold transition ${
                    isVisible
                      ? "border-transparent text-white shadow-sm"
                      : "border-medical-200 bg-white text-medical-400 line-through"
                  }`}
                  style={isVisible ? { backgroundColor: LEAD_COLORS[index] } : undefined}
                  title={isVisible ? t('ecg.leads.clickToHide') : t('ecg.leads.clickToShow')}
                >
                  {lead}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts grid */}
      {visibleCount === 0 ? (
        <div className="rounded-lg border border-dashed border-medical-300 bg-medical-50 px-3 py-12 text-center text-sm text-medical-600">
          {t('ecg.leads.noLeadsSelected')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {data.map((lead, leadIndex) =>
            visibleLeads.has(leadIndex) ? (
              <ECGLeadChart
                key={ECG_LEADS[leadIndex]}
                leadData={lead}
                leadName={ECG_LEADS[leadIndex]}
                leadIndex={leadIndex}
                sampleRate={sampleRate}
              />
            ) : null
          )}
        </div>
      )}
    </section>
  );
}

export default ECGChart;
