// Department codes from the reference seed that represent administrative,
// ancillary, or diagnostic units. They do not own inpatient beds or operating
// theatres, so they must not appear in patient-care workflows such as
// admissions and surgery scheduling.
const NON_PATIENT_CARE_DEPARTMENT_CODES = new Set([
  "ADMIN",
  "BILL",
  "LAB",
  "PHARM",
  "RAD",
]);

export function isPatientCareDepartment(code: string): boolean {
  return !NON_PATIENT_CARE_DEPARTMENT_CODES.has(code.trim().toUpperCase());
}
