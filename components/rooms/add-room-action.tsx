"use client";

import { AddCircleIcon } from "@solar-icons/react/linear";

import { UnavailableAction } from "@/components/module/unavailable-action";

export function AddRoomAction() {
  return (
    <UnavailableAction
      label="Add Room"
      variant="secondary"
      icon={<AddCircleIcon className="size-4" aria-hidden="true" />}
      description="Register a room and its beds under a department."
      note="Room and bed registration will be available once the hospital database is connected. Nothing is saved in this preview."
    />
  );
}
