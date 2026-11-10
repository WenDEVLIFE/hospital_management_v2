"use client";

import * as React from "react";

import { ErrorState } from "@/components/module/error-state";
import { Tabs } from "@/components/ui/tabs";
import type { DataError } from "@/lib/data/result";
import type { MedicationStockRow, PrescriptionListRow } from "@/types/hospital";

import { MedicationInventory } from "./medication-inventory";
import { PrescriptionQueue } from "./prescription-queue";

type PharmacyTab = "queue" | "inventory";

export interface PharmacyViewProps {
  prescriptions: PrescriptionListRow[];
  medications: MedicationStockRow[];
  prescriptionsError: DataError | null;
  medicationsError: DataError | null;
}

export function PharmacyView({
  prescriptions,
  medications,
  prescriptionsError,
  medicationsError,
}: PharmacyViewProps) {
  const [tab, setTab] = React.useState<PharmacyTab>("queue");

  const tabItems = [
    {
      value: "queue",
      label: "Prescription Queue",
      count: prescriptions.length,
    },
    {
      value: "inventory",
      label: "Medication Inventory",
      count: medications.length,
    },
  ];

  return (
    <div className="space-y-4">
      <Tabs
        items={tabItems}
        value={tab}
        onValueChange={(value) => setTab(value as PharmacyTab)}
      />

      {tab === "queue" ? (
        <div role="tabpanel" aria-label="Prescription queue">
          {prescriptionsError ? (
            <ErrorState error={prescriptionsError} />
          ) : (
            <PrescriptionQueue rows={prescriptions} />
          )}
        </div>
      ) : (
        <div role="tabpanel" aria-label="Medication inventory">
          {medicationsError ? (
            <ErrorState error={medicationsError} />
          ) : (
            <MedicationInventory rows={medications} />
          )}
        </div>
      )}
    </div>
  );
}
