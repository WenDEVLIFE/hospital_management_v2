-- ============================================================================
-- SPMC HMS — remaining private buckets and path-scoped storage policies
-- Migration 20261119002100. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Migration 041 created three buckets with permission-only policies that are
-- already verified in use, so they stay untouched. This adds the five remaining
-- private buckets and scopes each new bucket to the patient (or user) id in the
-- first path segment.

-- Safe cast for path segments: an invalid folder name yields null instead of
-- raising inside a policy comparison.
create or replace function public.try_uuid(p_value text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return p_value::uuid;
exception when others then
  return null;
end;
$$;

revoke all on function public.try_uuid(text) from public;
grant execute on function public.try_uuid(text) to authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    false,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'medical-record-files',
    'medical-record-files',
    false,
    26214400,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'prescription-files',
    'prescription-files',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'billing-documents',
    'billing-documents',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'hospital-documents',
    'hospital-documents',
    false,
    26214400,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Avatars: one folder per user id
-- ----------------------------------------------------------------------------
drop policy if exists "avatars_select" on storage.objects;
create policy "avatars_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ----------------------------------------------------------------------------
-- Medical record files: patient-scoped
-- ----------------------------------------------------------------------------
drop policy if exists "medical_record_files_select" on storage.objects;
create policy "medical_record_files_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'medical-record-files'
  and public.has_permission('medical_record.view')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

drop policy if exists "medical_record_files_insert" on storage.objects;
create policy "medical_record_files_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'medical-record-files'
  and public.has_permission('medical_record.create')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

drop policy if exists "medical_record_files_delete" on storage.objects;
create policy "medical_record_files_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'medical-record-files'
  and public.has_permission('medical_record.update')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

-- ----------------------------------------------------------------------------
-- Prescription files: patient-scoped
-- ----------------------------------------------------------------------------
drop policy if exists "prescription_files_select" on storage.objects;
create policy "prescription_files_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'prescription-files'
  and public.has_permission('prescription.view')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

drop policy if exists "prescription_files_insert" on storage.objects;
create policy "prescription_files_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'prescription-files'
  and public.has_permission('prescription.create')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

drop policy if exists "prescription_files_delete" on storage.objects;
create policy "prescription_files_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'prescription-files'
  and public.has_permission('prescription.create')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

-- ----------------------------------------------------------------------------
-- Billing documents: patient-scoped
-- ----------------------------------------------------------------------------
drop policy if exists "billing_documents_select" on storage.objects;
create policy "billing_documents_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'billing-documents'
  and public.has_permission('billing.view')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

drop policy if exists "billing_documents_insert" on storage.objects;
create policy "billing_documents_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'billing-documents'
  and public.has_permission('billing.invoice.create')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

drop policy if exists "billing_documents_delete" on storage.objects;
create policy "billing_documents_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'billing-documents'
  and public.has_permission('billing.invoice.update')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

-- ----------------------------------------------------------------------------
-- Hospital documents: administrators only
-- ----------------------------------------------------------------------------
drop policy if exists "hospital_documents_select" on storage.objects;
create policy "hospital_documents_select"
on storage.objects
for select
to authenticated
using (bucket_id = 'hospital-documents' and public.is_admin());

drop policy if exists "hospital_documents_insert" on storage.objects;
create policy "hospital_documents_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'hospital-documents' and public.is_admin());

drop policy if exists "hospital_documents_update" on storage.objects;
create policy "hospital_documents_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'hospital-documents' and public.is_admin())
with check (bucket_id = 'hospital-documents' and public.is_admin());

drop policy if exists "hospital_documents_delete" on storage.objects;
create policy "hospital_documents_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'hospital-documents' and public.is_admin());
