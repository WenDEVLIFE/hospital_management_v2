# DEPLOYMENT.md — SPMC Platform Operations Runbook

Phase 9 runbook. Covers environments, CI gates, migration governance, type-drift
checks, preview testing, production deployment, backup/restore, and audit log
retention.

**Live targets**

| Target | Value |
|---|---|
| Repository | `WenDEVLIFE/hospital_management_v2` |
| Production Supabase project | `lrzakpmflicvxkzthyws` (`hospital_management_v2`) |
| Region | See Supabase dashboard (project settings) |
| Frontend host | Vercel (Git integration) |
| Node.js | 22.x in CI, 24 locally |

---

## 1. Environments and variables

| Variable | Local | Preview / Staging | Production | Exposure |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | staging or prod URL | **staging** project URL | production project URL | Browser-safe |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key | **staging** publishable key | production publishable key | Browser-safe |
| `SUPABASE_ACCESS_TOKEN` | CLI login (local) | GitHub secret | GitHub secret | Server/CI only |
| `SUPABASE_DB_PASSWORD` | not needed locally | GitHub secret | GitHub secret | Server/CI only |
| `SUPABASE_PROJECT_REF` | `supabase/.temp` | GitHub secret | GitHub secret | Server/CI only |
| `VERCEL_DEPLOY_HOOK_URL` | — | — | GitHub secret (optional) | Server/CI only |
| `HMS_*` Edge Function secrets | — | `supabase secrets set` | `supabase secrets set` | **Edge Functions only** |

Rules:

- Only `NEXT_PUBLIC_*` values are bundled into the browser. Everything else stays
  server-side.
- The service-role key is **never** placed in Vercel, `.env.local`, or any
  `NEXT_PUBLIC_*` variable. It exists only in the Edge Function runtime.
- Preview deployments must point at the **staging** project. Never: production.
- Disable public sign-up in every Supabase project; accounts are provisioned by an
  administrator (`docs/ADMIN_BOOTSTRAP.md`).

Required GitHub repository secrets:

```
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_REF
SUPABASE_DB_PASSWORD
```

Optional:

```
VERCEL_DEPLOY_HOOK_URL
```

Required GitHub `staging` environment secrets (for `smoke.yml`):

```
STAGING_SUPABASE_URL
STAGING_SUPABASE_PUBLISHABLE_KEY
```

---

## 2. CI gates (pull requests)

