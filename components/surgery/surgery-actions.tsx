"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarMarkIcon,
  MedicalKitIcon,
} from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  registerOperatingRoomAction,
  scheduleSurgeryAction,
} from "@/app/(workspace)/surgery/actions";
import {
  registerRoomSchema,
  scheduleSurgerySchema,
} from "@/lib/validations/surgery";
import type { PhysicianOption } from "@/types/hospital";

type RoomValues = {
  roomName: string;
  departmentId: string;
  status: string;
  notes: string;
};

type RoomErrors = Partial<Record<keyof RoomValues, string>>;

type CaseValues = {
  patientId: string;
  roomId: string;
  procedureCode: string;
  procedureName: string;
  scheduledStart: string;
  scheduledEnd: string;
  priority: string;
  surgeonId: string;
  anesthesiaType: string;
  notes: string;
};

type CaseErrors = Partial<Record<keyof CaseValues, string>>;

const ROOM_INITIAL: RoomValues = {
  roomName: "",
  departmentId: "",
  status: "available",
  notes: "",
};

const CASE_INITIAL: CaseValues = {
  patientId: "",
  roomId: "",
  procedureCode: "",
  procedureName: "",
  scheduledStart: "",
  scheduledEnd: "",
  priority: "elective",
  surgeonId: "",
  anesthesiaType: "",
  notes: "",
};

const ROOM_STATUS_OPTIONS = [
  { label: "Available", value: "available" },
  { label: "In use", value: "in_use" },
  { label: "Cleaning", value: "cleaning" },
  { label: "Maintenance", value: "maintenance" },
];

const PRIORITY_OPTIONS = [
  { label: "Elective", value: "elective" },
  { label: "Urgent", value: "urgent" },
  { label: "Emergency", value: "emergency" },
];

const ANESTHESIA_OPTIONS = [
  { label: "General", value: "general" },
  { label: "Regional", value: "regional" },
  { label: "Local", value: "local" },
  { label: "Sedation", value: "sedation" },
];

export interface SurgeryActionsProps {
  patients: Array<{
    id: string;
    full_name: string;
    medical_record_number: string;
  }>;
  departments: Array<{ id: string; name: string }>;
  rooms: Array<{ id: string; room_name: string; status: string }>;
  physicians: PhysicianOption[];
}

