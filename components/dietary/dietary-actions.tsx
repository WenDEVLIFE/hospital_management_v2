"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChefHatMinimalisticIcon } from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useCan } from "@/components/providers/permission-provider";
import {
  advanceMealAction,
  createDietaryOrderAction,
} from "@/app/(workspace)/dietary/actions";
import { createDietaryOrderSchema } from "@/lib/validations/dietary";
import type { DietCategory, MealOrderListRow, TherapeuticDiet } from "@/types/hospital";

const MEALS = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
  { label: "Snack", value: "snack" },
];

export function NewDietaryAssessmentAction({
  patients,
  diets,
  categories,
}: {
  patients: Array<{ id: string; full_name: string; medical_record_number: string }>;
  diets: TherapeuticDiet[];
  categories: DietCategory[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({
    patientId: "",
    therapeuticDietId: "",
    allergies: "",
    restrictions: "",
    notes: "",
  });
  const [schedule, setSchedule] = React.useState<string[]>([
    "breakfast",
    "lunch",
    "dinner",
  ]);
  const [error, setError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("dietary.manage")) {
    return null;
  }

  const categoryName = new Map(categories.map((category) => [category.id, category.name]));

  function toggleMeal(meal: string) {
    setSchedule((current) =>
      current.includes(meal)
        ? current.filter((entry) => entry !== meal)
        : [...current, meal]
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = createDietaryOrderSchema.safeParse({
      ...values,
      mealSchedule: schedule,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the assessment.");
      return;
    }

    setError(null);
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await createDietaryOrderAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Dietary assessment recorded",
        description: `${schedule.length} meal(s) scheduled for today.`,
        variant: "success",
      });
      setValues({
        patientId: "",
        therapeuticDietId: "",
        allergies: "",
        restrictions: "",
        notes: "",
      });
      setSchedule(["breakfast", "lunch", "dinner"]);
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not record the assessment. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <ChefHatMinimalisticIcon className="size-4" aria-hidden="true" />
        New Dietary Assessment
      </Button>

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="New dietary assessment"
        description="Choose the therapeutic diet and the meals to schedule."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="dietary-form" loading={submitting}>
              Record assessment
            </Button>
          </>
        }
      >
        <form id="dietary-form" noValidate onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <Alert variant="danger" title="Unable to record assessment">
              {formError}
            </Alert>
          ) : null}
          {error ? <Alert variant="warning" title="Check the form">{error}</Alert> : null}

          <FormField label="Patient" htmlFor="diet_patient" required>
            <Select
              id="diet_patient"
              value={values.patientId}
              onChange={(event) => setValues((c) => ({ ...c, patientId: event.target.value }))}
            >
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name} · {patient.medical_record_number}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Therapeutic diet" htmlFor="diet_choice" required>
            <Select
              id="diet_choice"
              value={values.therapeuticDietId}
              onChange={(event) =>
                setValues((c) => ({ ...c, therapeuticDietId: event.target.value }))
              }
            >
              <option value="">Select diet</option>
              {diets.map((diet) => (
                <option key={diet.id} value={diet.id}>
                  {diet.name} · {categoryName.get(diet.category_id) ?? "Diet"}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Allergies"
              htmlFor="diet_allergies"
              hint="Comma separated. Copied onto every tray."
            >
              <Input
                id="diet_allergies"
                value={values.allergies}
                onChange={(event) => setValues((c) => ({ ...c, allergies: event.target.value }))}
              />
            </FormField>

            <FormField label="Restrictions" htmlFor="diet_restrictions" hint="Comma separated.">
              <Input
                id="diet_restrictions"
                value={values.restrictions}
                onChange={(event) =>
                  setValues((c) => ({ ...c, restrictions: event.target.value }))
                }
              />
            </FormField>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-hospital-text">Meals to schedule</legend>
            <div className="flex flex-wrap gap-3">
              {MEALS.map((meal) => (
                <label key={meal.value} className="flex items-center gap-2 text-xs text-hospital-text">
                  <input
                    type="checkbox"
                    checked={schedule.includes(meal.value)}
                    onChange={() => toggleMeal(meal.value)}
                    className="size-4 rounded border-hospital-border"
                  />
                  {meal.label}
                </label>
              ))}
            </div>
          </fieldset>

          <FormField label="Assessment notes" htmlFor="diet_notes" hint="Optional.">
            <Textarea
              id="diet_notes"
              rows={2}
              value={values.notes}
              onChange={(event) => setValues((c) => ({ ...c, notes: event.target.value }))}
            />
          </FormField>
        </form>
      </Modal>
    </>
  );
}

const MEAL_NEXT: Record<string, { status: string; label: string } | undefined> = {
  scheduled: { status: "preparing", label: "Mark preparing" },
  preparing: { status: "ready", label: "Mark ready" },
  ready: { status: "delivered", label: "Confirm delivery" },
};

export function MealStatusAction({ meal }: { meal: MealOrderListRow }) {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!can("dietary.manage")) {
    return null;
  }

  const next = MEAL_NEXT[meal.status];

  if (!next) {
    return null;
  }

  const action = next;

  async function handleClick() {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await advanceMealAction({
        mealId: meal.id,
        status: action.status,
      });

      if (!result.ok) {
        setError(result.formError);
        return;
      }

      toast({
        title: action.label,
        description: `${meal.meal_number} updated.`,
        variant: "success",
      });
      router.refresh();
    } catch {
      setError("We could not update the meal. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button size="sm" variant="secondary" loading={submitting} onClick={handleClick}>
        {action.label}
      </Button>
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}
