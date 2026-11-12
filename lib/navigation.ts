import type { ComponentType } from "react";
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
  MedicalKitIcon,
  Pills2Icon,
  Scanner2Icon,
  SettingsIcon,
  SirenRoundedIcon,
  StethoscopeIcon,
  TestTubeIcon,
  UserRoundedIcon,
  UsersGroupTwoRoundedIcon,
  WalletMoneyIcon,
} from "@solar-icons/react/linear";

export type IconComponent = ComponentType<{
  className?: string;
  size?: number | string;
}>;

export type NavItem = {
  label: string;
  href: string;
  icon: IconComponent;
  permission?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navigation: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: HomeSmileIcon },
    ],
  },
  {
    title: "PATIENT SERVICES",
    items: [
      { label: "Patients", href: "/patients", icon: UserRoundedIcon },
      { label: "Appointments", href: "/appointments", icon: CalendarMarkIcon },
      { label: "Emergency Room", href: "/emergency", icon: SirenRoundedIcon },
      { label: "Admissions", href: "/admissions", icon: LoginIcon },
      { label: "Discharges", href: "/discharges", icon: LogoutIcon },
    ],
  },
  {
    title: "CLINICAL SERVICES",
    items: [
      {
        label: "Medical Records",
        href: "/medical-records",
        icon: DocumentTextIcon,
      },
      { label: "Nursing", href: "/nursing", icon: HeartPulseIcon },
      { label: "Surgery & OR", href: "/surgery", icon: MedicalKitIcon },
      { label: "Doctors & Staff", href: "/staff", icon: StethoscopeIcon },
    ],
  },
  {
    title: "DIAGNOSTIC SERVICES",
    items: [
      { label: "Laboratory", href: "/laboratory", icon: TestTubeIcon },
      { label: "Radiology", href: "/radiology", icon: Scanner2Icon },
    ],
  },
  {
    title: "MEDICATION SERVICES",
    items: [
      { label: "Pharmacy", href: "/pharmacy", icon: Pills2Icon },
      {
        label: "Prescriptions",
        href: "/prescriptions",
        icon: DocumentMedicineIcon,
      },
    ],
  },
  {
    title: "FINANCIAL SERVICES",
    items: [
      { label: "Billing", href: "/billing", icon: BillListIcon },
      { label: "Payments", href: "/payments", icon: WalletMoneyIcon },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Inventory", href: "/inventory", icon: BoxIcon },
      { label: "Departments", href: "/departments", icon: Buildings2Icon },
      { label: "Rooms & Beds", href: "/rooms-beds", icon: BedIcon },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Reports & Analytics", href: "/reports", icon: Chart2Icon },
      {
        label: "User Management",
        href: "/settings/users",
        icon: UsersGroupTwoRoundedIcon,
      },
      { label: "Audit Logs", href: "/audit-logs", icon: HistoryIcon },
      { label: "Settings", href: "/settings", icon: SettingsIcon },
    ],
  },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard" || href === "/settings") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
