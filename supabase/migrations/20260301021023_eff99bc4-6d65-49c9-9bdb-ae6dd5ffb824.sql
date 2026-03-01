
-- Drop trigger first (it's on auth.users), then the function
DROP TRIGGER IF EXISTS on_user_email_confirmed ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_email_confirmed() CASCADE;
