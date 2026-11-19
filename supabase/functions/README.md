# Edge Functions

Deployed with the Supabase CLI. Nothing here ships in the Next.js bundle, and no
secret below may ever use a `NEXT_PUBLIC_` prefix.

## Functions

| Function | Purpose | Authorization |
|---|---|---|
| `admin-users` | Create Auth users and set initial credentials | `requireAdmin` (admin session) |
| `admin-role-assignment` | Grant or revoke a role | `requireAdmin` |
| `send-notification` | Deliver queued notification emails | `x-hms-job-token` (`HMS_NOTIFICATION_TOKEN`) |
| `generate-document` | Render a document payload | `requireAdmin` |
| `scheduled-maintenance` | Nightly upkeep job | `x-hms-job-token` (`HMS_MAINTENANCE_TOKEN`) |

## Required secrets

```bash
supabase secrets set \
  HMS_NOTIFICATION_TOKEN="<random-32-bytes>" \
  HMS_MAINTENANCE_TOKEN="<random-32-bytes>" \
  HMS_SMTP_USER="notifications@your-domain.org" \
  HMS_SMTP_APP_PASSWORD="<gmail-app-password>"
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected
by the platform for deployed functions. The service-role key is read only inside
`_shared/http.ts` and must never be sent to the browser.

Generate the tokens with:

```bash
openssl rand -hex 32
```

## Deploy

```bash
supabase functions deploy admin-users
supabase functions deploy admin-role-assignment
supabase functions deploy send-notification
supabase functions deploy generate-document
supabase functions deploy scheduled-maintenance
```

`generate-document` and `scheduled-maintenance` can also be scheduled with
`supabase functions schedule` or an external cron that sends
`x-hms-job-token`.

## Local development

Create `supabase/functions/.env` (git-ignored) with the same keys and run:

```bash
supabase functions serve --env-file supabase/functions/.env
```

## Rotation

`SUPABASE_SERVICE_ROLE_KEY` is the highest-value secret here. Rotate it from the
dashboard, then `supabase secrets set` again and redeploy. Rotating the job
tokens invalidates any cron caller until it is updated.

## Never

- Never put `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, a `NEXT_PUBLIC_*`
  variable, or any client component.
- Never log tokens or SMTP credentials; `send-notification` audits outcomes, not
  secrets.
