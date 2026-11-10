"use client";

import { UnavailableActionDialog } from "@/components/module/unavailable-action";
import { formatName } from "@/lib/format";
import type { StaffListRow } from "@/types/hospital";

export type StaffWriteAction = "edit" | "deactivate";

export interface StaffWriteRequest {
  action: StaffWriteAction;
  staff: StaffListRow;
}

export interface StaffWriteDialogProps {
  request: StaffWriteRequest | null;
  onClose: () => void;
}

export function StaffWriteDialog({
  request,
  onClose,
}: StaffWriteDialogProps) {
  if (!request) {
    return <></>;
  }

  const isDeactivate = request.action === "deactivate";
  const staffName = formatName(request.staff);

  return (
    <UnavailableActionDialog
      open
      onClose={onClose}
      title={isDeactivate ? "Deactivate staff account" : "Edit staff record"}
      description={
        isDeactivate
          ? `Deactivate the account for ${staffName}.`
          : `Update the staff record for ${staffName}.`
      }
      note={
        isDeactivate
          ? `This action would remove ${staffName}'s access without deleting their employment record. Nothing is saved in this preview.`
          : `This action would update employment and professional details for ${staffName}. Nothing is saved in this preview.`
      }
    />
  );
}
