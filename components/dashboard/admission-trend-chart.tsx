import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import type { DashboardOverview } from "@/types/hospital";

export interface AdmissionTrendChartProps {
  data: DashboardOverview["admissionTrend"];
}

function monthLabel(month: string) {
  return formatDate(`${month}-01T00:00:00+08:00`, {
    month: "short",
    day: undefined,
    year: undefined,
  });
}

function barHeight(value: number, max: number) {
  if (value <= 0 || max <= 0) return "0%";

  return `${Math.max((value / max) * 100, 2)}%`;
}

export function AdmissionTrendChart({ data }: AdmissionTrendChartProps) {
  if (data.length === 0) {
    return (
      <EmptyState
        title="No admission data"
        description="Admission and discharge trends will appear once records are available."
        className="px-0 py-8"
      />
    );
  }

  const max = Math.max(
    0,
    ...data.flatMap((point) => [point.admissions, point.discharges])
  );

  if (max === 0) {
    return (
      <EmptyState
        title="No admission activity"
        description="No admissions or discharges were recorded for this period."
        className="px-0 py-8"
      />
    );
  }

  const seriesDescription = data
    .map(
      (point) =>
        `${monthLabel(point.month)} ${point.admissions} admissions and ${point.discharges} discharges`
    )
    .join("; ");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ul className="flex items-center gap-4">
          <li className="flex items-center gap-1.5 text-[11px] font-medium text-hospital-text-muted">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-[2px] bg-hospital-green"
            />
            Admissions
          </li>
          <li className="flex items-center gap-1.5 text-[11px] font-medium text-hospital-text-muted">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-[2px] bg-slate-400"
            />
            Discharges
          </li>
        </ul>

        <p className="text-[11px] text-hospital-text-subtle">
          Peak <span className="font-semibold text-hospital-text">{max}</span>
        </p>
      </div>

      <div
        role="img"
        aria-label={`Patient admission trends by month. ${seriesDescription}.`}
        className="mt-3"
      >
        <div className="flex h-40 items-end gap-2 border-b border-hospital-border sm:gap-3">
          {data.map((point) => (
            <div
              key={point.month}
              aria-hidden="true"
              className="flex h-full min-w-0 flex-1 items-end justify-center gap-1"
            >
              <div
                className="w-full max-w-3 rounded-t-[2px] bg-hospital-green"
                style={{ height: barHeight(point.admissions, max) }}
              />
              <div
                className="w-full max-w-3 rounded-t-[2px] bg-slate-400"
                style={{ height: barHeight(point.discharges, max) }}
              />
            </div>
          ))}
        </div>

        <div className="mt-1.5 flex gap-2 sm:gap-3">
          {data.map((point) => (
            <span
              key={point.month}
              aria-hidden="true"
              className="min-w-0 flex-1 truncate text-center text-[11px] text-hospital-text-muted"
            >
              {monthLabel(point.month)}
            </span>
          ))}
        </div>
      </div>

      <details className="mt-4 border-t border-hospital-border-subtle pt-3">
        <summary className="cursor-pointer rounded-sm py-0.5 text-xs font-medium text-hospital-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1">
          View data table
        </summary>

        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[240px] border-collapse text-xs">
            <caption className="sr-only">
              Admissions and discharges by month
            </caption>
            <thead>
              <tr className="border-b border-hospital-border text-left text-[11px] text-hospital-text-muted">
                <th scope="col" className="py-1.5 pr-3 font-medium">
                  Month
                </th>
                <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                  Admissions
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  Discharges
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((point) => (
                <tr
                  key={point.month}
                  className="border-b border-hospital-border-subtle last:border-b-0"
                >
                  <th
                    scope="row"
                    className="py-1.5 pr-3 text-left font-normal text-hospital-text"
                  >
                    {monthLabel(point.month)}
                  </th>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-hospital-text">
                    {point.admissions}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-hospital-text">
                    {point.discharges}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
