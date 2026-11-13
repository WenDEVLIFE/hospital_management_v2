/**
 * Supabase connectivity check.
 *
 * Usage: node --env-file=.env.local scripts/check-supabase.mjs
 *
 * Probes every table from the migrations with the publishable key and reports
 * whether it exists. PostgREST returns 42501 for existing tables the anon role
 * cannot read, and PGRST205 for tables missing from the schema cache.
 *
 * Never prints credential values.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(url);
} catch {
  console.error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  process.exit(1);
}

const tables = [
  "admission_bed_assignments",
  "admissions",
  "appointments",
  "audit_logs",
  "beds",
  "clinical_notes",
  "departments",
  "diagnoses",
  "emergency_contacts",
  "encounters",
  "inventory_batches",
  "inventory_categories",
  "inventory_items",
  "invoice_items",
  "invoices",
  "laboratory_order_items",
  "laboratory_orders",
  "laboratory_results",
  "laboratory_specimens",
  "laboratory_tests",
  "medical_histories",
  "medication_dispenses",
  "medications",
  "notifications",
  "nursing_assessments",
  "nursing_notes",
  "patient_allergies",
  "patient_care_assignments",
  "patient_transfers",
  "patients",
  "payments",
  "permissions",
  "physicians",
  "prescription_items",
  "prescriptions",
  "profiles",
  "radiology_orders",
  "radiology_reports",
  "reference_sequences",
  "role_permissions",
  "roles",
  "rooms",
  "staff_department_assignments",
  "staff_profiles",
  "stock_transactions",
  "user_roles",
  "vital_signs",
];

const health = await fetch(`${parsed.origin}/auth/v1/health`, {
  headers: { apikey: key },
});

console.log(`Project host: ${parsed.host}`);
console.log(`Auth health: ${health.status}`);

const missing = [];
const denied = [];
const readable = [];

const batchSize = 6;
for (let index = 0; index < tables.length; index += batchSize) {
  const batch = tables.slice(index, index + batchSize);

  await Promise.all(
    batch.map(async (table) => {
      const response = await fetch(
        `${parsed.origin}/rest/v1/${table}?select=*&limit=1`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 404) {
        missing.push(table);
      } else if (response.status === 401 || response.status === 403) {
        denied.push(table);
      } else if (response.ok) {
        readable.push(table);
      } else {
        missing.push(`${table} (HTTP ${response.status})`);
      }
    })
  );
}

console.log(`Tables present: ${denied.length + readable.length} / ${tables.length}`);
console.log(`RLS-protected (anon denied): ${denied.length}`);
console.log(`Readable by anon: ${readable.length}${readable.length ? ` (${readable.join(", ")})` : ""}`);

if (missing.length) {
  console.log(`Missing tables (${missing.length}): ${missing.join(", ")}`);
} else {
  console.log("Missing tables: none");
}
