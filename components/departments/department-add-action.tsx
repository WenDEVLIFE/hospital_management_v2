"use client";

import { AddCircleIcon } from "@solar-icons/react/linear";

import { UnavailableAction } from "@/components/module/unavailable-action";

export function DepartmentAddAction() {
  return (
    <UnavailableAction
      label="Add Department"
      variant="secondary"
      icon={<AddCircleIcon className="size-4" aria-hidden="true" />}
      description="Create a new hospital department or service unit."
      note="Department records will be created here once the hospital database is connected. Nothing is saved in this preview."
    />
  );
}
