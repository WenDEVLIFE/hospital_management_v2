"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  MedicalKitIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "@solar-icons/react/linear";

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
  completeWorkOrderAction,
  createWorkOrderAction,
  recordCalibrationAction,
  registerEquipmentAction,
} from "@/app/(workspace)/equipment/actions";

type CategoryOption = { id: string; name: string };
type DepartmentOption = { id: string; name: string };
type EquipmentOption = { id: string; asset_number: string; name: string };

const emptyRegisterForm = {
  assetNumber: "",
  name: "",
  serialNumber: "",
  categoryId: "",
  departmentId: "",
  manufacturer: "",
  model: "",
  location: "",
  nextMaintenanceDue: "",
  nextCalibrationDue: "",
};

const emptyWorkOrderForm = {
  equipmentId: "",
  issueDescription: "",
  priority: "routine",
  notes: "",
};

const emptyCalibrationForm = {
  calibrationType: "Routine calibration",
  result: "passed",
  certificateNumber: "",
  nextDueDate: "",
  notes: "",
};

export function RegisterEquipmentDialog({
  open,
  onClose,
  categories,
  departments,
}: {
  open: boolean;
  onClose: () => void;
  categories: CategoryOption[];
  departments: DepartmentOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = React.useState(emptyRegisterForm);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function close() {
    if (submitting) {
      return;
    }

    setFormError(null);
    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const result = await registerEquipmentAction(values);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Equipment registered",
        description: `${values.name.trim()} added to the asset register.`,
        variant: "success",
      });
      setValues(emptyRegisterForm);
      onClose();
      router.refresh();
    } catch {
      setFormError("We could not register the equipment. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Register equipment"
      description="Add a medical asset to the register with its maintenance dates."
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="equipment-register-form" loading={submitting}>
            Register asset
          </Button>
        </>
      }
    >
      <form
        id="equipment-register-form"
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {formError ? (
          <Alert variant="danger" title="Unable to register">
            {formError}
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Asset number" htmlFor="eq_asset" required>
            <Input
              id="eq_asset"
              value={values.assetNumber}
              onChange={(event) =>
                setValues((current) => ({ ...current, assetNumber: event.target.value }))
              }
            />
          </FormField>

          <FormField label="Equipment name" htmlFor="eq_name" required>
            <Input
              id="eq_name"
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({ ...current, name: event.target.value }))
              }
            />
          </FormField>

          <FormField label="Serial number" htmlFor="eq_serial" required>
            <Input
              id="eq_serial"
              value={values.serialNumber}
              onChange={(event) =>
                setValues((current) => ({ ...current, serialNumber: event.target.value }))
              }
            />
          </FormField>

          <FormField label="Category" htmlFor="eq_category">
            <Select
              id="eq_category"
              value={values.categoryId}
              onChange={(event) =>
                setValues((current) => ({ ...current, categoryId: event.target.value }))
              }
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Manufacturer" htmlFor="eq_manufacturer">
            <Input
              id="eq_manufacturer"
              value={values.manufacturer}
              onChange={(event) =>
                setValues((current) => ({ ...current, manufacturer: event.target.value }))
              }
            />
          </FormField>

          <FormField label="Model" htmlFor="eq_model">
            <Input
              id="eq_model"
              value={values.model}
              onChange={(event) =>
                setValues((current) => ({ ...current, model: event.target.value }))
              }
            />
          </FormField>

          <FormField label="Department" htmlFor="eq_department">
            <Select
              id="eq_department"
              value={values.departmentId}
              onChange={(event) =>
                setValues((current) => ({ ...current, departmentId: event.target.value }))
              }
            >
              <option value="">Unassigned</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Location" htmlFor="eq_location">
            <Input
              id="eq_location"
              value={values.location}
              onChange={(event) =>
                setValues((current) => ({ ...current, location: event.target.value }))
              }
            />
          </FormField>

          <FormField label="Next maintenance" htmlFor="eq_maintenance">
            <Input
              id="eq_maintenance"
              type="date"
              value={values.nextMaintenanceDue}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  nextMaintenanceDue: event.target.value,
                }))
              }
            />
          </FormField>

          <FormField label="Next calibration" htmlFor="eq_calibration">
            <Input
              id="eq_calibration"
              type="date"
              value={values.nextCalibrationDue}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  nextCalibrationDue: event.target.value,
                }))
              }
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}

