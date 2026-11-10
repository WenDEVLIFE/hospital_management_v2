import { AltArrowRightIcon } from "@solar-icons/react/linear";

export interface LabWorkflowCounts {
  pending: number;
  collection: number;
  processing: number;
  completed: number;
}

export interface LabWorkflowStripProps {
  counts: LabWorkflowCounts;
}

interface WorkflowStage {
  key: string;
  label: string;
  countLabel?: string;
}

/**
 * Non-interactive laboratory workflow reference (THEME.MD §8.8).
 * Counts are rendered as text so the stage is never communicated by color.
 * The strip scrolls inside its own container instead of widening the page.
 */
export function LabWorkflowStrip({ counts }: LabWorkflowStripProps) {
  const stages: WorkflowStage[] = [
    { key: "requested", label: "Requested", countLabel: `${counts.pending} pending` },
    {
      key: "collected",
      label: "Collected",
      countLabel: `${counts.collection} in collection`,
    },
    {
      key: "processing",
      label: "Processing",
      countLabel: `${counts.processing} processing`,
    },
    { key: "result", label: "Result entered" },
    { key: "verified", label: "Verified" },
    {
      key: "completed",
      label: "Completed",
      countLabel: `${counts.completed} completed`,
    },
  ];

  return (
    <section aria-label="Laboratory workflow stages">
      <div className="overflow-x-auto pb-1">
        <ol className="flex min-w-max items-stretch gap-2">
          {stages.map((stage, index) => (
            <li key={stage.key} className="flex items-center gap-2">
              <div className="flex min-w-[7.5rem] flex-col rounded-md border border-hospital-border bg-hospital-surface px-3 py-2">
                <span className="text-[11px] font-medium text-hospital-text-subtle">
                  Step {index + 1}
                </span>
                <span className="mt-0.5 text-sm font-medium text-hospital-text">
                  {stage.label}
                </span>
                {stage.countLabel ? (
                  <span className="mt-0.5 text-[11px] text-hospital-text-muted">
                    {stage.countLabel}
                  </span>
                ) : null}
              </div>

              {index < stages.length - 1 ? (
                <AltArrowRightIcon
                  className="size-4 shrink-0 text-hospital-text-subtle"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
