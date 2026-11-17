import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const { error: authError } = await supabase.auth.signInWithPassword({
  email: "admin@spmc.test",
  password: "SpmcDemo!2026",
});

if (authError) {
  console.error("AUTH", authError.message);
  process.exit(1);
}

const { data: patient, error: patientError } = await supabase
  .from("patients")
  .select("id, medical_record_number, first_name, last_name, registration_status")
  .eq("email", "test.registration.check@example.test")
  .maybeSingle();

if (patientError || !patient) {
  console.error("PATIENT", patientError?.message ?? "not found");
  process.exit(1);
}

const { data: department, error: departmentError } = await supabase
  .from("departments")
  .select("id, name")
  .eq("code", "IPD")
  .single();

if (departmentError || !department) {
  console.error("DEPARTMENT", departmentError?.message ?? "not found");
  process.exit(1);
}

const { data: beds, error: bedError } = await supabase
  .from("beds")
  .select("id, bed_number, status")
  .in("bed_number", ["W3-302-A", "W3-302-B"]);

const bedA = beds?.find((bed) => bed.bed_number === "W3-302-A");
const bedB = beds?.find((bed) => bed.bed_number === "W3-302-B");

if (bedError || !bedA || !bedB) {
  console.error("BEDS", bedError?.message ?? "missing");
  process.exit(1);
}

console.log(
  "SETUP",
  JSON.stringify({
    patient: patient.medical_record_number,
    department: department.name,
    bedA: { number: bedA.bed_number, status: bedA.status },
    bedB: { number: bedB.bed_number, status: bedB.status },
  })
);

const create = await supabase.rpc("create_admission", {
  p_patient_id: patient.id,
  p_department_id: department.id,
  p_attending_physician_id: "33333333-3333-4333-8333-000000000001",
  p_bed_id: bedA.id,
  p_admission_type: "Elective",
  p_admission_notes: "Synthetic admission/transfer verification.",
});

console.log(
  "CREATE",
  JSON.stringify({
    admissionId: create.data ?? null,
    error: create.error
      ? { code: create.error.code, message: create.error.message }
      : null,
  })
);

if (!create.data) {
  await supabase.auth.signOut();
  process.exit(1);
}

const admissionId = create.data;

const { data: created } = await supabase
  .from("admissions")
  .select(
    "admission_number, status, patients(medical_record_number), departments(name), admission_bed_assignments(released_at, beds(bed_number))"
  )
  .eq("id", admissionId)
  .maybeSingle();

const { data: bedsAfterCreate } = await supabase
  .from("beds")
  .select("bed_number, status")
  .in("bed_number", ["W3-302-A", "W3-302-B"]);

const { data: createAudit } = await supabase
  .from("audit_logs")
  .select("action, entity_type")
  .eq("entity_id", admissionId)
  .eq("action", "admission.create");

console.log(
  "AFTER_CREATE",
  JSON.stringify({
    created,
    beds: bedsAfterCreate,
    audit: createAudit,
  })
);

const transfer = await supabase.rpc("transfer_patient", {
  p_admission_id: admissionId,
  p_to_bed_id: bedB.id,
  p_transfer_reason: "Verification transfer",
});

console.log(
  "TRANSFER",
  JSON.stringify({
    data: transfer.data ?? null,
    error: transfer.error
      ? { code: transfer.error.code, message: transfer.error.message }
      : null,
  })
);

const { data: transfers } = await supabase
  .from("patient_transfers")
  .select("from_bed_id, to_bed_id, transfer_reason")
  .eq("admission_id", admissionId);

const { data: bedsAfterTransfer } = await supabase
  .from("beds")
  .select("bed_number, status")
  .in("bed_number", ["W3-302-A", "W3-302-B"]);

const { data: transferAudit } = await supabase
  .from("audit_logs")
  .select("action, entity_type")
  .eq("entity_id", admissionId)
  .eq("action", "admission.transfer");

console.log(
  "AFTER_TRANSFER",
  JSON.stringify({
    transfers,
    beds: bedsAfterTransfer,
    audit: transferAudit,
  })
);

const discharge = await supabase.rpc("discharge_patient", {
  p_admission_id: admissionId,
  p_discharge_notes: "Verification discharge; bed released.",
});

const { data: discharged } = await supabase
  .from("admissions")
  .select("status, discharge_date, discharge_notes")
  .eq("id", admissionId)
  .maybeSingle();

const { data: bedsAfterDischarge } = await supabase
  .from("beds")
  .select("bed_number, status")
  .in("bed_number", ["W3-302-A", "W3-302-B"]);

const { data: dischargeAudit } = await supabase
  .from("audit_logs")
  .select("action, entity_type")
  .eq("entity_id", admissionId)
  .eq("action", "admission.discharge");

console.log(
  "AFTER_DISCHARGE",
  JSON.stringify({
    data: discharge.data ?? null,
    error: discharge.error
      ? { code: discharge.error.code, message: discharge.error.message }
      : null,
    discharged,
    beds: bedsAfterDischarge,
    audit: dischargeAudit,
  })
);

await supabase.auth.signOut();
