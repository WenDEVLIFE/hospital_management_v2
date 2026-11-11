# HMS Build Status — Task Tracker

**Project:** SPMC Hospital Management System (`hospital_management_v2`)
**Stack:** Next.js 16.4.3 · React 19 · Tailwind CSS 4 · TypeScript 5 · Supabase (planned)
**Last updated:** 2026-11-11

**Legend:** ✅ done · 🟡 partial / scaffolding only · ⬜ not started · ⚠️ debt to pay down

**Authoritative specs:** `docs/PROJECT.MD` (functionality) · `docs/THEME.MD` (visual system) · `docs/SUPABASE.MD` (backend)

---

## 1. Specification & Schema

| Status | Item | Notes |
|---|---|---|
| ✅ | PROJECT.MD rewritten to HMS (46 sections, 30+ modules) | Source of truth for functionality |
| ✅ | THEME.MD rewritten to SPMC green/white design system (14 sections) | Source of truth for UI |
| ✅ | SUPABASE.MD backend spec | Source of truth for backend |
| ✅ | Core database schema written | `supabase/schema.sql` — 46 tables, 4 helper functions, 2 trigger sets, 24+ indexes, 8 views |
| ✅ | Reference seed data | 8 departments, 10 roles, 73 permissions |
| 🟡 | Schema applied to a live Supabase project | DDL is written but never executed against a real project |
| ⬜ | `supabase/migrations/` layout | No `config.toml`, no timestamped migrations; only the single `schema.sql` |
| ⬜ | `role_permissions` mapping | Deliberately unseeded — SUPABASE.MD §22.2 requires stakeholder approval |
| ⬜ | Enum types (`appointment_status`, etc.) | Currently `text` + `check` constraints; SUPABASE.MD §5.1 lists enums as the convention |

---

## 2. UI Foundation — ✅ COMPLETE

| Status | Item | Location |
|---|---|---|
| ✅ | Design tokens (THEME §12.1 verbatim) | `app/globals.css` |
| ✅ | Reduced-motion guard + slim scrollbar | `app/globals.css` |
| ✅ | Plus Jakarta Sans via `next/font` | `app/layout.tsx` |
| ✅ | Solar Icons migration (lucide removed) | `package.json`, 75 imports across `app/` + `components/` |
| ✅ | Root redirect → `/dashboard` (server) | `app/page.tsx` |
| ✅ | Navigation IA (THEME §7.2) | `lib/navigation.ts` |
| ✅ | Formatters (en-PH, Asia/Manila, PHP) | `lib/format.ts` |
| ✅ | 22 UI primitives + barrel | `components/ui/*`, `components/ui/index.ts` |
| ✅ | App shell, header, sidebar, breadcrumbs, page header/section | `components/layout/*` |
| ✅ | Preview-mode disclosure bar | `components/layout/preview-notice.tsx` |
| ✅ | Shared module primitives (stat card, record table, error state, unavailable action) | `components/module/*` |
| ✅ | Auth screens (login, forgot password, brand panel) | `app/(auth)/*`, `components/auth/*` |
| ✅ | Old doc-generation UI removed | 24 route files deleted |
| ✅ | Zero `lucide`, zero non-`/linear` solar imports, zero `transition-all`, zero banned fonts | Verified by sweep |

---

## 3. UI Modules — ✅ COMPLETE (26 routes)

Every route renders real component structure with loading/empty/error/success handling. Data comes from `lib/data/*` (synthetic preview or empty).

