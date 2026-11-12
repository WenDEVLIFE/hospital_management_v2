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
| 0 | Specification & design authority | 5 / 8 | In progress (approvals pending) |
| 1 | Database schema | 24 / 29 | In progress (live apply pending) |
| 2 | UI foundation | 30 / 33 | Complete (2 follow-ups) |
| 3 | UI modules | 42 / 48 | In progress (ER, account settings, surgery, HR, insurance, blood bank, ambulance, dietary added; 4 modules remain) |
| 4 | Row Level Security | 22 / 25 | Implemented, runtime verification pending |
| 5 | Backend services | 0 / 29 | Not started |
| 6 | Frontend ↔ backend integration | 0 / 55 | Not started |
| 7 | QA & security verification | 5 / 40 | Partial |
| 8 | Cleanup & debt | 0 / 10 | Not started |
| 9 | Deployment | 0 / 7 | Not started |
| **Total** | | **128 / 284** | |

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
- [ ] Stakeholder approval: role → permission matrix (`SUPABASE.MD` §22.2, `THEME.MD` §8.14) — **blocked by: hospital stakeholders**
- [ ] Stakeholder approval: provisional visual decisions (`THEME.MD` §11 — primary green, sidebar width, table density, dark mode, dashboard layout)
- [ ] Approval: official hospital logo asset (currently a generic mark, per `THEME.MD` §7.1 "do not fabricate a seal")

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
- [ ] Seed `role_permissions` — **blocked by: Phase 0 approval**
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
- [ ] Apply to a live project and run `npx supabase db lint` — **blocked by: no linked Supabase project or credentials**
- [ ] Run `npx supabase db reset` on a clean local database — **blocked by: Docker/PostgreSQL not installed**
- [ ] Generate types: `npx supabase gen types typescript --schema public > types/supabase.ts` — **blocked by: requires a running database**
- [ ] Replace hand-written `types/hospital.ts` usage with the generated `Database` types (keep view models on top) — **blocked by: generated types above**

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
- [ ] Mount `<ToastProvider>` in the workspace tree — **deferred to Phase 6** (no mutation to notify yet)

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
- [ ] Role-based navigation filtering — `NavItem.permission` exists but is unset — **blocked by: Phase 4 policies**
- [ ] Role-based action visibility (hide actions the user cannot perform)

### 3.3 Modules in `PROJECT.MD` without a route yet

- [x] Emergency Room Management (`PROJECT.MD` §14) — 2026-11-12, `/emergency` queue + triage board, visit detail, vitals/orders/notes/monitoring, honest disposition actions; `npm run build` + runtime 200
- [x] Surgery & Operating Room (`PROJECT.MD` §20) — 2026-11-12, `/surgery` schedule + OR board, pre-op checklist, anesthesia/intra-op record, instruments/supplies, recovery monitoring, billing context; build + runtime 200
- [x] Human Resources & Payroll (`PROJECT.MD` §21) — 2026-11-12, `/hr` employee directory, credentials/license watch, attendance/shift view, leave requests, payroll periods + payslips; build + runtime 200
- [x] Insurance & PhilHealth (`PROJECT.MD` §22) — 2026-11-12, `/insurance` policies, coverage verification, authorizations, claims + status history/payment monitoring, provider/benefit catalog, manual-integration notice; build + runtime 200
- [x] Blood Bank (`PROJECT.MD` §23) — 2026-11-12, `/blood-bank` inventory, requests/crossmatch, donors, screening and transfusion safety, qualified-personnel notice; build + runtime 200
- [x] Ambulance (`PROJECT.MD` §24) — 2026-11-12, `/ambulance` dispatch board, fleet/availability, trip history, maintenance and fuel records, honest no-write dispatch; build + runtime 200
- [x] Dietary (`PROJECT.MD` §25) — 2026-11-12, `/dietary` meal board, diet orders/assessments, allergy and restriction alerts, therapeutic diet catalog, delivery confirmation; build + runtime 200
- [ ] Housekeeping (`PROJECT.MD` §26)
- [ ] Equipment & Maintenance (`PROJECT.MD` §27)
- [ ] Mortuary (`PROJECT.MD` §28)
- [ ] Notifications & Communication (`PROJECT.MD` §29)

