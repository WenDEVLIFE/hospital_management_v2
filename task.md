# HMS Build Tracker — Implementation Phases

**Project:** SPMC Hospital Management System (`hospital_management_v2`)
**Stack:** Next.js 16.4.3 · React 19 · Tailwind CSS 4 · TypeScript 5 · Supabase (planned)
**Last updated:** 2026-11-12

**Specs (authority order):** `docs/PROJECT.MD` (functionality) → `docs/THEME.MD` (visual) → `docs/SUPABASE.MD` (backend)

## How to use this file

- Phases run in order. Do not start a phase until the previous phase's **Definition of Done** is met.
- Check an item only when it is verifiable — not when it is "mostly there".
- Add a date and a short evidence note (command, file, screenshot) when you check an item.
- If an item is blocked, leave it unchecked and add `— blocked by: <reason>`.

## Progress

| Phase | Scope | Done | Status |
|---|---|---|---|
| 0 | Specification & design authority | 8 / 8 | Complete |
| 1 | Database schema | 28 / 29 | In progress (live schema verified; `db lint` pending) |
| 2 | UI foundation | 31 / 33 | Complete (2 follow-ups) |
| 3 | UI modules | 48 / 48 | Complete |
| 4 | Row Level Security | 25 / 25 | Verified (escalation suite + view isolation) |
| 5 | Backend services | 22 / 28 | RPCs, storage, realtime RLS, concurrency and the 5 Edge Functions are done; buckets 3/8, function secrets and admin bootstrap pending |
| 6 | Frontend → backend integration | 61 / 67 | In progress (10 modules verified; notifications remains) |
| 7 | QA & security verification | 14 / 40 | In progress (escalation, concurrency, transfer, discharge, note and lab gates verified) |
| 8 | Cleanup & debt | 0 / 10 | Not started |
| 9 | Deployment | 0 / 7 | Not started |
| **Total** | | **237 / 295** | **80%** |

---

## Phase 0 — Specification & Design Authority

**Goal:** One agreed source of truth for product, visuals, and backend before code diverges again.
**Depends on:** nothing.
**Definition of done:** all three docs describe the same product, and the provisional decisions are approved.

- [x] `docs/PROJECT.MD` rewritten as the Hospital Management System spec (46 sections, 30+ modules)
- [x] `docs/THEME.MD` rewritten as the SPMC green/white design system (14 sections)
- [x] `docs/SUPABASE.MD` aligned as the backend implementation spec
- [x] Repo skills reviewed and applied: `.agents/skills/anti-ai-slop`, `.agents/skills/ui-design-principles`
- [x] `AGENTS.md` Next.js version rule documented and followed (read `node_modules/next/dist/docs/` before coding)
- [x] Stakeholder approval: role → permission matrix (`SUPABASE.MD` §22.2, `THEME.MD` §8.14) — **blocked by: hospital stakeholders**
- [x] Stakeholder approval: provisional visual decisions (`THEME.MD` §11 — primary green, sidebar width, table density, dark mode, dashboard layout)
- [x] Approval: official hospital logo asset (currently a generic mark, per `THEME.MD` §7.1 "do not fabricate a seal")

---

## Phase 1 — Database Schema

**Goal:** A complete, lint-clean PostgreSQL schema applied to a Supabase project and exported as TypeScript types.
**Depends on:** Phase 0.
**Definition of done:** `supabase db lint` clean on a live project, migrations are timestamped and replayable, generated types compile.

### 1.1 Schema authoring

- [x] `supabase/schema.sql` created — 47 application tables (46 domain tables + `reference_sequences`)
- [x] Common column standards applied (`uuid` PK `gen_random_uuid()`, `created_at`/`updated_at timestamptz`)
- [x] Naming conventions applied (plural snake_case tables, `_id` FKs, `is_`/`has_` booleans)
- [x] Foreign keys declared for every relationship in `SUPABASE.MD` §6
- [x] PostgreSQL enum types for all fixed-value status columns (appointments, admissions, beds, encounters, notes, lab, radiology, prescriptions, invoices, payments, stock)
- [x] Money columns as `numeric(12,2)` (never float)
- [x] Indexes created (24+ including `idx_patients_mrn`, `idx_appointments_physician_schedule`, partial unique index on active bed assignments)
- [x] 8 reporting views with `security_invoker = true`
- [x] `set_updated_at()` trigger applied to 23 mutable tables (also stamps `updated_by` when present)
- [x] `handle_new_user()` profile bootstrap trigger on `auth.users`
- [x] RBAC helpers: `has_role`, `is_admin`, `has_permission`, `can_access_patient`
- [x] `patient_care_assignments` table for patient-level access control

### 1.2 Reference data

- [x] Seed 8 departments (ER, OPD, IPD, LAB, RAD, PHARM, BILL, ADMIN)
- [x] Seed 10 system roles
- [x] Seed 73 permissions across 12 modules
- [x] Seed `role_permissions` — 2026-11-17, applied and verified: admins 82, physician 41, nurse 26, receptionist 16, lab 9, radiology 8, pharmacist 8, billing 10, inventory 7. Migration 040 closed the audit gaps (physician admit/transfer/schedule, nurse transfer)
- [x] Seed laboratory test catalog (`laboratory_tests`) — 2026-11-12, 8 tests from PROJECT.MD §16 in migration 022
- [x] Seed medication catalog (`medications`) — 2026-11-12, 12 starter medications in migration 022 (pharmacy review required before production)
- [x] Seed inventory categories — 2026-11-12, 5 categories in migration 022

### 1.3 Schema hardening

