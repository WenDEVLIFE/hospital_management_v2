"use client";

import { UnavailableAction } from "@/components/module/unavailable-action";

export function PatientRecordActions() {
  const description = "Patient record changes are not available yet.";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <UnavailableAction
        label="Edit"
        variant="outline"
        size="sm"
        description={description}
      />
      <UnavailableAction
        label="Archive"
        variant="outline"
        size="sm"
        description={description}
      />
    </div>
  );
}