export function CreateWorkOrderDialog({
  open,
  onClose,
  equipment,
  initialEquipmentId = "",
}: {
  open: boolean;
  onClose: () => void;
  equipment: EquipmentOption[];
  initialEquipmentId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = React.useState({
    ...emptyWorkOrderForm,
    equipmentId: initialEquipmentId,
  });
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function close() {
    if (submitting) {
      return;
    }

    setValues({ ...emptyWorkOrderForm, equipmentId: initialEquipmentId });
    setFormError(null);
    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const result = await createWorkOrderAction(values);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Work order raised",
        description: "The asset is now marked under maintenance.",
        variant: "success",
      });
      setValues({ ...emptyWorkOrderForm, equipmentId: initialEquipmentId });
      onClose();
      router.refresh();
    } catch {
      setFormError("We could not raise the work order. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Create work order"
      description="Report a fault and move the asset into maintenance."
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="equipment-work-order-form" loading={submitting}>
            Raise work order
          </Button>
        </>
      }
    >
      <form
        id="equipment-work-order-form"
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {formError ? (
          <Alert variant="danger" title="Unable to raise the work order">
            {formError}
          </Alert>
        ) : null}

        <FormField label="Equipment" htmlFor="wo_equipment" required>
          <Select
            id="wo_equipment"
            value={values.equipmentId}
            onChange={(event) =>
              setValues((current) => ({ ...current, equipmentId: event.target.value }))
            }
          >
            <option value="">Select equipment</option>
            {equipment.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.asset_number} · {asset.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Issue" htmlFor="wo_issue" required>
          <Textarea
            id="wo_issue"
            rows={3}
            value={values.issueDescription}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                issueDescription: event.target.value,
              }))
            }
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Priority" htmlFor="wo_priority" required>
            <Select
              id="wo_priority"
              value={values.priority}
              options={[
                { label: "Routine", value: "routine" },
                { label: "Urgent", value: "urgent" },
                { label: "Emergency", value: "emergency" },
              ]}
              onChange={(event) =>
                setValues((current) => ({ ...current, priority: event.target.value }))
              }
            />
          </FormField>

          <FormField label="Notes" htmlFor="wo_notes" hint="Optional.">
            <Input
              id="wo_notes"
              value={values.notes}
              onChange={(event) =>
                setValues((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}

export function CompleteWorkOrderDialog({
  open,
  onClose,
  workOrder,
}: {
  open: boolean;
  onClose: () => void;
  workOrder: { id: string; work_order_number: string } | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = React.useState({
    resolutionNotes: "",
    partsUsed: "",
    cost: "",
  });
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function close() {
    if (submitting) {
      return;
    }

    setValues({ resolutionNotes: "", partsUsed: "", cost: "" });
    setFormError(null);
    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || !workOrder) {
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const result = await completeWorkOrderAction({
        workOrderId: workOrder.id,
        ...values,
      });

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Work order completed",
        description: `${workOrder.work_order_number} closed and the asset returned to service.`,
        variant: "success",
      });
      setValues({ resolutionNotes: "", partsUsed: "", cost: "" });
      onClose();
      router.refresh();
    } catch {
      setFormError("We could not complete the work order. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={
        workOrder ? `Complete ${workOrder.work_order_number}` : "Complete work order"
      }
      description="Record the resolution, parts and cost, then return the asset to service."
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="equipment-complete-form" loading={submitting}>
            Complete work order
          </Button>
        </>
      }
    >
      <form
        id="equipment-complete-form"
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {formError ? (
          <Alert variant="danger" title="Unable to complete">
            {formError}
          </Alert>
        ) : null}

        <FormField label="Resolution" htmlFor="wo_resolution" required>
          <Textarea
            id="wo_resolution"
            rows={3}
            value={values.resolutionNotes}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                resolutionNotes: event.target.value,
              }))
            }
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Parts used" htmlFor="wo_parts" hint="Optional.">
            <Input
              id="wo_parts"
              value={values.partsUsed}
              onChange={(event) =>
                setValues((current) => ({ ...current, partsUsed: event.target.value }))
              }
            />
          </FormField>

          <FormField label="Cost" htmlFor="wo_cost" hint="Philippine pesos.">
            <Input
              id="wo_cost"
              type="number"
              min="0"
              step="0.01"
              value={values.cost}
              onChange={(event) =>
                setValues((current) => ({ ...current, cost: event.target.value }))
              }
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}