`.github/workflows/ci.yml` runs on every pull request:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck` (`tsc --noEmit`)
4. `npm run build` with placeholder Supabase values
5. `npm run db:types:check` against the linked project

Merge is blocked when any step fails. The type-drift job requires
`SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF`; it fails loudly if they are
missing rather than silently skipping.

Use `npm run verify:ci` locally to run lint, typecheck, drift, and build in the
same order.

---

## 3. Migration governance

**Rule: migrations reach the database through CI, never by hand.**

- `.github/workflows/migrate.yml` runs on pushes to `master` that change
  `supabase/migrations/**` (or on manual dispatch).
- It links the project, prints pending migrations, then runs
  `supabase db push --remote --yes`.
- GitHub `production` environment protection rules should require a reviewer
  before the job runs.
- Migrations are forward-only. There are no down migrations; rollback is a
  restore or a new corrective migration.

### One-time baseline (already done)

The production database was originally bootstrapped from `supabase/schema.sql`, so
`supabase_migrations.schema_migrations` only contained `20261117002500` while the
schema was current through `20261120000300`. Before CI could push safely, the
ledger was backfilled once:

```bash
supabase migration repair --status applied --remote --yes <all versions except the new one>
```

After that, `supabase db push --dry-run --remote` reported exactly one pending
migration, which was applied. **Do not repeat this unless the ledger and the
schema genuinely diverge.** Never use `db push --include-all` on a populated
database — it replays every migration.

### New migration checklist

1. Unique timestamp version (no duplicates — CI is not the place to discover one).
2. RLS policies in the same migration as the table.
3. Mirrored into `supabase/schema.sql` when the file claims parity.
4. `supabase db push --remote --dry-run` shows only the intended files.
5. Merge → CI applies it.

---

## 4. Database type generation and drift

The generated types live in `types/database.generated.ts` and are committed.

```bash
npm run db:types        # regenerate from the linked project
npm run db:types:check  # compare; exits 1 on drift
```

- Locally the CLI uses the stored login. Target `SUPABASE_PROJECT_REF` when set.
- CI supplies `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF`.
- After any migration that changes the exposed schema, run `npm run db:types` and
  commit the result in the same pull request.
- `types/database.generated.ts` is ignored by ESLint and never hand-edited.

---

## 5. Preview and staging

1. Create a **separate** Supabase project for staging (do not reuse production).
2. Apply migrations to staging through the same CLI workflow.
3. Seed it with synthetic data only (`supabase/seed.sql`). Never patient data.
4. In Vercel, set Preview environment variables to the staging URL and publishable
   key. Keep Production variables separate.
5. Deploy a preview and verify sign-in, prescriptions, and one mutation.
6. Run the authorization probes:

```bash
node scripts/verify-security.mjs   # with staging env vars
```

GitHub `smoke.yml` runs the same probes on demand against the `staging`
environment.

**Status:** blocked until a staging project and Vercel Preview variables exist.
There is currently no staging project in the organization.

---

## 6. Production deployment order

1. Pull request passes CI (lint, typecheck, build, type drift).
2. Merge to `master`.
3. `migrate.yml` applies pending migrations to production.
4. Vercel builds and deploys from the same commit. If `VERCEL_DEPLOY_HOOK_URL` is
   configured, the workflow triggers the deploy **after** migrations finish.
5. Verify: sign in, open `/dashboard`, create one prescription in a test encounter,
   confirm the pharmacy queue entry.
6. Record the deployed commit and migration versions in the handover log.

If Vercel auto-deploys on push independently of `migrate.yml`, either disable
automatic production deploys in favor of the deploy hook, or ensure migrations are
backward compatible for one release (expand/contract pattern). The current
production schema change (`create_prescription`) is additive and backward
compatible.

---

## 7. Backup and restore

### Platform backups

- Supabase maintains daily backups depending on plan. Enable PITR where the plan
  allows it (recommended for production).
- Verify in Dashboard → Database → Backups that a recent restore point exists
  before any destructive migration.
- `supabase db dump` requires Docker/Podman, which is not installed on the current
  workstation. Use `pg_dump` directly, or run the dump from a machine with Docker.

### Logical backup with `pg_dump` (no Docker)

Use the **session pooler** connection string from Dashboard → Connect:

```bash
export PGPASSWORD='<database-password>'
pg_dump \
  --host 'aws-0-<region>.pooler.supabase.com' \
  --port 5432 \
  --username 'postgres.<project-ref>' \
  --dbname postgres \
  --format custom \
  --no-owner \
  --file "spmc-$(date +%Y%m%d-%H%M).dump"
```

Verify the archive:

```bash
pg_restore --list spmc-*.dump | head
```

### Restore

Restore into a **new** project first; never directly over production.

```bash
export PGPASSWORD='<target-database-password>'
pg_restore \
  --host 'aws-0-<region>.pooler.supabase.com' \
  --port 5432 \
  --username 'postgres.<target-project-ref>' \
  --dbname postgres \
  --clean --if-exists --no-owner \
  spmc-YYYYMMDD-HHMM.dump
```

Then:

1. Re-apply any migrations newer than the backup.
2. Recreate Storage buckets and policies (see `supabase/migrations/*storage*`).
3. Restore Storage objects separately — `pg_dump` does not include them. Use
   `supabase storage cp -r` or the S3-compatible API per bucket.
4. Run `scripts/verify-security.mjs` against the restored project.
5. Rotate credentials after any restore into a shared environment.

Test a restore into staging at least quarterly and record the date and result.

---

## 8. Audit log retention policy

**Status: defined, provisional pending SPMC legal/records sign-off.**

| Item | Policy |
|---|---|
| System of record | `public.audit_logs` (append-only; no update/delete RLS policy) |
| Retention window | **7 years (2555 days)** from `created_at` |
| Basis | DOH records practice and the Philippine Data Privacy Act; confirm with SPMC legal |
| Legal hold | Any incident, complaint, or investigation freezes deletion for affected records |
| Automated deletion | **None.** Deletion requires written approval, a verified backup, and two authorized operators |
| Access | `audit.view` permission or administrator only |
| Review cadence | Count and age distribution reviewed annually |

Read-only check for records approaching the window:

```sql
select date_trunc('year', created_at) as year,
       count(*) as records
from public.audit_logs
group by 1
order by 1;
```

Records at or beyond 2555 days:

```sql
select count(*)
from public.audit_logs
where created_at < now() - interval '2555 days';
```

Approved disposal (only after sign-off, backup, and dual authorization) must run in
an explicit transaction and be recorded outside the database:

```sql
begin;

create temporary table audit_purge_candidates as
select id from public.audit_logs
where created_at < now() - interval '2555 days'
  and entity_id not in (select entity_id from public.audit_hold);

delete from public.audit_logs
where id in (select id from audit_purge_candidates);

-- Replace with the reviewed count before committing.
-- rollback;
commit;
```

`public.audit_hold` is a proposed table for legal holds; add it with legal approval
before any disposal. Until then, **no audit records are deleted**.

---

## 9. Rollback

| Layer | Action |
|---|---|
| Frontend | Vercel → Deployments → previous deployment → Promote |
| Database function/table | Ship a corrective migration; do not edit applied migrations |
| Destructive data change | Restore from the verified backup into a new project, then cut over |
| Secrets leak | Rotate the key in Supabase, update GitHub/Vercel secrets, redeploy |

Never run `db reset` against production.

---

## 10. Phase 9 status

- [x] Environment variables documented per environment; service-role key excluded
      from all frontend and CI env
- [x] Migrations applied through CI (`migrate.yml`); one-time ledger baseline
      completed and documented
- [x] Type generation and drift check in CI (`db:types:check`)
- [x] `lint` + `tsc` + `build` gates on pull requests
- [ ] Preview deployment tested against staging — **blocked**: no staging project
      and no Vercel authentication on this workstation
- [x] Backup and restore procedure documented
- [x] Audit log retention policy defined (provisional, pending legal sign-off)