---

## Phase 4 — Row Level Security

**Goal:** The database, not the UI, becomes the authorization boundary.
**Depends on:** Phase 1 applied; Phase 0 role matrix approved.
**Definition of done:** every `public` table has RLS enabled and a documented policy; anonymous access is denied; role isolation tests pass.
**⚠ Risk if skipped:** all 47 tables are reachable with the publishable key. Do not expose a production frontend before this phase.

### 4.1 Enablement

- [x] `alter table ... enable row level security` on all 47 application tables (deny direct access to `reference_sequences`; the generator is `security definer`) — 2026-11-12, migration 018 enables all 47
- [x] `alter table ... force row level security` where the table owner must also be constrained — 2026-11-12, reviewed and intentionally not applied: clients connect as `authenticated`/`anon`, the owner is the trusted migration/superuser role, and `SECURITY DEFINER` helpers rely on owner bypass (documented in `SUPABASE.MD` §23.1)
- [ ] Verify no table has RLS disabled: query `pg_tables` for `rowsecurity = false` — verification script added at `supabase/tests/rls_enablement.sql`; **execution blocked by: no running database**

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
- [ ] Test privilege escalation through `has_permission` / `can_access_patient` — **blocked by: no running database or authenticated test tokens**
- [ ] Add `SECURITY INVOKER` views verified against RLS (all 8 views) — views are `security_invoker` and grants are applied; runtime RLS verification **blocked by: no running database**

---

## Phase 5 — Backend Services

**Goal:** Everything the UI needs beyond plain table reads.
**Depends on:** Phase 4.
**Definition of done:** each service is tested with a real authenticated token.

### 5.1 Storage (`SUPABASE.MD` §24)

- [ ] Create 8 private buckets: `avatars`, `patient-documents`, `medical-record-files`, `laboratory-files`, `radiology-files`, `prescription-files`, `billing-documents`, `hospital-documents`
- [ ] Storage RLS policies per bucket (path scoped to patient / user id)
- [ ] File size + MIME restrictions per bucket
- [ ] Signed URL flow verified (short expiry)

### 5.2 Realtime (`SUPABASE.MD` §25)

- [ ] Add to `supabase_realtime` publication: `appointments`, `admissions`, `beds`, `laboratory_orders`, `laboratory_results`, `prescriptions`, `notifications`, `payments`, `stock_transactions`
- [ ] Verify RLS is enforced on subscription payloads

### 5.3 Transactional RPC functions (`SUPABASE.MD` §21.1)

- [ ] `generate_reference_number`
- [ ] `register_patient`
- [ ] `create_appointment`
- [ ] `create_admission`
- [ ] `transfer_patient`
- [ ] `discharge_patient`
- [ ] `finalize_clinical_note`
- [ ] `verify_laboratory_result`
- [ ] `dispense_prescription`
- [ ] `record_payment`
- [ ] `refund_payment`
- [ ] `adjust_inventory`
- [ ] Each function: `auth.uid()` check, permission check, row lock, single transaction, audit write, typed result
- [ ] Concurrency tests: two simultaneous bed allocations must not double-book

### 5.4 Edge Functions (`SUPABASE.MD` §26)

- [ ] `admin-users`
- [ ] `admin-role-assignment`
- [ ] `send-notification`
- [ ] `generate-document`
- [ ] `scheduled-maintenance`
- [ ] Secrets configured via `supabase secrets set` (never in the frontend)

### 5.5 Provisioning

- [ ] Initial administrator created through a documented, non-public process
- [ ] Signup flow does not grant any privileged role

---

## Phase 6 — Frontend ↔ Backend Integration

**Goal:** The UI reads and writes real data through Supabase, with the same components.
**Depends on:** Phases 4 and 5.
**Definition of done:** preview mode is off, no fixture is reachable, and every mutation goes through RLS or an RPC.