export function RecordCalibrationDialog({
  open,
  onClose,
  equipment,
}: {
  open: boolean;
  onClose: () => void;
  equipment: { id: string; asset_number: string; name: string } | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = React.useState(emptyCalibrationForm);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function close() {
    if (submitting) {
      return;
    }

    setValues(emptyCalibrationForm);
    setFormError(null);
    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || !equipment) {
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const result = await recordCalibrationAction({
        equipmentId: equipment.id,
        ...values,
      });

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Calibration recorded",
        description:
          values.result === "failed"
            ? "A failed calibration takes the asset out of service."
            : `${equipment.asset_number} calibration saved.`,
        variant: values.result === "failed" ? "warning" : "success",
      });
      setValues(emptyCalibrationForm);
      onClose();
      router.refresh();
    } catch {
      setFormError("We could not record the calibration. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={
        equipment ? `Record calibration · ${equipment.asset_number}` : "Record calibration"
      }
      description="Log the calibration result and the next due date."
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="equipment-calibration-form" loading={submitting}>
            Save calibration
          </Button>
        </>
      }
    >
      <form
        id="equipment-calibration-form"
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {formError ? (
          <Alert variant="danger" title="Unable to record">
            {formError}
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Calibration type" htmlFor="cal_type" required>
            <Input
              id="cal_type"
              value={values.calibrationType}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  calibrationType: event.target.value,
                }))
              }
            />
          </FormField>

          <FormField label="Result" htmlFor="cal_result" required>
            <Select
              id="cal_result"
              value={values.result}
              options={[
                { label: "Passed", value: "passed" },
                { label: "Adjusted", value: "adjusted" },
                { label: "Failed", value: "failed" },
              ]}
              onChange={(event) =>
                setValues((current) => ({ ...current, result: event.target.value }))
              }
            />
          </FormField>

          <FormField label="Certificate number" htmlFor="cal_certificate" required>
            <Input
              id="cal_certificate"
              value={values.certificateNumber}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  certificateNumber: event.target.value,
                }))
              }
            />
          </FormField>

          <FormField label="Next due" htmlFor="cal_next">
            <Input
              id="cal_next"
              type="date"
              value={values.nextDueDate}
              onChange={(event) =>
                setValues((current) => ({ ...current, nextDueDate: event.target.value }))
              }
            />
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="cal_notes" hint="Optional.">
          <Textarea
            id="cal_notes"
            rows={2}
            value={values.notes}
            onChange={(event) =>
              setValues((current) => ({ ...current, notes: event.target.value }))
            }
          />
        </FormField>

        {values.result === "failed" ? (
          <Alert variant="warning" title="Failed calibration">
            Saving a failed result marks the asset out of service until it is
            recalibrated.
          </Alert>
        ) : null}
      </form>
    </Modal>
  );
}

export function RegisterEquipmentAction({
  categories,
  departments,
}: {
  categories: CategoryOption[];
  departments: DepartmentOption[];
}) {
  const can = useCan();
  const [open, setOpen] = React.useState(false);

  if (!can("equipment.manage")) {
    return null;
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <MedicalKitIcon className="size-4" aria-hidden="true" />
        Register Equipment
      </Button>
      <RegisterEquipmentDialog
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        departments={departments}
      />
    </>
  );
}

export function CreateWorkOrderAction({
  equipment,
}: {
  equipment: EquipmentOption[];
}) {
  const can = useCan();
  const [open, setOpen] = React.useState(false);

  if (!can("equipment.manage")) {
    return null;
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <SettingsIcon className="size-4" aria-hidden="true" />
        Create Work Order
      </Button>
      <CreateWorkOrderDialog
        open={open}
        onClose={() => setOpen(false)}
        equipment={equipment}
      />
    </>
  );
}

export function RecordCalibrationButton({
  equipment,
}: {
  equipment: EquipmentOption;
}) {
  const can = useCan();
  const [open, setOpen] = React.useState(false);

  if (!can("equipment.manage")) {
    return null;
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <ShieldCheckIcon className="size-4" aria-hidden="true" />
        Record calibration
      </Button>
      <RecordCalibrationDialog
        open={open}
        onClose={() => setOpen(false)}
        equipment={equipment}
      />
    </>
  );
}
