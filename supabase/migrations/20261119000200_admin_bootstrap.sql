-- ============================================================================
-- SPMC HMS — administrator bootstrap
-- Migration 20261119000200. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- The first administrator cannot be created through the UI (that would be a
-- public privilege-escalation path). This function is granted to service_role
-- only and is meant to be run once, from the Supabase SQL editor or a trusted
-- operator shell after the account exists in Auth.

create or replace function public.bootstrap_administrator(p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_role_id uuid;
  v_existing boolean;
begin
  if btrim(coalesce(p_email, '')) = '' then
    raise exception 'An email address is required' using errcode = '22023';
  end if;

  select id
  into v_profile_id
  from public.profiles
  where lower(email) = lower(btrim(p_email));

  if v_profile_id is null then
    raise exception 'No account exists for %; create it in Auth first', p_email
      using errcode = '22023';
  end if;

  select id into v_role_id from public.roles where slug = 'super_admin';

  if v_role_id is null then
    raise exception 'The super_admin role is missing' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.user_roles where user_id = v_profile_id
  )
  into v_existing;

  if v_existing then
    raise exception 'The account already has a role; bootstrap only grants the first one'
      using errcode = '22023';
  end if;

  update public.profiles
  set is_active = true
  where id = v_profile_id;

  insert into public.user_roles (user_id, role_id)
  values (v_profile_id, v_role_id)
  on conflict do nothing;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_profile_id,
    'user.bootstrap_admin',
    'profile',
    v_profile_id,
    'Bootstrapped the first administrator account.',
    jsonb_build_object('source', 'bootstrap_administrator')
  );

  return v_profile_id;
end;
$$;

-- Deliberately not executable by anon or authenticated.
revoke all on function public.bootstrap_administrator(text) from public;
revoke all on function public.bootstrap_administrator(text) from anon;
revoke all on function public.bootstrap_administrator(text) from authenticated;

grant execute on function public.bootstrap_administrator(text)
  to service_role;