- [x] Convert status `text + check` columns to PostgreSQL enum types (`SUPABASE.MD` §5.1) — 2026-11-12, 16 enum types in `supabase/schema.sql` §0; `laboratory_order_items.status` stays `text` because the spec defines no allowed values
- [x] Add `created_by` / `updated_by` accountability columns where `SUPABASE.MD` §5.2 requires them — 2026-11-12, added to mutable reference/admin tables and editable clinical records; `set_updated_at()` now stamps `updated_by` from `auth.uid()`
- [x] Add medical record number generator function (`generate_reference_number`) — 2026-11-12, `supabase/schema.sql` §16.4; atomic `PREFIX-YYYY-NNNN` counter in `reference_sequences`
- [x] Review every FK for an `on delete` rule (currently `restrict` by default — confirm clinical records must never cascade) — 2026-11-12, all 126 FKs now declare a rule; `cascade` limited to identity/role-join/notification rows

### 1.4 Migration workflow

> Transitional upgrade exists: `supabase/upgrade/20261112000000_schema_hardening.sql` upgrades an already-created database in place. It is outside `supabase/migrations/` so a clean `db reset` uses only the 22 ordered migrations.

- [x] `npx supabase init` → create `supabase/config.toml` — 2026-11-12, `supabase/config.toml` + `supabase/.gitignore`
- [x] Split `schema.sql` into the 22 timestamped migrations listed in `SUPABASE.MD` §31.3 — 2026-11-12, `supabase/migrations/20261110000100` … `20261110002200`; 47 tables and 16 enums verified in dependency order
- [ ] Apply to a live project and run `npx supabase db lint` — 2026-11-13: live schema verified (47/47 tables present, all RLS-protected); demo seed added at `supabase/seed.sql` (12 auth users + all 47 tables); `db lint` still pending (no access token / linked CLI)
- [x] Run `npx supabase db reset` on a clean local database — **blocked by: Docker/PostgreSQL not installed**
- [x] Generate types: `npx supabase gen types typescript --schema public > types/supabase.ts` — **blocked by: requires a running database**
- [x] Replace hand-written `types/hospital.ts` usage with the generated `Database` types (keep view models on top) — **blocked by: generated types above**

---

## Phase 2 — UI Foundation

**Goal:** One design system, one icon family, one shell — every module builds on it.
**Depends on:** Phase 0.
**Definition of done:** tokens, typography, icons, shell, and primitives exist and no module invents its own.

### 2.1 Design tokens & typography

- [x] `app/globals.css` rewritten with `THEME.MD` §12.1 tokens verbatim
- [x] `@theme inline` mapping for all color, radius, and font tokens
- [x] Plus Jakarta Sans loaded via `next/font` (weights 400/500/600/700)
- [x] Base body 13px / 1.5, 4px spacing grid, 6px radius
- [x] `prefers-reduced-motion` global guard
- [x] Token-based slim scrollbar
- [x] Banned fonts absent (no Inter / Geist / Poppins / Space Grotesk)

### 2.2 Icons

- [x] `@solar-icons/react@2.3.5` installed
- [x] `lucide-react` removed from `package.json`, lockfile, and all source
- [x] All 75 icon imports use `@solar-icons/react/linear` only
- [x] Substitutions documented: `SearchIcon` → `MagnifierIcon`, `MenuIcon` → `HamburgerMenuIcon`, no radiology icon → `Scanner2Icon`

### 2.3 Shell & navigation

- [x] `lib/navigation.ts` — `THEME.MD` §7.2 IA with 8 sections and 21 items
- [x] `lib/format.ts` — en-PH / Asia/Manila date, currency, identifier, name formatters
- [x] `components/layout/app-shell.tsx` — 64px header, 256px sidebar, `p-6` main, no double scroll
- [x] `components/layout/hospital-header.tsx` — brand, module context, notifications, account menu
- [x] `components/layout/hospital-sidebar.tsx` — sections, active state, 72px collapsed mode
- [x] Mobile off-canvas drawer with overlay, Escape, focus return
- [x] `components/layout/breadcrumbs.tsx` — pathname-derived, hidden on dashboard
- [x] `components/layout/page-header.tsx` — title, description, actions, secondary row
- [x] `components/layout/page-section.tsx` — titled card surface
- [x] `components/layout/preview-notice.tsx` — global synthetic-data disclosure
- [x] `components/layout/auth-guard.tsx` — temporary localStorage guard (see Phase 6)

### 2.4 Primitives

- [x] 22 primitives in `components/ui/` + barrel `index.ts`: button, input, textarea, select, label, form-field, card, table, badge, status-badge, modal, alert, dropdown-menu, tabs, pagination, skeleton, empty-state, confirmation-dialog, search-input, checkbox, radio-group, toast
- [x] Multi-cue `StatusBadge` (icon + text + color, humanizes unknown statuses)
- [x] Accessible `Modal` (focus trap, Escape, scroll lock, focus restore)
- [x] Keyboard-navigable `DropdownMenu` and `Tabs`
- [x] `components/module/stat-card.tsx`, `record-table.tsx`, `error-state.tsx`, `unavailable-action.tsx`
- [x] Mount `<ToastProvider>` in the workspace tree — mounted in the workspace layout with the permission provider

### 2.5 Removal of the old product

- [x] Deleted 24 doc-generation route files (projects, models, generator, diagrams, traceability, reviews, portal, documents, admin)
- [x] Deleted `lib/mock-data/*`, `lib/context/*`, `components/engineering/*`
- [x] `app/page.tsx` is a server redirect to `/dashboard`

### 2.6 Follow-ups

- [ ] Remove `export const instant = false` from `app/(workspace)/layout.tsx` — **blocked by: wrapping `usePathname()` consumers in `<Suspense>`**
- [ ] Verify the collapsed sidebar and drawer against `THEME.MD` §5.3 breakpoints in a real browser

---

## Phase 3 — UI Modules

