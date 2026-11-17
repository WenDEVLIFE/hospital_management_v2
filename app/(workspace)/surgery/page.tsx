import { connection } from "next/server";
import {
  CalendarMarkIcon,
  CheckCircleIcon,
  ClockCircleIcon,
  HeartPulseIcon,
  MedicalKitIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { SurgeryActions } from "@/components/surgery/surgery-actions";
import { SurgeryView } from "@/components/surgery/surgery-view";
import { SurgeryWorkflowStrip } from "@/components/surgery/surgery-workflow-strip";
import { listDepartments } from "@/lib/data/departments";
import { listPatients } from "@/lib/data/patients";
import { listPhysicians } from "@/lib/data/staff";
import {
  getOperatingRoomBoard,
  getSurgeryDetails,
  getSurgeryStats,
  listSurgeryCases,
} from "@/lib/data/surgery";

export const metadata = {
  title: "Surgery & Operating Room",
};

export default async function SurgeryPage() {
  await connection();

  const [
    statsResult,
    listResult,
    roomsResult,
    detailsResult,
    patientResult,
    departmentResult,
    physicianResult,
  ] = await Promise.all([
    getSurgeryStats(),
    listSurgeryCases({ pageSize: 200 }),
    getOperatingRoomBoard(),
    getSurgeryDetails(),
    listPatients({ pageSize: 300 }),
    listDepartments({ pageSize: 100 }),
    listPhysicians(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surgery & Operating Room"
        description="Schedule surgical cases, coordinate theatre teams, and track recovery."
        actions={
          <SurgeryActions
            patients={(patientResult.data?.rows ?? []).map((patient) => ({
              id: patient.id,
              full_name: patient.full_name,
              medical_record_number: patient.medical_record_number,
            }))}
            departments={(departmentResult.data?.rows ?? []).map(
              (department) => ({ id: department.id, name: department.name })
            )}
            rooms={(roomsResult.data ?? []).map((room) => ({
              id: room.id,
              room_name: room.room_name,
              status: room.status,
            }))}
            physicians={physicianResult.data ?? []}
          />
        }
      />

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Today's cases"
              value={statsResult.data.today}
              hint="Scheduled for today"
              icon={<CalendarMarkIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="In OR"
              value={statsResult.data.inProgress}
              hint="Active theatre cases"
              tone="info"
              icon={<HeartPulseIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Recovery"
              value={statsResult.data.recovery}
              hint="Post-anesthesia care"
              tone="warning"
              icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Completed"
              value={statsResult.data.completed}
              hint={`${statsResult.data.cancelled} cancelled`}
              tone="success"
              icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="OR utilization"
              value={`${statsResult.data.orUtilization}%`}
              hint="Average across operating rooms"
              icon={<MedicalKitIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Pending pre-op"
              value={statsResult.data.preOp + statsResult.data.requested}
              hint={`${statsResult.data.preOp} in pre-op · ${statsResult.data.requested} requested`}
              tone="warning"
              icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
            />
          </div>

          <SurgeryWorkflowStrip stats={statsResult.data} />
        </>
      )}

      {listResult.error ? (
        <ErrorState error={listResult.error} />
      ) : (
        <SurgeryView
          rows={listResult.data.rows}
          rooms={roomsResult.error ? [] : roomsResult.data}
          details={detailsResult.error ? {} : detailsResult.data}
        />
      )}
    </div>
  );
}