| Status | Route | Module | Spec |
|---|---|---|---|
| ✅ | `/dashboard` | KPIs, admission trend, appointment breakdown, recent registrations, pending activities | THEME §8.1 |
| ✅ | `/patients` | Patient list, search, status filter | THEME §8.2 |
| ✅ | `/patients/new` | 5-section registration form with validation | THEME §8.2 |
| ✅ | `/patients/[id]` | Profile with 9 tabs (overview, history, allergies, appointments, admissions, encounters, labs, prescriptions, billing) | THEME §8.2 |
| ✅ | `/appointments` | List / daily schedule / calendar views | THEME §8.3 |
| ✅ | `/admissions` | KPIs, bed board, admission list | THEME §8.4 |
| ✅ | `/discharges` | Discharge records | THEME §8.4 |
| ✅ | `/medical-records` | Encounter list + clinical detail dialog (vitals with units, diagnoses, notes) | THEME §8.5 |
| ✅ | `/nursing` | Assigned-patient workspace, latest vitals | THEME §8.7 |
| ✅ | `/staff` | Staff list, detail dialog, employment vs auth separation | THEME §8.6 |
| ✅ | `/laboratory` | Workflow strip, specimen vs result status, request detail | THEME §8.8 |
| ✅ | `/radiology` | Request list, draft-vs-verified report dialog | THEME §8.9 |
| ✅ | `/pharmacy` | Prescription queue + medication inventory tabs | THEME §8.10 |
| ✅ | `/prescriptions` | Prescription list + detail | THEME §8.10 |
| ✅ | `/billing` | Invoice list, invoice detail with totals, outstanding balance emphasis | THEME §8.11 |
| ✅ | `/payments` | Payment list, receipt dialog | THEME §8.11 |
| ✅ | `/inventory` | Items + stock history tabs, stock status multi-cue | THEME §8.12 |
| ✅ | `/departments` | Department list with accent identity | THEME §3.6 |
| ✅ | `/rooms-beds` | Rooms table + bed availability board | THEME §8.4 |
| ✅ | `/reports` | 9 report categories, range controls | THEME §8.13 |
| ✅ | `/settings` | Settings index, backend status, theme facts | THEME §7.2 |
| ✅ | `/settings/users` | User list, role panel | THEME §8.14 |
| ✅ | `/audit-logs` | Read-only audit table | THEME §8.15 |
| ✅ | `/login`, `/forgot-password` | Auth screens | THEME §7.1 |

**Data-access layer:** `lib/data/*` — 20 modules, 42 typed async accessors returning `DataResult` / `PagedResult`.
**Domain types:** `types/hospital.ts` — 41 schema row types + 16 view models, mirroring `supabase/schema.sql`.

---

## 4. Backend — Supabase — 🟡 PARTIAL

| Status | Item | Notes |
|---|---|---|
| ⬜ | Install `@supabase/supabase-js`, `@supabase/ssr`, `zod` | `package.json` has none of them |
| ⬜ | `.env.local` with project URL + publishable key | `.env.example` exists with placeholders |
| ⚠️ | `.env.example` is git-ignored | `.gitignore` line 34 `.env*` swallows it — needs an exception |
| ✅ | Table DDL (46 tables) | `supabase/schema.sql` |
| ✅ | RBAC helper functions (`has_role`, `is_admin`, `has_permission`, `can_access_patient`) | `supabase/schema.sql` |
| ✅ | `updated_at` triggers + `handle_new_user` profile bootstrap | `supabase/schema.sql` |
| ✅ | Reporting views (8) with `security_invoker = true` | `supabase/schema.sql` |
| ⬜ | **Row Level Security — enabled on 0 of 46 tables** | Highest-risk gap; see §6 |
| ⬜ | RLS policies per table | Blocked by role→permission matrix approval |
| ⬜ | Storage buckets (8 private) + storage policies | SUPABASE.MD §24 |
| ⬜ | Realtime publication (9 tables) | SUPABASE.MD §25 |
| ⬜ | Transactional RPC functions (12) | `register_patient`, `create_appointment`, `create_admission`, `transfer_patient`, `discharge_patient`, `finalize_clinical_note`, `verify_laboratory_result`, `dispense_prescription`, `record_payment`, `refund_payment`, `adjust_inventory`, `generate_reference_number` |
| ⬜ | Supabase Edge Functions | `admin-users`, `admin-role-assignment`, `send-notification`, `generate-document`, `ai-assist`, `scheduled-maintenance` |
| ⬜ | Generated TypeScript database types | `npx supabase gen types` → `types/supabase.ts` |
| ⬜ | Initial administrator provisioning | SUPABASE.MD §34 |

---

## 5. UI ↔ Backend Integration — ⬜ NOT STARTED

| Status | Item | Notes |
|---|---|---|
| 🟡 | Data layer exists | 42 accessors, each with a `// TODO(supabase)` marker at the query boundary |
| 🟡 | Preview data mode | `NEXT_PUBLIC_UI_PREVIEW` (default on). Synthetic rows, clearly labelled. Set `false` for pure empty states |
| ⬜ | Replace accessor bodies with `supabase.from(...)` calls | The swap point is already isolated |
| ⬜ | Supabase browser + server clients | `src/lib/supabase/{client,server,proxy}.ts` per SUPABASE.MD §4 |
| ⬜ | Session refresh proxy | SUPABASE.MD §4.4 |
| ⬜ | **Real authentication** | Currently a `localStorage` stub (`spmc_auth_session`); no real session, no password reset, no MFA |
| ⬜ | Role-based navigation filtering | `NavItem.permission` exists but is unset; all nav items visible to everyone |
| ⬜ | Zod validation on mutations | PROJECT.MD §2 requires it; no `zod` installed |
| ⬜ | File uploads to Storage + signed URLs | No upload UI yet |
| ⬜ | Realtime subscriptions | No subscription hooks yet |
| ⬜ | Toast provider mounted | `components/ui/toast.tsx` exists but no `<ToastProvider>` in the tree |
| ⬜ | Remove the "unavailable action" dialogs | `components/module/unavailable-action.tsx` is a deliberate placeholder; delete call sites as real mutations land |
| ⬜ | Delete preview fixtures | `lib/fixtures/*` once real data flows |

