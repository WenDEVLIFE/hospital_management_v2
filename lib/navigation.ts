import type { ComponentType } from "react";
import {
  ArchiveIcon,
  BedIcon,
  BellIcon,
  BillListIcon,
  BoxIcon,
  BroomIcon,
  Buildings2Icon,
  BusIcon,
  CalendarMarkIcon,
  CaseIcon,
  Chart2Icon,
  ChefHatMinimalisticIcon,
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
  ShieldCheckIcon,
  SirenRoundedIcon,
  StethoscopeIcon,
  TestTubeIcon,
  UserRoundedIcon,
  UsersGroupTwoRoundedIcon,
  WalletMoneyIcon,
  WaterdropIcon,
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
      { label: "Patients", href: "/patients", permission: "patient.view", icon: UserRoundedIcon },
      { label: "Appointments", href: "/appointments", permission: "appointment.view", icon: CalendarMarkIcon },
      { label: "Emergency Room", href: "/emergency", permission: "emergency.view", icon: SirenRoundedIcon },
      { label: "Admissions", href: "/admissions", permission: "admission.view", icon: LoginIcon },
      { label: "Discharges", href: "/discharges", permission: "admission.view", icon: LogoutIcon },
    ],
  },
  {
    title: "CLINICAL SERVICES",
    items: [
      {
        label: "Medical Records",
        href: "/medical-records", permission: "medical_record.view",
        icon: DocumentTextIcon,
      },
      { label: "Nursing", href: "/nursing", permission: "nursing.view", icon: HeartPulseIcon },
      { label: "Surgery & OR", href: "/surgery", permission: "surgery.view", icon: MedicalKitIcon },
      { label: "Doctors & Staff", href: "/staff", permission: "hr.view", icon: StethoscopeIcon },
    ],
  },
  {
    title: "DIAGNOSTIC SERVICES",
    items: [
      { label: "Laboratory", href: "/laboratory", permission: "laboratory.view", icon: TestTubeIcon },
      { label: "Radiology", href: "/radiology", permission: "radiology.view", icon: Scanner2Icon },
      { label: "Blood Bank", href: "/blood-bank", icon: WaterdropIcon },
    ],
  },
  {
    title: "MEDICATION SERVICES",
    items: [
      { label: "Pharmacy", href: "/pharmacy", permission: "pharmacy.view", icon: Pills2Icon },
      {
        label: "Prescriptions",
        href: "/prescriptions", permission: "prescription.view",
        icon: DocumentMedicineIcon,
      },
    ],
  },
  {
    title: "FINANCIAL SERVICES",
    items: [
      { label: "Billing", href: "/billing", permission: "billing.view", icon: BillListIcon },
      { label: "Payments", href: "/payments", permission: "billing.view", icon: WalletMoneyIcon },
      {
        label: "Insurance & PhilHealth",
        href: "/insurance",
        icon: ShieldCheckIcon,
      },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Inventory", href: "/inventory", permission: "inventory.view", icon: BoxIcon },
      { label: "Departments", href: "/departments", icon: Buildings2Icon },
      { label: "Rooms & Beds", href: "/rooms-beds", permission: "bed.view", icon: BedIcon },
      { label: "Ambulance", href: "/ambulance", icon: BusIcon },
    ],
  },
  {
    title: "SUPPORT SERVICES",
    items: [
      {
        label: "Dietary",
        href: "/dietary",
        icon: ChefHatMinimalisticIcon,
      },
      {
        label: "Housekeeping",
        href: "/housekeeping",
        icon: BroomIcon,
      },
      {
        label: "Equipment & Maintenance",
        href: "/equipment",
        icon: MedicalKitIcon,
      },
      {
        label: "Mortuary",
        href: "/mortuary",
        icon: ArchiveIcon,
      },
      {
        label: "Notifications",
        href: "/notifications",
        icon: BellIcon,
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "HR & Payroll", href: "/hr", permission: "hr.view", icon: CaseIcon },
      { label: "Reports & Analytics", href: "/reports", icon: Chart2Icon },
      {
        label: "User Management",
        href: "/settings/users", permission: "user.view",
        icon: UsersGroupTwoRoundedIcon,
      },
      { label: "Audit Logs", href: "/audit-logs", permission: "audit.view", icon: HistoryIcon },
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
