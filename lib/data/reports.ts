import type { ReportCard, ReportRange } from "@/types/hospital";
import { reportCards, reportRange } from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import type { DataResult } from "./result";

export async function listReportCategories(): Promise<
  DataResult<ReportCard[]>
> {
  // TODO(supabase): replace with supabase.from("report_categories").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  return { data: reportCards, error: null };
}

export async function getReportRange(): Promise<DataResult<ReportRange>> {
  // TODO(supabase): replace with supabase.from("report_ranges").select("*")
  if (!isPreviewMode) {
    return {
      data: { start: "", end: "", label: "No range available" },
      error: null,
    };
  }

  await Promise.resolve();

  return { data: reportRange, error: null };
}
