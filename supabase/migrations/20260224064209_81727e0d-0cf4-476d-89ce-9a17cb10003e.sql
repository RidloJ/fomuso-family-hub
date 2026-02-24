
-- Allow any authenticated user to add members to threads they created
-- Also allow self-insertion for the thread creator
DROP POLICY IF EXISTS "Thread creators and admins can add members" ON public.chat_thread_members;
CREATE POLICY "Thread creators and admins can add members"
  ON public.chat_thread_members FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- Thread creator can add anyone
      EXISTS (
        SELECT 1 FROM public.chat_threads
        WHERE id = thread_id AND created_by = auth.uid()
      )
      -- Admins can add anyone
      OR has_role(auth.uid(), 'admin'::app_role)
      -- Users can add themselves (for joining)
      OR member_id = auth.uid()
    )
  );

-- Also allow the thread creator to see their own thread even before membership is set up
DROP POLICY IF EXISTS "Users can view threads they belong to" ON public.chat_threads;
CREATE POLICY "Users can view threads they belong to"
  ON public.chat_threads FOR SELECT
  USING (
    created_by = auth.uid() OR public.is_thread_member(id, auth.uid())
  );
