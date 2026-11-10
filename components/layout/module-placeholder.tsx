import * as React from "react";
import {
  BedIcon,
  BillListIcon,
  BoxIcon,
  Buildings2Icon,
  CalendarMarkIcon,
  Chart2Icon,
  DocumentMedicineIcon,
  DocumentTextIcon,
  HeartPulseIcon,
  HistoryIcon,
  HomeSmileIcon,
  LoginIcon,
  LogoutIcon,
  Pills2Icon,
  Scanner2Icon,
  SettingsIcon,
  StethoscopeIcon,
  TestTubeIcon,
  UserIdIcon,
  UserPlusIcon,
  UserRoundedIcon,
  UsersGroupTwoRoundedIcon,
  WalletMoneyIcon,
} from "@solar-icons/react/linear";
import { EmptyState } from "@/components/ui/empty-state";
import type { IconComponent } from "@/lib/navigation";
import { PageHeader } from "./page-header";
import { PageSection } from "./page-section";

const moduleIcons = {
  dashboard: HomeSmileIcon,
  patients: UserRoundedIcon,
  patientsNew: UserPlusIcon,
  patientDetail: UserIdIcon,
  appointments: CalendarMarkIcon,
  admissions: LoginIcon,
  discharges: LogoutIcon,
  medicalRecords: DocumentTextIcon,
  nursing: HeartPulseIcon,
  staff: StethoscopeIcon,
  laboratory: TestTubeIcon,
  radiology: Scanner2Icon,
  pharmacy: Pills2Icon,
  prescriptions: DocumentMedicineIcon,
  billing: BillListIcon,
  payments: WalletMoneyIcon,
  inventory: BoxIcon,
  departments: Buildings2Icon,
  roomsBeds: BedIcon,
  reports: Chart2Icon,
  settings: SettingsIcon,
  users: UsersGroupTwoRoundedIcon,
  auditLogs: HistoryIcon,
} satisfies Record<string, IconComponent>;

export type ModuleIconName = keyof typeof moduleIcons;

export interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon?: ModuleIconName;
}

export function ModulePlaceholder({
  title,
  description,
  icon = "dashboard",
}: ModulePlaceholderProps) {
  const Icon = moduleIcons[icon];

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      <PageSection>
        <EmptyState
          icon={<Icon className="size-5" />}
          title="No records yet"
          description="This module will display data from Supabase once records are available."
        />
      </PageSection>
    </div>
  );
}
