/**
 * Logs in with the demo admin account and requests a workspace page with the
 * resulting Supabase SSR cookies. Useful for verifying RLS-backed pages.
 *
 * Usage:
 *   node --env-file=.env.local scripts/check-auth-page.mjs [/patients]
 */
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const appUrl = process.env.APP_URL ?? "http://localhost:3101";
const path = process.argv[2] ?? "/patients";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const cookies = new Map();
const supabase = createServerClient(supabaseUrl, supabaseKey, {
  cookies: {
    getAll() {
      return [...cookies.entries()].map(([name, value]) => ({ name, value }));
    },
    setAll(cookiesToSet) {
      for (const { name, value } of cookiesToSet) {
        cookies.set(name, value);
      }
    },
  },
});

const { error } = await supabase.auth.signInWithPassword({
  email: "admin@spmc.test",
  password: "SpmcDemo!2026",
});

if (error) {
  console.error(`Sign-in failed: ${error.message}`);
  process.exit(1);
}

const cookieHeader = [...cookies.entries()]
  .map(([name, value]) => `${name}=${value}`)
  .join("; ");

const response = await fetch(`${appUrl}${path}`, {
  headers: { cookie: cookieHeader },
  redirect: "manual",
});

const html = await response.text();

console.log(`GET ${path} -> ${response.status}`);

const location = response.headers.get("location");
if (location) {
  console.log(`  location = ${location}`);
}

const checks = [
  "Patients",
  "MRN-2026-0010",
  "MRN-2026-0001",
  "Active",
  "Preview data",
];

if (path.startsWith("/patients/")) {
  checks.push("Allergies", "Appointments", "Prescriptions");
}

if (path.startsWith("/appointments")) {
  checks.push("APT-2026-0001", "Total appointments", "Daily Schedule");
}

if (path === "/admissions") {
  checks.push(
    "ADM-2026-0001",
    "Current admissions",
    "Admission list",
    "Bed board",
    "Test Patient Two"
  );
}

if (path === "/discharges") {
  checks.push("ADM-2026-0003", "Discharge records");
}

if (path === "/medical-records") {
  checks.push("ENC-2026-0001", "Encounter register", "In Progress");
}

if (path === "/nursing") {
  checks.push(
    "ADM-2026-0001",
    "Assigned patients",
    "Latest vital signs",
    "Test Patient Two",
    "Assigned nurse Test Nurse One"
  );
}

if (path === "/staff") {
  checks.push(
    "SPMC-2026-0001",
    "Doctors & Staff",
    "Staff directory",
    "Test Physician One",
    "Physician / Doctor"
  );
}

if (path === "/laboratory") {
  checks.push(
    "LAB-2026-0001",
    "Laboratory Requests",
    "Pending",
    "Complete Blood Count"
  );
}

if (path === "/radiology") {
  checks.push(
    "RAD-2026-0001",
    "Examination Requests",
    "Scheduled",
    "Chest X-ray"
  );
}

if (path === "/pharmacy") {
  checks.push("RX-2026-0001", "Prescription Queue", "Pending Prescriptions");
}

if (path === "/prescriptions") {
  checks.push("RX-2026-0001", "Prescription Records", "Paracetamol");
}

if (path === "/billing") {
  checks.push(
    "INV-2026-0001",
    "Invoices",
    "Total billing",
    "Outstanding balance"
  );
}

if (path === "/payments") {
  checks.push("PAY-2026-0001", "Recorded payments", "Total collected");
}

for (const check of checks) {
  console.log(`  ${check} = ${html.includes(check)}`);
}

if (path.startsWith("/patients/")) {
  console.log(
    `  summaryError = ${html.includes("We could not load this patient history")}`
  );
}

await supabase.auth.signOut();