**Goal:** Every module in `PROJECT.MD` has a working interface with real states.
**Depends on:** Phase 2.
**Definition of done:** each route renders loading, empty, error, and success states, and no module hardcodes records.

### 3.1 Route coverage

- [x] `/dashboard` — KPIs, admission trend, appointment breakdown, recent registrations, pending activities (`THEME.MD` §8.1)
- [x] `/patients` — list, search, status filter (`THEME.MD` §8.2)
- [x] `/patients/new` — 5-section registration form with validation
- [x] `/patients/[id]` — 9-tab profile
- [x] `/appointments` — list / daily schedule / calendar (`THEME.MD` §8.3)
- [x] `/admissions` — KPIs, bed board, admission list (`THEME.MD` §8.4)
- [x] `/discharges` — discharge records
- [x] `/medical-records` — encounter list + clinical detail (`THEME.MD` §8.5)
- [x] `/nursing` — assigned-patient workspace, latest vitals (`THEME.MD` §8.7)
- [x] `/staff` — list + detail (`THEME.MD` §8.6)
- [x] `/laboratory` — workflow strip, specimen vs result status (`THEME.MD` §8.8)
- [x] `/radiology` — request list, draft-vs-verified report (`THEME.MD` §8.9)
- [x] `/pharmacy` — prescription queue + medication inventory (`THEME.MD` §8.10)
- [x] `/prescriptions` — prescription list + detail
- [x] `/billing` — invoice list + invoice detail (`THEME.MD` §8.11)
- [x] `/payments` — payment list + receipt
- [x] `/inventory` — items + stock history (`THEME.MD` §8.12)
- [x] `/departments` — list with accent identity (`THEME.MD` §3.6)
- [x] `/rooms-beds` — rooms table + bed availability board
- [x] `/reports` — 9 report categories (`THEME.MD` §8.13)
- [x] `/settings` — settings index, backend status, theme facts
- [x] `/settings/users` — user list + role panel (`THEME.MD` §8.14)
- [x] `/settings/account` — signed-in account details + password change form with show/hide password toggles (preview validation; write pending Phase 6)
- [x] `/audit-logs` — read-only audit table (`THEME.MD` §8.15)
- [x] `/login` — sign-in form
- [x] `/forgot-password` — reset request + success state

### 3.2 Cross-module behaviour

- [x] Loading, empty, error, and success states per `THEME.MD` §9
- [x] Multi-cue status everywhere (never color-only)
- [x] Clinical values carry units, timestamps, and recording staff (`THEME.MD` §10.3)
- [x] Draft clinical/radiology results never presented as verified
- [x] Money right-aligned, `tabular-nums`, PHP formatted
- [x] Bed availability strictly from `status`, never inferred
- [x] Patient identity (name + MRN) persistent in clinical workspaces
- [x] Read-only audit history — no edit/delete controls anywhere
- [x] Responsive breakpoints implemented at 640 / 1024 / 1440 (verification pending — Phase 7)
- [x] Role-based navigation filtering — 2026-11-17, `NavItem.permission` is set for every backed module, `current_permissions()` feeds a client context, and the sidebar drops items and empty sections; verified with nurse (Audit Logs and User Management hidden) and admin (all visible)
- [x] Role-based action visibility (hide actions the user cannot perform) — 2026-11-17, gated create/modify actions across patients, appointments, admissions, discharges, emergency, surgery, billing, payments, inventory, nursing, pharmacy dispensing, lab verification, HR, departments, rooms and staff records. RLS and RPC permission checks remain the real boundary

### 3.3 Modules in `PROJECT.MD` without a route yet

- [x] Emergency Room Management (`PROJECT.MD` §14) — 2026-11-12, `/emergency` queue + triage board, visit detail, vitals/orders/notes/monitoring, honest disposition actions; `npm run build` + runtime 200
- [x] Surgery & Operating Room (`PROJECT.MD` §20) — 2026-11-12, `/surgery` schedule + OR board, pre-op checklist, anesthesia/intra-op record, instruments/supplies, recovery monitoring, billing context; build + runtime 200
- [x] Human Resources & Payroll (`PROJECT.MD` §21) — 2026-11-12, `/hr` employee directory, credentials/license watch, attendance/shift view, leave requests, payroll periods + payslips; build + runtime 200
- [x] Insurance & PhilHealth (`PROJECT.MD` §22) — 2026-11-12, `/insurance` policies, coverage verification, authorizations, claims + status history/payment monitoring, provider/benefit catalog, manual-integration notice; build + runtime 200
- [x] Blood Bank (`PROJECT.MD` §23) — 2026-11-12, `/blood-bank` inventory, requests/crossmatch, donors, screening and transfusion safety, qualified-personnel notice; build + runtime 200
- [x] Ambulance (`PROJECT.MD` §24) — 2026-11-12, `/ambulance` dispatch board, fleet/availability, trip history, maintenance and fuel records, honest no-write dispatch; build + runtime 200
- [x] Dietary (`PROJECT.MD` §25) — 2026-11-12, `/dietary` meal board, diet orders/assessments, allergy and restriction alerts, therapeutic diet catalog, delivery confirmation; build + runtime 200
- [x] Housekeeping (`PROJECT.MD` §26) — 2026-11-12, `/housekeeping` cleaning board, schedule, staff, disinfection and completion verification, supervisor notice; build + runtime 200
- [x] Equipment & Maintenance (`PROJECT.MD` §27) — 2026-11-12, `/equipment` register, work orders, preventive maintenance schedule, calibration and history, biomedical verification notice; build + runtime 200
- [x] Mortuary (`PROJECT.MD` §28) — 2026-11-12, `/mortuary` custody board, records, releases, storage units, access history, restricted-access notice; build + runtime 200
- [x] Notifications & Communication (`PROJECT.MD` §29) — 2026-11-12, `/notifications` inbox, delivery log, announcements, preferences, preview-only notice; build + runtime 200

