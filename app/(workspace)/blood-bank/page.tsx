import { connection } from "next/server";
import {
  CheckCircleIcon,
  ClipboardListIcon,
  ClockCircleIcon,
  HeartPulseIcon,
  TestTubeIcon,
  UserRoundedIcon,
  WaterdropIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { BloodBankView } from "@/components/blood-bank/blood-bank-view";
import { BloodBankWorkflowStrip } from "@/components/blood-bank/blood-bank-workflow-strip";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { UnavailableAction } from "@/components/module/unavailable-action";
import { Alert } from "@/components/ui/alert";
import {
  getBloodBankStats,
  getBloodDonorDetails,
  getBloodRequestDetails,
  getBloodUnitDetails,
  listBloodDonors,
  listBloodRequests,
  listBloodScreenings,
  listBloodUnits,
  listTransfusionRecords,
} from "@/lib/data/blood-bank";

export const metadata = {
  title: "Blood Bank",
};

export default async function BloodBankPage() {
  await connection();

  const [
    statsResult,
    unitsResult,
    unitDetailsResult,
    requestsResult,
    requestDetailsResult,
    donorsResult,
    donorDetailsResult,
    screeningsResult,
    transfusionsResult,
  ] = await Promise.all([
    getBloodBankStats(),
    listBloodUnits({ pageSize: 200 }),
    getBloodUnitDetails(),
    listBloodRequests({ pageSize: 200 }),
    getBloodRequestDetails(),
    listBloodDonors({ pageSize: 200 }),
    getBloodDonorDetails(),
    listBloodScreenings(),
    listTransfusionRecords(),
  ]);

  const donors = donorsResult.error ? [] : donorsResult.data.rows;
  const eligibleDonors = donors.filter(
    (donor) => donor.eligibility_status === "eligible"
  ).length;
  const screenings = screeningsResult.error ? [] : screeningsResult.data;
  const screenedUnits = new Set(
    screenings.map((screening) => screening.unit_id)
  ).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blood Bank"
        description="Donors, blood components, requests, crossmatching, and transfusion records."
        actions={
          <>
            <UnavailableAction
              label="Register Donor"
              description="Register a blood donor and record eligibility screening."
              variant="secondary"
              icon={<UserRoundedIcon className="size-4" aria-hidden="true" />}
            />
            <UnavailableAction
              label="Create Request"
              description="Create a blood request for a patient and route it to the blood bank."
              icon={<ClipboardListIcon className="size-4" aria-hidden="true" />}
            />
          </>
        }
      />

      <Alert variant="info" title="Qualified personnel review required">
        Blood bank workflows must be validated by qualified blood bank
        personnel. This interface records and displays data; it does not
        determine donor eligibility, crossmatch compatibility, or transfusion
        safety.
      </Alert>

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Units in stock"
              value={statsResult.data.unitsInStock}
              hint="Available, reserved, or crossmatched"
              icon={<WaterdropIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Available"
              value={statsResult.data.availableUnits}
              hint="Ready for allocation"
              tone="success"
              icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Expiring soon"
              value={statsResult.data.expiringSoon}
              hint="Within 7 days"
              tone="warning"
              icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Pending requests"
              value={statsResult.data.pendingRequests}
              hint="Pending, reserved, or crossmatched"
              tone="warning"
              icon={<ClipboardListIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Crossmatches pending"
              value={statsResult.data.crossmatchesPending}
              hint="Awaiting compatibility result"
              tone="info"
              icon={<TestTubeIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Issued today"
              value={statsResult.data.issuedToday}
              hint="Units released today"
              icon={<HeartPulseIcon className="size-4" aria-hidden="true" />}
            />
          </div>

          <BloodBankWorkflowStrip
            stats={statsResult.data}
            donorCount={donors.length}
            eligibleDonors={eligibleDonors}
            screenedUnits={screenedUnits}
          />
        </>
      )}

      {unitsResult.error ? (
        <ErrorState error={unitsResult.error} />
      ) : (
        <BloodBankView
          units={unitsResult.data.rows}
          unitDetails={unitDetailsResult.error ? {} : unitDetailsResult.data}
          requests={requestsResult.error ? [] : requestsResult.data.rows}
          requestDetails={
            requestDetailsResult.error ? {} : requestDetailsResult.data
          }
          donors={donors}
          donorDetails={
            donorDetailsResult.error ? {} : donorDetailsResult.data
          }
          screenings={screenings}
          transfusions={
            transfusionsResult.error ? [] : transfusionsResult.data
          }
        />
      )}
    </div>
  );
}
