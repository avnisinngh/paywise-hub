ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS father_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text;