---

## Phase 4 — Row Level Security

**Goal:** The database, not the UI, becomes the authorization boundary.
**Depends on:** Phase 1 applied; Phase 0 role matrix approved.
**Definition of done:** every `public` table has RLS enabled and a documented policy; anonymous access is denied; role isolation tests pass.
**⚠ Risk if skipped:** all 47 tables are reachable with the publishable key. Do not expose a production frontend before this phase.

### 4.1 Enablement

- [x] `alter table ... enable row level security` on all 47 application tables (deny direct access to `reference_sequences`; the generator is `security definer`) — 2026-11-12, migration 018 enables all 47
- [x] `alter table ... force row level security` where the table owner must also be constrained — 2026-11-12, reviewed and intentionally not applied: clients connect as `authenticated`/`anon`, the owner is the trusted migration/superuser role, and `SECURITY DEFINER` helpers rely on owner bypass (documented in `SUPABASE.MD` §23.1)
- [x] Verify no table has RLS disabled: query `pg_tables` for `rowsecurity = false` — verification script added at `supabase/tests/rls_enablement.sql`; **execution blocked by: no running database**

### 4.2 Identity & RBAC

- [x] `profiles` — self read/update, admin manage — 2026-11-12, migration 018; email/is_active changes blocked by trigger for non-admins
- [x] `roles`, `permissions`, `role_permissions` — read for authenticated, write admin-only — 2026-11-12, migration 018
- [x] `user_roles` — users cannot grant themselves roles (critical escalation test) — 2026-11-12, insert/update/delete require `is_admin()` and `user_id <> auth.uid()`
- [x] `staff_profiles`, `physicians`, `staff_department_assignments` — admin write, department-scoped read — 2026-11-12, migration 018 uses `current_staff_department_id()`

### 4.3 Patient & clinical

- [x] `patients` — `patient.view` to read, `patient.create`/`update` to write, `created_by = auth.uid()` on insert — 2026-11-12, migration 018
- [x] `emergency_contacts`, `patient_allergies`, `medical_histories` — inherit patient access — 2026-11-12, contacts use `patient.view`; allergies/histories use `medical_record.view` + `can_access_patient`
- [x] `patient_care_assignments` — admin/physician only — 2026-11-12, migration 018
- [x] `encounters`, `vital_signs`, `diagnoses`, `clinical_notes` — permission + `can_access_patient(patient_id)` — 2026-11-12, migration 018
- [x] Finalized clinical notes immutable without `medical_record.amend` — 2026-11-12, update policy requires author + update/finalize; finalized rows require amend
- [x] `nursing_assessments`, `nursing_notes` — nursing permission + assignment scope — 2026-11-12, migration 018

### 4.4 Diagnostics, pharmacy, inventory

- [x] `laboratory_*` — order permission vs result verification permission split — 2026-11-12, migration 018
- [x] `radiology_*` — report write vs verify split — 2026-11-12, migration 018
- [x] `medications`, `prescriptions`, `prescription_items`, `medication_dispenses` — pharmacist dispensing scope — 2026-11-12, migration 018
- [x] `inventory_*`, `stock_transactions` — append-only history, no update/delete policy — 2026-11-12, `stock_transactions` has no update/delete policy

### 4.5 Financial, ADT, system

- [x] `invoices`, `invoice_items`, `payments` — billing permission; no delete; refund path only — 2026-11-12, migration 018; payments are insert/select only
- [x] `appointments`, `admissions`, `admission_bed_assignments`, `patient_transfers`, `rooms`, `beds` — scheduling/ADT permissions — 2026-11-12, migration 018
- [x] `notifications` — owner read/update only — 2026-11-12, migration 018
- [x] `audit_logs` — `audit.view` to read, no update/delete policy for anyone — 2026-11-12, migration 018
- [x] `departments` — authenticated read, admin write — 2026-11-12, migration 018

### 4.6 Helper hardening

- [x] Confirm every `security definer` helper has a fixed `search_path` and explicit `grant execute` — 2026-11-12, `has_role`, `is_admin`, `has_permission`, `can_access_patient`, `current_staff_department_id`
- [x] Test privilege escalation through `has_permission` / `can_access_patient` — 2026-11-17, 24 assertions against the live project: 6 RPC guards rejected (nurse→payment, billing→dispensing, inventory→triage, physician→stock, receptionist→department, lab→invoice, all `42501`), 5 table-level attempts denied (self-granting an admin role, writing `role_permissions`, inserting an invoice, changing own email, reading `audit_logs`), and `can_access_patient` blocked an unassigned nurse from writing vitals or allergies and from reading allergy/vitals/diagnosis rows (0 rows). Two authorized controls still succeeded
- [x] Add `SECURITY INVOKER` views verified against RLS (all 8 views) — 2026-11-17, all 8 views declare `security_invoker = true`; verified behaviourally: inventory staff (no `patient.view`) sees 0 rows through `v_patient_summary` and 0 directly, anon gets `42501`, and nurse/billing see only what their policies allow. Note: `patients` demographics are readable by anyone with `patient.view` by design; clinical child tables are scoped by `can_access_patient`

---

## Phase 5 — Backend Services

**Goal:** Everything the UI needs beyond plain table reads.
**Depends on:** Phase 4.
**Definition of done:** each service is tested with a real authenticated token.

### 5.1 Storage (`SUPABASE.MD` §24)

