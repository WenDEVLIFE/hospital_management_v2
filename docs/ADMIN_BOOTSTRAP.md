# Administrator bootstrap

The first administrator is created **outside the application**. There is no
signup route and no UI action that grants a privileged role, so this cannot be
reached by an unauthenticated visitor.

## Preconditions

- The schema migrations have been applied.
- The `super_admin` role exists (`select id from public.roles where slug = 'super_admin'`).
- The person's account exists in Supabase Auth.

## 1. Create the account (Auth)

Supabase Dashboard → **Authentication → Users → Add user**, or from a trusted
shell with the service-role key:

```bash
curl -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.org","password":"<initial-password>","email_confirm":true}'
```

The `on_auth_user_created` trigger creates the matching `profiles` row.

## 2. Grant the first role

Run once in the SQL editor (or as `service_role`):

```sql
select public.bootstrap_administrator('admin@example.org');
```

The function:

- requires an existing profile,
- refuses if the account already holds any role (it is a bootstrap, not a
  promotion tool),
- activates the profile,
- grants `super_admin`,
- writes a `user.bootstrap_admin` audit row.

It is **not executable by `anon` or `authenticated`** — only `service_role`.

## 3. Hand over

1. Sign in as that account.
2. Change the initial password from **Settings → Account**.
3. Create the remaining staff accounts and roles from **Settings → Users**.

## Why not a UI button

A "make me admin" action would be a privilege-escalation path available to any
authenticated session. Keeping it in the SQL editor / service-role shell means
the grant requires infrastructure access, not just a login.

## Verification

```sql
select u.email, r.slug
from public.user_roles ur
join public.profiles u on u.id = ur.user_id
join public.roles r on r.id = ur.role_id
where r.slug = 'super_admin';
```

Expected: exactly the intended account(s).
