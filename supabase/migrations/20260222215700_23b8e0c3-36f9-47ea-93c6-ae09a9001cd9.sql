
-- Njangi Members
CREATE TABLE public.njangi_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  expected_monthly_amount numeric DEFAULT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.njangi_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view njangi members"
ON public.njangi_members FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert njangi members"
ON public.njangi_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update njangi members"
ON public.njangi_members FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = created_by);

CREATE POLICY "Admins can delete njangi members"
ON public.njangi_members FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = created_by);

-- Njangi Periods
CREATE TYPE public.njangi_status AS ENUM ('not_started', 'partial', 'completed', 'overpaid');

CREATE TABLE public.njangi_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_month integer NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year integer NOT NULL,
  deadline_date date NOT NULL,
  expected_total numeric NOT NULL DEFAULT 0,
  total_remitted numeric NOT NULL DEFAULT 0,
  balance_left numeric NOT NULL DEFAULT 0,
  status njangi_status NOT NULL DEFAULT 'not_started',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(period_month, period_year)
);

ALTER TABLE public.njangi_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view njangi periods"
ON public.njangi_periods FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert njangi periods"
ON public.njangi_periods FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update njangi periods"
ON public.njangi_periods FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Njangi Payments
CREATE TYPE public.njangi_payment_method AS ENUM ('cash', 'interac', 'bank_transfer', 'other');

CREATE TABLE public.njangi_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id uuid NOT NULL REFERENCES public.njangi_periods(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.njangi_members(id) ON DELETE CASCADE,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method njangi_payment_method NOT NULL DEFAULT 'cash',
  note text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.njangi_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view njangi payments"
ON public.njangi_payments FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert njangi payments"
ON public.njangi_payments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators and admins can update njangi payments"
ON public.njangi_payments FOR UPDATE
TO authenticated
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Creators and admins can delete njangi payments"
ON public.njangi_payments FOR DELETE
TO authenticated
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));
