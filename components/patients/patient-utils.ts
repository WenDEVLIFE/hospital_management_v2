import type { PatientListRow } from "@/types/hospital";

export function getPatientAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (
    monthDelta < 0 ||
    (monthDelta === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function formatPatientAddress(patient: PatientListRow): string {
  return [patient.address_line, patient.city, patient.province]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ");
}
