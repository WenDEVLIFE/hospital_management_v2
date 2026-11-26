"use client";

import * as React from "react";
import {
  AltArrowRightIcon,
  BedIcon,
  BillListIcon,
  BoxIcon,
  CalendarMarkIcon,
  Chart2Icon,
  DocumentTextIcon,
  DownloadIcon,
  LoginIcon,
  Pills2Icon,
  StethoscopeIcon,
  TestTubeIcon,
  UserRoundedIcon,
} from "@solar-icons/react/linear";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import type { ReportCard } from "@/types/hospital";
export interface ReportsCategoryGridProps {
  cards: ReportCard[];
}

function iconForReport(title: string) {
  const normalized = title.toLowerCase();

  if (normalized.includes("bed")) return BedIcon;
  if (normalized.includes("admission")) return LoginIcon;
  if (normalized.includes("patient")) return UserRoundedIcon;
  if (normalized.includes("appointment")) return CalendarMarkIcon;
  if (normalized.includes("laboratory")) return TestTubeIcon;
  if (normalized.includes("pharmacy")) return Pills2Icon;
  if (normalized.includes("billing")) return BillListIcon;
  if (normalized.includes("inventory")) return BoxIcon;
  if (normalized.includes("staff")) return StethoscopeIcon;

  return DocumentTextIcon;
}

function reportKey(card: ReportCard): string {
  const query = card.href.split("?")[1] ?? "";
  const params = new URLSearchParams(query);

  return params.get("category") ?? "";
}

function downloadReport(card: ReportCard, format: string) {
  const category = reportKey(card);
  const url = `/reports/export?category=${encodeURIComponent(
    category
  )}&format=${format.toLowerCase()}`;
  const link = document.createElement("a");

  link.href = url;
  link.download = "";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function ReportsCategoryGrid({ cards }: ReportsCategoryGridProps) {
  const [selected, setSelected] = React.useState<ReportCard | null>(null);

  const openReport = React.useCallback((card: ReportCard) => {
    setSelected(card);
  }, []);

  const close = React.useCallback(() => {
    setSelected(null);
  }, []);

  if (cards.length === 0) {
    return (
      <EmptyState
        icon={<Chart2Icon className="size-5" aria-hidden="true" />}
        title="No reports available"
        description="Report categories will appear here once configured."
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = iconForReport(card.title);

          return (
            <article
              key={card.id}
              className="flex flex-col justify-between gap-4 rounded-md border border-hospital-border bg-white p-5 shadow-xs"
            >
              <div>
                <span className="flex size-9 items-center justify-center rounded-md bg-hospital-green-light text-hospital-green">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-hospital-text">
                  {card.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-hospital-text-muted">
                  {card.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-hospital-text-subtle">
                  {card.formats.join(" · ")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReport(card)}
                  className="cursor-pointer"
                >
                  Open report
                  <AltArrowRightIcon className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={close}
        title={selected?.title ?? "Report"}
        description={selected?.description}
        size="md"
        footer={
          <Button variant="secondary" onClick={close}>
            Close
          </Button>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-medium text-hospital-text-muted">
                  Category
                </dt>
                <dd className="mt-0.5 text-sm text-hospital-text">
                  {selected.category}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium text-hospital-text-muted">
                  Formats
                </dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {selected.formats.map((format) => (
                    <Badge key={format} variant="info">
                      {format}
                    </Badge>
                  ))}
                </dd>
              </div>
            </dl>

            <div>
              <p className="text-[11px] font-medium text-hospital-text-muted">
                Columns this report would contain
              </p>
              <ul className="mt-2 space-y-1.5">
                {selected.columns.map((column) => (
                  <li
                    key={column}
                    className="flex gap-2 text-sm text-hospital-text"
                  >
                    <span
                      className="mt-2 size-1 shrink-0 rounded-full bg-hospital-green"
                      aria-hidden="true"
                    />
                    {column}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-hospital-border-subtle pt-3">
              <p className="text-[11px] font-medium text-hospital-text-muted">
                Download
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selected.formats.map((format) => (
                  <Button
                    key={format}
                    variant="secondary"
                    onClick={() => downloadReport(selected, format)}
                    className="cursor-pointer"
                  >
                    <DownloadIcon className="size-4" aria-hidden="true" />
                    {format}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
