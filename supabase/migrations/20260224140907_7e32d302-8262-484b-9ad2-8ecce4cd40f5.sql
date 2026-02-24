-- Add member_type column
CREATE TYPE public.family_member_type AS ENUM ('grandpa', 'grandma', 'children', 'grandchildren', 'wife');

ALTER TABLE public.family_members
ADD COLUMN member_type public.family_member_type NOT NULL DEFAULT 'children';