### 6.1 Client setup

- [ ] Install `@supabase/supabase-js`, `@supabase/ssr`, `zod`
- [ ] `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] Fix `.gitignore` so `.env.example` is tracked (`!.env.example`)
- [ ] `lib/supabase/client.ts` — singleton browser client with `Database` types
- [ ] `lib/supabase/server.ts` — cookie-based server client
- [ ] `lib/supabase/proxy.ts` + root proxy — session refresh
- [ ] `lib/supabase/storage.ts`, `lib/supabase/realtime.ts`

### 6.2 Authentication

- [ ] Replace `components/layout/auth-guard.tsx` localStorage stub with real session checks
- [ ] Login → `supabase.auth.signInWithPassword`
- [ ] Forgot password → `supabase.auth.resetPasswordForEmail`
- [ ] Password reset completion route
- [ ] Wire `/settings/account` password change to `supabase.auth.updateUser`
- [ ] Sign out clears the real session
- [ ] Profile bootstrap verified on first sign-in
- [ ] Disabled accounts (`profiles.is_active = false`) blocked at sign-in
- [ ] Remove the "authentication is not yet connected" notices from `app/(auth)/*`

### 6.3 Data layer swap (`lib/data/*`, 20 modules)

- [ ] `patients.ts` → `supabase.from("patients")`
- [ ] `appointments.ts`
- [ ] `admissions.ts`
- [ ] `medical-records.ts`
- [ ] `nursing.ts`
- [ ] `staff.ts`
- [ ] `laboratory.ts`
- [ ] `radiology.ts`
- [ ] `pharmacy.ts`
- [ ] `billing.ts`
- [ ] `inventory.ts`
- [ ] `departments.ts`
- [ ] `rooms.ts`
- [ ] `reports.ts`
- [ ] `users.ts`
- [ ] `audit.ts`
- [ ] `dashboard.ts` (aggregates; may need RPC or views)
- [ ] Keep the `DataResult` / `PagedResult` contract so components do not change
- [ ] Map PostgreSQL error codes to `THEME.MD` §9.4 messages

### 6.4 Mutations

- [ ] Zod schemas in `lib/validations/*` for every form
- [ ] Patient registration → `register_patient` RPC
- [ ] Appointment creation → `create_appointment` RPC
- [ ] Admission / transfer / discharge → RPCs
- [ ] Clinical note finalize → `finalize_clinical_note`
- [ ] Lab result verify → `verify_laboratory_result`
- [ ] Dispensing → `dispense_prescription`
- [ ] Payment / refund → `record_payment` / `refund_payment`
- [ ] Stock movements → `adjust_inventory`
- [ ] Delete every `UnavailableAction` call site and `components/module/unavailable-action.tsx`
- [ ] Mount `<ToastProvider>` and replace success alerts with toasts

### 6.5 Files, realtime, roles

- [ ] Upload UI for patient documents, lab attachments, radiology files
- [ ] Signed URL viewer
- [ ] Realtime hooks for the 9 published tables
- [ ] Set `NavItem.permission` and filter navigation by `has_permission`
- [ ] Hide actions the user cannot perform (never rely on hiding alone — RLS still enforces)

### 6.6 Decommission preview mode

- [ ] Delete `lib/fixtures/*`
- [ ] Delete `lib/data/config.ts` preview flag
- [ ] Delete `components/layout/preview-notice.tsx`
- [ ] Set `NEXT_PUBLIC_UI_PREVIEW` out of the codebase entirely

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
- [ ] Invalid appointment scheduling rejected
- [ ] Concurrent bed allocation cannot double-book
- [ ] Discharge releases the bed exactly once
- [ ] Patient transfer closes the previous assignment
- [ ] Clinical note finalization is irreversible without amendment
- [ ] Laboratory result verification is permission-gated
- [ ] Prescription dispensing decrements inventory atomically
- [ ] Inventory cannot go negative
- [ ] Duplicate payment submission rejected
- [ ] Refund preserves the original payment record

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
