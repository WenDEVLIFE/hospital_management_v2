import {
  BedIcon,
  CheckCircleIcon,
  LoginIcon,
  LogoutIcon,
  TransferHorizontalIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { AdmissionsView } from "@/components/admissions/admissions-view";
import { BedBoard } from "@/components/admissions/bed-board";
import { UnavailableAction } from "@/components/module/unavailable-action";
import {
  getAdmissionStats,
  getBedBoard,
  listAdmissions,
} from "@/lib/data/admissions";

export const metadata = {
  title: "Admissions",
};

export default async function AdmissionsPage() {
  const [statsResult, listResult, boardResult] = await Promise.all([
    getAdmissionStats(),
    listAdmissions({ pageSize: 200 }),
    getBedBoard(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admissions"
        description="Admit patients and manage bed allocation."
        actions={
          <>
            <UnavailableAction
              label="Transfer Patient"
              description="Move an admitted patient to a different room or bed."
              variant="secondary"
              icon={
                <TransferHorizontalIcon
                  className="size-4"
                  aria-hidden="true"
                />
              }
            />
            <UnavailableAction
              label="Admit Patient"
              description="Create a new inpatient admission and assign a bed."
              icon={<LoginIcon className="size-4" aria-hidden="true" />}
            />
          </>
        }
      />

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label="Current admissions"
            value={statsResult.data.admitted}
            icon={<LoginIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Available beds"
            value={statsResult.data.availableBeds}
            tone="success"
            icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Occupied beds"
            value={statsResult.data.occupiedBeds}
            tone="info"
            icon={<BedIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Recent transfers"
            value={statsResult.data.transferred}
            tone="warning"
            icon={
              <TransferHorizontalIcon className="size-4" aria-hidden="true" />
            }
          />
          <StatCard
            label="Discharges today"
            value={statsResult.data.dischargesToday}
            icon={<LogoutIcon className="size-4" aria-hidden="true" />}
          />
        </div>
      )}

      <PageSection
        title="Bed board"
        description="Bed availability grouped by department and room. A bed is only shown as available when its recorded status is available."
      >
        {boardResult.error ? (
          <ErrorState error={boardResult.error} />
        ) : (
          <BedBoard rows={boardResult.data} />
        )}
      </PageSection>

      <PageSection
        title="Admission list"
        description="Current and past inpatient admissions."
      >
        {listResult.error ? (
          <ErrorState error={listResult.error} />
        ) : (
          <AdmissionsView rows={listResult.data.rows} />
        )}
      </PageSection>
    </div>
  );
}
