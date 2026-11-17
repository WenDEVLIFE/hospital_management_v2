-- ============================================================================
-- SPMC HMS — storage buckets
-- Migration 041. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Private buckets for clinical attachments. Objects are namespaced by patient
-- and read through short-lived signed URLs; nothing is public.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'patient-documents',
    'patient-documents',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'laboratory-attachments',
    'laboratory-attachments',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'radiology-files',
    'radiology-files',
    false,
    52428800,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/dicom']
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Patient documents
-- ----------------------------------------------------------------------------
drop policy if exists "patient_documents_select" on storage.objects;
create policy "patient_documents_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'patient-documents'
  and public.has_permission('medical_record.view')
);

drop policy if exists "patient_documents_insert" on storage.objects;
create policy "patient_documents_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'patient-documents'
  and public.has_permission('medical_record.create')
);

drop policy if exists "patient_documents_delete" on storage.objects;
create policy "patient_documents_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'patient-documents'
  and public.has_permission('medical_record.update')
);

-- ----------------------------------------------------------------------------
-- Laboratory attachments
-- ----------------------------------------------------------------------------
drop policy if exists "laboratory_attachments_select" on storage.objects;
create policy "laboratory_attachments_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'laboratory-attachments'
  and public.has_permission('laboratory.view')
);

drop policy if exists "laboratory_attachments_insert" on storage.objects;
create policy "laboratory_attachments_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'laboratory-attachments'
  and public.has_permission('laboratory.result.create')
);

-- ----------------------------------------------------------------------------
-- Radiology files
-- ----------------------------------------------------------------------------
drop policy if exists "radiology_files_select" on storage.objects;
create policy "radiology_files_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'radiology-files'
  and public.has_permission('radiology.view')
);

drop policy if exists "radiology_files_insert" on storage.objects;
create policy "radiology_files_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'radiology-files'
  and public.has_permission('radiology.report.create')
);
