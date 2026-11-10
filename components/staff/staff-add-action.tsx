"use client";

import { AddCircleIcon } from "@solar-icons/react/linear";

import { UnavailableAction } from "@/components/module/unavailable-action";

export function StaffAddAction() {
  return (
    <UnavailableAction
      label="Add Staff"
      variant="secondary"
      icon={<AddCircleIcon className="size-4" aria-hidden="true" />}
      description="Provision a staff account and department assignment."
      note="This form would create an employment record, assign a department, and issue an account for the new staff member. Nothing is saved in this preview."
    />
  );
}
