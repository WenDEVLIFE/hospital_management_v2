import { accessCan, getCurrentUserAccess } from "@/lib/auth/access";
import { buildReportTable, isReportKey } from "@/lib/data/report-exports";
import { formatDateTime } from "@/lib/format";
import { toCsv, toPdf, toXlsx } from "@/lib/reports/export-formats";

export const runtime = "nodejs";

const FORMATS = ["csv", "xlsx", "pdf"] as const;
type ExportFormat = (typeof FORMATS)[number];

function isFormat(value: string): value is ExportFormat {
  return (FORMATS as readonly string[]).includes(value);
}

function dateStamp(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/-/g, "");
}

export async function GET(request: Request) {
  const access = await getCurrentUserAccess();

  if (!access.userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!accessCan(access, "reports.view")) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? "";
  const format = (url.searchParams.get("format") ?? "csv").toLowerCase();

  if (!isReportKey(category)) {
    return new Response("Unknown report category", { status: 400 });
  }

  if (!isFormat(format)) {
    return new Response("Unknown export format", { status: 400 });
  }

  const report = await buildReportTable(category);

  if (report.error) {
    return new Response(`Could not build report: ${report.error.message}`, {
      status: 500,
    });
  }

  const { title, columns, rows } = report.data;
  const filename = `${category}-report-${dateStamp()}.${format}`;
  const baseHeaders = {
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "private, no-store",
  };

  if (format === "csv") {
    const body = Buffer.from(`\uFEFF${toCsv(columns, rows)}`, "utf8");

    return new Response(new Uint8Array(body), {
      headers: {
        ...baseHeaders,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  }

  if (format === "xlsx") {
    const body = toXlsx(columns, rows);

    return new Response(new Uint8Array(body), {
      headers: {
        ...baseHeaders,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  }

  const subtitle = `Generated ${formatDateTime(
    new Date().toISOString()
  )} · SPMC Hospital Management System`;
  const body = toPdf(title, subtitle, columns, rows);

  return new Response(new Uint8Array(body), {
    headers: {
      ...baseHeaders,
      "Content-Type": "application/pdf",
    },
  });
}
