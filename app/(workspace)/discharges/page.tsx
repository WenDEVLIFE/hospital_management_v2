import { LogoutIcon } from "@solar-icons/react/linear";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { DischargesView } from "@/components/admissions/discharges-view";
import { Button } from "@/components/ui/button";
import { accessCan, getCurrentUserAccess } from "@/lib/auth/access";
import { listDischarges } from "@/lib/data/admissions";

export const metadata = {
  title: "Discharges",
};

export default async function DischargesPage() {
  const [access, listResult] = await Promise.all([
    getCurrentUserAccess(),
    listDischarges({ pageSize: 200 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discharges"
        description="Complete discharge workflows and release beds."
        actions={
          accessCan(access, "admission.discharge") ? (
            <Link href="/discharges/new">
              <Button>
                <LogoutIcon className="size-4" aria-hidden="true" />
                Discharge Patient
              </Button>
            </Link>
          ) : null
        }
      />

      <PageSection
        title="Discharge records"
        description="Patients whose inpatient admission has been completed."
      >
        {listResult.error ? (
          <ErrorState error={listResult.error} />
        ) : (
          <DischargesView rows={listResult.data.rows} />
        )}
      </PageSection>
    </div>
  );
}
