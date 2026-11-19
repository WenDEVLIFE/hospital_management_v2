import { createClient } from "@supabase/supabase-js";

/**
 * Live authorization probe for the Phase 7.4 security checklist.
 * Run with: node --env-file=.env.local scripts/verify-security.mjs
 *
 * Requires the demo accounts seeded in supabase/seed.sql and a populated
 * database (patients, clinical notes, diagnoses, invoices). Exits non-zero when
 * any assertion fails so it can gate a CI job against a seeded project.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const password = "SpmcDemo!2026";

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"} ${name} ${detail}`);
}

async function signIn(email) {
  const client = createClient(url, key);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${email}: ${error.message}`);
  return client;
}

const anon = createClient(url, key, { auth: { persistSession: false } });
const admin = await signIn("admin@spmc.test");
const reception = await signIn("reception@spmc.test");
const physician = await signIn("physician@spmc.test");
const nurse = await signIn("nurse@spmc.test");
const nurse2 = await signIn("nurse2@spmc.test");
const lab = await signIn("lab@spmc.test");
const pharmacist = await signIn("pharmacy@spmc.test");
const billing = await signIn("billing@spmc.test");
const inventory = await signIn("inventory@spmc.test");

const FINALIZED_NOTE = "f3000000-0000-4000-8000-000000000001";
const DIAGNOSIS = "f2000000-0000-4000-8000-000000000001";
const INVOICE = "ae000000-0000-4000-8000-000000000001";

async function countRows(client, table, select = "id") {
  const { data, error } = await client.from(table).select(select).limit(5);
  return { rows: data?.length ?? 0, error: error?.code ?? null };
}

// 1. Anonymous cannot read patient records.
{
  const patients = await countRows(anon, "patients");
  const notes = await countRows(anon, "clinical_notes");
  record(
    "anonymous reads patients",
    patients.rows === 0 && notes.rows === 0,
    `patients=${patients.rows} (${patients.error}) notes=${notes.rows} (${notes.error})`
  );
}

// 2. Receptionist cannot read clinical notes or diagnoses.
{
  const notes = await countRows(reception, "clinical_notes", "id, patient_id, content");
  const diagnoses = await countRows(reception, "diagnoses", "id, patient_id");
  record(
    "receptionist reads clinical notes",
    notes.rows === 0 && diagnoses.rows === 0,
    `notes=${notes.rows} diagnoses=${diagnoses.rows}`
  );
}

// 3. Physician cannot use administrative functions.
{
  const department = await physician.rpc("create_department", {
    p_code: `SEC${Date.now().toString().slice(-4)}`,
    p_name: "Security Probe Department",
  });
  const staff = await physician.rpc("create_staff_record", {
    p_user_id: "11111111-1111-4111-8111-000000000006",
    p_staff_number: `SEC-${Date.now()}`,
    p_first_name: "Nope",
    p_last_name: "Nope",
  });
  const audit = await countRows(physician, "audit_logs", "id, action");
  record(
    "physician uses admin functions",
    department.error?.code === "42501" &&
      staff.error?.code === "42501" &&
      audit.rows === 0,
    `department=${department.error?.code} staff=${staff.error?.code} audit=${audit.rows}`
  );
}

// 4. Nurse cannot modify a finalized note.
{
  const visible = await nurse
    .from("clinical_notes")
    .select("id, patient_id, status, content")
    .eq("status", "finalized")
    .limit(5);

  const target = (visible.data ?? []).find(
    (note) => note.id === FINALIZED_NOTE
  ) ?? visible.data?.[0];

  if (!target) {
    record("nurse modifies finalized note", false, "no readable finalized note to probe");
  } else {
    const update = await nurse
      .from("clinical_notes")
      .update({ content: "SECURITY PROBE: overwritten by nurse" })
      .eq("id", target.id)
      .select("id");

    const { data: after } = await admin
      .from("clinical_notes")
      .select("content")
      .eq("id", target.id)
      .maybeSingle();

    record(
      "nurse modifies finalized note",
      (update.data?.length ?? 0) === 0 &&
        after?.content === target.content,
      `rows=${update.data?.length ?? 0} error=${update.error?.code ?? "none"} unchanged=${after?.content === target.content}`
    );
  }
}

// 5. Laboratory staff cannot touch billing.
{
  const invoices = await countRows(lab, "invoices", "id, invoice_number, total_amount");
  const payments = await countRows(lab, "payments", "id, invoice_id");
  const rpc = await lab.rpc("record_payment", {
    p_invoice_id: INVOICE,
    p_amount: 1,
    p_payment_method: "cash",
  });
  record(
    "lab reads or writes billing",
    invoices.rows === 0 && payments.rows === 0 && rpc.error?.code === "42501",
    `invoices=${invoices.rows} payments=${payments.rows} rpc=${rpc.error?.code}`
  );
}

// 6. Pharmacist cannot assign administrator roles.
{
  const { data: adminRole } = await admin
    .from("roles")
    .select("id")
    .eq("slug", "hospital_admin")
    .maybeSingle();

  const rpc = await pharmacist.rpc("set_edge_user_role", {
    p_target: "11111111-1111-4111-8111-000000000006",
    p_role: adminRole?.id,
    p_grant: true,
  });

  const session = (await pharmacist.auth.getSession()).data.session;
  const response = await fetch(`${url}/functions/v1/admin-role-assignment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({
      action: "grant",
      userId: "11111111-1111-4111-8111-000000000006",
      roleId: adminRole?.id,
    }),
  });

  const direct = await pharmacist
    .from("user_roles")
    .insert({
      user_id: "11111111-1111-4111-8111-000000000006",
      role_id: adminRole?.id,
    })
    .select("user_id");

  record(
    "pharmacist grants an admin role",
    rpc.error?.code === "42501" &&
      response.status === 403 &&
      (direct.error?.code === "42501" || (direct.data?.length ?? 0) === 0),
    `rpc=${rpc.error?.code} function=${response.status} direct=${direct.error?.code ?? (direct.data?.length ?? 0)}`
  );
}

// 7. Billing staff cannot modify clinical diagnoses.
{
  const read = await countRows(billing, "diagnoses", "id, diagnosis_name");
  const update = await billing
    .from("diagnoses")
    .update({ diagnosis_name: "SECURITY PROBE" })
    .eq("id", DIAGNOSIS)
    .select("id");

  const { data: after } = await admin
    .from("diagnoses")
    .select("diagnosis_name")
    .eq("id", DIAGNOSIS)
    .maybeSingle();

  record(
    "billing modifies a diagnosis",
    read.rows === 0 &&
      (update.data?.length ?? 0) === 0 &&
      after?.diagnosis_name !== "SECURITY PROBE",
    `read=${read.rows} updated=${update.data?.length ?? 0} error=${update.error?.code ?? "none"} value=${after?.diagnosis_name}`
  );
}

// 8. Inventory staff cannot read medical records.
{
  const patients = await countRows(inventory, "patients", "id, medical_record_number");
  const notes = await countRows(inventory, "clinical_notes");
  const diagnoses = await countRows(inventory, "diagnoses");
  record(
    "inventory reads medical records",
    patients.rows === 0 && notes.rows === 0 && diagnoses.rows === 0,
    `patients=${patients.rows} notes=${notes.rows} diagnoses=${diagnoses.rows}`
  );
}

// 9. Ordinary users cannot read audit logs.
{
  const nurseAudit = await countRows(nurse, "audit_logs", "id, action");
  const labAudit = await countRows(lab, "audit_logs", "id, action");
  record(
    "nurse and lab read audit logs",
    nurseAudit.rows === 0 && labAudit.rows === 0,
    `nurse=${nurseAudit.rows} lab=${labAudit.rows}`
  );
}

// 10. Users cannot change their own roles.
{
  const { data: self } = await nurse.auth.getUser();
  const { data: adminRole } = await admin
    .from("roles")
    .select("id")
    .eq("slug", "hospital_admin")
    .maybeSingle();

  const insert = await nurse
    .from("user_roles")
    .insert({ user_id: self.user?.id, role_id: adminRole?.id })
    .select("user_id");

  const rpc = await nurse.rpc("set_edge_user_role", {
    p_target: self.user?.id,
    p_role: adminRole?.id,
    p_grant: true,
  });

  const { data: rolesAfter } = await admin
    .from("user_roles")
    .select("roles(slug)")
    .eq("user_id", self.user?.id ?? "");

  const hasAdmin = (rolesAfter ?? []).some(
    (row) => row.roles?.slug === "hospital_admin"
  );

  record(
    "nurse grants themselves an admin role",
    !hasAdmin &&
      (insert.error?.code === "42501" || (insert.data?.length ?? 0) === 0) &&
      rpc.error?.code === "42501",
    `insert=${insert.error?.code ?? (insert.data?.length ?? 0)} rpc=${rpc.error?.code} hasAdmin=${hasAdmin}`
  );
}

// 11. Changing a record id does not bypass access control.
{
  const accessible = await nurse2
    .from("clinical_notes")
    .select("id, patient_id")
    .limit(50);
  const visibleIds = new Set((accessible.data ?? []).map((note) => note.id));

  const { data: allNotes } = await admin
    .from("clinical_notes")
    .select("id, patient_id")
    .limit(50);
  const hidden = (allNotes ?? []).find((note) => !visibleIds.has(note.id));

  if (!hidden) {
    record("nurse2 reads an unassigned note by id", false, "no hidden note found");
  } else {
    const read = await nurse2
      .from("clinical_notes")
      .select("id, content")
      .eq("id", hidden.id);
    const update = await nurse2
      .from("clinical_notes")
      .update({ content: "SECURITY PROBE" })
      .eq("id", hidden.id)
      .select("id");

    record(
      "nurse2 reads an unassigned note by id",
      (read.data?.length ?? 0) === 0 && (update.data?.length ?? 0) === 0,
      `read=${read.data?.length ?? 0} update=${update.data?.length ?? 0} hidden=${hidden.id.slice(0, 8)}`
    );
  }
}

console.log("\nSUMMARY");
const failed = results.filter((entry) => !entry.ok);
console.log(`passed=${results.length - failed.length} failed=${failed.length}`);
if (failed.length) {
  console.log(failed.map((entry) => entry.name).join(" | "));
  process.exitCode = 1;
}

await Promise.all(
  [admin, reception, physician, nurse, nurse2, lab, pharmacist, billing, inventory].map(
    (client) => client.auth.signOut()
  )
);
