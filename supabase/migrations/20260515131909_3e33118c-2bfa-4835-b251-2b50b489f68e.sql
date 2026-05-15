
INSERT INTO storage.buckets (id, name, public) VALUES ('employee-docs', 'employee-docs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins read employee docs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'employee-docs' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins upload employee docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'employee-docs' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete employee docs" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'employee-docs' AND has_role(auth.uid(), 'admin'));

-- Add documents column to employees for onboarding uploads (jsonb list of {label, path})
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS emergency_contact text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;