export function SurgeryActions({
  patients,
  departments,
  rooms,
  physicians,
}: SurgeryActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [roomOpen, setRoomOpen] = React.useState(false);
  const [caseOpen, setCaseOpen] = React.useState(false);

  const [roomValues, setRoomValues] = React.useState<RoomValues>(ROOM_INITIAL);
  const [roomErrors, setRoomErrors] = React.useState<RoomErrors>({});
  const [roomFormError, setRoomFormError] = React.useState<string | null>(null);
  const [roomSubmitting, setRoomSubmitting] = React.useState(false);

  const [caseValues, setCaseValues] = React.useState<CaseValues>(CASE_INITIAL);
  const [caseErrors, setCaseErrors] = React.useState<CaseErrors>({});
  const [caseFormError, setCaseFormError] = React.useState<string | null>(null);
  const [caseSubmitting, setCaseSubmitting] = React.useState(false);

  const bookableRooms = rooms.filter((room) => room.status !== "maintenance");

  function setRoomField<K extends keyof RoomValues>(
    field: K,
    value: RoomValues[K]
  ) {
    setRoomValues((current) => ({ ...current, [field]: value }));
    setRoomFormError(null);
    setRoomErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];

      return next;
    });
  }

  function setCaseField<K extends keyof CaseValues>(
    field: K,
    value: CaseValues[K]
  ) {
    setCaseValues((current) => ({ ...current, [field]: value }));
    setCaseFormError(null);
    setCaseErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];

      return next;
    });
  }

  async function handleRegisterRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (roomSubmitting) {
      return;
    }

    const parsed = registerRoomSchema.safeParse(roomValues);

    if (!parsed.success) {
      const nextErrors: RoomErrors = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && !nextErrors[field as keyof RoomValues]) {
          nextErrors[field as keyof RoomValues] = issue.message;
        }
      }

      setRoomErrors(nextErrors);
      return;
    }

    setRoomErrors({});
    setRoomFormError(null);
    setRoomSubmitting(true);

    try {
      const result = await registerOperatingRoomAction(parsed.data);

      if (!result.ok) {
        setRoomFormError(result.formError);
        return;
      }

      toast({
        title: "Operating room registered",
        description: `${parsed.data.roomName} is available on the theatre board.`,
        variant: "success",
      });

      setRoomValues(ROOM_INITIAL);
      setRoomOpen(false);
      router.refresh();
    } catch {
      setRoomFormError(
        "We could not register the room. Check your connection and try again."
      );
    } finally {
      setRoomSubmitting(false);
    }
  }

  async function handleScheduleCase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (caseSubmitting) {
      return;
    }

    const payload = {
      ...caseValues,
      scheduledStart: caseValues.scheduledStart
        ? new Date(caseValues.scheduledStart).toISOString()
        : "",
      scheduledEnd: caseValues.scheduledEnd
        ? new Date(caseValues.scheduledEnd).toISOString()
        : "",
    };

    const parsed = scheduleSurgerySchema.safeParse(payload);

    if (!parsed.success) {
      const nextErrors: CaseErrors = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && !nextErrors[field as keyof CaseValues]) {
          nextErrors[field as keyof CaseValues] = issue.message;
        }
      }

      setCaseErrors(nextErrors);
      return;
    }

    setCaseErrors({});
    setCaseFormError(null);
    setCaseSubmitting(true);

    try {
      const result = await scheduleSurgeryAction(parsed.data);

      if (!result.ok) {
        setCaseFormError(result.formError);
        return;
      }

      toast({
        title: "Surgery scheduled",
        description: `${parsed.data.procedureName} was added to the theatre schedule.`,
        variant: "success",
      });

      setCaseValues(CASE_INITIAL);
      setCaseOpen(false);
      router.refresh();
    } catch {
      setCaseFormError(
        "We could not schedule the case. Check your connection and try again."
      );
    } finally {
      setCaseSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setRoomOpen(true)}>
        <MedicalKitIcon className="size-4" aria-hidden="true" />
        Register OR
      </Button>
      <Button onClick={() => setCaseOpen(true)}>
        <CalendarMarkIcon className="size-4" aria-hidden="true" />
        Schedule Surgery
      </Button>

      <Modal
        open={roomOpen}
        onClose={() => {
          if (!roomSubmitting) {
            setRoomOpen(false);
          }
        }}
        title="Register operating room"
        description="Add a theatre to the scheduling board."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRoomOpen(false)}
              disabled={roomSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="or-form"
              loading={roomSubmitting}
            >
              Register room
            </Button>
          </>
        }
      >
        <form
          id="or-form"
          noValidate
          onSubmit={handleRegisterRoom}
          className="space-y-4"
        >
          {roomFormError ? (
            <Alert variant="danger" title="Unable to register room">
              {roomFormError}
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Room name"
              htmlFor="or_name"
              required
              error={roomErrors.roomName}
            >
              <Input
                id="or_name"
                autoComplete="off"
                value={roomValues.roomName}
                invalid={Boolean(roomErrors.roomName)}
                onChange={(event) =>
                  setRoomField("roomName", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Department"
              htmlFor="or_department"
              required
              error={roomErrors.departmentId}
            >
              <Select
                id="or_department"
                value={roomValues.departmentId}
                invalid={Boolean(roomErrors.departmentId)}
                onChange={(event) =>
                  setRoomField("departmentId", event.target.value)
                }
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Status"
              htmlFor="or_status"
              required
              error={roomErrors.status}
            >
              <Select
                id="or_status"
                value={roomValues.status}
                options={ROOM_STATUS_OPTIONS}
                onChange={(event) =>
                  setRoomField("status", event.target.value)
                }
              />
            </FormField>
          </div>

          <FormField
            label="Notes"
            htmlFor="or_notes"
            hint="Optional."
            error={roomErrors.notes}
          >
            <Textarea
              id="or_notes"
              rows={2}
              value={roomValues.notes}
              onChange={(event) => setRoomField("notes", event.target.value)}
            />
          </FormField>
        </form>
      </Modal>

      <Modal
        open={caseOpen}
        onClose={() => {
          if (!caseSubmitting) {
            setCaseOpen(false);
          }
        }}
        title="Schedule surgery"
        description="Reserve a theatre slot and assign the surgical team."
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setCaseOpen(false)}
              disabled={caseSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="surgery-form"
              loading={caseSubmitting}
            >
              Schedule case
            </Button>
          </>
        }
      >
        <form
          id="surgery-form"
          noValidate
          onSubmit={handleScheduleCase}
          className="space-y-4"
        >
          {caseFormError ? (
            <Alert variant="danger" title="Unable to schedule surgery">
              {caseFormError}
            </Alert>
          ) : null}

          <FormField
            label="Patient"
            htmlFor="surgery_patient"
            required
            error={caseErrors.patientId}
          >
            <Select
              id="surgery_patient"
              value={caseValues.patientId}
              invalid={Boolean(caseErrors.patientId)}
              onChange={(event) =>
                setCaseField("patientId", event.target.value)
              }
            >
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name} · {patient.medical_record_number}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Procedure code"
              htmlFor="surgery_code"
              required
              error={caseErrors.procedureCode}
            >
              <Input
                id="surgery_code"
                autoComplete="off"
                value={caseValues.procedureCode}
                invalid={Boolean(caseErrors.procedureCode)}
                onChange={(event) =>
                  setCaseField("procedureCode", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Procedure name"
              htmlFor="surgery_name"
              required
              error={caseErrors.procedureName}
            >
              <Input
                id="surgery_name"
                autoComplete="off"
                value={caseValues.procedureName}
                invalid={Boolean(caseErrors.procedureName)}
                onChange={(event) =>
                  setCaseField("procedureName", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Starts"
              htmlFor="surgery_start"
              required
              error={caseErrors.scheduledStart}
            >
              <Input
                id="surgery_start"
                type="datetime-local"
                value={caseValues.scheduledStart}
                invalid={Boolean(caseErrors.scheduledStart)}
                onChange={(event) =>
                  setCaseField("scheduledStart", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Ends"
              htmlFor="surgery_end"
              required
              error={caseErrors.scheduledEnd}
            >
              <Input
                id="surgery_end"
                type="datetime-local"
                value={caseValues.scheduledEnd}
                invalid={Boolean(caseErrors.scheduledEnd)}
                onChange={(event) =>
                  setCaseField("scheduledEnd", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Operating room"
              htmlFor="surgery_room"
              required
              error={caseErrors.roomId}
            >
              <Select
                id="surgery_room"
                value={caseValues.roomId}
                invalid={Boolean(caseErrors.roomId)}
                onChange={(event) => setCaseField("roomId", event.target.value)}
              >
                <option value="">Select room</option>
                {bookableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.room_name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Priority"
              htmlFor="surgery_priority"
              required
              error={caseErrors.priority}
            >
              <Select
                id="surgery_priority"
                value={caseValues.priority}
                options={PRIORITY_OPTIONS}
                onChange={(event) =>
                  setCaseField("priority", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Surgeon"
              htmlFor="surgery_surgeon"
              required
              error={caseErrors.surgeonId}
            >
              <Select
                id="surgery_surgeon"
                value={caseValues.surgeonId}
                invalid={Boolean(caseErrors.surgeonId)}
                onChange={(event) =>
                  setCaseField("surgeonId", event.target.value)
                }
              >
                <option value="">Select surgeon</option>
                {physicians.map((physician) => (
                  <option key={physician.id} value={physician.id}>
                    {physician.full_name}
                    {physician.specialty ? ` · ${physician.specialty}` : ""}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Anesthesia"
              htmlFor="surgery_anesthesia"
              hint="Optional."
              error={caseErrors.anesthesiaType}
            >
              <Select
                id="surgery_anesthesia"
                value={caseValues.anesthesiaType}
                options={ANESTHESIA_OPTIONS}
                onChange={(event) =>
                  setCaseField("anesthesiaType", event.target.value)
                }
              >
                <option value="">Not planned</option>
              </Select>
            </FormField>
          </div>

          <FormField
            label="Notes"
            htmlFor="surgery_notes"
            hint="Optional."
            error={caseErrors.notes}
          >
            <Textarea
              id="surgery_notes"
              rows={2}
              value={caseValues.notes}
              onChange={(event) => setCaseField("notes", event.target.value)}
            />
          </FormField>

          <Alert variant="info" title="Slots are exclusive">
            A theatre cannot hold two overlapping cases. Maintenance rooms are
            excluded from scheduling.
          </Alert>
        </form>
      </Modal>
    </>
  );
}
