ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_complete boolean NOT NULL DEFAULT false;

-- Mark existing users who have a family_members record as complete
UPDATE public.profiles p
SET registration_complete = true
WHERE EXISTS (
  SELECT 1 FROM public.family_members fm
  WHERE LOWER(TRIM(fm.first_name)) = LOWER(TRIM(SPLIT_PART(p.full_name, ' ', 1)))
  OR p.user_id = fm.created_by
);

-- Also mark admin users as complete
UPDATE public.profiles p
SET registration_complete = true
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.user_id AND ur.role = 'admin'
);