
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Auto-make first signup an admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ EMPLOYEES ============
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  dob DATE,
  gender TEXT,
  pan TEXT,
  aadhaar TEXT,
  personal_email TEXT,
  phone TEXT,
  department TEXT,
  designation TEXT,
  date_of_joining DATE,
  employment_type TEXT DEFAULT 'Full-time',
  work_location TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  bank_account TEXT,
  ifsc TEXT,
  bank_name TEXT,
  account_holder_name TEXT,
  pf_applicable BOOLEAN DEFAULT true,
  esi_applicable BOOLEAN DEFAULT false,
  pt_applicable BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage employees" ON public.employees FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE TRIGGER employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ONBOARDING TOKENS ============
CREATE TABLE public.onboarding_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage tokens" ON public.onboarding_tokens FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============ SALARY COMPONENTS ============
CREATE TABLE public.salary_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('earning','deduction')),
  calc_type TEXT NOT NULL CHECK (calc_type IN ('fixed','percentage')),
  default_value NUMERIC NOT NULL DEFAULT 0,
  taxable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.salary_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage components" ON public.salary_components FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

INSERT INTO public.salary_components (name, type, calc_type, default_value, taxable) VALUES
  ('Basic Salary','earning','percentage',40,true),
  ('HRA','earning','percentage',40,true),
  ('Special Allowance','earning','fixed',0,true),
  ('Conveyance Allowance','earning','fixed',1600,false),
  ('Medical Allowance','earning','fixed',1250,false),
  ('LTA','earning','fixed',0,false),
  ('Bonus','earning','fixed',0,true),
  ('PF Employee','deduction','percentage',12,false),
  ('PF Employer','deduction','percentage',12,false),
  ('ESI Employee','deduction','percentage',0.75,false),
  ('ESI Employer','deduction','percentage',3.25,false),
  ('Professional Tax','deduction','fixed',200,false),
  ('TDS','deduction','fixed',0,false),
  ('Loan Deduction','deduction','fixed',0,false);

-- ============ SALARY STRUCTURES ============
CREATE TABLE public.salary_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  components JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage structures" ON public.salary_structures FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.employee_salary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  structure_id UUID REFERENCES public.salary_structures(id),
  ctc NUMERIC NOT NULL DEFAULT 0,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_salary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage employee salary" ON public.employee_salary FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============ PAYROLL ============
CREATE TABLE public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','finalized')),
  total_gross NUMERIC NOT NULL DEFAULT 0,
  total_net NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalized_at TIMESTAMPTZ,
  UNIQUE (month, year)
);
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage runs" ON public.payroll_runs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.payroll_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  working_days NUMERIC NOT NULL DEFAULT 30,
  lop_days NUMERIC NOT NULL DEFAULT 0,
  gross_pay NUMERIC NOT NULL DEFAULT 0,
  pf_employee NUMERIC NOT NULL DEFAULT 0,
  pf_employer NUMERIC NOT NULL DEFAULT 0,
  esi_employee NUMERIC NOT NULL DEFAULT 0,
  esi_employer NUMERIC NOT NULL DEFAULT 0,
  pt NUMERIC NOT NULL DEFAULT 0,
  tds NUMERIC NOT NULL DEFAULT 0,
  other_deductions NUMERIC NOT NULL DEFAULT 0,
  net_pay NUMERIC NOT NULL DEFAULT 0,
  components_snapshot JSONB DEFAULT '{}'::jsonb,
  UNIQUE (run_id, employee_id)
);
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage entries" ON public.payroll_entries FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============ LEAVE & ATTENDANCE ============
CREATE TABLE public.leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  annual_entitlement INT NOT NULL DEFAULT 0
);
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage leave types" ON public.leave_types FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

INSERT INTO public.leave_types (name, annual_entitlement) VALUES
  ('Casual Leave',12),('Sick Leave',12),('Earned Leave',15),('LOP',0);

CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days NUMERIC NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage leave requests" ON public.leave_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present','absent','half_day','leave')),
  UNIQUE (employee_id, date)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage attendance" ON public.attendance FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============ TAX ============
CREATE TABLE public.tax_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  financial_year TEXT NOT NULL,
  regime TEXT NOT NULL DEFAULT 'new' CHECK (regime IN ('old','new')),
  section_80c NUMERIC DEFAULT 0,
  section_80d NUMERIC DEFAULT 0,
  hra_rent_paid NUMERIC DEFAULT 0,
  city_type TEXT DEFAULT 'Non-Metro',
  home_loan_interest NUMERIC DEFAULT 0,
  other_declarations JSONB DEFAULT '{}'::jsonb,
  UNIQUE (employee_id, financial_year)
);
ALTER TABLE public.tax_declarations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage tax declarations" ON public.tax_declarations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============ PAYSLIPS ============
CREATE TABLE public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  payslip_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, employee_id)
);
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage payslips" ON public.payslips FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
