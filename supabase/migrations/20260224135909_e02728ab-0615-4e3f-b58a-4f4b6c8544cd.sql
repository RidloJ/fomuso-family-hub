-- Trigger function: auto-approve profile when user confirms email
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When email_confirmed_at changes from NULL to a value, approve the profile
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL) THEN
    UPDATE public.profiles
    SET is_approved = true
    WHERE user_id = NEW.id AND is_approved = false;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users on UPDATE
CREATE TRIGGER on_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_confirmed();