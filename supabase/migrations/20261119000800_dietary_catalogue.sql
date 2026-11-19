-- ============================================================================
-- SPMC HMS — dietary catalogue (reference data)
-- Migration 20261119000800. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- The diet catalogue is configuration, not demo data, so it ships with the
-- schema: an empty catalogue makes it impossible to record an assessment.

insert into public.diet_categories (id, name, description)
values
  ('d1000000-0000-4000-8000-000000000001', 'Regular', 'Standard hospital meals.'),
  ('d1000000-0000-4000-8000-000000000002', 'Therapeutic', 'Modified diets for treatment.'),
  ('d1000000-0000-4000-8000-000000000003', 'Special', 'Nil-by-mouth and pre-procedure.')
on conflict (id) do nothing;

insert into public.therapeutic_diets (
  id, category_id, name, indication, restrictions
)
values
  ('d2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001',
   'Regular diet', 'No dietary modification required.', 'None'),
  ('d2000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002',
   'Diabetic diet', 'Diabetes mellitus and hyperglycaemia.',
   'Added sugar, refined carbohydrates'),
  ('d2000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000002',
   'Low-sodium diet', 'Hypertension, heart failure, CKD.',
   'Salt, processed foods'),
  ('d2000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000002',
   'Renal diet', 'Chronic kidney disease.',
   'Potassium, phosphorus, sodium'),
  ('d2000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000002',
   'Soft diet', 'Dysphagia, post-operative.',
   'Hard or fibrous foods'),
  ('d2000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000003',
   'Nil by mouth', 'Pre-procedure or acute abdomen.',
   'All oral intake')
on conflict (id) do nothing;