---

## 6. QA, Security & Verification

| Status | Item | Notes |
|---|---|---|
| ✅ | `npm run lint` | Exit 0 |
| ✅ | `npx tsc --noEmit` | Exit 0 |
| ✅ | `npm run build` | 29/29 routes generated |
| ✅ | Runtime render check | `next start -p 3100` → HTTP 200 on all 23 app routes + `/login` + `/forgot-password` |
| ✅ | Static sweep | 0 `lucide`, 0 non-`/linear` solar, 0 `transition-all`, 0 banned fonts |
| ⬜ | **Browser visual QA** | No viewport (640 / 1024 / 1440), hover, focus-visible, keyboard, or reduced-motion inspection was performed |
| ⬜ | Automated tests | No test runner, no test files, no `test` script |
| ⬜ | RLS security tests | SUPABASE.MD §33.3 — anonymous access, role isolation, ID tampering |
| ⬜ | Clinical integrity tests | SUPABASE.MD §33.4 — concurrent bed allocation, duplicate payment, dispense/inventory atomicity |
| ⬜ | Storage access tests | SUPABASE.MD §33.5 |
| ⬜ | Real-device responsive check | Not done |
| ⬜ | Accessibility audit | Focus order and ARIA implemented by construction, never verified with a screen reader |

---

## 7. Known Debt / Follow-ups

1. **RLS is the top risk.** 46 tables are exposed to the publishable key with no row-level policies. Do not point a production frontend at this schema until §4 RLS is complete.
2. **Auth is fake.** `components/layout/auth-guard.tsx` only checks a `localStorage` key. Anyone can set it manually.
3. **`export const instant = false`** on `app/(workspace)/layout.tsx` — Next 16 Cache Components opt-out because `usePathname()` runs outside `<Suspense>` in the sidebar/breadcrumbs. Remove once those consumers are wrapped.
4. **`.env.example` is untracked** because `.gitignore` has `.env*`. Add `!.env.example`.
5. **Two raw `<table>` elements** outside the shared primitives: `components/billing/invoice-detail-dialog.tsx`, `components/dashboard/admission-trend-chart.tsx` (the latter is a chart data fallback).
6. **One hardcoded hex** in UI code: `app/(workspace)/settings/page.tsx` renders `#007A55` as display text describing the theme token. Intentional, but worth moving to a token read.
7. **`supabase/.temp/` and `cli-latest`** are present from CLI runs and are not git-ignored.
8. **Report category labels** come from fixtures and differ slightly from THEME §8.13 wording (`Appointment Activity` vs `Appointment Reports`).
9. **Missing fields surfaced by the UI**: `EncounterDetail` has no prescriptions, `VitalSigns` has no verification flag, `InvoiceListRow` has no line items, `StaffListRow` has no work schedule. Each renders an explicit "not included" note rather than fabricated data — extend the data layer when the schema grows.
10. **`MedicationStockRow` is synthesized** — there is no medication stock table in `schema.sql` (stock lives in `inventory_batches`/`stock_transactions`).

---

## 8. Recommended Next Order

1. **Apply the schema** to a Supabase project and confirm `db lint` is clean.
2. **Enable RLS + policies** for identity/RBAC tables first (`profiles`, `roles`, `permissions`, `user_roles`), then patient and clinical tables.
3. **Approve the role→permission matrix**, seed `role_permissions`.
4. **Wire Supabase clients + real auth**, replace the `localStorage` guard.
5. **Swap `lib/data/*` accessors** to real queries, module by module, starting with Patients.
6. **Add the 12 transactional RPC functions** and delete the corresponding "unavailable action" dialogs.
7. **Storage buckets + policies**, then file upload UI.
8. **Realtime** for the queues named in SUPABASE.MD §25.1.
9. **Tests**: RLS security suite, clinical integrity suite, then a browser QA pass.
10. **Cleanup**: remove `instant = false`, delete `lib/fixtures/*`, remove preview notice.
