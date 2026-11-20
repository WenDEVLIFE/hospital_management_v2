"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AddCircleIcon,
  CloseIcon,
  DocumentMedicineIcon,
} from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { createPrescriptionAction } from "@/app/(workspace)/prescriptions/actions";
import type {
  PrescriptionEncounterOption,
  PrescriptionMedicationOption,
} from "@/types/hospital";

export interface NewPrescriptionButtonProps {
  encounters: PrescriptionEncounterOption[];
  medications: PrescriptionMedicationOption[];
  /** Present when the option lists could not be loaded. */
  optionsError?: string | null;
}

type DraftItem = {
  key: string;
  medicationId: string;
  dosage: string;
  frequency: string;
  durationDays: string;
  quantity: string;
  instructions: string;
};

function emptyItem(key: string): DraftItem {
  return {
    key,
    medicationId: "",
    dosage: "",
    frequency: "",
    durationDays: "",
    quantity: "1",
    instructions: "",
  };
}

export function NewPrescriptionButton({
  encounters,
  medications,
  optionsError = null,
}: NewPrescriptionButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formId = React.useId();
  const nextItemKey = React.useRef(2);

  const [open, setOpen] = React.useState(false);
  const [encounterId, setEncounterId] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [items, setItems] = React.useState<DraftItem[]>([
    emptyItem("draft-1"),
  ]);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const selectedEncounter =
    encounters.find((encounter) => encounter.id === encounterId) ?? null;
  const prerequisitesMissing =
    encounters.length === 0 || medications.length === 0;

  const openDialog = React.useCallback(() => {
    setEncounterId("");
    setNotes("");
    setItems([emptyItem("draft-1")]);
    nextItemKey.current = 2;
    setFormError(null);
    setOpen(true);
  }, []);

  const closeDialog = React.useCallback(() => {
    setOpen(false);
    setFormError(null);
  }, []);

  const updateItem = React.useCallback(
    (key: string, patch: Partial<DraftItem>) => {
      setItems((current) =>
        current.map((item) =>
          item.key === key ? { ...item, ...patch } : item
        )
      );
    },
    []
  );

  const addItem = React.useCallback(() => {
    const key = `draft-${nextItemKey.current}`;
    nextItemKey.current += 1;
    setItems((current) => [...current, emptyItem(key)]);
  }, []);

  const removeItem = React.useCallback((key: string) => {
    setItems((current) =>
      current.length > 1 ? current.filter((item) => item.key !== key) : current
    );
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (!selectedEncounter) {
      setFormError("Select the patient encounter this prescription belongs to.");
      return;
    }

    const payloadItems: Array<{
      medicationId: string;
      dosage: string;
      frequency: string;
      durationDays: number | null;
      quantity: number;
      instructions?: string;
    }> = [];

    for (const item of items) {
      if (!item.medicationId) {
        setFormError("Select a medication for every line.");
        return;
      }

      const dosage = item.dosage.trim();
      const frequency = item.frequency.trim();

      if (!dosage || !frequency) {
        setFormError("Enter a dosage and frequency for every medication.");
        return;
      }

      const quantity = Number(item.quantity);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        setFormError("Enter a quantity greater than zero for every medication.");
        return;
      }

      let durationDays: number | null = null;

      if (item.durationDays.trim()) {
        const duration = Number(item.durationDays);

        if (!Number.isInteger(duration) || duration < 1 || duration > 3650) {
          setFormError("Duration must be a whole number between 1 and 3650 days.");
          return;
        }

        durationDays = duration;
      }

      payloadItems.push({
        medicationId: item.medicationId,
        dosage,
        frequency,
        durationDays,
        quantity,
        instructions: item.instructions.trim() || undefined,
      });
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const result = await createPrescriptionAction({
        patientId: selectedEncounter.patient_id,
        encounterId: selectedEncounter.id,
        notes: notes.trim() || undefined,
        items: payloadItems,
      });

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Prescription created",
        description: "The medication order is now pending in the pharmacy queue.",
        variant: "success",
      });

      closeDialog();
      router.refresh();
    } catch {
      setFormError(
        "We could not create the prescription. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={openDialog}>
        <DocumentMedicineIcon className="size-4" aria-hidden="true" />
        New Prescription
      </Button>

      <Modal
        open={open}
        onClose={submitting ? () => undefined : closeDialog}
        title="New prescription"
        description="Medication orders are issued during a patient encounter."
        size="xl"
        preventDismiss={submitting}
        footer={
          prerequisitesMissing ? (
            <Button variant="secondary" onClick={closeDialog}>
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={closeDialog}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form={formId}
                loading={submitting}
              >
                Create prescription
              </Button>
            </>
          )
        }
      >
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          {optionsError ? (
            <Alert variant="danger" title="Form data unavailable">
              {optionsError}
            </Alert>
          ) : null}

          {encounters.length === 0 ? (
            <Alert variant="warning" title="No active encounters">
              Open a patient encounter in Medical Records before issuing a
              prescription.
            </Alert>
          ) : null}

          {medications.length === 0 ? (
            <Alert variant="warning" title="No active medications">
              Add medications to the pharmacy catalogue before prescribing.
            </Alert>
          ) : null}

          {formError ? (
            <Alert variant="danger" title="Unable to create prescription">
              {formError}
            </Alert>
          ) : null}

          <FormField label="Patient encounter" htmlFor={`${formId}-encounter`} required>
            <Select
              id={`${formId}-encounter`}
              value={encounterId}
              onChange={(event) => setEncounterId(event.target.value)}
              disabled={prerequisitesMissing || submitting}
            >
              <option value="">Select an active encounter</option>
              {encounters.map((encounter) => (
                <option key={encounter.id} value={encounter.id}>
                  {encounter.label}
                </option>
              ))}
            </Select>
          </FormField>

          {selectedEncounter ? (
            <p className="rounded-md border border-hospital-border bg-hospital-surface px-3 py-2 text-xs text-hospital-text-muted">
              Prescribing for{" "}
              <strong className="text-hospital-text">
                {selectedEncounter.patient_name}
              </strong>{" "}
              · MRN {selectedEncounter.patient_mrn} · Encounter{" "}
              {selectedEncounter.encounter_number}
            </p>
          ) : null}

          <div className="space-y-3">
            {items.map((item, index) => {
              const itemId = `${formId}-${item.key}`;

              return (
                <div
                  key={item.key}
                  className="rounded-md border border-hospital-border p-3 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-hospital-text">
                      Medication {index + 1}
                    </p>
                    {items.length > 1 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.key)}
                        disabled={submitting}
                        aria-label={`Remove medication ${index + 1}`}
                      >
                        <CloseIcon className="size-3.5" aria-hidden="true" />
                        Remove
                      </Button>
                    ) : null}
                  </div>

                  <FormField
                    label="Medication"
                    htmlFor={`${itemId}-medication`}
                    required
                  >
                    <Select
                      id={`${itemId}-medication`}
                      value={item.medicationId}
                      onChange={(event) =>
                        updateItem(item.key, {
                          medicationId: event.target.value,
                        })
                      }
                      disabled={submitting}
                    >
                      <option value="">Select a medication</option>
                      {medications.map((medication) => (
                        <option key={medication.id} value={medication.id}>
                          {medication.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      label="Dosage"
                      htmlFor={`${itemId}-dosage`}
                      required
                    >
                      <Input
                        id={`${itemId}-dosage`}
                        value={item.dosage}
                        onChange={(event) =>
                          updateItem(item.key, { dosage: event.target.value })
                        }
                        placeholder="e.g. 500 mg"
                        maxLength={120}
                        disabled={submitting}
                      />
                    </FormField>

                    <FormField
                      label="Frequency"
                      htmlFor={`${itemId}-frequency`}
                      required
                    >
                      <Input
                        id={`${itemId}-frequency`}
                        value={item.frequency}
                        onChange={(event) =>
                          updateItem(item.key, { frequency: event.target.value })
                        }
                        placeholder="e.g. every 8 hours"
                        maxLength={120}
                        disabled={submitting}
                      />
                    </FormField>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      label="Duration (days)"
                      htmlFor={`${itemId}-duration`}
                      hint="Leave blank for as-needed orders."
                    >
                      <Input
                        id={`${itemId}-duration`}
                        type="number"
                        min={1}
                        max={3650}
                        value={item.durationDays}
                        onChange={(event) =>
                          updateItem(item.key, {
                            durationDays: event.target.value,
                          })
                        }
                        placeholder="e.g. 7"
                        disabled={submitting}
                      />
                    </FormField>

                    <FormField
                      label="Quantity"
                      htmlFor={`${itemId}-quantity`}
                      required
                    >
                      <Input
                        id={`${itemId}-quantity`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(item.key, { quantity: event.target.value })
                        }
                        disabled={submitting}
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="Instructions"
                    htmlFor={`${itemId}-instructions`}
                  >
                    <Textarea
                      id={`${itemId}-instructions`}
                      rows={2}
                      value={item.instructions}
                      onChange={(event) =>
                        updateItem(item.key, {
                          instructions: event.target.value,
                        })
                      }
                      placeholder="Take with food, avoid alcohol, etc."
                      maxLength={500}
                      disabled={submitting}
                    />
                  </FormField>
                </div>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={addItem}
            disabled={submitting || prerequisitesMissing}
          >
            <AddCircleIcon className="size-4" aria-hidden="true" />
            Add medication
          </Button>

          <FormField label="Prescription notes" htmlFor={`${formId}-notes`}>
            <Textarea
              id={`${formId}-notes`}
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes for the pharmacy team."
              maxLength={1000}
              disabled={submitting}
            />
          </FormField>
        </form>
      </Modal>
    </>
  );
}