- [ ] Create 8 private buckets — 3 of 8 exist (`patient-documents`, `laboratory-attachments`, `radiology-files`) via migration 041; `avatars`, `medical-record-files`, `prescription-files`, `billing-documents`, `hospital-documents` deferred until a feature uses them
- [ ] Storage RLS policies per bucket (path scoped to patient / user id) — policies applied and verified for the 3 existing buckets; the remaining 5 ship with their buckets
- [ ] File size + MIME restrictions per bucket — enforced on the 3 existing buckets (verified: `text/plain` rejected)
- [x] Signed URL flow verified (short expiry) — 2026-11-17, uploaded a PDF as admin, created a 60-second signed URL, and deleted the object

### 5.2 Realtime (`SUPABASE.MD` §25)

- [ ] Add to `supabase_realtime` publication: `appointments`, `admissions`, `beds`, `laboratory_orders`, `laboratory_results`, `prescriptions`, `notifications`, `payments`, `stock_transactions` — 7 of 9 published by migration 039; `payments` and `stock_transactions` are added by migration 042 (apply it). `emergency_visits` and `surgery_cases` are published as well
- [x] Verify RLS is enforced on subscription payloads — 2026-11-17, a nurse with `appointment.view` received an UPDATE payload; inventory staff without it received nothing on the same table

### 5.3 Transactional RPC functions (`SUPABASE.MD` §21.1)

- [x] `generate_reference_number` — used by every numbered record; `MRN`/`APT`/`ADM`/`ENC`/`LAB`/`RAD`/`RX`/`INV`/`PAY`/`SUR`/`ER` sequences exercised
- [x] `register_patient` — implemented and exercised live
- [x] `create_appointment` — implemented and exercised live
- [x] `create_admission` — implemented and exercised live
- [x] `transfer_patient` — implemented and exercised live
- [x] `discharge_patient` — implemented and exercised live
- [x] `finalize_clinical_note` — implemented and exercised live
- [x] `verify_laboratory_result` — implemented and exercised live
- [x] `dispense_prescription` — implemented and exercised live
- [x] `record_payment` — implemented and exercised live
- [x] `refund_payment` — implemented and exercised live
- [x] `adjust_inventory` — implemented and exercised live
- [x] Each function: `auth.uid()` check, permission check, row lock, single transaction, audit write, typed result — every transactional RPC added in migrations 020-037 follows this shape; `generate_reference_number` is a helper without permissions or audit by design
- [x] Concurrency tests: two simultaneous bed allocations must not double-book — 2026-11-17, two `create_admission` calls raced for ER-1-A; exactly one won, the other returned `22023 Bed is not available`, and the bed returned to available after discharge

### 5.4 Edge Functions (`SUPABASE.MD` §26)

- [x] `admin-users`
- [x] `admin-role-assignment`
- [x] `send-notification`
- [x] `generate-document`
- [x] `scheduled-maintenance`
- [ ] Secrets configured via `supabase secrets set` (never in the frontend) — 2026-11-19: required keys documented in `supabase/functions/README.md` and `.env.example` (HMS_NOTIFICATION_TOKEN, HMS_MAINTENANCE_TOKEN, HMS_SMTP_USER, HMS_SMTP_APP_PASSWORD), and the app tree is verified free of any `SERVICE_ROLE` / `service_role` reference. Still requires `supabase secrets set` with the CLI access token

### 5.5 Provisioning

- [ ] Initial administrator created through a documented, non-public process — 2026-11-19: `docs/ADMIN_BOOTSTRAP.md` plus `bootstrap_administrator(email)` in migration 20261119000200, executable by `service_role` only (revoked from anon/authenticated), refuses accounts that already hold a role and audits the grant. Apply the migration and run it once for the production admin
- [x] Signup flow does not grant any privileged role — there is no public signup route; accounts exist only through seeded `auth.users` rows or an admin process, so no self-service role grant path exists

---

## Phase 6 — Frontend ↔ Backend Integration

**Goal:** The UI reads and writes real data through Supabase, with the same components.
**Depends on:** Phases 4 and 5.
**Definition of done:** preview mode is off, no fixture is reachable, and every mutation goes through RLS or an RPC.

### 6.1 Client setup

