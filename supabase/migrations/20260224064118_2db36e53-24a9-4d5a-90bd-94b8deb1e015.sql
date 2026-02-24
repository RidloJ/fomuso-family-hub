
-- Drop the recursive policy
DROP POLICY IF EXISTS "Members can view thread members" ON public.chat_thread_members;

-- Create a security definer function to check thread membership
CREATE OR REPLACE FUNCTION public.is_thread_member(_thread_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_thread_members
    WHERE thread_id = _thread_id AND member_id = _user_id
  )
$$;

-- Recreate policies using the function
CREATE POLICY "Members can view thread members"
  ON public.chat_thread_members FOR SELECT
  USING (public.is_thread_member(thread_id, auth.uid()));

-- Also fix chat_threads SELECT policy to use the function
DROP POLICY IF EXISTS "Users can view threads they belong to" ON public.chat_threads;
CREATE POLICY "Users can view threads they belong to"
  ON public.chat_threads FOR SELECT
  USING (public.is_thread_member(id, auth.uid()));

-- Also fix chat_messages SELECT policy
DROP POLICY IF EXISTS "Members can view messages in their threads" ON public.chat_messages;
CREATE POLICY "Members can view messages in their threads"
  ON public.chat_messages FOR SELECT
  USING (public.is_thread_member(thread_id, auth.uid()));

-- Fix chat_messages INSERT policy
DROP POLICY IF EXISTS "Members can send messages to their threads" ON public.chat_messages;
CREATE POLICY "Members can send messages to their threads"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    public.is_thread_member(thread_id, auth.uid())
  );
