
-- Add last_read_at to track when a member last viewed a thread
ALTER TABLE public.chat_thread_members 
ADD COLUMN last_read_at timestamptz DEFAULT now();

-- Allow members to update their own last_read_at
CREATE POLICY "Members can update own read status"
ON public.chat_thread_members
FOR UPDATE
USING (member_id = auth.uid())
WITH CHECK (member_id = auth.uid());