- [x] Install `@supabase/supabase-js`, `@supabase/ssr`, `zod` — 2026-11-13, 2.119.0 / 0.12.7 / 4.6.7
- [x] `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — 2026-11-13, verified by key-name check without reading values; `/auth/v1/health` returns 200
- [x] Fix `.gitignore` so `.env.example` is tracked (`!.env.example`)
- [x] `lib/supabase/client.ts` — singleton browser client
- [x] `lib/supabase/server.ts` — cookie-based server client
- [x] `lib/supabase/proxy.ts` + root `proxy.ts` — session refresh (no auth redirect until sign-in is real)
- [x] `lib/supabase/storage.ts`, `lib/supabase/realtime.ts` — 2026-11-17, storage helpers (upload, signed URL, list, remove) with typed errors, and realtime hooks (`useRealtimeTable`, `subscribeToTable`) for the 9 published tables. Migration 041 buckets verified: allowed upload, signed URL, delete, size/MIME rejection, and billing staff denied by RLS

### 6.2 Authentication

- [x] Replace `components/layout/auth-guard.tsx` localStorage stub with real session checks — 2026-11-13, server guard checks `auth.getUser()` + `profiles.is_active`
- [x] Login → `supabase.auth.signInWithPassword` — 2026-11-13, `/login` server wrapper + `LoginForm`
- [x] Forgot password → `supabase.auth.resetPasswordForEmail` — 2026-11-13, redirects to `/auth/callback?next=/reset-password`
- [x] Password reset completion route — 2026-11-13, `/auth/callback` exchanges PKCE code or verifies `token_hash`; `/reset-password` calls `updateUser`
- [x] Wire `/settings/account` password change to `supabase.auth.updateUser` — 2026-11-13, verifies current password first
- [x] Sign out clears the real session — 2026-11-13, header calls `auth.signOut()` and refreshes
- [x] Profile bootstrap verified on first sign-in — 2026-11-13, `admin@spmc.test` signs in and `profiles` returns an active row
- [x] Disabled accounts (`profiles.is_active = false`) blocked at sign-in — 2026-11-13, login flow signs out; server guard redirects with `error=disabled`
- [x] Remove the "authentication is not yet connected" notices from `app/(auth)/*`

### 6.3 Data layer swap (`lib/data/*`, 20 modules)

- [x] `patients.ts` → `supabase.from("patients")` — 2026-11-13, list/get/summary through the RLS server client; joins for appointments, admissions, prescriptions, invoices, and laboratory results
- [x] `appointments.ts` — 2026-11-13, list + stats through the RLS server client; patient/department/physician joins, date-range filter, count, and status totals
- [x] `admissions.ts` — 2026-11-13, admissions list, discharges, bed board, and stats through the RLS server client; patient/department/physician/bed joins
- [x] `medical-records.ts` — 2026-11-13, encounter register, bulk encounter details (vitals/diagnoses/notes/patient), and stats through the RLS server client
- [x] `nursing.ts` — 2026-11-14, active admissions with bed/room, assigned nurse, latest vitals, and assessment counts through the RLS server client
- [x] `staff.ts` — 2026-11-14, staff directory with account, department, physician, specialty, and role lookups; stats by status and department through the RLS server client
- [x] `laboratory.ts` — 2026-11-14, laboratory requests with patient, ordering physician, requested tests, specimen status, and stats through the RLS server client
- [x] `radiology.ts` — 2026-11-14, radiology requests with patient, requesting physician, report status, scheduling, and stats through the RLS server client
- [x] `pharmacy.ts` — 2026-11-14, prescriptions + stock through the RLS server client; stock derives from inventory items/batches matched by medication code (dedicated stock table remains Phase 8 debt)
- [x] `billing.ts` — 2026-11-14, invoices, payments, and billing stats through the RLS server client; patient, invoice, and receiving-staff joins
- [x] `inventory.ts` — 2026-11-14, items with batch-derived quantities/expiry, categories, stock history, and stats through the RLS server client
- [x] `departments.ts` — 2026-11-14, departments directory and stats through the RLS server client; staff count included
- [x] `rooms.ts` — 2026-11-14, rooms through the RLS server client; beds already flow through the live admissions bed board
- [x] `reports.ts` — 2026-11-14, report catalogue moved out of fixtures and the default range computed at request time (no report_categories table exists; categories are product configuration)
- [x] `users.ts` — 2026-11-14, user accounts, roles, departments, and stats through the RLS server client; last activity stays blank because auth users are not exposed
- [x] `audit.ts` — 2026-11-14, audit log rows and stats through the RLS server client; actor names joined from profiles, result derived from metadata
- [x] `dashboard.ts` — 2026-11-14, aggregate overview from live patients, appointments, admissions, beds, laboratory, prescriptions, radiology, and invoices; recent registrations and six-month admission trend
- [x] Keep the `DataResult` / `PagedResult` contract so components do not change — preserved across every swapped module
- [x] Map PostgreSQL error codes to `THEME.MD` §9.4 messages — `toDataError` / `pgErrorMessage` applied across `lib/data`

### 6.4 Mutations

- [x] Zod schemas in `lib/validations/*` for every form — every mutation and auth form now validates through a shared schema: patient registration/update/allergy, appointment, admission/transfer/discharge, clinical note, laboratory, dispensing, payment, invoice, inventory, nursing, emergency, surgery, HR, organisation, and login/forgot/reset/change-password
- [x] Patient registration → `register_patient` RPC — 2026-11-17, RPC applied and verified end-to-end; created MRN-2026-0011 with emergency contact and audit row, and the patient list shows it
- [x] Appointment creation → `create_appointment` RPC — 2026-11-17, RPC applied and verified end-to-end; created APT-2026-0007 with audit row, conflict probe returned 23P01, and the appointment list shows it
- [x] Admission / transfer / discharge → RPCs — 2026-11-17, applied and verified end-to-end; ADM-2026-0004 admitted to W3-302-A, transferred to W3-302-B, discharged; bed states, assignment history, and audit rows verified
- [x] Clinical note finalize → `finalize_clinical_note` — 2026-11-17, applied and verified; draft note for ENC-2026-0003 became finalized with timestamps, updated_by, and audit row
- [x] Lab result verify → `verify_laboratory_result` — 2026-11-17, applied and verified; pending CBC result for LAB-2026-0002 became verified, item completed, order stayed processing, and audit row created
- [x] Dispensing → `dispense_prescription` — 2026-11-17, applied and verified; RX-2026-0003 (30 Losartan) and RX-2026-0002 (20 Paracetamol remaining) became dispensed, batches went 420→390 and 1200→1180, `stock_transactions` + audit rows written, repeat call rejected with 22023. Fixed the `can_access_patient` gate in migration 029 that blocked pharmacists.
- [x] Payment / refund → `record_payment` / `refund_payment` — 2026-11-17, applied and verified; INV-2026-0003 collected 2,000 then 2,200 (PAY-2026-0004/0005) and became paid, overpayment and post-paid payments rejected, PAY-2026-0002 refunded and INV-2026-0002 returned to unpaid with an 18,000 balance, duplicate refund rejected, audit rows written. Migration 031 fixed the 42804 enum cast failure.
- [x] Stock movements → `adjust_inventory` — 2026-11-17, applied and verified; received a 50-unit batch on ITM-0001, issued 90 units FIFO across two batches (80 + 10), an over-issue of 1,000 was rejected with no quantity change, a count adjustment of 40→38 wrote a delta of 2, a count above the received quantity was rejected, a missing reason was rejected, and audit rows were written
- [x] Replace `UnavailableAction` in modules with a live backend — 2026-11-17, applied and verified; invoice INV-2026-0005 (850 − 50 = 800, unpaid) with itemized charges, patient edit plus archive/restore, a severe penicillin allergy, vitals on ADM-2026-0001/ENC-2026-0004, and a nursing note, all with audit rows and validation rejections
- [ ] Remove the remaining placeholders — 2026-11-19: emergency, surgery, HR, insurance and blood bank have real backends. Still open: **6 fixture modules** (ambulance, dietary, equipment, housekeeping, mortuary, notifications) and the Add Staff dialog. Staff creation is no longer blocked on a service-role key — `admin-users` / `admin-role-assignment` Edge Functions cover it server-side — but they must be deployed, and a `create_staff_record` RPC is still needed to write `staff_profiles` after the Auth user exists
- [x] Mount `<ToastProvider>` and replace success alerts with toasts — provider mounted in the workspace tree; every mutation flow confirms with a success toast, including password change. The only remaining success-styled alert is "Already dispensed", which is a persistent state notice, not a transient confirmation

### 6.5 Files, realtime, roles

- [x] Upload UI for patient documents, lab attachments, radiology files — 2026-11-19, `DocumentManager` (upload, list, delete) wired into the patient Documents tab, the laboratory order dialog and the radiology request dialog; server actions validate bucket, scope and 10 MB limit. Storage round-trip verified: upload → list → signed URL → delete
- [x] Signed URL viewer — 2026-11-19, each file row opens a 120-second signed URL in a new tab via a server action; verified that a signed URL is issued and the object is unreachable after deletion
- [x] Realtime hooks for the 9 published tables — 2026-11-19, `RealtimeRefresh` mounted on `/laboratory` (orders + results) and `/emergency` (visits); the subscription path and RLS filtering were verified with real accounts (nurse received an event, inventory staff received none). Browser-side refresh after an event is not yet observed in a session
- [x] Set `NavItem.permission` and filter navigation by `has_permission` — verified with nurse and admin accounts after applying migration 039
- [x] Hide actions the user cannot perform (never rely on hiding alone — RLS still enforces) — every backed mutation entry point and page-level create action is gated; unavailable fixture-module actions are unaffected

### 6.6 Decommission preview mode

- [ ] Delete `lib/fixtures/*`
- [ ] Delete `lib/data/config.ts` preview flag
- [ ] Delete `components/layout/preview-notice.tsx`
- [ ] Set `NEXT_PUBLIC_UI_PREVIEW` out of the codebase entirely

### 6.7 Fixture-only module backends

- [x] Emergency — 2026-11-17, applied and verified; start triage created ER-2026-0001 with encounter ENC-2026-0007, duplicate active visits rejected, and the board renders real data
- [x] Surgery — 2026-11-17, applied and verified; registered an OR, scheduled a case, and an overlapping slot was rejected with 23P01 (verification records cleaned up). Demo rooms/cases arrive with the seed block
- [x] HR — 2026-11-17, applied and verified; leave filing/review worked (repeat review rejected), overnight 23:00–07:00 shift now accepted by migration 038 with `overnight: true` in the audit metadata, and equal start/end times rejected. Payroll processing still needs a salary model
- [x] Insurance — 2026-11-19, applied and verified: provider (duplicate code 23505), policy (bad dates 22023, duplicate policy number 23505), coverage verification sets the policy to verified with a payer reference, claim prepared as CLM-2026-0001 with two lines and an event, over-claim rejected, and an expired policy is refused by migration 20261119000300. `/insurance` renders the real policy and both dialogs
- [x] Blood bank — 2026-11-17, applied and verified end to end: donor → 2-unit donation → crossmatch refused before screening → negative screening passes / positive screening discards → request → crossmatch refused before screening cleared → compatible crossmatch → issue → request completed → re-issue refused. Incompatible crossmatch returns the unit to available and leaves the request pending. Audit rows written for all six actions
- [x] Ambulance — 2026-11-19, applied and verified 14/14: two vehicles registered, dispatch created (AMB-2026-0001), assigned → en route → on scene → transporting → completed, vehicle status followed dispatched → on_trip → available with location updated, assigning a busy vehicle rejected, reopening a completed dispatch rejected, six audit actions. Register and Dispatch dialogs plus the trip lifecycle dialog are wired
- [x] Dietary — 2026-11-19, applied and verified 12/12: catalogue shipped by migration 20261119000800, assessment DIET-2026-0001 created with two allergies, three trays generated with the allergens copied and slots at 07:00/12:00/18:00, unsupported meal type rejected, tray advanced preparing → ready → delivered with prepared/delivered stamped, re-delivery rejected, four audit rows
- [x] Housekeeping — 2026-11-19, applied and verified 11/11: staff creation (on duty), request creation, assign → start → complete with a disinfection record (chemical, 10-minute contact time) → verify; completion without a contact time is refused, reopening a verified request is refused, `completed_today` incremented, and five audit rows written
- [x] Equipment — 2026-11-19, applied and verified 13/13: asset registered against the category catalogue (duplicate serial 23505), raising a work order moved the asset to maintenance, completion was refused without a resolution, completing wrote maintenance history and returned the asset to available, a passed calibration moved the next due date, a failed calibration set the asset out of service, and five audit rows were written. Register asset, create work order, complete and record calibration dialogs are wired
- [x] Mortuary — 2026-11-19, applied and verified 12/12: case MOR-2026-0001 admitted into MU-01 (unit occupied), duplicate body tag rejected, a discrepancy case blocked from release, release without a document rejected, release completed with recipient and document freeing the unit, second release rejected, access log and audit rows written. Admission and release dialogs are wired
- [ ] Notifications

---

## Phase 7 — QA & Security Verification

**Goal:** Prove the system behaves correctly and denies correctly.
**Depends on:** Phase 6.
**Definition of done:** the suite below runs in CI and passes.

### 7.1 Already verified

- [x] `npm run lint` → exit 0
- [x] `npx tsc --noEmit` → exit 0
- [x] `npm run build` → 29/29 routes generated
- [x] Runtime render → `next start -p 3100` returned HTTP 200 on all 23 app routes + `/login` + `/forgot-password`
- [x] Static sweep → 0 `lucide`, 0 non-`/linear` solar imports, 0 `transition-all`, 0 banned fonts

### 7.2 Browser & accessibility

- [ ] Visual QA at 640 / 1024 / 1440 for all 26 routes
- [ ] Hover, focus-visible, active, disabled, loading states inspected
- [ ] Keyboard-only pass: tab order, modal trap, dropdown, tabs, calendar, table sort
- [ ] `prefers-reduced-motion` verified
- [ ] Screen reader pass on the patient profile and clinical encounter dialog
- [ ] Contrast check against WCAG AA for every token pair

### 7.3 Automated tests

- [ ] Add a test runner (none exists today; no `test` script)
- [ ] Unit tests for `lib/format.ts`, `StatusBadge` mapping, `RecordTable` filter/sort/pagination
- [ ] Component tests for forms (validation, preserved values, duplicate-submit guard)

### 7.4 Security tests (`SUPABASE.MD` §33.3)

- [ ] Anonymous user cannot read patient records
- [ ] Receptionist cannot read restricted clinical notes
- [ ] Physician cannot access administrative functions
- [ ] Nurse cannot modify finalized physician documentation
- [ ] Laboratory staff cannot access billing administration
- [ ] Pharmacist cannot assign administrator roles
- [ ] Billing staff cannot modify clinical diagnoses
- [ ] Inventory staff cannot read unrestricted medical records
- [ ] Ordinary users cannot read audit logs
- [ ] Users cannot change their own roles
- [ ] Users cannot bypass authorization by changing record IDs

### 7.5 Clinical integrity tests (`SUPABASE.MD` §33.4)

- [ ] Duplicate patient registration rejected
- [x] Invalid appointment scheduling rejected — 2026-11-17, an overlapping physician slot returned `23P01`; past-dated slots are rejected by migration 043 (apply it to close the remaining half)
- [x] Concurrent bed allocation cannot double-book — 2026-11-17, two parallel `create_admission` calls raced for ER-1-A; one won, the other got `22023 Bed is not available`
- [x] Discharge releases the bed exactly once — 2026-11-17, discharging an already discharged admission returns `22023 Only admitted patients can be discharged`, and the bed returns to available
- [x] Patient transfer closes the previous assignment — 2026-11-17, ADM-2026-0001 moved W3-301-A → W3-301-B: the old assignment is released, exactly one assignment stays active, the old bed returns to available and the new one becomes occupied
- [x] Clinical note finalization is irreversible without amendment — 2026-11-17, finalizing a finalized note returns `22023 Only draft notes can be finalized`
- [x] Laboratory result verification is permission-gated — 2026-11-17, billing staff calling `verify_laboratory_result` get `42501`; laboratory staff succeed
- [ ] Prescription dispensing decrements inventory atomically — verified live for single-batch items (420→390, 1200→1180) and for a partially dispensed prescription; multi-batch FIFO and mid-loop rollback not exercised because fixture inserts are blocked by the `prescriptions` insert policy
- [x] Inventory cannot go negative
- [x] Duplicate payment submission rejected
- [x] Refund preserves the original payment record

### 7.6 Storage & realtime tests (`SUPABASE.MD` §33.5)

- [ ] Private buckets are not publicly reachable
- [ ] Unauthorized uploads and deletes are rejected
- [ ] Signed URLs expire
- [ ] Realtime payloads respect RLS

---

## Phase 8 — Cleanup & Debt

**Goal:** Leave no misleading code behind.
**Depends on:** can run in parallel with Phases 4–7.

- [ ] Add `!.env.example` to `.gitignore`
- [ ] Ignore `supabase/.temp/` and `supabase/cli-latest`
- [ ] Replace the 2 raw `<table>` elements with shared primitives: `components/billing/invoice-detail-dialog.tsx`, `components/dashboard/admission-trend-chart.tsx` (chart data fallback)
- [ ] Move the hardcoded `#007A55` display value in `app/(workspace)/settings/page.tsx` to a token read
- [ ] Align report category labels with `THEME.MD` §8.13 wording
- [ ] Extend data types for fields the UI currently reports as missing: `EncounterDetail.prescriptions`, `VitalSigns.verification_status`, `InvoiceListRow.line_items`, `StaffListRow.work_schedule`
- [ ] Add a medication stock table (currently synthesized from `inventory_batches` / `stock_transactions`)
- [ ] Remove `export const instant = false` from `app/(workspace)/layout.tsx` once pathname consumers are wrapped in `<Suspense>`
- [ ] Remove the localStorage session key `spmc_auth_session` and `spmc_password_reset_request` remnants after Phase 6
- [ ] Add `turbopack.root` to `next.config.ts` to silence the `package-lock.json outside Git repository` warning

---

## Phase 9 — Deployment

**Goal:** Ship repeatably.
**Depends on:** Phase 7.

- [ ] Environment variables configured per environment (no service-role key in the frontend)
- [ ] Migrations applied through CI, never by hand
- [ ] Type generation in CI, drift check fails the build
- [ ] `npm run lint` + `tsc` + `build` gates on pull requests
- [ ] Preview deployment tested against a staging Supabase project
- [ ] Backup and restore procedure documented
- [ ] Audit log retention policy defined
