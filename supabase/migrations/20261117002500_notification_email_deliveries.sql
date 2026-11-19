-- An SMTP reply can be lost after the provider accepts a message. Keep a
-- durable claim so concurrent calls and retries cannot send it a second time.
create table public.notification_email_deliveries (
  notification_id uuid primary key references public.notifications(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  accepted_at timestamptz
);

alter table public.notification_email_deliveries enable row level security;
revoke all on table public.notification_email_deliveries from public, anon, authenticated;
grant select, insert, update, delete on public.notification_email_deliveries to service_role;
